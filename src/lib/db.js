import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Resolve DB path relative to project root so it works from any cwd
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
}
