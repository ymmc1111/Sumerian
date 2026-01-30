# Sprint 08: Layout Engine
**Duration:** 1 week  
**Goal:** Drag-drop panels, layout toggles, and snap regions

**Prerequisites:** Sprint 07 complete (Theme Foundation)

---

## 🎯 Sprint Objective

Implement the Universal Interaction Engine that enables magnetic drag-and-drop panel repositioning with layout mode presets.

---

## 📋 Task Checklist

### Task 8.1: Define Panel Slot System
**Status:** ⬜ Not Started  
**Estimate:** 2 hours

**Description:**
Create the data model for panel slots and their configurations.

**Acceptance Criteria:**
- [ ] `PanelSlot` interface (A, B, C, D positions)
- [ ] `PanelConfig` with width/height constraints
- [ ] Default slot assignments for each panel type
- [ ] Zustand store for panel layout state

**Files to Create:**
- `src/renderer/stores/layoutStore.ts`
- `src/renderer/types/layout.ts`

---

### Task 8.2: Implement Snap Region Detection
**Status:** ⬜ Not Started  
**Estimate:** 3 hours

**Description:**
Calculate snap zones and magnetic influence areas.

**Acceptance Criteria:**
- [ ] 40px threshold for snap detection
- [ ] Edge snapping (viewport boundaries)
- [ ] Panel-to-panel snapping
- [ ] Return closest valid snap target

**Files to Create:**
- `src/renderer/utils/snapRegions.ts`

---

### Task 8.3: Build Drag Controller
**Status:** ⬜ Not Started  
**Estimate:** 3 hours

**Description:**
Core drag-and-drop logic for panel movement.

**Acceptance Criteria:**
- [ ] `useDragPanel()` hook
- [ ] Mouse/touch event handling
- [ ] Cursor changes (grab → grabbing)
- [ ] Drag threshold (5px) before lift

**Files to Create:**
- `src/renderer/hooks/useDragPanel.ts`

---

### Task 8.4: Implement Ghost Frame Preview
**Status:** ⬜ Not Started  
**Estimate:** 2 hours

**Description:**
Visual preview showing where panel will land.

**Acceptance Criteria:**
- [ ] Semi-transparent preview rectangle
- [ ] Follows snap region calculations
- [ ] Animates smoothly between targets
- [ ] Theme-aware styling

**Files to Create:**
- `src/renderer/components/GhostFrame.tsx`

---

### Task 8.5: Add Spring Animation System
**Status:** ⬜ Not Started  
**Estimate:** 2 hours

**Description:**
Physics-based animations for panel movement.

**Acceptance Criteria:**
- [ ] Spring config: stiffness 400, damping 28
- [ ] Snap animation on drop
- [ ] Return-to-origin animation
- [ ] Respects reduced motion preference

**Files to Create:**
- `src/renderer/utils/springAnimation.ts`

---

### Task 8.6: Create Draggable Panel Header
**Status:** ⬜ Not Started  
**Estimate:** 2 hours

**Description:**
Make panel headers the drag handles.

**Acceptance Criteria:**
- [ ] 32px header height (touch target)
- [ ] Drag handle cursor indicator
- [ ] Double-click to reset position
- [ ] Title and controls layout

**Files to Modify:**
- `src/renderer/components/PanelHeader.tsx` (or create)

---

### Task 8.7: Implement Layout Mode Toggles
**Status:** ⬜ Not Started  
**Estimate:** 2 hours

**Description:**
Three layout presets: Standard, Hyper-Focus, Agent-First.

**Acceptance Criteria:**
- [ ] `Cmd+\` cycles through modes
- [ ] Standard: all panels visible
- [ ] Hyper-Focus: A, C, D collapse to 4px edges
- [ ] Agent-First: B and C split 45%/45%

**Files to Create:**
- `src/renderer/components/LayoutModeToggle.tsx`

**Files to Modify:**
- `src/renderer/stores/layoutStore.ts`

---

### Task 8.8: Add Panel Resize Handles
**Status:** ⬜ Not Started  
**Estimate:** 2 hours

**Description:**
Allow manual resizing of panel widths/heights.

**Acceptance Criteria:**
- [ ] 4px resize zones between panels
- [ ] Cursor changes to resize indicator
- [ ] Min/max constraints per panel
- [ ] Persist custom sizes

**Files to Create:**
- `src/renderer/components/ResizeHandle.tsx`
- `src/renderer/hooks/useResizePanel.ts`

---

### Task 8.9: Implement Panel Stacking (Tabs)
**Status:** ⬜ Not Started  
**Estimate:** 3 hours

**Description:**
Drag panel to center of another to create tabbed group.

**Acceptance Criteria:**
- [ ] Center drop zone detection
- [ ] Tab bar appears when stacked
- [ ] Click tab to switch active panel
- [ ] Drag tab out to unstack

**Files to Create:**
- `src/renderer/components/PanelTabBar.tsx`

---

### Task 8.10: Add Theme-Specific Drag Feedback
**Status:** ⬜ Not Started  
**Estimate:** 2 hours

**Description:**
Visual feedback varies by active theme during drag.

**Acceptance Criteria:**
- [ ] NEXUS: 50% opacity lift
- [ ] GRID: pixelate/de-rez effect
- [ ] LOVE: precision shadow
- [ ] Snap haptic varies by theme

**Files to Modify:**
- `src/renderer/hooks/useDragPanel.ts`
- Theme CSS files

---

### Task 8.11: Persist Layout State
**Status:** ⬜ Not Started  
**Estimate:** 1 hour

**Description:**
Save panel positions to localStorage.

**Acceptance Criteria:**
- [ ] Layout saved on every change
- [ ] Restored on app launch
- [ ] Per-project layout option
- [ ] Reset to default option

**Files to Modify:**
- `src/renderer/stores/layoutStore.ts`

---

### Task 8.12: Write Layout Unit Tests
**Status:** ⬜ Not Started  
**Estimate:** 2 hours

**Description:**
Test layout engine functionality.

**Acceptance Criteria:**
- [ ] Snap region calculation tests
- [ ] Layout mode transition tests
- [ ] Panel stacking tests
- [ ] Persistence tests

**Files to Create:**
- `tests/unit/layoutStore.test.ts`
- `tests/unit/snapRegions.test.ts`

---

## ✅ Sprint Definition of Done

- [ ] All tasks marked complete
- [ ] Panels draggable to any slot
- [ ] Three layout modes functional
- [ ] Layout persists across restarts
- [ ] Panel stacking works
- [ ] No regressions in core functionality

---

## 📊 Sprint Summary

| Metric | Target | Actual |
|--------|--------|--------|
| Tasks Completed | 12/12 | /12 |
| Layout Recalc Time | <16ms | |
| Drag Smoothness | 60fps | |

---

## 📝 Notes

_Add session notes and blockers here during the sprint._

---

*Sprint 08 — Sumerian Vibe-Runner IDE*
