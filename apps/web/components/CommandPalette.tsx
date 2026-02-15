import React, { useState, useEffect } from 'react';
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
  const [selectedIndex, setSelectedIndex] = useState(0);

  const actions = [
    { label: t('cmd.dashboard'), icon: 'dashboard', action: () => onNavigate(View.DASHBOARD) },
    { label: t('cmd.new_note'), icon: 'edit_note', action: () => onNavigate(View.EDITOR) },
    { label: t('cmd.search'), icon: 'search', action: () => onNavigate(View.SEARCH) },
    { label: t('cmd.timeline'), icon: 'history', action: () => onNavigate(View.TIMELINE) },
    { label: t('cmd.analytics'), icon: 'insights', action: () => onNavigate(View.ANALYTICS) },
    { label: t('cmd.template'), icon: 'extension', action: () => onNavigate(View.TEMPLATES) },
    { label: t('cmd.public'), icon: 'public', action: () => onNavigate(View.PUBLIC_GATEWAY) },
    { label: t('cmd.settings'), icon: 'settings', action: () => onNavigate(View.SETTINGS) },
  ];

  const filteredActions = actions.filter(action => 
    action.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredActions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredActions.length) % filteredActions.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredActions[selectedIndex]) {
          filteredActions[selectedIndex].action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredActions, selectedIndex, onClose]);

  // Reset selection when query changes
  useEffect(() => setSelectedIndex(0), [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-start justify-center pt-[20vh] px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white border-3 border-ink rounded-2xl shadow-neo-lg overflow-hidden animate-pop">
        {/* Search Input */}
        <div className="flex items-center gap-4 px-6 py-4 border-b-3 border-ink bg-gray-50">
          <span className="material-icons-round text-2xl text-gray-400">search</span>
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('cmd.placeholder')}
            className="flex-1 bg-transparent border-none text-xl font-bold text-ink placeholder-gray-400 focus:ring-0 p-0"
          />
          <span className="text-xs font-bold bg-gray-200 border-2 border-ink px-2 py-1 rounded text-gray-500">ESC</span>
        </div>

        {/* Actions List */}
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {filteredActions.length === 0 ? (
            <div className="p-8 text-center text-gray-500 font-bold">{t('cmd.no_results')}</div>
          ) : (
            filteredActions.map((action, index) => (
              <button
                key={action.label}
                onClick={() => {
                  action.action();
                  onClose();
                }}
                className={`
                  w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-colors
                  ${index === selectedIndex ? 'bg-primary border-2 border-ink shadow-neo-sm' : 'hover:bg-gray-100 border-2 border-transparent'}
                `}
              >
                <span className={`material-icons-round ${index === selectedIndex ? 'text-ink' : 'text-gray-500'}`}>{action.icon}</span>
                <span className="font-bold text-ink">{action.label}</span>
                {index === selectedIndex && <span className="ml-auto material-icons-round text-sm">keyboard_return</span>}
              </button>
            ))
          )}
        </div>
        
        {/* Footer */}
        <div className="px-4 py-2 bg-gray-50 border-t-3 border-ink flex justify-between items-center text-xs font-bold text-gray-400">
           <span>{t('cmd.footer_nav')}</span>
           <span>{t('cmd.footer_title')}</span>
        </div>
      </div>
    </div>
  );
};