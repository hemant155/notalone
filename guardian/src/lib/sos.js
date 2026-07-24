import * as Location from 'expo-location';
import * as SMS from 'expo-sms';

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

// Core SOS: grab location, open an SMS to every guardian with a live map link.
// NOTE (important for v0): expo-sms opens the phone's SMS composer with the
// recipients + message pre-filled. It does NOT send silently. A true one-tap
// auto-send needs a backend (e.g. Twilio/MSG91) or a native Android build —
// that's the very next step after this MVP.
export async function sendSOS(guardians) {
  if (!guardians || guardians.length === 0) {
    throw new Error('Koi guardian add nahi hai.');
  }

  const isAvailable = await SMS.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Is device pe SMS available nahi hai.');
  }

  const coords = await getCurrentLocation();
  const link = mapsLink(coords);
  const body = `EMERGENCY! Mujhe help chahiye. Meri live location: ${link}`;
  const numbers = guardians.map((g) => g.phone);

  const { result } = await SMS.sendSMSAsync(numbers, body);
  return { result, link, coords };
}
