import { ThemeConfig } from './theme-tokens';

export const gridTheme: ThemeConfig = {
  id: 'grid',
  name: 'GRID',
  description: 'Tron 80s cyberpunk with neon glow effects',
  tokens: {
    colors: {
      // Backgrounds
      bgPrimary: '#000808',
      bgSecondary: '#000505',
      bgTertiary: '#001010',
      bgGlass: 'rgba(0, 20, 20, 0.8)',
      bgHover: 'rgba(0, 229, 255, 0.07)',
      bgActive: 'rgba(0, 229, 255, 0.2)',

      // Foregrounds
      fgPrimary: '#E0FFFF',
      fgSecondary: '#408080',
      fgMuted: '#002B2B',

      // Accents
      accent: '#00E5FF',
      accentHover: '#5BFFFF',
      accentMuted: 'rgba(0, 229, 255, 0.3)',

      // Semantic
      success: '#5BFFAD',
      successMuted: 'rgba(91, 255, 173, 0.1)',
      warning: '#CCFF00',
      warningMuted: 'rgba(204, 255, 0, 0.1)',
      error: '#FF3C00',
      errorMuted: 'rgba(255, 60, 0, 0.1)',

      // Borders
      border: '#00E5FF',
      borderHover: '#5BFFFF',
      borderFocus: '#FF3C00',

      // Selection
      selection: 'rgba(0, 229, 255, 0.3)',

      // Scrollbar
      scrollbarThumb: '#00E5FF',
      scrollbarThumbHover: '#5BFFFF',
    },
    spacing: {
      xs: '4px',
      sm: '8px',
      md: '16px',
      lg: '24px',
      xl: '32px',
    },
    radius: {
      sm: '0px',
      md: '0px',
      lg: '0px',
      full: '0px',
    },
    typography: {
      fontSans: "'Share Tech Mono', 'JetBrains Mono', monospace",
      fontMono: "'Share Tech Mono', 'JetBrains Mono', 'Fira Code', monospace",
      fontSizeBase: '13px',
      lineHeight: '1.5',
    },
    shadows: {
      sm: '0 0 5px rgba(0, 229, 255, 0.3)',
      md: '0 0 10px rgba(0, 229, 255, 0.3)',
      lg: '0 0 20px rgba(0, 229, 255, 0.4)',
      glow: '0 0 10px rgba(0, 229, 255, 0.3), inset 0 0 5px rgba(0, 229, 255, 0.2)',
    },
    motion: {
      fast: '0.1s',
      normal: '0.15s',
      slow: '0.25s',
      easing: 'cubic-bezier(0.2, 1, 0.3, 1)',
    },
  },
};
