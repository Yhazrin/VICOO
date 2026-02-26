// TimelineScreen — Vicoo Mobile Timeline
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, shadows } from '../styles/theme';
import { apiClient } from '../services/api';

interface TimelineEvent { id: string; title: string; description?: string; date: string; type: string }

export default function TimelineScreen() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/api/timeline?limit=30').then(r => { setEvents(r.data || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const typeColors: Record<string, string> = { Idea: colors.secondary, Code: colors.info, Design: colors.accent, Milestone: colors.primary };

  if (loading) return <View style={s.center}><ActivityIndicator color={colors.primary} /></View>;

  return (
    <View style={s.container}>
      <FlatList
        data={events}
        keyExtractor={e => e.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<Text style={s.empty}>暂无时间线事件</Text>}
        renderItem={({ item }) => (
          <View style={s.item}>
            <View style={[s.dot, { backgroundColor: typeColors[item.type] || colors.primary }]} />
            <View style={s.line} />
            <View style={s.card}>
              <View style={s.cardHeader}>
                <Text style={s.cardType}>{item.type}</Text>
                <Text style={s.cardDate}>{item.date?.slice(0, 10)}</Text>
              </View>
              <Text style={s.cardTitle}>{item.title}</Text>
              {item.description && <Text style={s.cardDesc}>{item.description}</Text>}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { textAlign: 'center', color: '#ccc', fontSize: 16, marginTop: 60 },
  item: { flexDirection: 'row', marginBottom: 16, paddingLeft: 20 },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: colors.ink, position: 'absolute', left: 0, top: 8, zIndex: 1 },
  line: { width: 2, backgroundColor: '#e0e0e0', position: 'absolute', left: 6, top: 22, bottom: -16 },
  card: { flex: 1, backgroundColor: '#fff', borderWidth: 2, borderColor: colors.ink, borderRadius: 12, padding: 14, marginLeft: 12, ...shadows.neo },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  cardType: { fontSize: 11, fontWeight: '800', color: colors.info, textTransform: 'uppercase' },
  cardDate: { fontSize: 11, fontWeight: '600', color: '#999' },
  cardTitle: { fontSize: 15, fontWeight: '800', color: colors.ink },
  cardDesc: { fontSize: 13, color: '#666', marginTop: 4 },
});
