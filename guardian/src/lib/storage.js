import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_KEY = 'profile_v1';

// Local copy of { id, name, phone } for the registered user — the backend is the
// source of truth, this just avoids re-registering (and re-asking for name/phone)
// on every launch.
export async function getProfile() {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export async function saveProfile(profile) {
  try {
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    // storage failure is non-fatal — profile still exists in memory for this session
  }
}
