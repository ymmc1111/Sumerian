# Sprint 09: GRID Theme Polish
**Duration:** 1 week  
**Goal:** Complete Tron 80s aesthetic with all visual effects

**Prerequisites:** Sprint 08 complete (Layout Engine)

---

## 🎯 Sprint Objective

Polish the GRID theme with authentic 1980s Tron aesthetics including animations, glow effects, and CRT-style visual treatments.

---

## 📋 Task Checklist

### Task 9.1: Implement Glow Border System
**Status:** ⬜ Not Started  
**Estimate:** 2 hours

**Description:**
Create the signature glowing circuit-line borders.

**Acceptance Criteria:**
- [ ] Multi-layer box-shadow for outer glow
- [ ] Inset glow for depth
- [ ] Animated pulse on focus (subtle)
- [ ] Configurable glow intensity

**Files to Create:**
- `src/renderer/styles/grid-borders.css`

---

### Task 9.2: Build Header Bar with Clipped Corners
**Status:** ⬜ Not Started  
**Estimate:** 2 hours

**Description:**
Panel headers with 45-degree clipped corner aesthetic.

**Acceptance Criteria:**
- [ ] `clip-path: polygon()` for corner cut
- [ ] All-caps text with letter-spacing
- [ ] Text glow effect
- [ ] Background with subtle gradient

**Files to Modify:**
- `src/renderer/styles/grid.css`
- `src/renderer/components/PanelHeader.tsx`

---

### Task 9.3: Create Power-Up Animation
**Status:** ⬜ Not Started  
**Estimate:** 2 hours

**Description:**
Borders animate from center outward on app launch.

**Acceptance Criteria:**
- [ ] CSS keyframe animation
- [ ] Panels "energize" in sequence
- [ ] Duration: 0.8s total
- [ ] Disabled when reduce-motion enabled

**Files to Create:**
- `src/renderer/styles/grid-animations.css`
- `src/renderer/components/PowerUpOverlay.tsx`

---

### Task 9.4: Add De-rez Deletion Effect
**Status:** ⬜ Not Started  
**Estimate:** 2 hours

**Description:**
Pixelate/dissolve effect when closing tabs or panels.

**Acceptance Criteria:**
- [ ] CSS filter or canvas-based pixelation
- [ ] Duration: 0.2s
- [ ] Falls back to fade when reduced motion
- [ ] Works on tab close, panel minimize

**Files to Create:**
- `src/renderer/components/DerezEffect.tsx`

---

### Task 9.5: Implement Chromatic Aberration Feedback
**Status:** ⬜ Not Started  
**Estimate:** 1 hour

**Description:**
Brief RGB split effect on panel snap.

**Acceptance Criteria:**
- [ ] 0.1s duration
- [ ] Subtle offset (1-2px)
- [ ] Only on snap completion
- [ ] Disabled when reduced motion

**Files to Modify:**
- `src/renderer/styles/grid-animations.css`

---

### Task 9.6: Style Monaco Editor for GRID
**Status:** ⬜ Not Started  
**Estimate:** 2 hours

**Description:**
Apply GRID syntax highlighting and editor chrome.

**Acceptance Criteria:**
- [ ] Variables: #00E5FF (Light Cycle blue)
- [ ] Keywords: #CCFF00 (Bit yellow)
- [ ] Strings: #FF00E5 (Identity Disc pink)
- [ ] Functions: #5BFFAD (System green)
- [ ] Comments: #002B2B (ghosted teal)
- [ ] Cursor: #FF3C00 (MCP red)

**Files to Create:**
- `src/renderer/themes/grid-monaco.ts`

---

### Task 9.7: Style Terminal for GRID
**Status:** ⬜ Not Started  
**Estimate:** 1 hour

**Description:**
Apply GRID theme to xterm.js terminal.

**Acceptance Criteria:**
- [ ] Background: #000505
- [ ] Foreground: #E0FFFF
- [ ] ANSI colors mapped to GRID palette
- [ ] Cursor block with glow

**Files to Modify:**
- `src/renderer/panels/TerminalPanel.tsx`

---

### Task 9.8: Style Sidebar for GRID
**Status:** ⬜ Not Started  
**Estimate:** 2 hours

**Description:**
File tree and sidebar with GRID aesthetic.

**Acceptance Criteria:**
- [ ] Glassmorphism background (blur + teal tint)
- [ ] Glow on selected item
- [ ] Folder icons with circuit motif
- [ ] Hover state with light beam effect

**Files to Modify:**
- `src/renderer/panels/Sidebar.tsx`
- `src/renderer/styles/grid.css`

---

### Task 9.9: Style Agent Panel for GRID
**Status:** ⬜ Not Started  
**Estimate:** 2 hours

**Description:**
Chat interface with GRID treatment.

**Acceptance Criteria:**
- [ ] Message bubbles with border glow
- [ ] User messages: MCP red accent
- [ ] Agent messages: User blue accent
- [ ] Typing indicator as "processing" animation

**Files to Modify:**
- `src/renderer/panels/AgentPanel.tsx`
- `src/renderer/styles/grid.css`

---

### Task 9.10: Add GRID-Specific Scrollbars
**Status:** ⬜ Not Started  
**Estimate:** 1 hour

**Description:**
Minimal glowing scrollbar style.

**Acceptance Criteria:**
- [ ] Width: 4px
- [ ] Track: transparent or #000
- [ ] Thumb: glowing line (#00E5FF)
- [ ] Hover: increased glow

**Files to Modify:**
- `src/renderer/styles/grid.css`

---

### Task 9.11: Create GRID Button Styles
**Status:** ⬜ Not Started  
**Estimate:** 1 hour

**Description:**
Angular, non-rounded button shapes.

**Acceptance Criteria:**
- [ ] `clip-path` for angled corners
- [ ] Border glow on hover
- [ ] 0.1s instant transition
- [ ] Focus state with MCP red outline

**Files to Modify:**
- `src/renderer/styles/grid.css`

---

### Task 9.12: Test GRID Theme End-to-End
**Status:** ⬜ Not Started  
**Estimate:** 2 hours

**Description:**
Visual regression and functionality testing.

**Acceptance Criteria:**
- [ ] All panels render correctly
- [ ] Animations perform at 60fps
- [ ] Reduced motion fully disables effects
- [ ] No contrast/readability issues
- [ ] Screenshot comparisons pass

**Files to Create:**
- `tests/e2e/grid-theme.spec.ts`

---

## ✅ Sprint Definition of Done

- [ ] All tasks marked complete
- [ ] GRID theme fully styled across all components
- [ ] Animations smooth (60fps)
- [ ] Reduced motion respected everywhere
- [ ] No accessibility contrast violations
- [ ] User-approved visual quality

---

## 📊 Sprint Summary

| Metric | Target | Actual |
|--------|--------|--------|
| Tasks Completed | 12/12 | /12 |
| Animation FPS | 60fps | |
| Contrast Ratio | >4.5:1 | |

---

## 📝 Notes

_Add session notes and blockers here during the sprint._

---

*Sprint 09 — Sumerian Vibe-Runner IDE*
