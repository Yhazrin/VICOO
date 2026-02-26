// GalaxyScreen — Vicoo Mobile Galaxy View (WebView wrapper)
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { colors, shadows } from '../styles/theme';

export default function GalaxyScreen() {
  const openWebGalaxy = () => {
    Linking.openURL('http://localhost:3001').catch(() => {});
  };

  return (
    <View style={s.container}>
      <View style={s.card}>
        <Text style={s.icon}>🌌</Text>
        <Text style={s.title}>Galaxy 知识图谱</Text>
        <Text style={s.desc}>知识图谱可视化功能需要在大屏幕上使用以获得最佳体验。</Text>
        <TouchableOpacity style={s.btn} onPress={openWebGalaxy}>
          <Text style={s.btnText}>在浏览器中打开 →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light, justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderWidth: 3, borderColor: colors.ink, borderRadius: 20, padding: 32, alignItems: 'center', width: '100%', ...shadows.neo },
  icon: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '900', color: colors.ink, marginBottom: 8 },
  desc: { fontSize: 14, color: '#999', textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  btn: { backgroundColor: colors.primary, borderWidth: 3, borderColor: colors.ink, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 28, ...shadows.neo },
  btnText: { fontSize: 15, fontWeight: '800', color: colors.ink },
});
