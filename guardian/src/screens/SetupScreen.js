import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { colors } from '../theme';
import { registerUser } from '../lib/api';
import { registerForPushNotificationsAsync } from '../lib/push';
import { saveProfile } from '../lib/storage';

// One-time screen: collects the user's own name+phone so the backend has an
// identity to attach guardians/alerts to (POST /api/users), and registers a
// push token if available. Runs once — after this, App.js loads the saved
// profile from storage and skips straight to the tabs.
export default function SetupScreen({ onDone }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const submit = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Adhoora', 'Naam aur phone dono daalo.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const expoPushToken = await registerForPushNotificationsAsync();
      const { id } = await registerUser({ name: name.trim(), phone: phone.trim(), expoPushToken });
      const profile = { id, name: name.trim(), phone: phone.trim() };
      await saveProfile(profile);
      onDone(profile);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Apna profile banao</Text>
      <Text style={styles.sub}>
        Emergency alert bhejne ke liye backend ko tumhara naam aur phone chahiye.
      </Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Naam"
          placeholderTextColor={colors.inkFaint}
          value={name}
          onChangeText={setName}
          editable={!saving}
        />
        <TextInput
          style={styles.input}
          placeholder="Phone number"
          placeholderTextColor={colors.inkFaint}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          editable={!saving}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity style={styles.submit} onPress={submit} disabled={saving}>
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitText}>Shuru karo</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: colors.ink, textAlign: 'center' },
  sub: {
    fontSize: 13, color: colors.inkSoft, marginTop: 8, marginBottom: 24, textAlign: 'center',
  },
  form: {
    backgroundColor: colors.surface, borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: colors.line,
  },
  input: {
    borderWidth: 1, borderColor: colors.line, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.ink, marginBottom: 10,
  },
  error: { color: colors.alert, fontSize: 13, marginBottom: 10 },
  submit: {
    backgroundColor: colors.safe, borderRadius: 12, paddingVertical: 14, alignItems: 'center',
  },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
