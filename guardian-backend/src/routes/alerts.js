const express = require('express');
const db = require('../db');
const { sendSms } = require('../sms');
const { sendExpoPush } = require('../push');

const router = express.Router();

function trackingLink(alertId) {
  const base = process.env.BASE_URL || 'http://localhost:3000';
  return `${base}/a/${alertId}`;
}

function getLatestLocation(alertId) {
  return db
    .prepare('SELECT lat, lng, recorded_at FROM alert_locations WHERE alert_id = ? ORDER BY id DESC LIMIT 1')
    .get(alertId);
}

// POST /api/sos — create an alert, notify all guardians (push + SMS with tracking link).
router.post('/sos', async (req, res) => {
  const { user_id, lat, lng } = req.body;

  if (!user_id || lat === undefined || lng === undefined) {
    return res.status(400).json({ error: 'user_id, lat and lng are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(user_id);
  if (!user) return res.status(404).json({ error: 'user not found' });

  const alertResult = db
    .prepare('INSERT INTO alerts (user_id, status) VALUES (?, ?)')
    .run(user_id, 'active');
  const alertId = alertResult.lastInsertRowid;

  db.prepare('INSERT INTO alert_locations (alert_id, lat, lng) VALUES (?, ?, ?)').run(alertId, lat, lng);

  const link = trackingLink(alertId);
  const guardians = db.prepare('SELECT * FROM guardians WHERE user_id = ?').all(user_id);
  const message = `SOS! ${user.name} needs help. Track live location: ${link}`;

  // Notify every guardian. Guardians only store name+phone (no push token of their own),
  // so push is only possible when a guardian's phone matches a registered app user —
  // SMS is the guaranteed channel and works even without the app installed.
  const notifyResults = await Promise.allSettled(
    guardians.map(async (guardian) => {
      const guardianAsUser = db.prepare('SELECT expo_push_token FROM users WHERE phone = ?').get(guardian.phone);

      if (guardianAsUser?.expo_push_token) {
        await sendExpoPush(guardianAsUser.expo_push_token, 'SOS Alert', message, { alertId, link });
      }

      await sendSms(guardian.phone, message);
    })
  );

  const failed = notifyResults.filter((r) => r.status === 'rejected');
  if (failed.length) {
    console.error('Some guardian notifications failed:', failed.map((f) => f.reason));
  }

  res.status(201).json({ alert_id: alertId, link });
});

// POST /api/alerts/:id/location — append a live location update for an alert.
router.post('/alerts/:id/location', (req, res) => {
  const { lat, lng } = req.body;
  if (lat === undefined || lng === undefined) {
    return res.status(400).json({ error: 'lat and lng are required' });
  }

  const alert = db.prepare('SELECT id FROM alerts WHERE id = ?').get(req.params.id);
  if (!alert) return res.status(404).json({ error: 'alert not found' });

  db.prepare('INSERT INTO alert_locations (alert_id, lat, lng) VALUES (?, ?, ?)').run(req.params.id, lat, lng);

  res.status(201).json({ ok: true });
});

// POST /api/alerts/:id/resolve — mark alert as resolved (user is safe).
router.post('/alerts/:id/resolve', (req, res) => {
  const result = db.prepare("UPDATE alerts SET status = 'resolved' WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'alert not found' });

  res.json({ ok: true });
});

// GET /api/alerts/:id — alert details + latest location, as JSON.
router.get('/alerts/:id', (req, res) => {
  const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id);
  if (!alert) return res.status(404).json({ error: 'alert not found' });

  const location = getLatestLocation(req.params.id);

  res.json({ ...alert, location: location || null });
});

module.exports = { router, getLatestLocation };
