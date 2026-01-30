import { ThemeConfig } from './theme-tokens';

export const nexusTheme: ThemeConfig = {
  id: 'nexus',
  name: 'OG',
  description: 'Dark minimalist theme with glass effects',
  tokens: {
    colors: {
      // Backgrounds
      bgPrimary: '#0a0a0a',
      bgSecondary: '#141414',
      bgTertiary: '#1a1a1a',
      bgGlass: 'rgba(20, 20, 20, 0.85)',
      bgHover: '#1a1a1a',
      bgActive: '#222222',

      // Foregrounds
      fgPrimary: '#ffffff',
      fgSecondary: '#a0a0a0',
      fgMuted: '#666666',

      // Accents
      accent: '#3b82f6',
      accentHover: '#60a5fa',
      accentMuted: 'rgba(59, 130, 246, 0.3)',

      // Semantic
      success: '#22c55e',
      successMuted: 'rgba(34, 197, 94, 0.1)',
      warning: '#f59e0b',
      warningMuted: 'rgba(245, 158, 11, 0.1)',
      error: '#ef4444',
      errorMuted: 'rgba(239, 68, 68, 0.1)',

      // Borders
      border: '#2a2a2a',
      borderHover: '#3a3a3a',
      borderFocus: '#3b82f6',

      // Selection
      selection: 'rgba(59, 130, 246, 0.3)',

      // Scrollbar
      scrollbarThumb: '#2a2a2a',
      scrollbarThumbHover: '#3a3a3a',
    },
    spacing: {
      xs: '4px',
      sm: '8px',
      md: '12px',
      lg: '16px',
      xl: '24px',
    },
    radius: {
      sm: '4px',
      md: '8px',
      lg: '12px',
      full: '9999px',
    },
    typography: {
      fontSans: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif",
      fontMono: "'SF Mono', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
      fontSizeBase: '13px',
      lineHeight: '1.5',
    },
    shadows: {
      sm: '0 1px 2px rgba(0, 0, 0, 0.5)',
      md: '0 4px 6px rgba(0, 0, 0, 0.5)',
      lg: '0 10px 15px rgba(0, 0, 0, 0.5)',
      glow: 'none',
    },
    motion: {
      fast: '0.1s',
      normal: '0.15s',
      slow: '0.3s',
      easing: 'ease',
    },
  },
};
