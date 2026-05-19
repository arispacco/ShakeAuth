import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Vibration, StatusBar, TouchableOpacity, DeviceEventEmitter, NativeEventEmitter, NativeModules, Platform } from 'react-native';
import ReactNativeBiometrics from 'react-native-biometrics';

function getDayNumber() {
  var day = new Date().getDay();
  return day === 0 ? 7 : day;
}

function getRequiredShakes() {
  var d = getDayNumber();
  return (d * d) % 5;
}

var DAY_NAMES = ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

export default function App() {
  var required = getRequiredShakes();
  var dayNum = getDayNumber();
  var dayName = DAY_NAMES[dayNum];
  var [count, setCount] = useState(0);
  var [auth, setAuth] = useState(required === 0);
  var [authMethod, setAuthMethod] = useState('');

  function handleShake() {
    Vibration.vibrate(60);
    setCount(function (prev) {
      var next = prev + 1;
      if (next >= required) {
        setAuthMethod('secousse');
        setAuth(true);
      }
      return next;
    });
  }

  function handleBiometric() {
    var rnBiometrics = new ReactNativeBiometrics();
    rnBiometrics.simplePrompt({ promptMessage: 'Confirmez votre empreinte' })
      .then(function (result) {
        if (result.success) {
          setAuthMethod('empreinte');
          setAuth(true);
        }
      })
      .catch(function () {
        console.log('Empreinte annulee');
      });
  }

  useEffect(function () {
    if (auth) return;

    let sub;
    if (Platform.OS === 'android') {
      sub = DeviceEventEmitter.addListener('ShakeEvent', handleShake);
    } else {
      const { ShakeEventEmitter } = NativeModules;
      const shakeEmitter = new NativeEventEmitter(ShakeEventEmitter);
      sub = shakeEmitter.addListener('ShakeEvent', handleShake);
    }

    return function () {
      sub.remove();
    };
  }, [auth]);

  if (auth) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <Text style={styles.icon}>★</Text>
        <Text style={styles.successTitle}>ACCES ACCORDE</Text>
        <Text style={styles.successSub}>Bienvenue !</Text>
        <Text style={styles.badge}>{dayName} - via {authMethod}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Text style={styles.title}>SHAKE TO UNLOCK</Text>
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>{dayName} - Jour {dayNum}</Text>
        <Text style={styles.formula}>{dayNum} x {dayNum} mod 5 = {required}</Text>
      </View>
      <View style={styles.circle}>
        <Text style={styles.countNum}>{count}</Text>
        <Text style={styles.countSub}>/ {required}</Text>
      </View>
      <Text style={styles.hint}>Secouez le téléphone !</Text>
      <Text style={styles.orText}>— OU —</Text>
      <TouchableOpacity style={styles.bioBtn} onPress={handleBiometric}>
        <Text style={styles.bioBtnText}>EMPREINTE DIGITALE</Text>
      </TouchableOpacity>
    </View>
  );
}

var styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F', alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: '900', color: '#FFFFFF', letterSpacing: 4, marginBottom: 24 },
  infoBox: { borderWidth: 1, borderColor: '#4ECDC4', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 32 },
  infoText: { color: '#A0AEC0', fontSize: 13, marginBottom: 4 },
  formula: { color: '#FFD700', fontSize: 16, fontWeight: 'bold' },
  circle: { width: 150, height: 150, borderRadius: 75, borderWidth: 4, borderColor: '#4ECDC4', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  countNum: { fontSize: 52, fontWeight: '900', color: '#FFFFFF' },
  countSub: { fontSize: 14, color: '#718096' },
  hint: { color: '#A0AEC0', fontSize: 14, textAlign: 'center', marginBottom: 20 },
  orText: { color: '#718096', fontSize: 13, marginVertical: 16 },
  bioBtn: { borderWidth: 2, borderColor: '#A855F7', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 25 },
  bioBtnText: { color: '#A855F7', fontWeight: '900', fontSize: 14, letterSpacing: 2 },
  icon: { fontSize: 64, color: '#00FFB2', marginBottom: 16 },
  successTitle: { fontSize: 30, fontWeight: '900', color: '#00FFB2', letterSpacing: 6, marginBottom: 8 },
  successSub: { fontSize: 18, color: '#E2E8F0', marginBottom: 20 },
  badge: { color: '#00FFB2', fontSize: 14, borderWidth: 1, borderColor: '#00FFB2', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
});