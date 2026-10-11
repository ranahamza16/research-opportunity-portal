// Picks the database backend from .env:  DB_CLIENT=mysql (default) or DB_CLIENT=sqlite
require('dotenv').config();
const client = (process.env.DB_CLIENT || 'mysql').toLowerCase();
module.exports = client === 'sqlite' ? require('./db/sqlite') : require('./db/mysql');
