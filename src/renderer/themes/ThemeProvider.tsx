import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { ThemeConfig, ThemeId, tokensToCSSVariables } from './theme-tokens';
import { nexusTheme } from './nexus';

// ============================================
// Theme Registry
// ============================================

const themeRegistry: Map<ThemeId, ThemeConfig> = new Map();

export function registerTheme(theme: ThemeConfig): void {
  themeRegistry.set(theme.id, theme);
}

export function getTheme(id: ThemeId): ThemeConfig | undefined {
  return themeRegistry.get(id);
}

export function getAvailableThemes(): ThemeConfig[] {
  return Array.from(themeRegistry.values());
}

// ============================================
// Theme Context
// ============================================

interface ThemeContextValue {
  theme: ThemeConfig;
  themeId: ThemeId;
  setTheme: (id: ThemeId) => void;
  availableThemes: ThemeConfig[];
  reducedMotion: boolean;
  setReducedMotion: (value: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ============================================
// Theme Provider
// ============================================

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeId;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  defaultTheme = 'nexus' 
}) => {
  const [themeId, setThemeId] = useState<ThemeId>(defaultTheme);
  const [reducedMotion, setReducedMotionState] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const theme = getTheme(themeId) || nexusTheme;

  const applyTheme = useCallback((themeConfig: ThemeConfig) => {
    const cssVars = tokensToCSSVariables(themeConfig.tokens);
    const root = document.documentElement;

    // Apply CSS variables to :root
    for (const [property, value] of Object.entries(cssVars)) {
      root.style.setProperty(property, value);
    }

    // Set data-theme attribute for CSS selectors
    root.setAttribute('data-theme', themeConfig.id);
  }, []);

  const setTheme = useCallback((id: ThemeId) => {
    const newTheme = getTheme(id);
    if (newTheme) {
      setThemeId(id);
      applyTheme(newTheme);
      // Persist to preferences
      (window as any).sumerian?.preferences?.set({ theme: id });
    }
  }, [applyTheme]);

  const setReducedMotion = useCallback((value: boolean) => {
    setReducedMotionState(value);
    // Persist to preferences
    (window as any).sumerian?.preferences?.set({ reducedMotion: value });
  }, []);

  // Apply default theme immediately on mount
  useEffect(() => {
    applyTheme(theme);
  }, []);

  // Load preferences on mount and apply saved theme
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const prefs = await (window as any).sumerian?.preferences?.get();
        if (prefs) {
          if (prefs.theme && getTheme(prefs.theme as ThemeId)) {
            const savedTheme = getTheme(prefs.theme as ThemeId);
            if (savedTheme) {
              setThemeId(prefs.theme as ThemeId);
              applyTheme(savedTheme);
            }
          }
          if (typeof prefs.reducedMotion === 'boolean') {
            setReducedMotionState(prefs.reducedMotion);
          }
        }
      } catch (e) {
        console.error('Failed to load preferences:', e);
      }
      setIsLoaded(true);
    };
    loadPreferences();
  }, [applyTheme]);

  // Apply theme when it changes (after initial load)
  useEffect(() => {
    if (isLoaded) {
      applyTheme(theme);
    }
  }, [theme, applyTheme, isLoaded]);

  // Check system preference for reduced motion (only if not explicitly set)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!isLoaded) {
      setReducedMotionState(mediaQuery.matches);
    }

    const handler = (e: MediaQueryListEvent) => {
      // Only auto-update if user hasn't explicitly set a preference
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [isLoaded]);

  // Apply reduced motion class
  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reducedMotion);
  }, [reducedMotion]);

  const value: ThemeContextValue = {
    theme,
    themeId,
    setTheme,
    availableThemes: getAvailableThemes(),
    reducedMotion,
    setReducedMotion,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// ============================================
// useTheme Hook
// ============================================

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
