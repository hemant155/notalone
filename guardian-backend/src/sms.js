// SMS provider abstraction — swap providers via SMS_PROVIDER in .env.
// Every provider exposes the same shape: async sendSms(phone, message) => { ok, provider, ... }

async function sendViaMock(phone, message) {
  // Dev-friendly fallback: just print to console instead of hitting a real API.
  console.log(`\n[sms:mock] To: ${phone}\n[sms:mock] Message: ${message}\n`);
  return { ok: true, provider: 'mock' };
}

async function sendViaMsg91(phone, message) {
  const authKey = process.env.MSG91_AUTH_KEY;
  const senderId = process.env.MSG91_SENDER_ID;
  const route = process.env.MSG91_ROUTE || '4';

  if (!authKey || !senderId) {
    throw new Error('MSG91_AUTH_KEY and MSG91_SENDER_ID must be set in .env to use SMS_PROVIDER=msg91');
  }

  // MSG91 legacy HTTP SMS API — simplest option, no template/flow setup needed.
  // Note: for production India traffic, DLT-registered sender/template is required by TRAI.
  const url = new URL('https://api.msg91.com/api/sendhttp.php');
  url.searchParams.set('authkey', authKey);
  url.searchParams.set('mobiles', phone);
  url.searchParams.set('message', message);
  url.searchParams.set('sender', senderId);
  url.searchParams.set('route', route);
  url.searchParams.set('country', '91');

  const res = await fetch(url.toString());
  const text = await res.text();

  if (!res.ok) {
    throw new Error(`msg91 request failed: ${res.status} ${text}`);
  }

  return { ok: true, provider: 'msg91', response: text };
}

async function sendSms(phone, message) {
  const provider = (process.env.SMS_PROVIDER || 'mock').toLowerCase();

  if (provider === 'msg91') return sendViaMsg91(phone, message);
  return sendViaMock(phone, message);
}

module.exports = { sendSms };
