<<<<<<< HEAD
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// --- APURAV'S REMOTE FETCH DB HELPER ---
export async function executeQuery(query, args = []) {
  const url = 'https://paced-nearest-prelaunch.ngrok-free.dev/query';
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, args }),
      cache: 'no-store', // always fetch fresh data
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Database Query Error:', error);
    throw error;
  }
}

// --- ABHI'S LOCAL BETTER-SQLITE3 DB HELPER ---
const DB_PATH = path.join(process.cwd(), 'transitops.db');
let _db = null;

export function getDb() {
  if (_db) return _db;

  const isNew = !fs.existsSync(DB_PATH);
  _db = new Database(DB_PATH);

  // Enable WAL mode for better concurrent performance
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');

  if (isNew) {
    console.log('[DB] New database detected — running schema migration...');
    runMigrations(_db);
    console.log('[DB] Schema applied.');
  }

  return _db;
}

function runMigrations(db) {
  const schemaPath = path.join(process.cwd(), 'sqlite_schema.sql');
  if (!fs.existsSync(schemaPath)) return;
  const schema = fs.readFileSync(schemaPath, 'utf-8');

  // Split and run each statement
  const statements = schema
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.toUpperCase().startsWith('SET '));

  for (const stmt of statements) {
    try {
      db.prepare(stmt).run();
    } catch (err) {
      console.warn(`[DB Migration] Skipped statement (${err.message}): ${stmt.substring(0, 80)}`);
    }
  }
=======
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
>>>>>>> origin/arun
}
