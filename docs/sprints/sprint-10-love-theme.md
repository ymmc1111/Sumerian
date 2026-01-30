# Sprint 10: LOVE Theme Polish
**Duration:** 1 week  
**Goal:** Complete Ive minimalist aesthetic with precision and restraint

**Prerequisites:** Sprint 09 complete (GRID Theme)

---

## 🎯 Sprint Objective

Polish the LOVE theme with authentic Jony Ive-inspired minimalism—precision spacing, subtle materials, and refined typography.

---

## 📋 Task Checklist

### Task 10.1: Implement Light/Dark Mode Toggle
**Status:** ⬜ Not Started  
**Estimate:** 2 hours

**Description:**
LOVE theme supports both light and dark variants.

**Acceptance Criteria:**
- [ ] Auto-detect system preference
- [ ] Manual toggle in settings
- [ ] Smooth transition between modes
- [ ] Both modes meet contrast requirements

**Files to Modify:**
- `src/renderer/themes/love.ts`
- `src/renderer/themes/ThemeProvider.tsx`

---

### Task 10.2: Build Vibrancy Sidebar
**Status:** ⬜ Not Started  
**Estimate:** 2 hours

**Description:**
Frosted glass effect on sidebar (macOS Vibrancy style).

**Acceptance Criteria:**
- [ ] `backdrop-filter: blur(20px) saturate(180%)`
- [ ] Semi-transparent background
- [ ] Content behind visible but blurred
- [ ] Fallback for unsupported browsers

**Files to Modify:**
- `src/renderer/panels/Sidebar.tsx`
- `src/renderer/styles/love.css`

---

### Task 10.3: Refine Typography System
**Status:** ⬜ Not Started  
**Estimate:** 2 hours

**Description:**
Implement precise Ive-style typography.

**Acceptance Criteria:**
- [ ] SF Mono / Roboto Mono for code
- [ ] SF Pro / Inter for UI
- [ ] Line height: 1.6 for code
- [ ] Light weight (300) for secondary text
- [ ] Tight tracking for headers

**Files to Modify:**
- `src/renderer/styles/love.css`
- `src/renderer/index.css`

---

### Task 10.4: Apply Precision Spacing
**Status:** ⬜ Not Started  
**Estimate:** 2 hours

**Description:**
Increase gutters and padding for "breathing room."

**Acceptance Criteria:**
- [ ] Container padding: 20px
- [ ] Panel gaps: 10px (25% increase)
- [ ] Generous editor gutters
- [ ] All elements on strict vertical axis

**Files to Modify:**
- `src/renderer/styles/love.css`

---

### Task 10.5: Style Buttons & Inputs
**Status:** ⬜ Not Started  
**Estimate:** 2 hours

**Description:**
Soft, precise interactive elements.

**Acceptance Criteria:**
- [ ] Border radius: 6px for buttons
- [ ] Border: 0.5px hairline
- [ ] No shadows (flat design)
- [ ] Focus ring: 3px blue glow
- [ ] Haptic feedback: subtle 5% darken on click

**Files to Modify:**
- `src/renderer/styles/love.css`

---

### Task 10.6: Style Monaco Editor for LOVE
**Status:** ⬜ Not Started  
**Estimate:** 2 hours

**Description:**
Apply minimal syntax highlighting.

**Acceptance Criteria:**
- [ ] Keywords: #1D1D1F bold (structure)
- [ ] Strings: #86868B (data)
- [ ] Comments: #C1C1C1 italic (context)
- [ ] Functions: #007AFF (action)
- [ ] Cursor: #007AFF
- [ ] Selection: #007AFF22

**Files to Create:**
- `src/renderer/themes/love-monaco.ts`

---

### Task 10.7: Style Terminal for LOVE
**Status:** ⬜ Not Started  
**Estimate:** 1 hour

**Description:**
Minimal terminal appearance.

**Acceptance Criteria:**
- [ ] Light mode: #F5F5F7 bg, #1D1D1F fg
- [ ] Dark mode: #1D1D1F bg, #F5F5F7 fg
- [ ] Minimal ANSI colors (monochromatic where possible)
- [ ] Thin cursor

**Files to Modify:**
- `src/renderer/panels/TerminalPanel.tsx`

---

### Task 10.8: Style Agent Panel for LOVE
**Status:** ⬜ Not Started  
**Estimate:** 2 hours

**Description:**
Clean, minimal chat interface.

**Acceptance Criteria:**
- [ ] No bubble borders (use spacing)
- [ ] Subtle background differentiation
- [ ] SF Pro font for messages
- [ ] Blue accent for user actions
- [ ] Minimal typing indicator (three dots)

**Files to Modify:**
- `src/renderer/panels/AgentPanel.tsx`
- `src/renderer/styles/love.css`

---

### Task 10.9: Hide Non-Essential UI
**Status:** ⬜ Not Started  
**Estimate:** 1 hour

**Description:**
Reduce visual noise per Ive philosophy.

**Acceptance Criteria:**
- [ ] Status bar hidden by default (show on hover)
- [ ] Minimize chrome around editor
- [ ] Activity bar icons: thin-stroke style
- [ ] Remove decorative elements

**Files to Modify:**
- `src/renderer/App.tsx`
- `src/renderer/styles/love.css`

---

### Task 10.10: Implement Apple Transition Curve
**Status:** ⬜ Not Started  
**Estimate:** 1 hour

**Description:**
Use the signature Apple animation curve.

**Acceptance Criteria:**
- [ ] `cubic-bezier(0.4, 0, 0.2, 1)` for all transitions
- [ ] Starts fast, ends with natural deceleration
- [ ] Duration: 0.25s for most transitions
- [ ] Respects reduced motion

**Files to Modify:**
- `src/renderer/styles/love.css`

---

### Task 10.11: Add LOVE-Specific Scrollbars
**Status:** ⬜ Not Started  
**Estimate:** 1 hour

**Description:**
Minimal, unobtrusive scrollbars.

**Acceptance Criteria:**
- [ ] Width: 6px
- [ ] Track: transparent
- [ ] Thumb: subtle gray (#D2D2D7 light, #3A3A3C dark)
- [ ] Appears on hover only

**Files to Modify:**
- `src/renderer/styles/love.css`

---

### Task 10.12: Test LOVE Theme End-to-End
**Status:** ⬜ Not Started  
**Estimate:** 2 hours

**Description:**
Visual regression and accessibility testing.

**Acceptance Criteria:**
- [ ] Both light and dark modes render correctly
- [ ] All panels styled consistently
- [ ] Contrast ratios meet WCAG AA
- [ ] Typography renders crisply
- [ ] Screenshot comparisons pass

**Files to Create:**
- `tests/e2e/love-theme.spec.ts`

---

## ✅ Sprint Definition of Done

- [ ] All tasks marked complete
- [ ] LOVE theme fully styled (light + dark)
- [ ] Vibrancy effect working
- [ ] Typography precise and readable
- [ ] All contrast requirements met
- [ ] User-approved visual quality

---

## 📊 Sprint Summary

| Metric | Target | Actual |
|--------|--------|--------|
| Tasks Completed | 12/12 | /12 |
| Contrast Ratio | >4.5:1 | |
| Light/Dark Parity | 100% | |

---

## 📝 Notes

_Add session notes and blockers here during the sprint._

---

*Sprint 10 — Sumerian Vibe-Runner IDE*
