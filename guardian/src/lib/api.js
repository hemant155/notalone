// Single place to point the app at the Guardian backend.
// Physical device / Expo Go: replace with your machine's LAN IP, e.g. 'http://192.168.1.5:3000'.
// Emulator/simulator on the same machine: 'http://localhost:3000' works.
export const API_BASE = 'https://guardian-backend-gskl.onrender.com';

const DEFAULT_TIMEOUT_MS = 8000;

async function request(path, { method = 'GET', body, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Server jawab nahi de raha (timeout). Internet ya backend check karo.');
    }
    throw new Error('Server tak pahunch nahi paaye. Internet ya backend URL (API_BASE) check karo.');
  } finally {
    clearTimeout(timer);
  }

  let data = null;
  try {
    data = await res.json();
  } catch (_) {
    // empty/non-JSON body — fine for endpoints like resolve/location that just return { ok: true }
  }

  if (!res.ok) {
    const msg = (data && data.error) || `Server error (${res.status})`;
    throw new Error(msg);
  }

  return data;
}

// POST /api/users — upsert by phone, returns { id }
export function registerUser({ name, phone, expoPushToken }) {
  return request('/api/users', {
    method: 'POST',
    body: { name, phone, expo_push_token: expoPushToken || null },
  });
}

// GET /api/users/:id/guardians
export function getGuardians(userId) {
  return request(`/api/users/${userId}/guardians`);
}

// POST /api/users/:id/guardians
export function addGuardian(userId, { name, phone }) {
  return request(`/api/users/${userId}/guardians`, {
    method: 'POST',
    body: { name, phone },
  });
}

// DELETE /api/users/:id/guardians/:guardianId
export function deleteGuardian(userId, guardianId) {
  return request(`/api/users/${userId}/guardians/${guardianId}`, { method: 'DELETE' });
}

// POST /api/sos — creates the alert server-side, returns { alert_id, link }
export function fireSOS(userId, lat, lng) {
  return request('/api/sos', {
    method: 'POST',
    body: { user_id: userId, lat, lng },
  });
}

// POST /api/alerts/:id/location — append a live location point
export function updateAlertLocation(alertId, lat, lng) {
  return request(`/api/alerts/${alertId}/location`, {
    method: 'POST',
    body: { lat, lng },
  });
}

// POST /api/alerts/:id/resolve — mark alert as resolved
export function resolveAlert(alertId) {
  return request(`/api/alerts/${alertId}/resolve`, { method: 'POST' });
}
