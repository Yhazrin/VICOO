// SettingsScreen — Vicoo Mobile Settings
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch } from 'react-native';
import { colors, fonts, shadows } from '../styles/theme';

export default function SettingsScreen({ navigation }: any) {
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');

  const items = [
    { label: '个人资料', icon: '👤', onPress: () => navigation?.navigate?.('Profile') },
    { label: '订阅管理', icon: '💎', onPress: () => {} },
    { label: 'AI Provider', icon: '🤖', onPress: () => {} },
    { label: '数据导出', icon: '📤', onPress: () => {} },
    { label: '关于 Vicoo', icon: 'ℹ️', onPress: () => {} },
  ];

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={s.title}>设置</Text>

      {/* Theme */}
      <View style={s.card}>
        <View style={s.row}>
          <Text style={s.rowLabel}>🌙 深色模式</Text>
          <Switch value={darkMode} onValueChange={setDarkMode} trackColor={{ true: colors.primary }} />
        </View>
        <View style={s.row}>
          <Text style={s.rowLabel}>🌐 语言</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={[s.langBtn, language === 'zh' && s.langActive]} onPress={() => setLanguage('zh')}>
              <Text style={[s.langText, language === 'zh' && { color: colors.ink }]}>中文</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.langBtn, language === 'en' && s.langActive]} onPress={() => setLanguage('en')}>
              <Text style={[s.langText, language === 'en' && { color: colors.ink }]}>EN</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Menu Items */}
      <View style={s.card}>
        {items.map((item, i) => (
          <TouchableOpacity key={i} style={[s.menuItem, i < items.length - 1 && s.menuBorder]} onPress={item.onPress}>
            <Text style={s.menuIcon}>{item.icon}</Text>
            <Text style={s.menuLabel}>{item.label}</Text>
            <Text style={s.menuArrow}>→</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Version */}
      <Text style={s.version}>Vicoo v1.0.0 • AI Knowledge Manager</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light },
  title: { fontSize: 28, fontWeight: '900', color: colors.ink, marginBottom: 16 },
  card: { backgroundColor: '#fff', borderWidth: 3, borderColor: colors.ink, borderRadius: 16, padding: 4, marginBottom: 12, ...shadows.neo },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  rowLabel: { fontSize: 15, fontWeight: '700', color: colors.ink },
  langBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, borderWidth: 2, borderColor: '#ddd' },
  langActive: { borderColor: colors.ink, backgroundColor: colors.primary },
  langText: { fontSize: 13, fontWeight: '700', color: '#999' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  menuIcon: { fontSize: 18, marginRight: 12 },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.ink },
  menuArrow: { fontSize: 16, color: '#ccc', fontWeight: '700' },
  version: { textAlign: 'center', color: '#ccc', fontSize: 12, fontWeight: '600', marginTop: 24 },
});
