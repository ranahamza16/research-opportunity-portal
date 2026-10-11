// MySQL implementation (default)
require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'research_portal',
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true // return DATE columns as 'YYYY-MM-DD' strings
});

module.exports = {
  name: 'MySQL',
  async ping() { await pool.query('SELECT 1'); },
  async all() { const [rows] = await pool.query('SELECT * FROM opportunities ORDER BY id DESC'); return rows; },
  async get(id) { const [rows] = await pool.query('SELECT * FROM opportunities WHERE id = ?', [id]); return rows[0] || null; },
  async insert(values) {
    const [r] = await pool.query('INSERT INTO opportunities SET ?', [values]);
    return this.get(r.insertId);
  },
  async update(id, values) {
    await pool.query('UPDATE opportunities SET ? WHERE id = ?', [values, id]);
    return this.get(id);
  },
  async remove(id) { const [r] = await pool.query('DELETE FROM opportunities WHERE id = ?', [id]); return r.affectedRows > 0; }
};
