import React, { useState } from 'react';
import {
  SafeAreaView, View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform,
} from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import GuardiansScreen from './src/screens/GuardiansScreen';
import { colors } from './src/theme';

export default function App() {
  const [tab, setTab] = useState('home');

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.safe} />

      <View style={styles.header}>
        <Text style={styles.brand}>Guardian</Text>
        <Text style={styles.brandSub}>Aapki safety, ek button door</Text>
      </View>

      <View style={{ flex: 1 }}>
        {tab === 'home'
          ? <HomeScreen onGoGuardians={() => setTab('guardians')} />
          : <GuardiansScreen />}
      </View>

      <View style={styles.tabbar}>
        <Tab label="Home" active={tab === 'home'} onPress={() => setTab('home')} />
        <Tab label="Guardians" active={tab === 'guardians'} onPress={() => setTab('guardians')} />
      </View>
    </SafeAreaView>
  );
}

function Tab({ label, active, onPress }) {
  return (
    <TouchableOpacity style={styles.tab} onPress={onPress}>
      <Text style={[styles.tabText, active && styles.tabActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.screen,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: { backgroundColor: colors.safe, paddingHorizontal: 20, paddingVertical: 16 },
  brand: { color: '#fff', fontSize: 22, fontWeight: '800' },
  brandSub: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 2 },
  tabbar: {
    flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: '#fff',
  },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabText: { color: colors.inkFaint, fontWeight: '600' },
  tabActive: { color: colors.ink },
});
