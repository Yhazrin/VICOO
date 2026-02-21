// EditorScreen.tsx - Note Editor
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { colors, spacing, typography, shadows, borderRadius, getCategoryColor } from '../styles/theme';

const categories = [
  { value: 'idea', label: '💡 Idea' },
  { value: 'code', label: '💻 Code' },
  { value: 'design', label: '🎨 Design' },
  { value: 'meeting', label: '📅 Meeting' }
];

export default function EditorScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const noteId = route.params?.noteId;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('idea');
  const [tags, setTags] = useState<string[]>([]);
  const [published, setPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!noteId);

  useEffect(() => {
    if (noteId) {
      loadNote();
    }
  }, [noteId]);

  const loadNote = async () => {
    try {
      const res = await api.getNote(noteId);
      const note = res.data;
      setTitle(note.title);
      setContent(note.content);
      setCategory(note.category);
      setTags(note.tags);
      setPublished(note.published);
    } catch (error) {
      Alert.alert('Error', 'Failed to load note');
    } finally {
      setLoading(false);
    }
  };

  const saveNote = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Title is required');
      return;
    }

    setSaving(true);

    try {
      const noteData = {
        title,
        content,
        category,
        tags,
        published,
        snippet: content.slice(0, 100)
      };

      if (noteId) {
        await api.updateNote(noteId, noteData);
        Alert.alert('Success', 'Note updated');
      } else {
        await api.createNote(noteData);
        Alert.alert('Success', 'Note created');
      }

      setTimeout(() => navigation.goBack(), 1000);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const deleteNote = () => {
    if (!noteId) return;

    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteNote(noteId);
              Alert.alert('Success', 'Note deleted');
              setTimeout(() => navigation.goBack(), 1000);
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={saveNote}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Title */}
          <TextInput
            style={styles.titleInput}
            placeholder="Note title..."
            value={title}
            onChangeText={setTitle}
          />

          {/* Category */}
          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryContainer}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.categoryChip,
                  category === cat.value && styles.categoryChipActive
                ]}
                onPress={() => setCategory(cat.value)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    category === cat.value && styles.categoryTextActive
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Content */}
          <Text style={styles.label}>Content</Text>
          <TextInput
            style={styles.contentInput}
            placeholder="Write your note here..."
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
          />

          {/* Tags */}
          <Text style={styles.label}>Tags</Text>
          <View style={styles.tagsContainer}>
            {tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
                <TouchableOpacity onPress={() => setTags(tags.filter((_, i) => i !== index))}>
                  <Ionicons name="close-circle" size={16} color={colors.gray} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={styles.addTagButton}
              onPress={() => {
                // Simple prompt for adding tag
                const newTag = prompt('Enter tag name:');
                if (newTag && !tags.includes(newTag.toLowerCase())) {
                  setTags([...tags, newTag.toLowerCase()]);
                }
              }}
            >
              <Text style={styles.addTagText}>+ Add Tag</Text>
            </TouchableOpacity>
          </View>

          {/* Published Toggle */}
          <View style={styles.toggleRow}>
            <Text style={styles.label}>Published</Text>
            <TouchableOpacity
              style={[styles.toggle, published && styles.toggleActive]}
              onPress={() => setPublished(!published)}
            >
              <View style={[styles.toggleThumb, published && styles.toggleThumbActive]} />
            </TouchableOpacity>
          </View>

          {/* Delete Button */}
          {noteId && (
            <TouchableOpacity style={styles.deleteButton} onPress={deleteNote}>
              <Text style={styles.deleteButtonText}>Delete Note</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light
  },
  keyboardView: {
    flex: 1
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: colors.white
  },
  backButton: {
    ...typography.body,
    fontWeight: '600'
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.ink
  },
  saveButtonDisabled: {
    opacity: 0.6
  },
  saveButtonText: {
    ...typography.body,
    fontWeight: '700'
  },
  content: {
    flex: 1,
    padding: spacing.md
  },
  titleInput: {
    ...typography.titleLarge,
    backgroundColor: colors.white,
    borderWidth: 3,
    borderColor: colors.ink,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg
  },
  label: {
    ...typography.caption,
    color: colors.gray,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    fontWeight: '600'
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.lg,
    gap: spacing.sm
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.white
  },
  categoryChipActive: {
    backgroundColor: colors.ink
  },
  categoryText: {
    ...typography.body,
    fontWeight: '600'
  },
  categoryTextActive: {
    color: colors.white
  },
  contentInput: {
    backgroundColor: colors.white,
    borderWidth: 3,
    borderColor: colors.ink,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    minHeight: 200,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: spacing.lg
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.lg,
    gap: spacing.sm
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.info,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: 4
  },
  tagText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600'
  },
  addTagButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.grayLight,
    borderRadius: borderRadius.sm
  },
  addTagText: {
    ...typography.caption,
    color: colors.grayLight
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg
  },
  toggle: {
    width: 50,
    height: 28,
    backgroundColor: colors.grayLight,
    borderRadius: 14,
    justifyContent: 'center',
    padding: 2
  },
  toggleActive: {
    backgroundColor: colors.secondary
  },
  toggleThumb: {
    width: 24,
    height: 24,
    backgroundColor: colors.white,
    borderRadius: 12
  },
  toggleThumbActive: {
    alignSelf: 'flex-end'
  },
  deleteButton: {
    backgroundColor: '#ff6b6b',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xl
  },
  deleteButtonText: {
    color: colors.white,
    fontWeight: '700'
  }
});
