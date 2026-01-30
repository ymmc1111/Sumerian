# Sprint 01: Foundation
**Duration:** 1 week  
**Goal:** Set up the Electron project skeleton with basic UI shell

---

## 🎯 Sprint Objective
Initialize the Sumerian project with Electron Forge, configure the build system, and create the basic application shell with placeholder panels.

---

## 📋 Task Checklist

### Task 1.1: Initialize Electron Forge Project
**Status:** ✅ Complete  
**Estimate:** 2 hours

**Description:**
Create a new Electron Forge project with React and TypeScript template.

**Acceptance Criteria:**
- [x] Project initialized with `npm init electron-app@latest`
- [x] React + TypeScript + Vite template configured
- [x] `npm run dev` launches empty Electron window
- [x] `npm run build` produces distributable

**Commands:**
```bash
npm init electron-app@latest sumerian -- --template=vite-typescript
cd sumerian
npm install react react-dom
npm install -D @types/react @types/react-dom @vitejs/plugin-react
```

**Files Created:**
- `package.json`
- `forge.config.ts`
- `vite.main.config.ts`
- `vite.renderer.config.ts`
- `src/main.ts`
- `src/renderer.tsx`

---

### Task 1.2: Install Core Dependencies
**Status:** ✅ Complete  
**Estimate:** 1 hour

**Description:**
Install all production and development dependencies defined in SPEC.md.

**Acceptance Criteria:**
- [x] All production deps installed (monaco-editor, xterm, node-pty, zustand, etc.)
- [x] All dev deps installed (tailwindcss, vitest, etc.)
- [x] No npm audit critical vulnerabilities
- [x] TypeScript compiles without errors

**Commands:**
```bash
# Production
npm install monaco-editor xterm xterm-addon-fit xterm-addon-web-links node-pty zustand simple-git electron-store keytar

# Development
npm install -D tailwindcss postcss autoprefixer vitest @playwright/test
npx tailwindcss init -p
```

---

### Task 1.3: Configure TailwindCSS with Nexus Theme
**Status:** ✅ Complete  
**Estimate:** 1 hour

**Description:**
Set up TailwindCSS with the Nexus dark theme color palette.

**Acceptance Criteria:**
- [x] `tailwind.config.js` includes Nexus colors
- [x] Global CSS imports Tailwind directives
- [x] Test component renders with Nexus styling

**Files Modified:**
- `tailwind.config.js`
- `src/renderer/index.css`

**Theme Colors:**
```javascript
colors: {
  nexus: {
    bg: {
      primary: '#0a0a0a',
      secondary: '#141414',
      tertiary: '#1a1a1a',
      glass: 'rgba(20, 20, 20, 0.85)'
    },
    fg: {
      primary: '#ffffff',
      secondary: '#a0a0a0',
      muted: '#666666'
    },
    accent: '#3b82f6',
    border: '#2a2a2a'
  }
}
```

---

### Task 1.4: Create App Shell Layout
**Status:** ✅ Complete  
**Estimate:** 3 hours

**Description:**
Build the main application layout with resizable panels.

**Acceptance Criteria:**
- [x] Three-column layout: Sidebar | Editor | AgentPanel
- [x] Bottom-docked terminal panel (collapsible)
- [x] Panels are resizable via drag handles
- [x] Layout persists dimensions in localStorage

**Files Created:**
- `src/renderer/App.tsx`
- `src/renderer/components/Layout.tsx`
- `src/renderer/components/ResizeHandle.tsx`
- `src/renderer/panels/Sidebar.tsx`
- `src/renderer/panels/EditorPanel.tsx`
- `src/renderer/panels/AgentPanel.tsx`
- `src/renderer/panels/TerminalPanel.tsx`

**Layout Constraints (from SPEC.md):**
| Panel | Min | Max | Default |
|-------|-----|-----|---------|
| Sidebar | 200px | 400px | 260px |
| AgentPanel | 300px | 600px | 380px |
| Terminal | 100px | 500px | 200px |

---

### Task 1.5: Set Up Zustand Store
**Status:** ✅ Complete  
**Estimate:** 1 hour

**Description:**
Create the initial Zustand store with UI state management.

**Acceptance Criteria:**
- [x] Store created with TypeScript types
- [x] UI state (panel widths, active panel) managed
- [x] State persists to localStorage
- [x] Components can read/write state

**Files Created:**
- `src/renderer/stores/useAppStore.ts`
- `src/renderer/stores/types.ts`

---

### Task 1.6: Configure IPC Bridge (Preload)
**Status:** ✅ Complete  
**Estimate:** 2 hours

**Description:**
Set up the Electron preload script with typed IPC channels.

**Acceptance Criteria:**
- [x] Preload script exposes `window.sumerian` API
- [x] TypeScript types for all IPC channels
- [x] Main process has IPC handlers (stubs)
- [x] Renderer can call preload API

**Files Created:**
- `src/preload/index.ts`
- `src/preload/types.ts`
- `src/main/ipc/handlers.ts`

---

### Task 1.7: Add Window Chrome (Title Bar)
**Status:** ✅ Complete  
**Estimate:** 1 hour

**Description:**
Create custom title bar with window controls (frameless window).

**Acceptance Criteria:**
- [x] Frameless window configured in main process
- [x] Custom title bar with drag region
- [x] Close/Minimize/Maximize buttons functional
- [x] macOS traffic lights positioned correctly

**Files Created:**
- `src/renderer/components/TitleBar.tsx`

**Files Modified:**
- `src/main.ts` (BrowserWindow options)

---

## ✅ Sprint Definition of Done

- [x] All tasks marked complete
- [x] `npm run dev` launches app with all panels visible
- [x] `npm run build` succeeds without errors
- [x] No TypeScript errors
- [x] Code follows Nexus design constraints

---

## 📊 Sprint Summary

| Metric | Target | Actual |
|--------|--------|--------|
| Tasks Completed | 7/7 | 7/7 |
| Build Status | ✅ | ✅ |
| Test Coverage | N/A | — |

---

## 📝 Notes

_Add session notes and blockers here during the sprint._

---

*Sprint 01 — Sumerian Vibe-Runner IDE*
