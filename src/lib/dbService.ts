import { v4 as uuidv4 } from 'uuid';
import { getDatabase, saveDatabase } from './database';

export interface QueryResult {
  rows: any[];
  rowsAffected: number;
}

export function executeQuery(sql: string, params: any[] = []): QueryResult {
  const db = getDatabase();

  try {
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      const rows: any[] = [];

      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();

      return { rows, rowsAffected: 0 };
    } else {
      db.run(sql, params);
      saveDatabase();
      return { rows: [], rowsAffected: db.getRowsModified() };
    }
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export function insert(table: string, data: Record<string, any>): string {
  const id = data.id || uuidv4();
  const fields = Object.keys(data);
  const values = fields.map(f => data[f]);

  const placeholders = fields.map(() => '?').join(', ');
  const sql = `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${placeholders})`;

  executeQuery(sql, values);
  return id;
}

export function update(table: string, id: string, data: Record<string, any>): void {
  const fields = Object.keys(data).filter(f => f !== 'id');
  const values = fields.map(f => data[f]);
  values.push(id);

  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const sql = `UPDATE ${table} SET ${setClause}, updated_at = datetime('now') WHERE id = ?`;

  executeQuery(sql, values);
}

export function deleteRecord(table: string, id: string): void {
  const sql = `DELETE FROM ${table} WHERE id = ?`;
  executeQuery(sql, [id]);
}

export function findById(table: string, id: string): any | null {
  const result = executeQuery(`SELECT * FROM ${table} WHERE id = ?`, [id]);
  return result.rows[0] || null;
}

export function findAll(table: string, where?: string, params?: any[]): any[] {
  let sql = `SELECT * FROM ${table}`;
  if (where) {
    sql += ` WHERE ${where}`;
  }
  const result = executeQuery(sql, params || []);
  return result.rows;
}

export function findOne(table: string, where: string, params: any[]): any | null {
  const sql = `SELECT * FROM ${table} WHERE ${where} LIMIT 1`;
  const result = executeQuery(sql, params);
  return result.rows[0] || null;
}

export function count(table: string, where?: string, params?: any[]): number {
  let sql = `SELECT COUNT(*) as count FROM ${table}`;
  if (where) {
    sql += ` WHERE ${where}`;
  }
  const result = executeQuery(sql, params || []);
  return result.rows[0]?.count || 0;
}
