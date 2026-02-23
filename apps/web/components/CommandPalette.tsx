import React, { useState } from 'react';
import { View } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: View) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onNavigate }) => {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');

  const actions = [
    { label: t('cmd.dashboard') || 'Dashboard', icon: '📊', action: () => onNavigate(View.DASHBOARD) },
    { label: t('cmd.new_note') || 'New Note', icon: '📝', action: () => onNavigate(View.EDITOR) },
    { label: t('cmd.ai_assistant') || 'AI Assistant', icon: '🤖', action: () => onNavigate(View.ASK_AI) },
    { label: t('cmd.timeline') || 'Timeline', icon: '📅', action: () => onNavigate(View.TIMELINE) },
    { label: t('cmd.analytics') || 'Analytics', icon: '📈', action: () => onNavigate(View.ANALYTICS) },
    { label: t('cmd.template') || 'Templates', icon: '📋', action: () => onNavigate(View.TEMPLATES) },
    { label: t('cmd.public') || 'Public Gateway', icon: '🌐', action: () => onNavigate(View.PUBLIC_GATEWAY) },
    { label: t('cmd.settings') || 'Settings', icon: '⚙️', action: () => onNavigate(View.SETTINGS) },
  ];

  const filteredActions = query.trim()
    ? actions.filter(a => a.label.toLowerCase().includes(query.toLowerCase()))
    : actions;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-xl mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border-2 border-gray-900 dark:border-gray-700">
        <div className="p-4">
          <input
            type="text"
            placeholder={t('cmd.placeholder') || 'Type a command...'}
            className="w-full p-3 bg-gray-100 dark:bg-gray-800 rounded-xl border-2 border-gray-900 dark:border-gray-700 focus:ring-2 focus:ring-amber-400 outline-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>
        <div className="max-h-80 overflow-y-auto">
          {filteredActions.map((action, index) => (
            <button
              key={index}
              onClick={() => {
                action.action();
                onClose();
              }}
              className="w-full p-4 text-left hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-3 border-t border-gray-200 dark:border-gray-700"
            >
              <span>{action.icon}</span>
              <span>{action.label}</span>
            </button>
          ))}
          {filteredActions.length === 0 && (
            <div className="p-4 text-center text-gray-500">No commands found</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
