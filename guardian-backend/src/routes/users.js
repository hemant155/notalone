const express = require('express');
const db = require('../db');

const router = express.Router();

// POST /api/users — register or update a user (upsert by phone), save Expo push token.
router.post('/', (req, res) => {
  const { name, phone, expo_push_token } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'name and phone are required' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);

  if (existing) {
    db.prepare('UPDATE users SET name = ?, expo_push_token = ? WHERE id = ?')
      .run(name, expo_push_token || null, existing.id);
    return res.json({ id: existing.id });
  }

  const result = db
    .prepare('INSERT INTO users (name, phone, expo_push_token) VALUES (?, ?, ?)')
    .run(name, phone, expo_push_token || null);

  res.status(201).json({ id: result.lastInsertRowid });
});

function getUserOr404(req, res) {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) {
    res.status(404).json({ error: 'user not found' });
    return null;
  }
  return user;
}

// GET /api/users/:id/guardians — list guardians for a user
router.get('/:id/guardians', (req, res) => {
  if (!getUserOr404(req, res)) return;

  const guardians = db
    .prepare('SELECT * FROM guardians WHERE user_id = ? ORDER BY id')
    .all(req.params.id);

  res.json(guardians);
});

// POST /api/users/:id/guardians — add a guardian
router.post('/:id/guardians', (req, res) => {
  if (!getUserOr404(req, res)) return;

  const { name, phone } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: 'name and phone are required' });
  }

  const result = db
    .prepare('INSERT INTO guardians (user_id, name, phone) VALUES (?, ?, ?)')
    .run(req.params.id, name, phone);

  res.status(201).json({ id: result.lastInsertRowid, user_id: Number(req.params.id), name, phone });
});

// DELETE /api/users/:id/guardians/:guardianId — remove a guardian
router.delete('/:id/guardians/:guardianId', (req, res) => {
  if (!getUserOr404(req, res)) return;

  const result = db
    .prepare('DELETE FROM guardians WHERE id = ? AND user_id = ?')
    .run(req.params.guardianId, req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'guardian not found' });
  }

  res.json({ ok: true });
});

module.exports = router;
