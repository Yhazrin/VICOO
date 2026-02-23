/**
 * Vicoo UI Components
 */

import React from 'react';

// Command Palette
export interface CommandAction {
  label: string;
  icon?: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  actions: CommandAction[];
  t?: (key: string) => string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  actions,
  t
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-xl mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-4">
          <input
            type="text"
            placeholder={t?.('cmd.placeholder') || 'Type a command...'}
            className="w-full p-3 bg-gray-100 dark:bg-gray-800 rounded-xl border-0 focus:ring-2 focus:ring-amber-400"
            autoFocus
          />
        </div>
        <div className="max-h-80 overflow-y-auto">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => {
                action.action();
                onClose();
              }}
              className="w-full p-4 text-left hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-3"
            >
              {action.icon && <span>{action.icon}</span>}
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default {
  CommandPalette
};
