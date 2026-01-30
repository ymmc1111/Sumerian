# Sumerian Design System v2.0
**Version:** 2.0.0  
**Status:** Specification  
**Feature:** Selectable UX/UI Themes

---

## 1. Overview

Sumerian v2.0 introduces a **selectable theme system** that allows users to customize the visual and interactive experience of the IDE. The system decouples the **Interaction Engine** (layout, motion, behavior) from the **Visual Skin** (colors, typography, effects).

### Design Philosophy

| Principle | Description |
|-----------|-------------|
| **Consistency** | All themes share the same interaction patterns |
| **Performance** | Theme switching is instant (CSS variables) |
| **Accessibility** | All themes meet WCAG 2.1 AA contrast requirements |
| **Extensibility** | Architecture supports future custom themes |

### Available Themes

| Theme | Aesthetic | Best For |
|-------|-----------|----------|
| **NEXUS** | Dark minimalist (default) | General development |
| **GRID** | Tron 80s cyberpunk | Immersive coding sessions |
| **LOVE** | Ive-style precision | Clean, professional work |

---

## 2. Universal Interaction Engine

The Interaction Engine is **theme-agnostic**. Regardless of visual skin, all layout, motion, and behavior remain consistent.

### 2.1 Dynamic Flex-Grid Layout

The workspace uses a **slot-based** panel system:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  ┌──────┐  ┌────────────────────────┐  ┌──────────┐   │
│  │      │  │                        │  │          │   │
│  │  A   │  │           B            │  │    C     │   │
│  │      │  │                        │  │          │   │
│  │      │  │                        │  │          │   │
│  └──────┘  └────────────────────────┘  └──────────┘   │
│            ┌────────────────────────────────────────┐   │
│            │                  D                     │   │
│            └────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

| Slot | Default Content | Width |
|------|-----------------|-------|
| **A** (Far Left) | File Explorer / Navigation | 240px |
| **B** (Center) | Primary Editor Canvas | flex-1 |
| **C** (Far Right) | AI Agent Panel | 320px |
| **D** (Bottom) | Terminal / Output | 200px height |

### 2.2 Magnetic Drag & Drop

Panels use **influence maps** for intuitive repositioning:

**The "Lift" (Drag Start):**
- Panel detaches from slot on `mousedown + drag`
- Visual feedback varies by theme (see theme specs)
- Cursor changes to `grabbing`

**The "Magnetic" Snap:**
- Snap regions: 40px threshold from edges and panel boundaries
- Ghost frame preview appears at destination
- Spring physics: `stiffness: 400`, `damping: 28`

**The "Drop" (Drag End):**
- If in snap region: animate to new slot
- If outside: spring back to origin
- Layout recalculates with animation

### 2.3 Layout Toggle Modes

Three global layout presets accessible via `Cmd+\`:

| Mode | Behavior | Use Case |
|------|----------|----------|
| **Standard** | All slots visible (A, B, C, D) | General development |
| **Hyper-Focus** | A, C, D collapse to 4px active edges | Deep flow state |
| **Agent-First** | B and C split 45%/45%; A hidden | Heavy AI-assisted work |

### 2.4 Shared Interaction Variables

```css
:root {
  /* Spacing (8px base grid) */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  /* Panel margins */
  --panel-gap: 8px;
  --panel-header-height: 32px;
  
  /* Motion */
  --transition-instant: 0.1s;
  --transition-fast: 0.15s;
  --transition-normal: 0.25s;
  --transition-curve: cubic-bezier(0.2, 1, 0.3, 1);
  
  /* Touch targets */
  --touch-target-min: 32px;
  --drag-threshold: 40px;
}
```

### 2.5 Essential Interactions

| Feature | Behavior |
|---------|----------|
| **Panel Stacking** | Drag panel to center of another → creates tabbed group |
| **Persistent Memory** | Layout saved to localStorage; restored on launch |
| **Escape Hatch** | Double-click header → reset panel to home slot |
| **Resize Handles** | 4px drag zones between panels |

---

## 3. Theme Profiles

### 3.1 NEXUS (Default)

The current Sumerian theme—dark, minimal, professional.

#### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#0a0a0a` | Main background |
| `--bg-secondary` | `#121212` | Panel backgrounds |
| `--bg-tertiary` | `#1a1a1a` | Hover states |
| `--border` | `#2a2a2a` | Panel borders |
| `--text-primary` | `#e0e0e0` | Primary text |
| `--text-secondary` | `#888888` | Secondary text |
| `--accent` | `#3b82f6` | Interactive elements |
| `--accent-hover` | `#60a5fa` | Hover state |

#### Typography

```css
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
--font-ui: 'Inter', -apple-system, sans-serif;
--font-size-sm: 12px;
--font-size-md: 13px;
--font-size-lg: 14px;
```

#### Effects

```css
/* Glass sidebar */
backdrop-filter: blur(20px);
background: rgba(10, 10, 10, 0.8);

/* Borders */
border: 1px solid var(--border);
border-radius: 8px;
```

---

### 3.2 GRID (Tron 80s Aesthetic)

A neon-infused cyberpunk interface inspired by the 1982 film *Tron*.

#### Design Philosophy

> "In the Grid, every element aligns to a strict mathematical rhythm. The glow is not decoration—it is the pulse of the system."

#### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#000808` | Mainframe floor |
| `--bg-secondary` | `#000505` | Sidebar/panels |
| `--bg-gradient` | `radial-gradient(circle at center, #001515 0%, #000505 100%)` | Depth effect |
| `--border` | `#00E5FF` | Glowing circuit lines |
| `--border-glow` | `rgba(0, 229, 255, 0.3)` | Border shadow |
| `--text-primary` | `#E0FFFF` | Primary text (ice white) |
| `--text-secondary` | `#408080` | Electronic teal |
| `--accent` | `#00E5FF` | User blue (Light Cycle) |
| `--accent-alt` | `#CCFF00` | Bit yellow (decisions) |
| `--danger` | `#FF3C00` | MCP red (focus/warning) |
| `--string` | `#FF00E5` | Identity disc pink |
| `--function` | `#5BFFAD` | System green |

#### Spatial Geometry

```css
/* 8px Grid System */
--grid-unit: 8px;
--padding-container: 16px;  /* Let neon breathe */
--margin-panel: 0;          /* 1px border acts as separator */
--vapor-gap: 2px;           /* Floating illusion */
```

#### Typography

```css
/* Headers */
h1 {
  text-transform: uppercase;
  letter-spacing: 3px;
  color: #FFFFFF;
  text-shadow: 0 0 10px var(--accent);
  /* 45° clipped corner header bar */
  clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%);
  background: rgba(0, 229, 255, 0.1);
}

/* Body */
--font-size-code: 13px;
--font-size-ui: 12px;
```

#### Panel Container

```css
.panel-container-grid {
  background-color: #000505;
  border: 1px solid #00E5FF;
  box-shadow: 
    0 0 10px rgba(0, 229, 255, 0.3),
    inset 0 0 5px rgba(0, 229, 255, 0.2);
  padding: 16px;
  position: relative;
  overflow: hidden;
}
```

#### Scanline Overlay

```css
.grid-scanlines::before {
  content: "";
  position: absolute;
  top: 0; left: 0; bottom: 0; right: 0;
  background: 
    linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%),
    linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
  background-size: 100% 2px, 3px 100%;
  pointer-events: none;
  z-index: 10;
}
```

#### Glassmorphism (Light Disk Effect)

```css
.grid-glass {
  backdrop-filter: blur(10px);
  background: rgba(0, 20, 20, 0.8);
}
```

#### Interaction Feedback

| State | CSS | Purpose |
|-------|-----|---------|
| Focus | `outline: 2px solid #FF3C00` | MCP red for selection |
| Hover | `background: #00E5FF11` | Subtle glow |
| Active | `background: #00E5FF33` | Light beam passing |

#### Drag Feedback (GRID-specific)

- **Lift:** Panel "de-rezzes" (pixelate filter, 50% opacity)
- **Snap:** Chromatic aberration flicker (0.1s)
- **Power Up:** Borders animate from center outward on launch

#### Syntax Highlighting

| Scope | Color | Meaning |
|-------|-------|---------|
| Variables | `#00E5FF` | Light Cycles (data carriers) |
| Keywords | `#CCFF00` | Bit yellow (decision points) |
| Strings | `#FF00E5` | Identity Disc pink |
| Functions | `#5BFFAD` | System green (processes) |
| Comments | `#002B2B` | Ghosted teal (derezzing traces) |

---

### 3.3 LOVE (Ive Minimalist)

Unapologetic minimalism inspired by Jony Ive's Apple design philosophy.

#### Design Philosophy

> "The goal is the removal of the unnecessary until what remains is pure, honest, and inevitable."

#### Color Palette (Light Mode)

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#F5F5F7` | Off-white canvas |
| `--bg-secondary` | `#EBEBED` | Panel backgrounds |
| `--border` | `#D2D2D7` | Hairline separators |
| `--text-primary` | `#1D1D1F` | Deep charcoal |
| `--text-secondary` | `#86868B` | Subdued labels |
| `--text-tertiary` | `#AEAEB2` | Line numbers |
| `--accent` | `#007AFF` | San Francisco blue |

#### Color Palette (Dark Mode)

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#1D1D1F` | Deep charcoal |
| `--bg-secondary` | `#2C2C2E` | Panel backgrounds |
| `--border` | `#3A3A3C` | Subtle separators |
| `--text-primary` | `#F5F5F7` | Off-white |
| `--accent` | `#0A84FF` | iOS blue |

#### Typography

```css
--font-mono: 'SF Mono', 'Roboto Mono', monospace;
--font-ui: 'SF Pro', 'Inter', -apple-system, sans-serif;
--line-height: 1.6;  /* Code needs air */
--letter-spacing-tight: -0.02em;  /* Headers */
--letter-spacing-loose: 0.01em;   /* Code labels */
--font-weight-light: 300;   /* Secondary UI */
--font-weight-regular: 400; /* Active code */
```

#### Geometry

```css
/* Soft but precise */
--radius-lg: 10px;  /* Main windows */
--radius-md: 6px;   /* Buttons, inputs */
--radius-sm: 4px;   /* Tags, badges */

/* Generous negative space */
--padding-container: 20px;
--gutter-increase: 1.25;  /* 25% more than default */

/* The Unibody Look */
box-shadow: none;
background: flat;
border: 0.5px solid var(--border);  /* Or 1px at low opacity */
```

#### Vibrancy (Frosted Glass)

```css
.love-vibrancy {
  backdrop-filter: blur(20px) saturate(180%);
  background: rgba(245, 245, 247, 0.7);  /* Light */
  /* background: rgba(29, 29, 31, 0.7); */ /* Dark */
}
```

#### Interaction Curves

```css
--transition-curve: cubic-bezier(0.4, 0, 0.2, 1);  /* Apple curve */
/* Starts fast, ends with soft natural deceleration */
```

#### Interaction Feedback

| State | Effect | Purpose |
|-------|--------|---------|
| Click | Subtle 5% darken | Haptic visual |
| Focus | `box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.3)` | Precise ring |
| Hover | 2% brightness increase | Minimal response |

#### Drag Feedback (LOVE-specific)

- **Lift:** High-precision shadow appears
- **Snap:** 2% brightness pulse (0.1s)

#### UX Refinements

| Principle | Implementation |
|-----------|----------------|
| **Alignment** | Every element on strict vertical axis |
| **Reduction** | Hide status bar until hover |
| **Materials** | Use vibrancy on sidebar |
| **Icons** | SF Symbols style: thin-stroke, geometric, centered |

#### Syntax Highlighting

| Scope | Color | Purpose |
|-------|-------|---------|
| Keywords | `#1D1D1F` (bold) | Structure |
| Strings | `#86868B` | Data |
| Comments | `#C1C1C1` (italic) | Context |
| Functions | `#007AFF` | Action |

---

## 4. Implementation Requirements

### 4.1 Architecture

```
src/renderer/
├── themes/
│   ├── ThemeProvider.tsx    # React context for theme state
│   ├── theme-tokens.ts      # CSS variable definitions
│   ├── nexus.ts             # NEXUS theme config
│   ├── grid.ts              # GRID theme config
│   └── love.ts              # LOVE theme config
├── hooks/
│   └── useTheme.ts          # Theme hook for components
└── styles/
    ├── base.css             # Universal interaction styles
    ├── nexus.css            # NEXUS-specific styles
    ├── grid.css             # GRID-specific styles (scanlines, etc.)
    └── love.css             # LOVE-specific styles (vibrancy, etc.)
```

### 4.2 Theme Provider

```typescript
interface ThemeConfig {
  id: 'nexus' | 'grid' | 'love';
  name: string;
  type: 'dark' | 'light';
  tokens: Record<string, string>;
  effects: {
    scanlines?: boolean;
    vibrancy?: boolean;
    glowBorders?: boolean;
  };
}

interface ThemeContextValue {
  theme: ThemeConfig;
  setTheme: (id: ThemeConfig['id']) => void;
  layoutMode: 'standard' | 'hyper-focus' | 'agent-first';
  setLayoutMode: (mode: LayoutMode) => void;
}
```

### 4.3 CSS Variable Injection

```typescript
function applyTheme(theme: ThemeConfig) {
  const root = document.documentElement;
  Object.entries(theme.tokens).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });
  root.setAttribute('data-theme', theme.id);
}
```

### 4.4 Settings Integration

Add to Settings Modal:

```
Appearance
├── Theme: [NEXUS ▼] [GRID] [LOVE]
├── Layout Mode: [Standard ▼] [Hyper-Focus] [Agent-First]
├── Font Size: [13px ───●─── ]
└── Reduce Motion: [ ] Enable reduced motion
```

### 4.5 Persistence

```typescript
interface UserPreferences {
  theme: 'nexus' | 'grid' | 'love';
  layoutMode: 'standard' | 'hyper-focus' | 'agent-first';
  panelLayout: PanelSlotConfig[];
  reduceMotion: boolean;
}

// Store in ~/.sumerian/preferences.json
```

---

## 5. Accessibility Requirements

| Requirement | Implementation |
|-------------|----------------|
| **Contrast** | All themes meet WCAG 2.1 AA (4.5:1 text, 3:1 UI) |
| **Motion** | Respect `prefers-reduced-motion` media query |
| **Focus** | All interactive elements have visible focus states |
| **Scaling** | UI scales gracefully from 12px to 24px base font |

### Reduced Motion Mode

When enabled:
- Disable scanlines animation (GRID)
- Disable spring physics (instant snaps)
- Disable glow animations
- Use `transition: none` or minimal 0.1s fades

---

## 6. Success Metrics

| Metric | Target |
|--------|--------|
| Theme switch latency | < 50ms |
| Layout recalculation | < 16ms (60fps) |
| Memory overhead per theme | < 2MB |
| User preference persistence | 100% reliable |

---

*Sumerian Design System v2.0 — January 2026*
