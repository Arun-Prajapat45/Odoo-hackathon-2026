/**
 * TransitOps Remote Database Adapter
 * Wraps the remote SQLite/MySQL query endpoint provided by team leader:
 * POST https://paced-nearest-prelaunch.ngrok-free.dev/query
 * Payload: { query: string, args: any[] }
 *
 * Features:
 * - TLS & Keep-Alive Connection Reuse (No 'Connection: close' thrashing)
 * - 5x Exponential Backoff with Jitter for ECONNRESET / TLS / Socket Drops
 * - Concurrent Request Throttling / Mutex Queue for free-tier rate limits
 * - safeQuery helper returning graceful fallback instead of unhandled 500 errors
 */

// Simple concurrency limiter to prevent flooding ngrok with simultaneous TLS handshakes
let activeRequests = 0;
const MAX_CONCURRENT_REQUESTS = 4;
const requestQueue = [];

function acquireSlot() {
  return new Promise((resolve) => {
    if (activeRequests < MAX_CONCURRENT_REQUESTS) {
      activeRequests++;
      resolve();
    } else {
      requestQueue.push(resolve);
    }
  });
}

function releaseSlot() {
  activeRequests--;
  if (requestQueue.length > 0 && activeRequests < MAX_CONCURRENT_REQUESTS) {
    activeRequests++;
    const next = requestQueue.shift();
    next();
  }
}

export async function queryDb(sql, args = []) {
  const url = process.env.DB_API_URL || 'https://paced-nearest-prelaunch.ngrok-free.dev/query';
  let lastError = null;

  for (let attempt = 1; attempt <= 5; attempt++) {
    await acquireSlot();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout per request

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'TransitOps-Enterprise/2.0',
        },
        body: JSON.stringify({ query: sql, args }),
        cache: 'no-store',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        console.error(`[DB Error HTTP ${response.status} (attempt ${attempt}/5)]:`, text);
        if (response.status >= 500 || response.status === 429) {
          throw new Error(`Database HTTP error: ${response.status}`);
        }
        throw new Error(`Database HTTP error: ${response.status}`);
      }

      const result = await response.json();

      if (result.status === 'error' || result.error) {
        console.error('[DB Query Error]:', result.error, '\nQuery:', sql, '\nArgs:', args);
        throw new Error(result.error || 'Database query failed');
      }

      return result.data || [];
    } catch (err) {
      lastError = err;
      const msg = err.message || '';
      const causeMsg = err.cause?.message || '';
      const causeCode = err.cause?.code || '';

      const isNetworkOrRateLimit =
        msg.includes('fetch failed') ||
        msg.includes('other side closed') ||
        msg.includes('socket') ||
        msg.includes('abort') ||
        msg.includes('timeout') ||
        msg.includes('Database HTTP error: 5') ||
        msg.includes('Database HTTP error: 429') ||
        causeCode === 'ECONNRESET' ||
        causeCode === 'ETIMEDOUT' ||
        causeCode === 'ENOTFOUND' ||
        causeCode === 'ECONNREFUSED' ||
        causeCode === 'UND_ERR_SOCKET' ||
        causeMsg.includes('Client network socket disconnected') ||
        causeMsg.includes('socket');

      if (attempt < 5 && isNetworkOrRateLimit) {
        releaseSlot();
        const backoffMs = Math.floor(350 * Math.pow(1.8, attempt - 1) + Math.random() * 250);
        console.warn(`[queryDb Retry ${attempt}/5 in ${backoffMs}ms due to network/socket drop: ${msg || causeCode || causeMsg}]`);
        await new Promise((res) => setTimeout(res, backoffMs));
        continue;
      }
      releaseSlot();
      break;
    } finally {
      if (activeRequests > 0) releaseSlot();
    }
  }

  console.error('[queryDb Exception after retries]:', lastError?.message || lastError);
  throw lastError;
}

/**
 * Safe wrapper that never throws. Returns fallback (e.g., []) on failure.
 */
export async function safeQuery(sql, args = [], fallback = []) {
  try {
    const data = await queryDb(sql, args);
    return data || fallback;
  } catch (err) {
    console.warn(`[safeQuery Fallback due to error]: ${err.message}`, { sql });
    return fallback;
  }
}

export const db = {
  query: queryDb,
  safeQuery,
};
