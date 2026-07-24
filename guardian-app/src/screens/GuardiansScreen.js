import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert,
} from 'react-native';
import * as Contacts from 'expo-contacts';
import { colors } from '../theme';
import { getGuardians, saveGuardians } from '../lib/storage';

export default function GuardiansScreen() {
  const [guardians, setGuardians] = useState([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    (async () => setGuardians(await getGuardians()))();
  }, []);

  const persist = async (list) => {
    setGuardians(list);
    await saveGuardians(list);
  };

  const add = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Adhoora', 'Naam aur phone dono daalo.');
      return;
    }
    const next = [
      ...guardians,
      { id: Date.now().toString(), name: name.trim(), phone: phone.trim() },
    ];
    await persist(next);
    setName('');
    setPhone('');
  };

  const remove = async (id) => {
    await persist(guardians.filter((g) => g.id !== id));
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
      <Text style={styles.sub}>Emergency mein inhe tumhari live location SMS hogi.</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Naam"
          placeholderTextColor={colors.inkFaint}
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Phone number"
          placeholderTextColor={colors.inkFaint}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.pick} onPress={pickContact}>
            <Text style={styles.pickText}>Contacts se</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.add} onPress={add}>
            <Text style={styles.addText}>+ Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        style={{ marginTop: 8 }}
        data={guardians}
        keyExtractor={(g) => g.id}
        ListEmptyComponent={
          <Text style={styles.empty}>Abhi koi guardian nahi. Upar se add karo.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowName}>{item.name}</Text>
              <Text style={styles.rowPhone}>{item.phone}</Text>
            </View>
            <TouchableOpacity onPress={() => remove(item.id)}>
              <Text style={styles.remove}>Hatao</Text>
            </TouchableOpacity>
          </View>
        )}
      />
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
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: 14, padding: 14, marginTop: 10, borderWidth: 1, borderColor: colors.line,
  },
  rowName: { fontSize: 15, fontWeight: '600', color: colors.ink },
  rowPhone: { fontSize: 13, color: colors.inkFaint, marginTop: 2 },
  remove: { color: colors.alert, fontWeight: '600' },
});
