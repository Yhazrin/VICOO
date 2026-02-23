// QuickCaptureFAB.tsx - Mobile Quick Capture Floating Action Button
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface QuickCaptureFABProps {
  onCapture?: (content: string) => void;
}

export default function QuickCaptureFAB({ onCapture }: QuickCaptureFABProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState('');

  const handleSubmit = () => {
    if (content.trim() && onCapture) {
      onCapture(content.trim());
      setContent('');
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* FAB Button */}
      <TouchableOpacity style={styles.fab} onPress={() => setIsOpen(true)}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Quick Capture Modal */}
      <Modal visible={isOpen} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.headerLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name="flash" size={20} color="#fff" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Quick Capture</Text>
                  <Text style={styles.modalHint}>Tap + Cmd+Shift+N</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Input */}
            <TextInput
              style={styles.input}
              placeholder="Start typing or paste..."
              value={content}
              onChangeText={setContent}
              multiline
              autoFocus
              placeholderTextColor="#999"
            />

            {/* Actions */}
            <View style={styles.actions}>
              <Text style={styles.hint}>Press done to save to inbox</Text>
              <TouchableOpacity
                style={[styles.saveButton, !content.trim() && styles.saveButtonDisabled]}
                onPress={handleSubmit}
                disabled={!content.trim()}
              >
                <Text style={styles.saveButtonText}>Save to Inbox</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFB800',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFB800',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  modalHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    color: '#1a1a1a',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  hint: {
    fontSize: 12,
    color: '#999',
  },
  saveButton: {
    backgroundColor: '#FFB800',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
