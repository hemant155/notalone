import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import { fireSOS, updateAlertLocation, resolveAlert } from './api';

const LOCATION_UPDATE_INTERVAL_MS = 10000;

// Ask for permission and return current coordinates
export async function getCurrentLocation() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission nahi mili. Settings mein allow karo.');
  }
  const loc = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });
  return loc.coords; // { latitude, longitude, ... }
}

export function mapsLink(coords) {
  return `https://maps.google.com/?q=${coords.latitude},${coords.longitude}`;
}

// Fallback path only: opens the phone's SMS composer pre-filled with a map link.
// User still has to press "Send" themselves — used only when the server is
// unreachable, so the alert isn't silently lost.
async function sendSmsFallback(guardians, coords) {
  const isAvailable = await SMS.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Is device pe SMS available nahi hai.');
  }
  const link = mapsLink(coords);
  const body = `EMERGENCY! Mujhe help chahiye. Meri live location: ${link}`;
  const numbers = guardians.map((g) => g.phone);
  await SMS.sendSMSAsync(numbers, body);
  return { link };
}

// Core SOS: tells the backend to create the alert (server notifies guardians via
// push + SMS with a live tracking link). If the server can't be reached, falls
// back to opening the SMS composer directly — never fails silently.
export async function sendSOS({ userId, guardians }) {
  if (!guardians || guardians.length === 0) {
    throw new Error('Koi guardian add nahi hai.');
  }

  const coords = await getCurrentLocation();

  try {
    const { alert_id, link } = await fireSOS(userId, coords.latitude, coords.longitude);
    return { mode: 'server', alertId: alert_id, link, coords };
  } catch (serverErr) {
    let smsResult;
    try {
      smsResult = await sendSmsFallback(guardians, coords);
    } catch (smsErr) {
      throw new Error(
        `Alert bhej nahi paaye. Server error: ${serverErr.message}. SMS fallback bhi fail: ${smsErr.message}. Guardians ko turant khud call karo.`
      );
    }
    return {
      mode: 'sms_fallback',
      link: smsResult.link,
      coords,
      warning: `Server tak SOS nahi pahuncha (${serverErr.message}). Isliye SMS composer khola gaya hai — "Send" dabana na bhoolo.`,
    };
  }
}

// Starts pushing a location update to the server every 10s. Returns a stop function.
// Transient failures don't stop the loop (network may recover) — they're just
// reported via onError so the UI can show a clear, non-crashing warning.
export function startLocationTracking(alertId, { onError } = {}) {
  let stopped = false;

  const tick = async () => {
    if (stopped) return;
    try {
      const coords = await getCurrentLocation();
      if (stopped) return;
      await updateAlertLocation(alertId, coords.latitude, coords.longitude);
    } catch (err) {
      if (!stopped) onError?.(err);
    }
  };

  const intervalId = setInterval(tick, LOCATION_UPDATE_INTERVAL_MS);

  return function stop() {
    stopped = true;
    clearInterval(intervalId);
  };
}

export async function resolveActiveAlert(alertId) {
  return resolveAlert(alertId);
}
