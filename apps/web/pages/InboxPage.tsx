import React, { useState, useEffect, useCallback } from 'react';
import { NeoCard } from '../components/NeoCard';
import { NeoButton } from '../components/NeoButton';
import { useLanguage } from '../contexts/LanguageContext';
import { useApi } from '../contexts/ApiContext';
import type { Note } from '@vicoo/types';

interface InboxPageProps {
  onOpenNote?: (noteId: string) => void;
}

export const InboxPage: React.FC<InboxPageProps> = ({ onOpenNote }) => {
  const { t } = useLanguage();
  const { notes: allNotes, refreshNotes, updateNote } = useApi();

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inbox' | 'clarified' | 'archived'>('inbox');

  // Load notes - filter client-side since API may not support status filtering
  const loadNotes = useCallback(async () => {
    setLoading(true);
    try {
      await refreshNotes();
    } catch (error) {
      console.error('Failed to load notes:', error);
    } finally {
      setLoading(false);
    }
  }, [refreshNotes]);

  // Filter notes by status when allNotes changes
  useEffect(() => {
    const filtered = (allNotes || []).filter(note => {
      // Default to 'inbox' for notes without status field (backwards compatibility)
      const status = (note as any).status || 'inbox';
      return status === activeTab;
    });
    setNotes(filtered);
    setLoading(false);
  }, [allNotes, activeTab]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // Handle status change
  const handleStatusChange = async (noteId: string, newStatus: 'inbox' | 'clarified' | 'archived') => {
    try {
      await updateNote(noteId, { status: newStatus } as any);
      // Remove from current list
      setNotes(notes.filter(n => n.id !== noteId));
    } catch (error) {
      console.error('Failed to update note status:', error);
    }
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const tabs = [
    { id: 'inbox', label: t('inbox.inbox') || 'Inbox', count: notes.length },
    { id: 'clarified', label: t('inbox.clarified') || 'Clarified', count: 0 },
    { id: 'archived', label: t('inbox.archived') || 'Archived', count: 0 }
  ] as const;

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('inbox.title') || 'Inbox'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t('inbox.description') || 'Review and organize your captured notes'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-amber-500 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-white/20">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-500 dark:text-gray-400">
            <span className="text-4xl mb-4">📥</span>
            <p>{t('inbox.empty') || 'No notes in inbox'}</p>
            <p className="text-sm mt-1">
              {t('inbox.emptyHint') || 'Use Ctrl+Shift+N to quickly capture notes'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {notes.map((note) => (
              <NeoCard
                key={note.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => onOpenNote?.(note.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {note.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                      {note.content || note.snippet}
                    </p>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        {formatDate(note.timestamp)}
                      </span>
                      {note.category && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                          {note.category}
                        </span>
                      )}
                      {note.tags?.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 text-xs rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                    {activeTab === 'inbox' && (
                      <>
                        <NeoButton
                          size="sm"
                          variant="secondary"
                          onClick={() => handleStatusChange(note.id, 'clarified')}
                        >
                          {t('inbox.clarify') || 'Clarify'}
                        </NeoButton>
                        <NeoButton
                          size="sm"
                          variant="ghost"
                          onClick={() => handleStatusChange(note.id, 'archived')}
                        >
                          {t('inbox.archive') || 'Archive'}
                        </NeoButton>
                      </>
                    )}
                    {activeTab === 'clarified' && (
                      <>
                        <NeoButton
                          size="sm"
                          variant="ghost"
                          onClick={() => handleStatusChange(note.id, 'inbox')}
                        >
                          {t('inbox.backToInbox') || 'Back to Inbox'}
                        </NeoButton>
                        <NeoButton
                          size="sm"
                          variant="ghost"
                          onClick={() => handleStatusChange(note.id, 'archived')}
                        >
                          {t('inbox.archive') || 'Archive'}
                        </NeoButton>
                      </>
                    )}
                    {activeTab === 'archived' && (
                      <NeoButton
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStatusChange(note.id, 'inbox')}
                      >
                        {t('inbox.restore') || 'Restore'}
                      </NeoButton>
                    )}
                  </div>
                </div>
              </NeoCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InboxPage;
