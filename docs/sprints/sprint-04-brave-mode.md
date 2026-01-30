# Sprint 04: Brave Mode & Safety
**Duration:** 1 week  
**Goal:** Implement Brave Mode with safety guardrails and file snapshots

**Prerequisites:** Sprint 03 complete

---

## 🎯 Sprint Objective
Build the Brave Mode system that allows agent autonomy while enforcing safety guardrails, command blocklists, and automatic file snapshots for reversibility.

---

## 📋 Task Checklist

### Task 4.1: Implement BraveModeGuard
**Status:** ✅ Completed  
**Estimate:** 3 hours

**Description:**
Create the safety layer that validates commands before execution.

**Acceptance Criteria:**
- [x] Blocklist regex patterns from SPEC.md implemented
- [x] Commands checked against blocklist before execution
- [x] Blocked commands return error with reason
- [x] Allowlist mode for pre-approved commands

**Files Created:**
- `src/main/cli/BraveModeGuard.ts`
- `src/main/cli/blocklist.ts`

---

### Task 4.2: Implement SnapshotManager
**Status:** ✅ Completed  
**Estimate:** 2 hours

**Description:**
Create automatic file backups before agent modifications.

**Acceptance Criteria:**
- [x] Snapshot created before any file write
- [x] Snapshots stored in `.sumerian/snapshots/{timestamp}/`
- [x] Snapshot includes file path and content
- [x] Cleanup old snapshots (keep last 50)

**Files Created:**
- `src/main/files/SnapshotManager.ts`

---

### Task 4.3: Implement Undo/Rollback
**Status:** ✅ Completed  
**Estimate:** 2 hours

**Description:**
Allow reverting agent actions using snapshots.

**Acceptance Criteria:**
- [x] `Cmd+Z` reverts last agent file change
- [x] Undo stack tracks last 50 actions
- [x] Session rollback restores to checkpoint
- [x] UI shows undo confirmation

**Files Created:**
- `src/main/files/UndoManager.ts`
- `src/renderer/panels/AgentPanel.tsx` (Undo/Rollback Button)

---

### Task 4.4: Add Brave Mode Toggle UI
**Status:** ✅ Completed  
**Estimate:** 1 hour

**Description:**
Create UI toggle for enabling/disabling Brave Mode.

**Acceptance Criteria:**
- [x] Toggle in AgentPanel header
- [x] Visual indicator when Brave Mode active
- [x] Warning modal on first enable

**Files Created:**
- `src/renderer/components/BraveModeToggle.tsx`

---

### Task 4.5: Implement Dry-Run Preview
**Status:** ✅ Completed  
**Estimate:** 2 hours

**Description:**
Show preview for destructive operations before execution.

**Acceptance Criteria:**
- [x] File deletions show preview modal
- [x] System commands show preview modal
- [x] User can approve or cancel
- [x] Preview shows affected files/commands

**Files Created:**
- `src/renderer/components/DryRunPreview.tsx`

---

### Task 4.6: Implement Audit Logger
**Status:** ✅ Completed  
**Estimate:** 1 hour

**Description:**
Log all agent actions for audit trail.

**Acceptance Criteria:**
- [x] All file operations logged
- [x] All commands logged
- [x] Log format matches SPEC.md AuditEntry
- [x] Logs written to `~/.sumerian/audit.log`

**Files Created:**
- `src/main/logging/AuditLogger.ts`

---

### Task 4.7: Add Sandbox Path Validation
**Status:** ✅ Completed  
**Estimate:** 1 hour

**Description:**
Enforce file access boundaries for agent operations.

**Acceptance Criteria:**
- [x] Agent can only access project directory by default
- [x] Denied paths always blocked (`~/.ssh`, `~/.aws`, etc.)
- [x] Out-of-scope access shows confirmation modal
- [x] Path validation in FileService

**Files Modified:**
- `src/main/files/FileService.ts`
- `src/main/files/SandboxValidator.ts`

---

### Task 4.8: Wire Brave Mode to CLI
**Status:** ✅ Completed  
**Estimate:** 1 hour

**Description:**
Pass Brave Mode flag to CLI and handle auto-confirm.

**Acceptance Criteria:**
- [x] Brave Mode adds `--dangerously-skip-permissions` flag
- [x] State synced between UI and CLI

**Files Modified:**
- `src/main/cli/CLIManager.ts`
- `src/renderer/stores/useAppStore.ts`
- `src/main/ipc/handlers.ts`


---

## ✅ Sprint Definition of Done

- [x] All tasks marked complete
- [x] Brave Mode toggle works
- [x] Dangerous commands blocked
- [x] File snapshots created before edits
- [x] Undo reverts last agent action
- [x] Audit log captures all actions
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

*Sprint 04 — Sumerian Vibe-Runner IDE*
