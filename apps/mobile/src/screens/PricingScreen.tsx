// PricingScreen — Vicoo Mobile Pricing / Subscription
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { colors, shadows } from '../styles/theme';
import { apiClient } from '../services/api';

interface Plan { id: string; nameZh: string; priceMonthly: number; features: string[] }

export default function PricingScreen() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [current, setCurrent] = useState('free');
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    apiClient.get('/api/subscription/plans').then(r => setPlans(r.data || [])).catch(() => {});
    apiClient.get('/api/subscription').then(r => setCurrent(r.data?.plan || 'free')).catch(() => {});
  }, []);

  const upgrade = (planId: string) => {
    Alert.alert('升级到 ' + planId, '支付功能需要在 Web 端完成。请打开 vicoo.app 进行升级。', [{ text: '好的' }]);
  };

  const icons: Record<string, string> = { free: '🌱', pro: '⚡', team: '🚀' };

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={s.title}>选择计划</Text>
      <Text style={s.subtitle}>释放 AI 知识管理的全部潜力</Text>

      {/* Billing toggle */}
      <View style={s.toggle}>
        <TouchableOpacity style={[s.toggleBtn, billing === 'monthly' && s.toggleActive]} onPress={() => setBilling('monthly')}>
          <Text style={[s.toggleText, billing === 'monthly' && s.toggleActiveText]}>月付</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.toggleBtn, billing === 'yearly' && s.toggleActive]} onPress={() => setBilling('yearly')}>
          <Text style={[s.toggleText, billing === 'yearly' && s.toggleActiveText]}>年付 省17%</Text>
        </TouchableOpacity>
      </View>

      {plans.map(plan => {
        const isCurrent = current === plan.id;
        const price = billing === 'yearly' ? Math.round(plan.priceMonthly * 10 / 12) : plan.priceMonthly;
        return (
          <View key={plan.id} style={[s.card, plan.id === 'pro' && s.proCard]}>
            {plan.id === 'pro' && <View style={s.popularBadge}><Text style={s.popularText}>🔥 最受欢迎</Text></View>}
            <Text style={s.planIcon}>{icons[plan.id] || '📋'}</Text>
            <Text style={s.planName}>{plan.nameZh}</Text>
            <Text style={s.planPrice}>{price === 0 ? '免费' : `¥${price / 100}/月`}</Text>
            {plan.features.map((f, i) => (
              <Text key={i} style={s.feature}>✓ {f}</Text>
            ))}
            {isCurrent ? (
              <View style={s.currentBtn}><Text style={s.currentText}>当前计划</Text></View>
            ) : plan.priceMonthly > 0 ? (
              <TouchableOpacity style={s.upgradeBtn} onPress={() => upgrade(plan.id)}>
                <Text style={s.upgradeText}>升级</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light },
  title: { fontSize: 28, fontWeight: '900', color: colors.ink, textAlign: 'center', marginTop: 8 },
  subtitle: { fontSize: 14, color: '#999', textAlign: 'center', marginBottom: 16 },
  toggle: { flexDirection: 'row', backgroundColor: '#f0f0f0', borderRadius: 12, padding: 4, marginBottom: 16, alignSelf: 'center' },
  toggleBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 10 },
  toggleActive: { backgroundColor: '#fff', ...shadows.neo, borderWidth: 2, borderColor: colors.ink },
  toggleText: { fontSize: 13, fontWeight: '700', color: '#999' },
  toggleActiveText: { color: colors.ink },
  card: { backgroundColor: '#fff', borderWidth: 3, borderColor: colors.ink, borderRadius: 16, padding: 20, marginBottom: 12, ...shadows.neo },
  proCard: { borderColor: '#3b82f6', borderWidth: 3 },
  popularBadge: { position: 'absolute', top: -12, alignSelf: 'center', backgroundColor: '#3b82f6', paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20 },
  popularText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  planIcon: { fontSize: 32, textAlign: 'center', marginBottom: 4 },
  planName: { fontSize: 20, fontWeight: '900', textAlign: 'center', color: colors.ink },
  planPrice: { fontSize: 28, fontWeight: '900', textAlign: 'center', color: colors.ink, marginVertical: 8 },
  feature: { fontSize: 14, color: '#555', marginVertical: 3, fontWeight: '500' },
  currentBtn: { marginTop: 12, padding: 12, backgroundColor: '#f0f0f0', borderRadius: 12, alignItems: 'center' },
  currentText: { fontSize: 14, fontWeight: '700', color: '#999' },
  upgradeBtn: { marginTop: 12, padding: 12, backgroundColor: colors.primary, borderWidth: 2, borderColor: colors.ink, borderRadius: 12, alignItems: 'center', ...shadows.neo },
  upgradeText: { fontSize: 14, fontWeight: '800', color: colors.ink },
});
