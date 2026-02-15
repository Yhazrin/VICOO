import React from 'react';

interface NeoButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'icon';
  size?: 'sm' | 'md' | 'lg';
}

export const NeoButton: React.FC<NeoButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}) => {
  const baseStyles = "border-3 border-ink dark:border-gray-200 font-bold transition-all active:translate-y-1 active:shadow-none inline-flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-ink text-white shadow-neo dark:shadow-[4px_4px_0px_0px_#ffffff] dark:bg-gray-100 dark:text-ink hover:bg-gray-800 dark:hover:bg-white",
    secondary: "bg-white text-ink shadow-neo dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] dark:bg-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700",
    ghost: "bg-transparent border-transparent shadow-none hover:bg-black/5 dark:hover:bg-white/10 active:translate-y-0 active:bg-black/10 dark:text-white",
    icon: "bg-white text-ink shadow-neo dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] dark:bg-gray-800 dark:text-white rounded-full p-2 aspect-square",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm rounded-lg",
    md: "px-6 py-3 text-base rounded-xl",
    lg: "px-8 py-4 text-lg rounded-2xl",
  };

  const finalSize = variant === 'icon' ? '' : sizes[size];

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${finalSize} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};