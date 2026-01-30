import { ThemeConfig } from './theme-tokens';

export const loveDarkTheme: ThemeConfig = {
  id: 'love-dark',
  name: 'LOVE Dark',
  description: 'Ive minimalist aesthetic - dark mode',
  tokens: {
    colors: {
      // Backgrounds
      bgPrimary: '#1D1D1F',
      bgSecondary: '#2C2C2E',
      bgTertiary: '#3A3A3C',
      bgGlass: 'rgba(29, 29, 31, 0.7)',
      bgHover: '#3A3A3C',
      bgActive: '#48484A',

      // Foregrounds
      fgPrimary: '#F5F5F7',
      fgSecondary: '#AEAEB2',
      fgMuted: '#636366',

      // Accents
      accent: '#0A84FF',
      accentHover: '#409CFF',
      accentMuted: 'rgba(10, 132, 255, 0.3)',

      // Semantic
      success: '#30D158',
      successMuted: 'rgba(48, 209, 88, 0.1)',
      warning: '#FFD60A',
      warningMuted: 'rgba(255, 214, 10, 0.1)',
      error: '#FF453A',
      errorMuted: 'rgba(255, 69, 58, 0.1)',

      // Borders
      border: '#3A3A3C',
      borderHover: '#48484A',
      borderFocus: '#0A84FF',

      // Selection
      selection: 'rgba(10, 132, 255, 0.3)',

      // Scrollbar
      scrollbarThumb: '#48484A',
      scrollbarThumbHover: '#636366',
    },
    spacing: {
      xs: '4px',
      sm: '8px',
      md: '16px',
      lg: '20px',
      xl: '32px',
    },
    radius: {
      sm: '4px',
      md: '6px',
      lg: '10px',
      full: '9999px',
    },
    typography: {
      fontSans: "'SF Pro', 'Inter', -apple-system, sans-serif",
      fontMono: "'SF Mono', 'Roboto Mono', monospace",
      fontSizeBase: '13px',
      lineHeight: '1.6',
    },
    shadows: {
      sm: 'none',
      md: 'none',
      lg: 'none',
      glow: 'none',
    },
    motion: {
      fast: '0.1s',
      normal: '0.2s',
      slow: '0.3s',
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
};

export const loveLightTheme: ThemeConfig = {
  id: 'love-light',
  name: 'LOVE Light',
  description: 'Ive minimalist aesthetic - light mode',
  tokens: {
    colors: {
      // Backgrounds
      bgPrimary: '#F5F5F7',
      bgSecondary: '#EBEBED',
      bgTertiary: '#E0E0E2',
      bgGlass: 'rgba(245, 245, 247, 0.7)',
      bgHover: '#E0E0E2',
      bgActive: '#D6D6D8',

      // Foregrounds
      fgPrimary: '#1D1D1F',
      fgSecondary: '#86868B',
      fgMuted: '#AEAEB2',

      // Accents
      accent: '#007AFF',
      accentHover: '#0066CC',
      accentMuted: 'rgba(0, 122, 255, 0.2)',

      // Semantic
      success: '#34C759',
      successMuted: 'rgba(52, 199, 89, 0.1)',
      warning: '#FF9500',
      warningMuted: 'rgba(255, 149, 0, 0.1)',
      error: '#FF3B30',
      errorMuted: 'rgba(255, 59, 48, 0.1)',

      // Borders
      border: '#D2D2D7',
      borderHover: '#C7C7CC',
      borderFocus: '#007AFF',

      // Selection
      selection: 'rgba(0, 122, 255, 0.2)',

      // Scrollbar
      scrollbarThumb: '#C7C7CC',
      scrollbarThumbHover: '#AEAEB2',
    },
    spacing: {
      xs: '4px',
      sm: '8px',
      md: '16px',
      lg: '20px',
      xl: '32px',
    },
    radius: {
      sm: '4px',
      md: '6px',
      lg: '10px',
      full: '9999px',
    },
    typography: {
      fontSans: "'SF Pro', 'Inter', -apple-system, sans-serif",
      fontMono: "'SF Mono', 'Roboto Mono', monospace",
      fontSizeBase: '13px',
      lineHeight: '1.6',
    },
    shadows: {
      sm: 'none',
      md: 'none',
      lg: 'none',
      glow: 'none',
    },
    motion: {
      fast: '0.1s',
      normal: '0.2s',
      slow: '0.3s',
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
};
