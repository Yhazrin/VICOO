import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useApi } from '../contexts/ApiContext';

interface QuickCapturePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onCaptureComplete?: (noteId: string) => void;
}

export const QuickCapturePanel: React.FC<QuickCapturePanelProps> = ({
  isOpen,
  onClose,
  onCaptureComplete
}) => {
  const { t } = useLanguage();
  const { createNote } = useApi();

  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Clear content when closed
  useEffect(() => {
    if (!isOpen) {
      setContent('');
    }
  }, [isOpen]);

  // Handle clipboard paste detection
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (!isOpen) return;

      const text = e.clipboardData?.getData('text');
      if (text && !content) {
        setContent(text);
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [isOpen, content]);

  const handleSubmit = useCallback(async () => {
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Parse content for title extraction
      const lines = content.trim().split('\n');
      const title = lines[0].slice(0, 50) || 'Quick Note';
      const body = lines.slice(1).join('\n').trim() || lines[0];

      // Create note in inbox
      const newNote = await createNote({
        title,
        content: body || content,
        category: 'idea',
        status: 'inbox'
      });

      if (onCaptureComplete) {
        onCaptureComplete(newNote.id);
      }

      onClose();
    } catch (error) {
      console.error('Failed to create note:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [content, isSubmitting, createNote, onCaptureComplete, onClose]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  }, [handleSubmit, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-2xl mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <span className="text-white text-sm">⚡</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {t('quickCapture.title') || 'Quick Capture'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('quickCapture.hint') || 'Ctrl+Shift+N to open • Ctrl+Enter to save'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="text-gray-500">✕</span>
          </button>
        </div>

        {/* Input Area */}
        <div className="p-4">
          <textarea
            ref={inputRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('quickCapture.placeholder') || 'Start typing or paste from clipboard...'}
            className="w-full h-40 p-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl resize-none focus:ring-2 focus:ring-amber-400 focus:outline-none text-gray-900 dark:text-white placeholder-gray-400"
            disabled={isSubmitting}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              📋 {t('quickCapture.paste') || 'Paste from clipboard detected'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              {t('quickCapture.cancel') || 'Cancel'}
            </button>
            <button
              onClick={handleSubmit}
              disabled={!content.trim() || isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? t('quickCapture.saving') || 'Saving...' : t('quickCapture.save') || 'Save to Inbox'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
