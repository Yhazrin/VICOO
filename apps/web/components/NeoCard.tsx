import React from 'react';

interface NeoCardProps {
  children?: React.ReactNode;
  className?: string;
  color?: string;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const NeoCard: React.FC<NeoCardProps> = ({
  children,
  className = '',
  color = '#FFD166',
  onClick,
  onMouseEnter,
  onMouseLeave
}) => {
  return (
    <div
      className={`rounded-2xl border-2 border-gray-900 dark:border-gray-700 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] ${className}`}
      style={{ backgroundColor: color }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </div>
  );
};

export default NeoCard;
