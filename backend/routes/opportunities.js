const express = require('express');
const db = require('../db');

const router = express.Router();

const TEXT_FIELDS = ['title', 'description', 'research_area', 'faculty_name', 'department', 'required_skills'];
const STATUSES = ['Open', 'Closed'];

function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value + 'T00:00:00Z');
  return !isNaN(d) && d.toISOString().slice(0, 10) === value;
}

/**
 * Validates a request body. When `partial` is true (PUT), only the fields
 * that are present are checked; otherwise every field is required.
 * Returns { errors: [...], values: {...clean fields} }
 */
function validate(body, partial) {
  const errors = [];
  const values = {};
  body = body || {};

  for (const f of TEXT_FIELDS) {
    if (body[f] === undefined) { if (!partial) errors.push(`${f} is required`); continue; }
    if (typeof body[f] !== 'string' || !body[f].trim()) errors.push(`${f} must be a non-empty string`);
    else values[f] = body[f].trim();
  }

  if (body.available_positions === undefined) {
    if (!partial) errors.push('available_positions is required');
  } else {
    const n = Number(body.available_positions);
    if (!Number.isInteger(n) || n < 1) errors.push('available_positions must be a whole number of at least 1');
    else values.available_positions = n;
  }

  if (body.application_deadline === undefined) {
    if (!partial) errors.push('application_deadline is required');
  } else if (!validDate(body.application_deadline)) {
    errors.push('application_deadline must be a valid date in YYYY-MM-DD format');
  } else values.application_deadline = body.application_deadline;

  if (body.status === undefined) {
    if (!partial) values.status = 'Open';
  } else if (!STATUSES.includes(body.status)) {
    errors.push("status must be 'Open' or 'Closed'");
  } else values.status = body.status;

  return { errors, values };
}

function parseId(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: 'ID must be a positive integer' });
    return null;
  }
  return id;
}

const notFound = (res, id) => res.status(404).json({ error: `Research opportunity with ID ${id} not found` });

// 1. Create
router.post('/', async (req, res, next) => {
  try {
    const { errors, values } = validate(req.body, false);
    if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });

    res.status(201).json(await db.insert(values));
  } catch (err) { next(err); }
});

// 2. Retrieve all
router.get('/', async (req, res, next) => {
  try {
    res.status(200).json(await db.all());
  } catch (err) { next(err); }
});

// 3. Retrieve one
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseId(req, res); if (id === null) return;
    const row = await db.get(id);
    if (!row) return notFound(res, id);
    res.status(200).json(row);
  } catch (err) { next(err); }
});

// 4. Update (any subset of fields)
router.put('/:id', async (req, res, next) => {
  try {
    const id = parseId(req, res); if (id === null) return;
    if (!(await db.get(id))) return notFound(res, id);

    const { errors, values } = validate(req.body, true);
    if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });
    if (!Object.keys(values).length) return res.status(400).json({ error: 'No valid fields provided to update' });

    res.status(200).json(await db.update(id, values));
  } catch (err) { next(err); }
});

// 5. Delete
router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseId(req, res); if (id === null) return;
    if (!(await db.remove(id))) return notFound(res, id);
    res.status(200).json({ message: `Research opportunity ${id} deleted successfully` });
  } catch (err) { next(err); }
});

module.exports = router;
