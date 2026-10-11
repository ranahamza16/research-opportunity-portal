require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const db = require('./db');
const opportunities = require('./routes/opportunities');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Simple request log (method, url, status)
app.use((req, res, next) => {
  res.on('finish', () => console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode}`));
  next();
});

app.use('/api/opportunities', opportunities);
app.use('/api', (req, res) => res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` }));

// The frontend is served by the same server: http://localhost:PORT
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Malformed JSON bodies -> 400
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Request body is not valid JSON' });
  next(err);
});

// Everything else -> 500
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  try {
    await db.ping();
    console.log('Connected to ' + db.name);
  } catch (e) {
    const detail = e.code || e.message || (e.errors && e.errors.map((x) => x.code || x.message).join(', '));
    console.error('Could not connect to the database:', detail);
    console.error('Tip: start MySQL, or set DB_CLIENT=sqlite in backend/.env to run without MySQL.');
  }
});
