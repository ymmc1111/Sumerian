# Sprint 07: Theme Foundation
**Duration:** 1 week  
**Goal:** CSS variable system, ThemeProvider, and Settings UI integration

**Prerequisites:** Sprint 06 complete (MVP released)

---

## 🎯 Sprint Objective

Build the foundational architecture for the selectable theme system, enabling runtime theme switching without page reload.

---

## 📋 Task Checklist

### Task 7.1: Define Theme Token System
**Status:** ✅ Completed  
**Estimate:** 2 hours

**Description:**
Create the CSS variable architecture that all themes will use.

**Acceptance Criteria:**
- [ ] Define `src/renderer/themes/theme-tokens.ts` with all token types
- [ ] Tokens cover: colors, spacing, typography, borders, shadows, motion
- [ ] TypeScript interfaces for `ThemeConfig` and `ThemeTokens`
- [ ] Export token validation function

**Files to Create:**
- `src/renderer/themes/theme-tokens.ts`

---

### Task 7.2: Create ThemeProvider Context
**Status:** ✅ Completed  
**Estimate:** 2 hours

**Description:**
React context provider for theme state management.

**Acceptance Criteria:**
- [ ] `ThemeProvider` wraps app root
- [ ] `useTheme()` hook for consuming theme
- [ ] Theme changes apply CSS variables to `:root`
- [ ] `data-theme` attribute set on document for CSS selectors

**Files to Create:**
- `src/renderer/themes/ThemeProvider.tsx`
- `src/renderer/hooks/useTheme.ts`

---

### Task 7.3: Implement NEXUS Theme Config
**Status:** ✅ Completed  
**Estimate:** 1 hour

**Description:**
Convert existing styles to the new theme token format.

**Acceptance Criteria:**
- [ ] All current colors mapped to tokens
- [ ] No hardcoded colors in component styles
- [ ] Theme loads as default on app start
- [ ] Existing UI unchanged visually

**Files to Create:**
- `src/renderer/themes/nexus.ts`

**Files to Modify:**
- `src/renderer/index.css` (convert to CSS variables)

---

### Task 7.4: Implement GRID Theme Config
**Status:** ✅ Completed  
**Estimate:** 3 hours

**Description:**
Create the Tron 80s aesthetic theme configuration.

**Acceptance Criteria:**
- [ ] All GRID colors from DESIGN_SYSTEM.md implemented
- [ ] Glowing border effects via box-shadow
- [ ] Header styling with clipped corners
- [ ] Theme selectable and applies correctly

**Files to Create:**
- `src/renderer/themes/grid.ts`
- `src/renderer/styles/grid.css`

---

### Task 7.5: Implement GRID Scanline Overlay
**Status:** ✅ Completed  
**Estimate:** 1 hour

**Description:**
Add optional CRT scanline effect for GRID theme.

**Acceptance Criteria:**
- [ ] Scanline overlay component
- [ ] Only renders when GRID theme active
- [ ] Respects `prefers-reduced-motion`
- [ ] Toggle in settings to disable

**Files to Create:**
- `src/renderer/components/ScanlineOverlay.tsx`

---

### Task 7.6: Implement LOVE Theme Config
**Status:** ✅ Completed  
**Estimate:** 2 hours

**Description:**
Create the Ive minimalist theme configuration.

**Acceptance Criteria:**
- [ ] All LOVE colors from DESIGN_SYSTEM.md implemented
- [ ] Light and dark mode variants
- [ ] Vibrancy/frosted glass effect on sidebar
- [ ] Precise border radius and spacing

**Files to Create:**
- `src/renderer/themes/love.ts`
- `src/renderer/styles/love.css`

---

### Task 7.7: Update Settings Modal
**Status:** ✅ Completed  
**Estimate:** 2 hours

**Description:**
Add theme selection to Settings.

**Acceptance Criteria:**
- [ ] Theme picker with visual previews
- [ ] Layout mode selector (Standard/Hyper-Focus/Agent-First)
- [ ] Reduce motion toggle
- [ ] Changes apply immediately (no save button)

**Files to Modify:**
- `src/renderer/components/SettingsModal.tsx`

---

### Task 7.8: Persist Theme Preferences
**Status:** ✅ Completed  
**Estimate:** 1 hour

**Description:**
Save and restore user theme preferences.

**Acceptance Criteria:**
- [ ] Preferences saved to `~/.sumerian/preferences.json`
- [ ] Theme restored on app launch
- [ ] Layout mode restored
- [ ] Graceful fallback if file corrupted

**Files to Modify:**
- `src/main/files/FileService.ts` (add preferences methods)
- `src/renderer/themes/ThemeProvider.tsx` (load on mount)

---

### Task 7.9: Write Theme Unit Tests
**Status:** ✅ Completed  
**Estimate:** 2 hours

**Description:**
Test theme system functionality.

**Acceptance Criteria:**
- [ ] Token validation tests
- [ ] Theme switching tests
- [ ] Persistence tests
- [ ] Reduced motion tests

**Files to Create:**
- `tests/unit/ThemeProvider.test.ts`
- `tests/unit/theme-tokens.test.ts`

---

## ✅ Sprint Definition of Done

- [x] All tasks marked complete
- [x] Three themes selectable from Settings
- [x] Theme persists across app restarts
- [x] No visual regressions in NEXUS theme
- [x] Reduced motion respected
- [x] Unit tests pass

---

## 📊 Sprint Summary

| Metric | Target | Actual |
|--------|--------|--------|
| Tasks Completed | 9/9 | 9/9 |
| Theme Switch Latency | <50ms | ✅ |
| Test Coverage | >80% | ✅ |

---

## 📝 Notes

_Add session notes and blockers here during the sprint._

---

*Sprint 07 — Sumerian Vibe-Runner IDE*
