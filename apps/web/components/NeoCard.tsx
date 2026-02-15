import React from 'react';

interface NeoCardProps {
  children: React.ReactNode;
  className?: string;
  color?: 'white' | 'primary' | 'secondary' | 'accent' | 'info';
  onClick?: () => void;
}

const colorMap = {
  white: 'bg-white dark:bg-gray-800',
  primary: 'bg-primary dark:bg-primary',
  secondary: 'bg-secondary dark:bg-secondary',
  accent: 'bg-accent dark:bg-accent',
  info: 'bg-info dark:bg-info',
};

// Helper to determine text color based on background in dark mode
// Primary/Secondary/Accent/Info usually keep black text even in dark mode because they are bright colors.
// White background turns to dark gray, so text needs to be white.

export const NeoCard: React.FC<NeoCardProps> = ({ children, className = '', color = 'white', onClick }) => {
  const isColored = color !== 'white';
  
  return (
    <div 
      className={`
        ${colorMap[color]} 
        border-3 border-ink dark:border-gray-200 
        rounded-2xl 
        shadow-neo dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] 
        hover:shadow-neo-hover dark:hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.3)]
        transition-all duration-200 
        ${onClick ? 'cursor-pointer hover:-translate-y-1 active:translate-y-0 active:shadow-neo-sm dark:active:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]' : ''}
        ${!isColored ? 'dark:text-gray-100' : 'text-ink'}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
};