import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

let _db = null;

// Helper to interpolate SQL parameters
function interpolate(sql, args) {
  let result = sql;
  for (const arg of args) {
    let val = 'NULL';
    if (arg !== null && arg !== undefined) {
      if (typeof arg === 'string') {
        val = `'${arg.replace(/'/g, "''")}'`;
      } else {
        val = arg;
      }
    }
    result = result.replace('?', val);
  }
  return result;
}

// Helper to run query via curl
function runRemoteQuery(sql, args) {
  const finalSql = args && args.length > 0 ? interpolate(sql, args) : sql;
  
  // Read endpoint url from .env
  let url = '';
  try {
    const envContent = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf-8');
    const match = envContent.match(/ENDPOINT_URL=(.+)/);
    if (match) url = match[1].trim();
  } catch (e) {}

  if (!url) {
    throw new Error("ENDPOINT_URL environment variable is missing. Please set it in your .env file.");
  }

  const payload = JSON.stringify({ query: finalSql });
  const safePayload = payload.replace(/'/g, "'\\''");
  
  try {
    const curlCmd = `curl -s -X POST -H "Content-Type: application/json" -d '${safePayload}' ${url}`;
    const response = execSync(curlCmd, { encoding: 'utf-8', maxBuffer: 1024 * 1024 * 10 });
    const json = JSON.parse(response);
    
    if (json.status === 'error') {
      throw new Error(json.error);
    }
    return json.data || [];
  } catch (err) {
    if (err.stdout) {
      console.error("[Remote DB Error Output]:", err.stdout);
    }
    throw err;
  }
}

export function getDb() {
  if (_db) return _db;

  _db = {
    prepare: (sql) => {
      // If we see INSERT ... VALUES (?, ?) without RETURNING id, and we need lastInsertRowid
      // we might just append RETURNING id. NextJS APIs here rely on lastInsertRowid
      let augmentedSql = sql;
      if (sql.trim().toUpperCase().startsWith('INSERT') && !sql.toUpperCase().includes('RETURNING')) {
         // rudimentary RETURNING id injection if it's not present
         augmentedSql = sql.trim() + ' RETURNING id';
      }

      return {
        all: (...args) => {
          return runRemoteQuery(augmentedSql, args);
        },
        get: (...args) => {
          const res = runRemoteQuery(augmentedSql, args);
          return res.length > 0 ? res[0] : null;
        },
        run: (...args) => {
          const res = runRemoteQuery(augmentedSql, args);
          let lastInsertRowid = 0;
          if (res.length > 0 && res[0].id) {
            lastInsertRowid = res[0].id;
          }
          return { changes: 1, lastInsertRowid };
        }
      };
    },
    pragma: () => {}
  };

  return _db;
}
