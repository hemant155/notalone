import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'guardians_v1';

// Returns an array of { id, name, phone }
export async function getGuardians() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export async function saveGuardians(list) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(list));
  } catch (e) {
    // storage failure is non-fatal for v0
  }
}
