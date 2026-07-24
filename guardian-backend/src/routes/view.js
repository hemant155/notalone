const express = require('express');
const db = require('../db');
const { getLatestLocation } = require('./alerts');

const router = express.Router();

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

// GET /a/:id — plain HTML page a guardian can open in any browser, no app needed.
// Auto-refreshes every 10s via <meta refresh> so it works even with JS disabled.
router.get('/:id', (req, res) => {
  const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id);

  if (!alert) {
    return res.status(404).send('<h1>Alert not found</h1>');
  }

  const user = db.prepare('SELECT name, phone FROM users WHERE id = ?').get(alert.user_id);
  const location = getLatestLocation(alert.id);

  const mapsLink = location
    ? `https://www.google.com/maps?q=${location.lat},${location.lng}`
    : null;

  const statusColor = alert.status === 'active' ? '#d32f2f' : '#2e7d32';

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      ${alert.status === 'active' ? '<meta http-equiv="refresh" content="10" />' : ''}
      <title>Guardian — Live Location</title>
      <style>
        body { font-family: -apple-system, Arial, sans-serif; max-width: 480px; margin: 40px auto; padding: 0 16px; }
        .status { display: inline-block; padding: 4px 12px; border-radius: 999px; color: white; background: ${statusColor}; font-weight: bold; }
        .card { border: 1px solid #ddd; border-radius: 12px; padding: 20px; margin-top: 20px; }
        a.button { display: inline-block; margin-top: 16px; padding: 12px 20px; background: #1a73e8; color: white; text-decoration: none; border-radius: 8px; }
        .muted { color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <h2>${escapeHtml(user ? user.name : 'Unknown user')}'s SOS Alert</h2>
      <span class="status">${alert.status.toUpperCase()}</span>

      <div class="card">
        ${location
          ? `
            <p><strong>Last known location:</strong></p>
            <p>${location.lat}, ${location.lng}</p>
            <p class="muted">Recorded at: ${escapeHtml(location.recorded_at)} UTC</p>
            <a class="button" href="${mapsLink}" target="_blank" rel="noopener">Open in Google Maps</a>
          `
          : '<p>No location received yet.</p>'
        }
      </div>

      <p class="muted">
        ${alert.status === 'active'
          ? 'This page auto-refreshes every 10 seconds.'
          : 'This alert has been resolved — the user is safe.'}
      </p>
    </body>
    </html>
  `);
});

module.exports = router;
