import initSqlJs from 'sql.js';
import Papa from 'papaparse';

let SQL = null;

export const initDB = async () => {
  if (!SQL) {
    SQL = await initSqlJs({
      locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.2/${file}`
    });
  }
  return new SQL.Database();
};

export const loadCSVtoDB = (db, file, tableName = 'data_table') => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const data = results.data;
          if (data.length === 0) return resolve(db);
          
          // Sanitize headers to be valid SQLite column names
          const headers = Object.keys(data[0]).map(h => h.trim().replace(/[^a-zA-Z0-9_]/g, '_') || 'column');
          
          // Drop if exists, then Create Table
          db.run(`DROP TABLE IF EXISTS ${tableName};`);
          const createTableQuery = `CREATE TABLE ${tableName} (${headers.map(h => '"' + h + '" TEXT').join(', ')});`;
          db.run(createTableQuery);
          
          // Insert Data
          const insertStmt = `INSERT INTO ${tableName} VALUES (${headers.map(() => '?').join(', ')})`;
          const stmt = db.prepare(insertStmt);
          
          db.run('BEGIN TRANSACTION;');
          data.forEach(row => {
            const values = Object.values(row);
            stmt.run(values);
          });
          db.run('COMMIT;');
          stmt.free();
          
          const schema = `TABLE ${tableName} (${headers.join(', ')})`;
          resolve({ schema, headers, rowCount: data.length });
        } catch (err) {
          console.error("Database load error", err);
          reject(err);
        }
      },
      error: (err) => reject(err)
    });
  });
};

export const executeQuery = (db, query) => {
  try {
    const results = db.exec(query);
    if (results.length === 0) return { columns: [], values: [] };
    return {
      columns: results[0].columns,
      values: results[0].values
    };
  } catch (err) {
    throw new Error(err.message);
  }
};
