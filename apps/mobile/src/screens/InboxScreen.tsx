// InboxScreen.tsx - Mobile Inbox View
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Main: undefined;
  Editor: { noteId?: string };
};

interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  status: string;
  timestamp: string;
}

export default function InboxScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inbox' | 'clarified' | 'archived'>('inbox');
  const [refreshing, setRefreshing] = useState(false);

  // Mock data - in production, fetch from API
  useEffect(() => {
    loadNotes();
  }, [activeTab]);

  const loadNotes = () => {
    setLoading(true);
    // Mock data
    const mockNotes: Note[] = [
      { id: '1', title: 'Quick idea about React', content: 'Consider using server components for better performance...', category: 'idea', status: 'inbox', timestamp: '2024-01-15' },
      { id: '2', title: 'Meeting notes', content: 'Discussed Q1 planning and milestone dates...', category: 'meeting', status: 'inbox', timestamp: '2024-01-14' },
    ];
    setNotes(mockNotes);
    setLoading(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNotes();
    setRefreshing(false);
  };

  const handleNotePress = (noteId: string) => {
    navigation.navigate('Editor', { noteId });
  };

  const handleStatusChange = (noteId: string, newStatus: string) => {
    setNotes(notes.filter(n => n.id !== noteId));
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  const renderNote = ({ item }: { item: Note }) => (
    <TouchableOpacity style={styles.noteCard} onPress={() => handleNotePress(item.id)}>
      <View style={styles.noteHeader}>
        <Text style={styles.noteTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.noteDate}>{formatDate(item.timestamp)}</Text>
      </View>
      <Text style={styles.noteContent} numberOfLines={2}>{item.content}</Text>
      <View style={styles.noteFooter}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
        {activeTab === 'inbox' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleStatusChange(item.id, 'clarified')}
            >
              <Text style={styles.actionText}>Clarify</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.archiveButton]}
              onPress={() => handleStatusChange(item.id, 'archived')}
            >
              <Text style={styles.actionText}>Archive</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const tabs = [
    { id: 'inbox', label: 'Inbox' },
    { id: 'clarified', label: 'Clarified' },
    { id: 'archived', label: 'Archived' },
  ] as const;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inbox</Text>
        <Text style={styles.headerSubtitle}>Review and organize your notes</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.activeTab]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Notes List */}
      <FlatList
        data={notes}
        renderItem={renderNote}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="inbox" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No notes in inbox</Text>
            <Text style={styles.emptyHint}>Use + to capture notes</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  activeTab: {
    backgroundColor: '#FFB800',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },
  list: {
    padding: 16,
  },
  noteCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  noteDate: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  noteContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  categoryBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    backgroundColor: '#FFB800',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  archiveButton: {
    backgroundColor: '#666',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  emptyHint: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 4,
  },
});
