// ProfileScreen — Vicoo Mobile User Profile
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { colors, fonts, shadows } from '../styles/theme';
import { apiClient } from '../services/api';

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    apiClient.get('/auth/me').then(res => {
      if (res.data) { setUser(res.data); setUsername(res.data.username || ''); setBio(res.data.bio || ''); }
    }).catch(() => {});
  }, []);

  const save = async () => {
    try {
      await apiClient.patch('/auth/profile', { username, bio });
      setUser((u: any) => ({ ...u, username, bio }));
      setEditing(false);
      Alert.alert('成功', '个人信息已更新');
    } catch { Alert.alert('失败', '更新失败'); }
  };

  if (!user) return <View style={s.center}><Text>加载中...</Text></View>;

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 16 }}>
      {/* Avatar + Name */}
      <View style={s.card}>
        <View style={s.avatar}><Text style={s.avatarText}>{user.username?.[0]?.toUpperCase() || '?'}</Text></View>
        <Text style={s.name}>{user.username}</Text>
        <Text style={s.email}>{user.email}</Text>
        <View style={s.badge}><Text style={s.badgeText}>📧 {user.provider === 'google' ? 'Google' : user.provider === 'github' ? 'GitHub' : '邮箱注册'}</Text></View>
      </View>

      {/* Edit */}
      {editing ? (
        <View style={s.card}>
          <Text style={s.label}>用户名</Text>
          <TextInput style={s.input} value={username} onChangeText={setUsername} />
          <Text style={s.label}>简介</Text>
          <TextInput style={[s.input, { height: 80 }]} value={bio} onChangeText={setBio} multiline />
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <TouchableOpacity style={[s.btn, { backgroundColor: '#eee' }]} onPress={() => setEditing(false)}>
              <Text style={s.btnText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.btn} onPress={save}>
              <Text style={s.btnText}>保存</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={s.card} onPress={() => setEditing(true)}>
          <Text style={s.label}>点击编辑个人信息 →</Text>
          {user.bio ? <Text style={{ color: '#666', marginTop: 4 }}>{user.bio}</Text> : null}
        </TouchableOpacity>
      )}

      {/* Account Info */}
      <View style={s.card}>
        <Text style={[s.label, { marginBottom: 8 }]}>账号信息</Text>
        <View style={s.infoRow}><Text style={s.infoLabel}>用户 ID</Text><Text style={s.infoValue}>{user.id?.slice(0, 12)}...</Text></View>
        <View style={s.infoRow}><Text style={s.infoLabel}>角色</Text><Text style={s.infoValue}>{user.role === 'admin' ? '管理员' : '普通用户'}</Text></View>
        <View style={s.infoRow}><Text style={s.infoLabel}>登录方式</Text><Text style={s.infoValue}>{user.provider}</Text></View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#fff', borderWidth: 3, borderColor: colors.ink, borderRadius: 16, padding: 16, marginBottom: 12, ...shadows.neo },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary, borderWidth: 3, borderColor: colors.ink, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 8 },
  avatarText: { fontSize: 28, fontWeight: '900', color: colors.ink },
  name: { fontSize: 22, fontWeight: '900', textAlign: 'center', color: colors.ink },
  email: { fontSize: 13, color: '#999', textAlign: 'center', marginTop: 2 },
  badge: { alignSelf: 'center', marginTop: 8, backgroundColor: '#e8f5e9', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#2e7d32' },
  label: { fontSize: 13, fontWeight: '800', color: colors.ink, textTransform: 'uppercase', letterSpacing: 1 },
  input: { borderWidth: 2, borderColor: colors.ink, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, marginTop: 6, backgroundColor: colors.light },
  btn: { flex: 1, backgroundColor: colors.primary, borderWidth: 2, borderColor: colors.ink, borderRadius: 12, paddingVertical: 12, alignItems: 'center', ...shadows.neo },
  btnText: { fontSize: 14, fontWeight: '800', color: colors.ink },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  infoLabel: { fontSize: 13, fontWeight: '700', color: '#999' },
  infoValue: { fontSize: 13, fontWeight: '700', color: colors.ink },
});
