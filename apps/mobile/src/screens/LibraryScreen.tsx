// LibraryScreen.tsx - Notes List
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
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
  published: boolean;
}

const categories = ['All', 'idea', 'code', 'design', 'meeting'];

export default function LibraryScreen() {
  const navigation = useNavigation<any>();
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotes();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [notes, filter, searchQuery]);

  const loadNotes = async () => {
    try {
      const res = await api.listNotes({ limit: 50 });
      setNotes(res.data);
    } catch (error) {
      console.error('Failed to load:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilters = () => {
    let result = [...notes];

    if (filter !== 'All') {
      result = result.filter(n => n.category === filter);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(n =>
        n.title.toLowerCase().includes(q) ||
        (n.content && n.content.toLowerCase().includes(q)) ||
        n.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    setFilteredNotes(result);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNotes();
  };

  const navigateToEditor = (noteId?: string) => {
    navigation.navigate('Editor', { noteId });
  };

  const renderNote = ({ item }: { item: Note }) => (
    <TouchableOpacity
      style={styles.noteCard}
      onPress={() => navigateToEditor(item.id)}
    >
      <View style={styles.noteHeader}>
        <View style={[styles.categoryTag, { backgroundColor: getCategoryColor(item.category) }]}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
        {!item.published && (
          <View style={styles.draftBadge}>
            <Text style={styles.draftText}>Draft</Text>
          </View>
        )}
      </View>
      <Text style={styles.noteTitle}>{item.title}</Text>
      <Text style={styles.noteSnippet} numberOfLines={2}>
        {item.snippet}
      </Text>
      <View style={styles.noteFooter}>
        <Text style={styles.noteDate}>
          {new Date(item.timestamp).toLocaleDateString()}
        </Text>
        {item.tags.length > 0 && (
          <Text style={styles.noteTags} numberOfLines={1}>
            {item.tags.map(t => `#${t}`).join(' ')}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Library</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search notes..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={categories}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, filter === item && styles.filterChipActive]}
              onPress={() => setFilter(item)}
            >
              <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Notes List */}
      <FlatList
        data={filteredNotes}
        keyExtractor={(item) => item.id}
        renderItem={renderNote}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No notes found</Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => navigateToEditor()}>
        <Ionicons name="add" size={32} color={colors.ink} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light
  },
  header: {
    padding: spacing.md,
    paddingBottom: spacing.sm
  },
  title: {
    ...typography.titleLarge
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm
  },
  searchInput: {
    backgroundColor: colors.white,
    borderWidth: 3,
    borderColor: colors.ink,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 16
  },
  filterContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: borderRadius.sm,
    marginRight: spacing.sm,
    backgroundColor: colors.white
  },
  filterChipActive: {
    backgroundColor: colors.ink
  },
  filterText: {
    ...typography.body,
    fontWeight: '600',
    textTransform: 'capitalize'
  },
  filterTextActive: {
    color: colors.white
  },
  list: {
    padding: spacing.md,
    paddingBottom: 100
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
    textTransform: 'uppercase',
    color: colors.white
  },
  draftBadge: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm
  },
  draftText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.white
  },
  noteTitle: {
    ...typography.titleSmall,
    marginBottom: spacing.xs
  },
  noteSnippet: {
    ...typography.body,
    color: colors.gray,
    marginBottom: spacing.sm
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: spacing.sm
  },
  noteDate: {
    ...typography.caption,
    color: colors.grayLight
  },
  noteTags: {
    ...typography.caption,
    color: colors.info,
    flex: 1,
    marginLeft: spacing.sm
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl
  },
  emptyText: {
    ...typography.body,
    color: colors.grayLight
  },
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    borderWidth: 3,  // 与 Web 一致 (border-3)
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.neo
  }
});
