import React from 'react';

export const PageSkeleton: React.FC = () => {
  return (
    <div className="w-full h-full p-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between mb-8">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>

      {/* Card Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <NoteCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
};

export const NoteCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
      <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
      <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
      <div className="flex gap-2">
        <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
      </div>
    </div>
  );
};

export const ListSkeleton: React.FC<{ items?: number }> = ({ items = 5 }) => {
  return (
    <div className="space-y-3">
      {[...Array(items)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3">
          <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-3 w-2/3 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const GraphSkeleton: React.FC = () => {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center">
        <div className="h-12 w-12 border-4 border-gray-200 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mx-auto"></div>
      </div>
    </div>
  );
};

export const EditorSkeleton: React.FC = () => {
  return (
    <div className="w-full h-full p-6 animate-pulse">
      <div className="h-10 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
      <div className="space-y-3">
        <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-4 w-4/6 bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-32 w-full bg-gray-200 dark:bg-gray-700 rounded mt-6"></div>
        <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
        <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    </div>
  );
};

export const Skeleton: React.FC<{
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  className?: string;
}> = ({
  variant = 'text',
  width = '100%',
  height = '1rem',
  className = '',
}) => {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700 animate-pulse';

  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={{ width, height }}
    />
  );
};
