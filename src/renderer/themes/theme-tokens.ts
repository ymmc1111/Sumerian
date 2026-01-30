// ============================================
// Theme Token Type Definitions
// ============================================

export interface ColorTokens {
  // Backgrounds
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgGlass: string;
  bgHover: string;
  bgActive: string;

  // Foregrounds
  fgPrimary: string;
  fgSecondary: string;
  fgMuted: string;

  // Accents
  accent: string;
  accentHover: string;
  accentMuted: string;

  // Semantic
  success: string;
  successMuted: string;
  warning: string;
  warningMuted: string;
  error: string;
  errorMuted: string;

  // Borders
  border: string;
  borderHover: string;
  borderFocus: string;

  // Selection
  selection: string;

  // Scrollbar
  scrollbarThumb: string;
  scrollbarThumbHover: string;
}

export interface SpacingTokens {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

export interface RadiusTokens {
  sm: string;
  md: string;
  lg: string;
  full: string;
}

export interface TypographyTokens {
  fontSans: string;
  fontMono: string;
  fontSizeBase: string;
  lineHeight: string;
}

export interface ShadowTokens {
  sm: string;
  md: string;
  lg: string;
  glow: string;
}

export interface MotionTokens {
  fast: string;
  normal: string;
  slow: string;
  easing: string;
}

export interface ThemeTokens {
  colors: ColorTokens;
  spacing: SpacingTokens;
  radius: RadiusTokens;
  typography: TypographyTokens;
  shadows: ShadowTokens;
  motion: MotionTokens;
}

export type ThemeId = 'nexus' | 'grid' | 'love-dark' | 'love-light';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  description: string;
  tokens: ThemeTokens;
}

// ============================================
// Token Validation
// ============================================

export function validateThemeTokens(tokens: ThemeTokens): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const requiredColorKeys: (keyof ColorTokens)[] = [
    'bgPrimary', 'bgSecondary', 'bgTertiary', 'fgPrimary', 'fgSecondary',
    'accent', 'border', 'success', 'warning', 'error'
  ];

  for (const key of requiredColorKeys) {
    if (!tokens.colors[key]) {
      errors.push(`Missing required color token: ${key}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// ============================================
// CSS Variable Mapping
// ============================================

export function tokensToCSSVariables(tokens: ThemeTokens): Record<string, string> {
  const vars: Record<string, string> = {};

  // Colors
  for (const [key, value] of Object.entries(tokens.colors)) {
    vars[`--color-${camelToKebab(key)}`] = value;
  }

  // Spacing
  for (const [key, value] of Object.entries(tokens.spacing)) {
    vars[`--spacing-${key}`] = value;
  }

  // Radius
  for (const [key, value] of Object.entries(tokens.radius)) {
    vars[`--radius-${key}`] = value;
  }

  // Typography
  vars['--font-sans'] = tokens.typography.fontSans;
  vars['--font-mono'] = tokens.typography.fontMono;
  vars['--font-size-base'] = tokens.typography.fontSizeBase;
  vars['--line-height'] = tokens.typography.lineHeight;

  // Shadows
  for (const [key, value] of Object.entries(tokens.shadows)) {
    vars[`--shadow-${key}`] = value;
  }

  // Motion
  vars['--motion-fast'] = tokens.motion.fast;
  vars['--motion-normal'] = tokens.motion.normal;
  vars['--motion-slow'] = tokens.motion.slow;
  vars['--motion-easing'] = tokens.motion.easing;

  return vars;
}

function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}
