// HomeScreen.tsx - Dashboard
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { colors, spacing, typography, shadows, borderRadius, getCategoryColor } from '../styles/theme';

interface Note {
  id: string;
  title: string;
  category: string;
  snippet: string;
  tags: string[];
  timestamp: string;
}

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [notes, setNotes] = useState<Note[]>([]);
  const [stats, setStats] = useState({ total: 0, ideas: 0, code: 0, design: 0, meeting: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await api.listNotes({ limit: 10 });
      const data = res.data;
      setNotes(data);
      setStats({
        total: data.length,
        ideas: data.filter((n: Note) => n.category === 'idea').length,
        code: data.filter((n: Note) => n.category === 'code').length,
        design: data.filter((n: Note) => n.category === 'design').length,
        meeting: data.filter((n: Note) => n.category === 'meeting').length
      });
    } catch (error) {
      console.error('Failed to load:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const navigateToEditor = (noteId?: string) => {
    navigation.navigate('Editor', { noteId });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>vicoo</Text>
          <Text style={styles.tagline}>Your Visual Coordinator</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <TouchableOpacity style={styles.statCard} onPress={() => navigation.navigate('Library')}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.statCard, { borderColor: colors.secondary }]}>
            <Text style={styles.statValue}>{stats.ideas}</Text>
            <Text style={styles.statLabel}>Ideas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.statCard, { borderColor: colors.info }]}>
            <Text style={styles.statValue}>{stats.code}</Text>
            <Text style={styles.statLabel}>Code</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.statCard, { borderColor: colors.accent }]}>
            <Text style={styles.statValue}>{stats.meeting}</Text>
            <Text style={styles.statLabel}>Meetings</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={() => navigateToEditor()}
          >
            <Ionicons name="add" size={20} color={colors.ink} />
            <Text style={styles.actionText}>New Note</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Notes */}
        <Text style={styles.sectionTitle}>Recent Notes</Text>
        {notes.slice(0, 5).map((note) => (
          <TouchableOpacity
            key={note.id}
            style={styles.noteCard}
            onPress={() => navigateToEditor(note.id)}
          >
            <View style={styles.noteHeader}>
              <View style={[styles.categoryTag, { backgroundColor: getCategoryColor(note.category) }]}>
                <Text style={styles.categoryText}>{note.category}</Text>
              </View>
              <Text style={styles.noteDate}>
                {new Date(note.timestamp).toLocaleDateString()}
              </Text>
            </View>
            <Text style={styles.noteTitle}>{note.title}</Text>
            <Text style={styles.noteSnippet} numberOfLines={2}>
              {note.snippet}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light
  },
  content: {
    padding: spacing.md
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg
  },
  logo: {
    ...typography.titleLarge,
    color: colors.ink
  },
  tagline: {
    ...typography.caption,
    color: colors.gray
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.lg
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderWidth: 3,
    borderColor: colors.ink,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    alignItems: 'center',
    ...shadows.neoSmall
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.ink
  },
  statLabel: {
    ...typography.caption,
    color: colors.gray,
    textTransform: 'uppercase'
  },
  actions: {
    marginBottom: spacing.lg
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 3,  // 与 Web 一致 (border-3)
    borderColor: colors.ink,
    ...shadows.neo  // 使用完整的 neo 阴影
  },
  primaryButton: {
    backgroundColor: colors.primary
  },
  actionText: {
    ...typography.titleSmall,
    marginLeft: spacing.sm
  },
  sectionTitle: {
    ...typography.titleMedium,
    marginBottom: spacing.md
  },
  noteCard: {
    backgroundColor: colors.white,
    borderWidth: 3,
    borderColor: colors.ink,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.neoSmall
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs
  },
  categoryTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  noteDate: {
    ...typography.caption,
    color: colors.grayLight
  },
  noteTitle: {
    ...typography.titleSmall,
    marginBottom: spacing.xs
  },
  noteSnippet: {
    ...typography.body,
    color: colors.gray
  }
});
