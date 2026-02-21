// SearchScreen.tsx - Search
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';
import { colors, spacing, typography, shadows, borderRadius, getCategoryColor } from '../styles/theme';

interface Note {
  id: string;
  title: string;
  category: string;
  snippet: string;
  tags: string[];
}

export default function SearchScreen() {
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Note[]>([]);
  const [searched, setSearched] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const handleSearch = async () => {
    if (!query.trim()) return;

    try {
      const res = await api.listNotes({ limit: 50 });
      const notes = res.data;
      const q = query.toLowerCase();
      const filtered = notes.filter(n =>
        n.title.toLowerCase().includes(q) ||
        (n.content && n.content.toLowerCase().includes(q)) ||
        n.tags.some(t => t.toLowerCase().includes(q)) ||
        n.category.toLowerCase().includes(q)
      );
      setResults(filtered);
      setSearched(true);

      // Save to recent
      if (!recentSearches.includes(query)) {
        const recent = [query, ...recentSearches.slice(0, 4)];
        setRecentSearches(recent);
      }
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const useRecent = (text: string) => {
    setQuery(text);
    // Trigger search
    setTimeout(() => handleSearch(), 100);
  };

  const navigateToEditor = (noteId: string) => {
    navigation.navigate('Editor', { noteId });
  };

  const renderNote = ({ item }: { item: Note }) => (
    <TouchableOpacity
      style={styles.resultCard}
      onPress={() => navigateToEditor(item.id)}
    >
      <View style={[styles.categoryTag, { backgroundColor: getCategoryColor(item.category) }]}>
        <Text style={styles.categoryText}>{item.category}</Text>
      </View>
      <Text style={styles.resultTitle}>{item.title}</Text>
      <Text style={styles.resultSnippet} numberOfLines={2}>
        {item.snippet}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search notes..."
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setSearched(false); }}>
              <Text style={styles.clear}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results or Recent */}
      {searched ? (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderNote}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No results for "{query}"</Text>
            </View>
          }
          ListHeaderComponent={
            results.length > 0 ? (
              <Text style={styles.resultCount}>{results.length} results</Text>
            ) : null
          }
        />
      ) : (
        <View style={styles.recentSection}>
          {recentSearches.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Recent Searches</Text>
              {recentSearches.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.recentItem}
                  onPress={() => useRecent(item)}
                >
                  <Text style={styles.recentIcon}>🕐</Text>
                  <Text style={styles.recentText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Search for notes</Text>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light
  },
  searchSection: {
    padding: spacing.md
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 3,
    borderColor: colors.ink,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 16
  },
  clear: {
    fontSize: 28,
    color: colors.grayLight,
    position: 'absolute',
    right: spacing.md
  },
  list: {
    padding: spacing.md
  },
  resultCount: {
    ...typography.caption,
    color: colors.gray,
    marginBottom: spacing.sm
  },
  resultCard: {
    backgroundColor: colors.white,
    borderWidth: 3,
    borderColor: colors.ink,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.neoSmall
  },
  categoryTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    color: colors.white
  },
  resultTitle: {
    ...typography.titleSmall,
    marginBottom: spacing.xs
  },
  resultSnippet: {
    ...typography.body,
    color: colors.gray
  },
  recentSection: {
    padding: spacing.md
  },
  sectionTitle: {
    ...typography.titleMedium,
    marginBottom: spacing.md
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: '#eee',
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm
  },
  recentIcon: {
    marginRight: spacing.sm
  },
  recentText: {
    ...typography.body
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
  }
});
