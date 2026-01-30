import { describe, it, expect } from 'vitest';
import { 
  validateThemeTokens, 
  tokensToCSSVariables,
  ThemeTokens 
} from '../../src/renderer/themes/theme-tokens';
import { nexusTheme } from '../../src/renderer/themes/nexus';
import { gridTheme } from '../../src/renderer/themes/grid';
import { loveDarkTheme, loveLightTheme } from '../../src/renderer/themes/love';

describe('theme-tokens', () => {
  describe('validateThemeTokens', () => {
    it('should validate nexus theme tokens', () => {
      const result = validateThemeTokens(nexusTheme.tokens);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate grid theme tokens', () => {
      const result = validateThemeTokens(gridTheme.tokens);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate love dark theme tokens', () => {
      const result = validateThemeTokens(loveDarkTheme.tokens);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate love light theme tokens', () => {
      const result = validateThemeTokens(loveLightTheme.tokens);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for missing required tokens', () => {
      const incompleteTokens = {
        colors: {
          bgPrimary: '#000',
          // Missing other required colors
        },
        spacing: { xs: '4px', sm: '8px', md: '12px', lg: '16px', xl: '24px' },
        radius: { sm: '4px', md: '8px', lg: '12px', full: '9999px' },
        typography: { fontSans: 'sans', fontMono: 'mono', fontSizeBase: '13px', lineHeight: '1.5' },
        shadows: { sm: 'none', md: 'none', lg: 'none', glow: 'none' },
        motion: { fast: '0.1s', normal: '0.15s', slow: '0.3s', easing: 'ease' },
      } as unknown as ThemeTokens;

      const result = validateThemeTokens(incompleteTokens);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('tokensToCSSVariables', () => {
    it('should convert tokens to CSS variables', () => {
      const cssVars = tokensToCSSVariables(nexusTheme.tokens);
      
      expect(cssVars['--color-bg-primary']).toBe('#0a0a0a');
      expect(cssVars['--color-accent']).toBe('#3b82f6');
      expect(cssVars['--spacing-sm']).toBe('8px');
      expect(cssVars['--radius-md']).toBe('8px');
      expect(cssVars['--font-mono']).toContain('JetBrains Mono');
    });

    it('should convert camelCase to kebab-case for color tokens', () => {
      const cssVars = tokensToCSSVariables(nexusTheme.tokens);
      
      expect(cssVars['--color-bg-primary']).toBeDefined();
      expect(cssVars['--color-fg-primary']).toBeDefined();
      expect(cssVars['--color-accent-hover']).toBeDefined();
    });

    it('should include all motion tokens', () => {
      const cssVars = tokensToCSSVariables(nexusTheme.tokens);
      
      expect(cssVars['--motion-fast']).toBe('0.1s');
      expect(cssVars['--motion-normal']).toBe('0.15s');
      expect(cssVars['--motion-slow']).toBe('0.3s');
      expect(cssVars['--motion-easing']).toBe('ease');
    });
  });
});

describe('theme configs', () => {
  it('nexus theme should have correct id and name', () => {
    expect(nexusTheme.id).toBe('nexus');
    expect(nexusTheme.name).toBe('Nexus');
  });

  it('grid theme should have correct id and name', () => {
    expect(gridTheme.id).toBe('grid');
    expect(gridTheme.name).toBe('GRID');
  });

  it('love themes should have correct ids', () => {
    expect(loveDarkTheme.id).toBe('love-dark');
    expect(loveLightTheme.id).toBe('love-light');
  });

  it('grid theme should have zero border radius (sharp edges)', () => {
    expect(gridTheme.tokens.radius.sm).toBe('0px');
    expect(gridTheme.tokens.radius.md).toBe('0px');
  });

  it('love themes should have soft border radius', () => {
    expect(loveDarkTheme.tokens.radius.lg).toBe('10px');
    expect(loveLightTheme.tokens.radius.lg).toBe('10px');
  });

  it('grid theme should have glow shadows', () => {
    expect(gridTheme.tokens.shadows.glow).toContain('rgba(0, 229, 255');
  });

  it('love themes should have no shadows', () => {
    expect(loveDarkTheme.tokens.shadows.sm).toBe('none');
    expect(loveLightTheme.tokens.shadows.sm).toBe('none');
  });
});
