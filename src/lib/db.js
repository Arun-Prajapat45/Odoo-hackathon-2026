/**
 * TransitOps Remote Database Adapter
 * Wraps the remote SQLite/MySQL query endpoint provided by team leader:
 * POST https://paced-nearest-prelaunch.ngrok-free.dev/query
 * Payload: { query: string, args: any[] }
 */

export async function queryDb(sql, args = []) {
  const url = process.env.DB_API_URL || 'https://paced-nearest-prelaunch.ngrok-free.dev/query';
  let lastError = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'TransitOps-Enterprise/2.0',
          'Connection': 'close',
        },
        body: JSON.stringify({ query: sql, args }),
        cache: 'no-store',
      });

      if (!response.ok) {
        const text = await response.text();
        console.error(`[DB Error HTTP ${response.status}]:`, text);
        throw new Error(`Database HTTP error: ${response.status}`);
      }

      const result = await response.json();

      if (result.status === 'error' || result.error) {
        console.error('[DB Query Error]:', result.error, '\nQuery:', sql, '\nArgs:', args);
        throw new Error(result.error || 'Database query failed');
      }

      // result.data contains the rows for SELECT or modification info for INSERT/UPDATE
      return result.data || [];
    } catch (err) {
      lastError = err;
      if (attempt < 3 && (err.message.includes('fetch failed') || err.message.includes('other side closed') || err.message.includes('socket'))) {
        await new Promise(res => setTimeout(res, attempt * 400));
        continue;
      }
      break;
    }
  }

  console.error('[queryDb Exception after retries]:', lastError?.message);
  throw lastError;
}
