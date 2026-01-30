# Sprint 05: Terminal & xterm.js
**Duration:** 1 week  
**Goal:** Integrate xterm.js terminal with CLI output mirroring

**Prerequisites:** Sprint 04 complete

---

## 🎯 Sprint Objective
Build the Shadow Terminal panel using xterm.js that mirrors Claude CLI background operations and provides an interactive terminal experience.

---

## 📋 Task Checklist

### Task 5.1: Integrate xterm.js
**Status:** ✅ Completed  
**Estimate:** 2 hours

**Description:**
Set up xterm.js in the TerminalPanel with Nexus styling.

**Acceptance Criteria:**
- [x] xterm.js renders in TerminalPanel
- [x] Terminal uses Nexus dark theme colors
- [x] Fit addon auto-resizes terminal
- [x] Web links addon enables clickable URLs

**Files Created:**
- `src/renderer/panels/TerminalPanel.tsx`
- `src/renderer/themes/xtermTheme.ts`

---

### Task 5.2: Connect Terminal to node-pty
**Status:** ✅ Completed  
**Estimate:** 2 hours

**Description:**
Wire xterm.js to a node-pty shell process.

**Acceptance Criteria:**
- [x] Terminal spawns user's default shell
- [x] Input/output streams correctly
- [x] Terminal resizes propagate to pty
- [x] Shell inherits project directory as cwd

**Files Created:**
- `src/main/terminal/TerminalManager.ts`

---

### Task 5.3: Implement CLI Output Mirroring
**Status:** ✅ Completed  
**Estimate:** 2 hours

**Description:**
Mirror Claude CLI background operations to terminal.

**Acceptance Criteria:**
- [x] CLI stdout/stderr appears in terminal
- [x] Agent commands prefixed with `[agent]`
- [x] Command output clearly distinguished
- [x] Toggle to show/hide agent output

**Files Modified:**
- `src/main/cli/CLIManager.ts`
- `src/renderer/panels/TerminalPanel.tsx`

---

### Task 5.4: Add Terminal Tabs
**Status:** ✅ Completed  
**Estimate:** 2 hours

**Description:**
Support multiple terminal instances with tabs.

**Acceptance Criteria:**
- [x] Tab bar for multiple terminals
- [x] New terminal button (+)
- [x] Close terminal button (x)
- [x] Switch between terminals

**Files Created:**
- `src/renderer/components/TerminalTabs.tsx`

---

### Task 5.5: Implement Terminal Toggle
**Status:** ✅ Completed  
**Estimate:** 1 hour

**Description:**
Add keyboard shortcut and UI to toggle terminal visibility.

**Acceptance Criteria:**
- [x] `Cmd+\`` toggles terminal panel
- [x] Terminal panel collapses/expands smoothly
- [x] Panel height persists in state
- [x] Drag handle to resize

**Files Modified:**
- `src/renderer/components/Layout.tsx` (In our case `App.tsx`)
- `src/renderer/hooks/useKeyboardShortcuts.ts`

---

### Task 5.6: Add Terminal State to Zustand
**Status:** ✅ Completed  
**Estimate:** 1 hour

**Description:**
Extend Zustand store with terminal state.

**Acceptance Criteria:**
- [x] Track terminal instances
- [x] Track active terminal ID
- [x] Track terminal visibility
- [x] Actions: createTerminal, closeTerminal, setActiveTerminal

**Files Modified:**
- `src/renderer/stores/useAppStore.ts`

---

### Task 5.7: Implement Self-Healing Loop Display
**Status:** ✅ Completed  
**Estimate:** 2 hours

**Description:**
Show agent's self-healing loop when commands fail.

**Acceptance Criteria:**
- [x] Failed command output highlighted in red
- [x] Agent's retry attempt shown
- [x] Loop iteration counter displayed
- [x] User can interrupt loop

**Files Created:**
- `src/renderer/components/SelfHealingIndicator.tsx`

---

### Task 5.8: Add Terminal Context Menu
**Status:** ✅ Completed  
**Estimate:** 1 hour

**Description:**
Right-click context menu for terminal actions.

**Acceptance Criteria:**
- [x] Copy selected text
- [x] Paste from clipboard
- [x] Clear terminal
- [x] Kill current process

**Files Created:**
- `src/renderer/components/TerminalContextMenu.tsx`

---

## ✅ Sprint Definition of Done

- [x] All tasks marked complete
- [x] Terminal panel functional with xterm.js
- [x] CLI output mirrors to terminal
- [x] Multiple terminal tabs work
- [x] Terminal toggle with keyboard shortcut
- [x] No TypeScript errors

---

## 📊 Sprint Summary

| Metric | Target | Actual |
|--------|--------|--------|
| Tasks Completed | 8/8 | 8/8 |
| Build Status | ✅ | ✅ |
| Test Coverage | >70% | — |


---

## 📝 Notes

_Add session notes and blockers here during the sprint._

---

*Sprint 05 — Sumerian Vibe-Runner IDE*
