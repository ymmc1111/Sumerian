import { ThemeId } from '../themes/theme-tokens';

export interface DragFeedbackConfig {
  opacity: number;
  scale: number;
  filter: string;
  shadow: string;
  transition: string;
}

// Theme-specific drag feedback configurations
export const DRAG_FEEDBACK_CONFIGS: Record<ThemeId, DragFeedbackConfig> = {
  nexus: {
    opacity: 0.5,
    scale: 1.02,
    filter: 'none',
    shadow: '0 8px 32px rgba(59, 130, 246, 0.3)',
    transition: 'all 150ms ease-out',
  },
  grid: {
    opacity: 0.7,
    scale: 1.0,
    filter: 'blur(1px) contrast(1.2)',
    shadow: '0 4px 16px rgba(0, 255, 0, 0.2)',
    transition: 'all 100ms steps(4)',
  },
  'love-dark': {
    opacity: 0.85,
    scale: 1.01,
    filter: 'none',
    shadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
  'love-light': {
    opacity: 0.85,
    scale: 1.01,
    filter: 'none',
    shadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

// Ghost frame styles per theme
export interface GhostFrameStyle {
  borderColor: string;
  backgroundColor: string;
  borderStyle: string;
}

export const GHOST_FRAME_STYLES: Record<ThemeId, GhostFrameStyle> = {
  nexus: {
    borderColor: 'rgba(59, 130, 246, 0.8)',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderStyle: 'solid',
  },
  grid: {
    borderColor: 'rgba(0, 255, 0, 0.8)',
    backgroundColor: 'rgba(0, 255, 0, 0.05)',
    borderStyle: 'dashed',
  },
  'love-dark': {
    borderColor: 'rgba(168, 85, 247, 0.8)',
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderStyle: 'solid',
  },
  'love-light': {
    borderColor: 'rgba(168, 85, 247, 0.6)',
    backgroundColor: 'rgba(168, 85, 247, 0.08)',
    borderStyle: 'solid',
  },
};

// Snap feedback styles per theme
export interface SnapFeedbackStyle {
  indicatorColor: string;
  pulseAnimation: boolean;
  hapticIntensity: 'light' | 'medium' | 'heavy';
}

export const SNAP_FEEDBACK_STYLES: Record<ThemeId, SnapFeedbackStyle> = {
  nexus: {
    indicatorColor: '#3b82f6',
    pulseAnimation: true,
    hapticIntensity: 'medium',
  },
  grid: {
    indicatorColor: '#00ff00',
    pulseAnimation: false,
    hapticIntensity: 'heavy',
  },
  'love-dark': {
    indicatorColor: '#a855f7',
    pulseAnimation: true,
    hapticIntensity: 'light',
  },
  'love-light': {
    indicatorColor: '#a855f7',
    pulseAnimation: true,
    hapticIntensity: 'light',
  },
};

// Get drag feedback styles for current theme
export function getDragFeedbackStyles(themeId: ThemeId, isDragging: boolean): React.CSSProperties {
  const config = DRAG_FEEDBACK_CONFIGS[themeId];
  
  if (!isDragging) {
    return {};
  }
  
  return {
    opacity: config.opacity,
    transform: `scale(${config.scale})`,
    filter: config.filter,
    boxShadow: config.shadow,
    transition: config.transition,
    pointerEvents: 'none',
  };
}

// Get ghost frame styles for current theme
export function getGhostFrameStyles(themeId: ThemeId): React.CSSProperties {
  const style = GHOST_FRAME_STYLES[themeId];
  
  return {
    borderColor: style.borderColor,
    backgroundColor: style.backgroundColor,
    borderStyle: style.borderStyle,
  };
}

// Apply pixelate effect for GRID theme
export function applyPixelateEffect(element: HTMLElement, intensity: number = 4): void {
  element.style.imageRendering = 'pixelated';
  element.style.filter = `blur(${intensity}px)`;
  
  // Use CSS to create pixelate effect
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  // Simplified pixelate - just apply filter
  element.style.filter = `contrast(1.5) brightness(1.1)`;
}

// Remove pixelate effect
export function removePixelateEffect(element: HTMLElement): void {
  element.style.imageRendering = '';
  element.style.filter = '';
}

// Trigger haptic feedback if available
export function triggerHapticFeedback(intensity: 'light' | 'medium' | 'heavy'): void {
  if (!('vibrate' in navigator)) return;
  
  const patterns: Record<string, number[]> = {
    light: [10],
    medium: [20],
    heavy: [30, 10, 30],
  };
  
  navigator.vibrate(patterns[intensity]);
}
