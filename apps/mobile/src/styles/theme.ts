// theme.ts - Vicoo Mobile Theme (Neo-brutalism)
// 与 Web 端保持一致的颜色系统
import { Platform } from 'react-native';

// 字体配置 - 尽可能接近 Web 端
export const fonts = {
  // Web 端使用: 'Plus Jakarta Sans' 和 'Space Grotesk'
  // 移动端使用系统字体作为后备
  regular: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System'
  }),
  bold: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System'
  })
};

export const colors = {
  primary: '#FFD166',    // vicoo Yellow
  secondary: '#0df259',  // Vibe Green
  accent: '#EF476F',     // Pop Pink
  info: '#118AB2',       // Deep Blue
  ink: '#1a1a1a',        // High Contrast Ink
  white: '#ffffff',
  light: '#f8f9fa',      // Canvas White (与 Web 一致)
  dark: '#101010',       // Ink Black (与 Web 一致)
  gray: '#666666',
  grayLight: '#999999'
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32
};

export const typography = {
  titleLarge: {
    fontSize: 32,
    fontWeight: '800' as const,
    letterSpacing: -0.5
  },
  titleMedium: {
    fontSize: 24,
    fontWeight: '700' as const
  },
  titleSmall: {
    fontSize: 18,
    fontWeight: '600' as const
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const
  }
};

export const shadows = {
  // Neo-brutalism 风格阴影 - 与 Web 端一致
  // Web: boxShadow: '4px 4px 0px 0px #1a1a1a'
  neo: {
    shadowColor: colors.ink,
    shadowOffset: { width: 4, height: 4 },  // 与 Web 一致
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4  // Android 提升效果
  },
  neoSmall: {
    shadowColor: colors.ink,
    shadowOffset: { width: 2, height: 2 },   // 与 Web 一致
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2
  },
  neoHover: {
    shadowColor: colors.ink,
    shadowOffset: { width: 6, height: 6 },   // 悬停状态
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6
  }
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999
};

export const getCategoryColor = (category: string): string => {
  switch (category) {
    case 'idea': return colors.secondary;
    case 'code': return colors.info;
    case 'design': return colors.accent;
    case 'meeting': return colors.primary;
    default: return colors.gray;
  }
};
