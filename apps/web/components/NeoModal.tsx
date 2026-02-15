import React, { useEffect } from 'react';
import { NeoButton } from './NeoButton';

interface NeoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  icon?: string;
  footer?: React.ReactNode;
}

export const NeoModal: React.FC<NeoModalProps> = ({ isOpen, onClose, title, icon, children, footer }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-ink/40 dark:bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-white dark:bg-gray-900 border-3 border-ink dark:border-gray-500 rounded-2xl shadow-neo-lg dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] w-full max-w-lg max-h-[90vh] flex flex-col animate-pop">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-3 border-ink dark:border-gray-500 bg-gray-50 dark:bg-gray-800 rounded-t-xl">
           <div className="flex items-center gap-3">
              {icon && (
                  <div className="w-10 h-10 bg-primary border-2 border-ink dark:border-gray-600 rounded-lg flex items-center justify-center shadow-sm text-ink">
                      <span className="material-icons-round">{icon}</span>
                  </div>
              )}
              <h2 className="text-2xl font-display font-bold text-ink dark:text-white">{title}</h2>
           </div>
           <button 
             onClick={onClose}
             className="w-8 h-8 flex items-center justify-center rounded-lg border-2 border-transparent hover:border-ink dark:hover:border-white hover:bg-white dark:hover:bg-gray-700 transition-all dark:text-white"
           >
             <span className="material-icons-round text-xl">close</span>
           </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar text-ink dark:text-gray-100">
           {children}
        </div>

        {/* Footer */}
        {footer && (
            <div className="p-6 border-t-3 border-ink dark:border-gray-500 bg-gray-50 dark:bg-gray-800 rounded-b-xl flex justify-end gap-2">
                {footer}
            </div>
        )}
      </div>
    </div>
  );
};