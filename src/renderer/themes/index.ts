// Theme System Entry Point
// Register all themes here

import { registerTheme } from './ThemeProvider';
import { nexusTheme } from './nexus';
import { gridTheme } from './grid';
import { loveDarkTheme, loveLightTheme } from './love';

// Register built-in themes
registerTheme(nexusTheme);
registerTheme(gridTheme);
registerTheme(loveDarkTheme);
registerTheme(loveLightTheme);

// Re-export everything
export { ThemeProvider, useTheme, getAvailableThemes, getTheme } from './ThemeProvider';
export { nexusTheme } from './nexus';
export { gridTheme } from './grid';
export { loveDarkTheme, loveLightTheme } from './love';
export type { ThemeConfig, ThemeId, ThemeTokens } from './theme-tokens';
