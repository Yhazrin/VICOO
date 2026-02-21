import React from 'react';
import { CommandPalette as UICommandPalette, CommandAction } from '@vicoo/ui';
import { View } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: View) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onNavigate }) => {
  const { t } = useLanguage();

  const actions: CommandAction[] = [
    { label: t('cmd.dashboard'), icon: 'dashboard', action: () => onNavigate(View.DASHBOARD) },
    { label: t('cmd.new_note'), icon: 'edit_note', action: () => onNavigate(View.EDITOR) },
    { label: t('cmd.search'), icon: 'search', action: () => onNavigate(View.SEARCH) },
    { label: t('cmd.timeline'), icon: 'history', action: () => onNavigate(View.TIMELINE) },
    { label: t('cmd.analytics'), icon: 'insights', action: () => onNavigate(View.ANALYTICS) },
    { label: t('cmd.template'), icon: 'extension', action: () => onNavigate(View.TEMPLATES) },
    { label: t('cmd.public'), icon: 'public', action: () => onNavigate(View.PUBLIC_GATEWAY) },
    { label: t('cmd.settings'), icon: 'settings', action: () => onNavigate(View.SETTINGS) },
  ];

  return (
    <UICommandPalette
      isOpen={isOpen}
      onClose={onClose}
      actions={actions}
      t={t}
    />
  );
};
