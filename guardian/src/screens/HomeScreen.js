import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, Alert, ScrollView,
} from 'react-native';
import { colors } from '../theme';
import { getGuardians } from '../lib/storage';
import { sendSOS } from '../lib/sos';

export default function HomeScreen({ onGoGuardians }) {
  const [guardians, setGuardians] = useState([]);
  const [counting, setCounting] = useState(false);
  const [count, setCount] = useState(3);
  const [sending, setSending] = useState(false);

  const holdTimer = useRef(null);
  const countTimer = useRef(null);

  const loadGuardians = async () => setGuardians(await getGuardians());
  useEffect(() => { loadGuardians(); }, []);

  const startHold = () => {
    holdTimer.current = setTimeout(beginCountdown, 800);
  };
  const cancelHold = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
  };

  const beginCountdown = async () => {
    const list = await getGuardians();
    setGuardians(list);
    if (list.length === 0) {
      Alert.alert('Koi guardian nahi', 'Pehle Guardians tab mein trusted contacts add karo.');
      return;
    }
    setCount(3);
    setCounting(true);
    let n = 3;
    countTimer.current = setInterval(() => {
      n -= 1;
      if (n <= 0) {
        clearInterval(countTimer.current);
        fire();
      } else {
        setCount(n);
      }
    }, 1000);
  };

  const cancelCountdown = () => {
    if (countTimer.current) clearInterval(countTimer.current);
    setCounting(false);
    setSending(false);
  };

  const fire = async () => {
    setSending(true);
    try {
      const list = await getGuardians();
      await sendSOS(list);
      setCounting(false);
      setSending(false);
      Alert.alert('Alert taiyaar', 'SMS composer khul gaya hai tumhari location ke saath — send dabao.');
    } catch (e) {
      setCounting(false);
      setSending(false);
      Alert.alert('Nahi bhej paaye', e.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>Aap safe area mein ho</Text>
        <Text style={styles.bannerSub}>
          {guardians.length} guardian(s) tumhe help kar sakte hain
        </Text>
      </View>

      <View style={styles.sosWrap}>
        <TouchableOpacity
          style={styles.sos}
          activeOpacity={0.85}
          onPressIn={startHold}
          onPressOut={cancelHold}
        >
          <Text style={styles.sosBig}>SOS</Text>
          <Text style={styles.sosSmall}>1 sec dabaye rakho</Text>
        </TouchableOpacity>
        <Text style={styles.hint}>
          Dabate hi tumhari live location guardians ko SMS hone ke liye taiyaar ho jaayegi.
        </Text>
      </View>

      <TouchableOpacity style={styles.link} onPress={onGoGuardians}>
        <Text style={styles.linkText}>Guardians manage karo →</Text>
      </TouchableOpacity>

      <Modal visible={counting} transparent animationType="fade">
        <View style={styles.overlay}>
          <Text style={styles.count}>{sending ? '…' : count}</Text>
          <Text style={styles.overlayText}>
            {sending ? 'Alert taiyaar kar rahe hain' : 'Guardians ko alert ja raha hai'}
          </Text>
          <TouchableOpacity style={styles.cancel} onPress={cancelCountdown} disabled={sending}>
            <Text style={styles.cancelText}>Main safe hun — cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 20, paddingBottom: 40 },
  banner: {
    backgroundColor: colors.safeTint, borderRadius: 18, padding: 16,
  },
  bannerTitle: { color: colors.safe, fontSize: 16, fontWeight: '700' },
  bannerSub: { color: colors.inkSoft, fontSize: 13, marginTop: 4 },
  sosWrap: { alignItems: 'center', marginTop: 36 },
  sos: {
    width: 200, height: 200, borderRadius: 100, backgroundColor: colors.alert,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.alert, shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  sosBig: { color: '#fff', fontSize: 44, fontWeight: '800', letterSpacing: 2 },
  sosSmall: { color: 'rgba(255,255,255,0.9)', fontSize: 12, marginTop: 2 },
  hint: { color: colors.inkSoft, fontSize: 13, textAlign: 'center', marginTop: 20, maxWidth: 280 },
  link: { marginTop: 36, alignItems: 'center' },
  linkText: { color: colors.guard, fontWeight: '600', fontSize: 15 },
  overlay: {
    flex: 1, backgroundColor: colors.alert, alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  count: { color: '#fff', fontSize: 120, fontWeight: '800' },
  overlayText: { color: 'rgba(255,255,255,0.95)', fontSize: 16, marginBottom: 30 },
  cancel: {
    backgroundColor: '#fff', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 40,
  },
  cancelText: { color: colors.alertDeep, fontWeight: '700', fontSize: 16 },
});
