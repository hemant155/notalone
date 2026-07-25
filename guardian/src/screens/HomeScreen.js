import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, Alert, ScrollView,
} from 'react-native';
import { colors } from '../theme';
import { getGuardians } from '../lib/api';
import { sendSOS, startLocationTracking, resolveActiveAlert } from '../lib/sos';

export default function HomeScreen({ userId, onGoGuardians }) {
  const [guardians, setGuardians] = useState([]);
  const [counting, setCounting] = useState(false);
  const [count, setCount] = useState(3);
  const [sending, setSending] = useState(false);
  const [activeAlert, setActiveAlert] = useState(null); // { alertId, link } | null
  const [locationWarning, setLocationWarning] = useState(null);
  const [resolving, setResolving] = useState(false);

  const holdTimer = useRef(null);
  const countTimer = useRef(null);
  const stopTracking = useRef(null);

  const loadGuardians = async () => {
    try {
      setGuardians(await getGuardians(userId));
    } catch (e) {
      // non-fatal here — countdown flow re-fetches and will surface the error
      // clearly if the user actually tries to fire an SOS
    }
  };
  useEffect(() => { loadGuardians(); }, []);

  // stop the tracking loop if the screen unmounts mid-alert
  useEffect(() => () => stopTracking.current?.(), []);

  const startHold = () => {
    holdTimer.current = setTimeout(beginCountdown, 800);
  };
  const cancelHold = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
  };

  const beginCountdown = async () => {
    let list = guardians;
    try {
      list = await getGuardians(userId);
      setGuardians(list);
    } catch (e) {
      Alert.alert('Guardians load nahi ho paaye', e.message);
      return;
    }
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
        fire(list);
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

  const fire = async (list) => {
    setSending(true);
    try {
      const result = await sendSOS({ userId, guardians: list });
      setCounting(false);
      setSending(false);

      if (result.mode === 'server') {
        setActiveAlert({ alertId: result.alertId, link: result.link });
        setLocationWarning(null);
        stopTracking.current = startLocationTracking(result.alertId, {
          onError: (err) => setLocationWarning(err.message),
        });
        Alert.alert('Alert bhej diya', 'Guardians ko notify kar diya gaya hai. Tumhari location har 10 second update ho rahi hai.');
      } else {
        // sms_fallback — composer is already open, no server-side alert to track
        Alert.alert('SMS fallback', result.warning);
      }
    } catch (e) {
      setCounting(false);
      setSending(false);
      Alert.alert('Nahi bhej paaye', e.message);
    }
  };

  const markSafe = async () => {
    if (!activeAlert) return;
    setResolving(true);
    try {
      await resolveActiveAlert(activeAlert.alertId);
      stopTracking.current?.();
      stopTracking.current = null;
      setActiveAlert(null);
      setLocationWarning(null);
      Alert.alert('Theek hai', 'Guardians ko bata diya gaya hai ki tum safe ho.');
    } catch (e) {
      Alert.alert('Resolve nahi ho paaya', `${e.message}. Location tracking chalu rahegi — dobara try karo.`);
    } finally {
      setResolving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <View style={[styles.banner, activeAlert && styles.bannerAlert]}>
        <Text style={[styles.bannerTitle, activeAlert && styles.bannerTitleAlert]}>
          {activeAlert ? 'SOS ACTIVE — tracking chalu hai' : 'Aap safe area mein ho'}
        </Text>
        <Text style={styles.bannerSub}>
          {guardians.length} guardian(s) tumhe help kar sakte hain
        </Text>
        {locationWarning && (
          <Text style={styles.bannerWarning}>Location update fail ho rahi hai: {locationWarning}</Text>
        )}
      </View>

      {activeAlert ? (
        <View style={styles.sosWrap}>
          <TouchableOpacity
            style={styles.safeBtn}
            onPress={markSafe}
            disabled={resolving}
          >
            <Text style={styles.safeBtnText}>{resolving ? 'Resolve ho raha hai…' : 'Main safe hun'}</Text>
          </TouchableOpacity>
          <Text style={styles.hint}>Guardians tumhari live location dekh sakte hain: {activeAlert.link}</Text>
        </View>
      ) : (
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
            Dabate hi tumhari live location guardians ko alert ke saath chali jaayegi.
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.link} onPress={onGoGuardians}>
        <Text style={styles.linkText}>Guardians manage karo →</Text>
      </TouchableOpacity>

      <Modal visible={counting} transparent animationType="fade">
        <View style={styles.overlay}>
          <Text style={styles.count}>{sending ? '…' : count}</Text>
          <Text style={styles.overlayText}>
            {sending ? 'Alert bhej rahe hain' : 'Guardians ko alert ja raha hai'}
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
  bannerAlert: { backgroundColor: '#FBE6E7' },
  bannerTitle: { color: colors.safe, fontSize: 16, fontWeight: '700' },
  bannerTitleAlert: { color: colors.alertDeep },
  bannerSub: { color: colors.inkSoft, fontSize: 13, marginTop: 4 },
  bannerWarning: { color: colors.alertDeep, fontSize: 12, marginTop: 8 },
  sosWrap: { alignItems: 'center', marginTop: 36 },
  sos: {
    width: 200, height: 200, borderRadius: 100, backgroundColor: colors.alert,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.alert, shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  sosBig: { color: '#fff', fontSize: 44, fontWeight: '800', letterSpacing: 2 },
  sosSmall: { color: 'rgba(255,255,255,0.9)', fontSize: 12, marginTop: 2 },
  safeBtn: {
    width: 200, height: 200, borderRadius: 100, backgroundColor: colors.safe,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16,
    shadowColor: colors.safe, shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  safeBtnText: { color: '#fff', fontSize: 18, fontWeight: '800', textAlign: 'center' },
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
