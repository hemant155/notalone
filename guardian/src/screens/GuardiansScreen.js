import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import * as Contacts from 'expo-contacts';
import { colors } from '../theme';
import { getGuardians, addGuardian, deleteGuardian } from '../lib/api';

export default function GuardiansScreen({ userId }) {
  const [guardians, setGuardians] = useState([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setGuardians(await getGuardians(userId));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Adhoora', 'Naam aur phone dono daalo.');
      return;
    }
    setBusy(true);
    try {
      const created = await addGuardian(userId, { name: name.trim(), phone: phone.trim() });
      setGuardians((list) => [...list, created]);
      setName('');
      setPhone('');
    } catch (e) {
      Alert.alert('Add nahi ho paaya', e.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    setBusy(true);
    try {
      await deleteGuardian(userId, id);
      setGuardians((list) => list.filter((g) => g.id !== id));
    } catch (e) {
      Alert.alert('Hata nahi paaye', e.message);
    } finally {
      setBusy(false);
    }
  };

  const pickContact = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission nahi', 'Contacts access chahiye guardian add karne ke liye.');
      return;
    }
    const contact = await Contacts.presentContactPickerAsync();
    if (contact) {
      setName(contact.name || '');
      const num = contact.phoneNumbers && contact.phoneNumbers[0]
        ? contact.phoneNumbers[0].number
        : '';
      setPhone(num || '');
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Trusted guardians</Text>
      <Text style={styles.sub}>Emergency mein inhe tumhari live location ka alert jaayega.</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Naam"
          placeholderTextColor={colors.inkFaint}
          value={name}
          onChangeText={setName}
          editable={!busy}
        />
        <TextInput
          style={styles.input}
          placeholder="Phone number"
          placeholderTextColor={colors.inkFaint}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          editable={!busy}
        />
        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.pick} onPress={pickContact} disabled={busy}>
            <Text style={styles.pickText}>Contacts se</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.add} onPress={add} disabled={busy}>
            <Text style={styles.addText}>+ Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading && <ActivityIndicator style={{ marginTop: 20 }} color={colors.guard} />}

      {!loading && error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={load}>
            <Text style={styles.retry}>Dobara try karo</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && (
        <FlatList
          style={{ marginTop: 8 }}
          data={guardians}
          keyExtractor={(g) => String(g.id)}
          ListEmptyComponent={
            <Text style={styles.empty}>Abhi koi guardian nahi. Upar se add karo.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName}>{item.name}</Text>
                <Text style={styles.rowPhone}>{item.phone}</Text>
              </View>
              <TouchableOpacity onPress={() => remove(item.id)} disabled={busy}>
                <Text style={styles.remove}>Hatao</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: '700', color: colors.ink },
  sub: { fontSize: 13, color: colors.inkSoft, marginTop: 4, marginBottom: 16 },
  form: {
    backgroundColor: colors.surface, borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: colors.line,
  },
  input: {
    borderWidth: 1, borderColor: colors.line, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.ink, marginBottom: 10,
  },
  btnRow: { flexDirection: 'row' },
  pick: {
    flex: 1, borderWidth: 1.5, borderColor: colors.guard, borderRadius: 12,
    paddingVertical: 12, alignItems: 'center', marginRight: 10,
  },
  pickText: { color: colors.guard, fontWeight: '600' },
  add: {
    flex: 1, backgroundColor: colors.safe, borderRadius: 12, paddingVertical: 12, alignItems: 'center',
  },
  addText: { color: '#fff', fontWeight: '700' },
  empty: { color: colors.inkFaint, textAlign: 'center', marginTop: 30 },
  errorBox: { marginTop: 20, alignItems: 'center' },
  errorText: { color: colors.alert, textAlign: 'center', fontSize: 13 },
  retry: { color: colors.guard, fontWeight: '600', marginTop: 10 },
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: 14, padding: 14, marginTop: 10, borderWidth: 1, borderColor: colors.line,
  },
  rowName: { fontSize: 15, fontWeight: '600', color: colors.ink },
  rowPhone: { fontSize: 13, color: colors.inkFaint, marginTop: 2 },
  remove: { color: colors.alert, fontWeight: '600' },
});
