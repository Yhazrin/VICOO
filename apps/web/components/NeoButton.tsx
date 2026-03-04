import React from 'react';

interface NeoButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'accent' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
}

/**
 * NeoButton - 统一设计系统的按钮组件
 * 使用 Neo-Brutalism 风格，粗边框 + 硬阴影
 * 设计令牌: border-3, rounded-neo, shadow-neo-sm
 */
export const NeoButton: React.FC<NeoButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}) => {
  // 基础样式：3px 边框 + 统一圆角 + 硬阴影
  const baseStyles = `
    font-bold border-3 border-ink dark:border-gray-400
    rounded-neo transition-all duration-150
    active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
    hover:-translate-y-0.5 hover:shadow-neo
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ink dark:focus:ring-gray-400
  `;

  // 变体样式 - 保持波普色彩的鲜明对比
  const variants = {
    primary: 'bg-primary text-ink shadow-neo-sm dark:shadow-neo-sm-dark',
    secondary: 'bg-white dark:bg-gray-800 text-ink dark:text-white shadow-neo-sm dark:shadow-neo-sm-dark',
    ghost: 'bg-transparent border-transparent shadow-none hover:bg-gray-100 dark:hover:bg-gray-800 active:translate-x-0 active:translate-y-0',
    accent: 'bg-accent text-white shadow-neo-sm dark:shadow-neo-sm-dark',
    success: 'bg-secondary text-ink shadow-neo-sm dark:shadow-neo-sm-dark',
    danger: 'bg-red-500 text-white shadow-neo-sm dark:shadow-neo-sm-dark',
  };

  // 尺寸样式
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default NeoButton;
