# Sprint 06: Polish & MVP Release
**Duration:** 1 week  
**Goal:** Final polish, testing, and MVP release preparation

**Prerequisites:** Sprint 05 complete

---

## 🎯 Sprint Objective
Complete final polish, implement remaining MVP features, add comprehensive tests, and prepare for initial release.

---

## 📋 Task Checklist

### Task 6.1: Implement Lore File Injection
**Status:** ✅ Completed  
**Estimate:** 2 hours

**Description:**
Auto-load context files from `.sumerian/lore/` into agent sessions.

**Acceptance Criteria:**
- [x] Scan `.sumerian/lore/` on project open
- [x] Inject lore files as system context
- [x] Support markdown files
- [x] Show loaded lore in UI

**Files Created:**
- `src/main/context/LoreManager.ts`

---

### Task 6.2: Implement Active File Context
**Status:** ✅ Completed  
**Estimate:** 1 hour

**Description:**
Keep agent synced with user's currently focused file.

**Acceptance Criteria:**
- [x] Track active file in editor
- [x] Send file context to agent on change
- [x] Show "Agent sees: filename" indicator
- [x] Debounce rapid file switches

**Files Modified:**
- `src/renderer/panels/EditorPanel.tsx`
- `src/main/cli/CLIManager.ts`

---

### Task 6.3: Add Project Open Dialog
**Status:** ✅ Completed  
**Estimate:** 1 hour

**Description:**
Implement project folder selection with recent projects.

**Acceptance Criteria:**
- [x] `Cmd+O` opens folder picker
- [x] Recent projects list (last 10)
- [x] Store recent projects in `~/.sumerian/recent-projects.json`
- [x] Welcome screen with recent projects

**Files Created:**
- `src/renderer/components/WelcomeScreen.tsx`
- `src/renderer/components/RecentProjects.tsx`

---

### Task 6.4: Implement Settings Panel
**Status:** ✅ Completed  
**Estimate:** 2 hours

**Description:**
Create settings UI for app configuration.

**Acceptance Criteria:**
- [x] Settings modal with tabs
- [x] Theme selection (dark only for MVP)
- [x] Font size slider
- [x] Brave Mode default toggle
- [x] Settings persist to config file

**Files Created:**
- `src/renderer/components/SettingsModal.tsx`
- `src/renderer/components/SettingsTab.tsx`

---

### Task 6.5: Add Keyboard Shortcuts Help
**Status:** ✅ Completed  
**Estimate:** 1 hour

**Description:**
Show keyboard shortcuts reference.

**Acceptance Criteria:**
- [x] `Cmd+Shift+P` opens command palette
- [x] `Cmd+/` shows shortcuts help
- [x] All shortcuts documented
- [x] Searchable command palette

**Files Created:**
- `src/renderer/components/CommandPalette.tsx`
- `src/renderer/components/ShortcutsHelp.tsx`

---

### Task 6.6: Write Unit Tests
**Status:** ✅ Completed  
**Estimate:** 3 hours

**Description:**
Add unit tests for core modules.

**Acceptance Criteria:**
- [x] CLIManager tests
- [x] FileService tests
- [x] BraveModeGuard tests
- [x] SnapshotManager tests
- [x] Coverage > 80%

**Files Created:**
- `tests/unit/CLIManager.test.ts`
- `tests/unit/FileService.test.ts`
- `tests/unit/BraveModeGuard.test.ts`
- `tests/unit/SnapshotManager.test.ts`

---

### Task 6.7: Write E2E Tests
**Status:** ✅ Completed  
**Estimate:** 2 hours

**Description:**
Add Playwright E2E tests for critical paths.

**Acceptance Criteria:**
- [x] Open project and browse files
- [x] Edit and save file
- [x] Send message to agent
- [x] Toggle Brave Mode

**Files Created:**
- `tests/e2e/project.spec.ts`
- `tests/e2e/editor.spec.ts`
- `tests/e2e/agent.spec.ts`

---

### Task 6.8: Configure Build & Distribution
**Status:** ✅ Completed  
**Estimate:** 2 hours

**Description:**
Set up production builds for all platforms.

**Acceptance Criteria:**
- [x] macOS DMG builds
- [x] Windows installer builds
- [x] Linux AppImage builds
- [x] Auto-update configured

**Files Modified:**
- `forge.config.ts`
- `package.json`

---

### Task 6.9: Create Release Checklist
**Status:** ✅ Completed  
**Estimate:** 1 hour

**Description:**
Document release process and verify MVP completeness.

**Acceptance Criteria:**
- [x] All MVP features from PRD complete
- [x] No critical bugs
- [x] README updated with final instructions
- [x] CHANGELOG created

**Files Created:**
- `CHANGELOG.md`
- `docs/RELEASE_CHECKLIST.md`

---

## ✅ Sprint Definition of Done

- [x] All tasks marked complete
- [x] All MVP features from PRD implemented
- [x] Unit test coverage > 80%
- [x] E2E tests pass
- [x] Production builds succeed for all platforms
- [x] No TypeScript errors
- [x] No critical bugs

---

## 📊 Sprint Summary

| Metric | Target | Actual |
|--------|--------|--------|
| Tasks Completed | 9/9 | 9/9 |
| Build Status | ✅ | ✅ |
| Unit Test Coverage | >80% | ✅ |
| E2E Tests | Pass | ✅ |

---

## 📝 Notes

_Add session notes and blockers here during the sprint._

---

*Sprint 06 — Sumerian Vibe-Runner IDE*
