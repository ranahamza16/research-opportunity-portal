// SQLite implementation (no server needed). Uses the built-in node:sqlite module (Node 22.5+).
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const file = process.env.SQLITE_FILE || path.join(__dirname, '..', 'data', 'portal.sqlite');
fs.mkdirSync(path.dirname(file), { recursive: true });
const db = new DatabaseSync(file);

db.exec(`
CREATE TABLE IF NOT EXISTS opportunities (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  title                TEXT NOT NULL,
  description          TEXT NOT NULL,
  research_area        TEXT NOT NULL,
  faculty_name         TEXT NOT NULL,
  department           TEXT NOT NULL,
  required_skills      TEXT NOT NULL,
  available_positions  INTEGER NOT NULL CHECK (available_positions > 0),
  application_deadline TEXT NOT NULL,
  status               TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open','Closed')),
  created_at           TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at           TEXT DEFAULT CURRENT_TIMESTAMP
);`);

const plain = (row) => (row ? { ...row } : null);

module.exports = {
  name: 'SQLite (' + file + ')',
  async ping() { db.prepare('SELECT 1').get(); },
  async all() { return db.prepare('SELECT * FROM opportunities ORDER BY id DESC').all().map(plain); },
  async get(id) { return plain(db.prepare('SELECT * FROM opportunities WHERE id = ?').get(id)); },
  async insert(values) {
    const cols = Object.keys(values);
    const r = db.prepare(`INSERT INTO opportunities (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`).run(...Object.values(values));
    return this.get(Number(r.lastInsertRowid));
  },
  async update(id, values) {
    const cols = Object.keys(values);
    db.prepare(`UPDATE opportunities SET ${cols.map((c) => c + ' = ?').join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...Object.values(values), id);
    return this.get(id);
  },
  async remove(id) { return db.prepare('DELETE FROM opportunities WHERE id = ?').run(id).changes > 0; }
};
