// Expo push notifications — plain fetch, no expo-server-sdk needed for this scale.

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

// token can be null/undefined — caller should skip in that case, but guard here too.
async function sendExpoPush(token, title, body, data = {}) {
  if (!token || !token.startsWith('ExponentPushToken')) {
    return { ok: false, reason: 'missing_or_invalid_token' };
  }

  const res = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      to: token,
      title,
      body,
      data,
      sound: 'default',
      priority: 'high',
    }),
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    return { ok: false, reason: `http_${res.status}`, response: json };
  }

  return { ok: true, response: json };
}

module.exports = { sendExpoPush };
