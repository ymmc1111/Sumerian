# Sprint 03: Claude CLI Integration
**Duration:** 1 week  
**Goal:** Integrate Claude CLI with node-pty for agent communication

**Prerequisites:** Sprint 02 complete

---

## 🎯 Sprint Objective
Implement the CLIManager to spawn and communicate with the Claude CLI, stream responses to the AgentPanel, and handle session authentication.

---

## 📋 Task Checklist

### Task 3.1: Implement CLIManager Core
**Status:** ✅ Completed  
**Estimate:** 3 hours

**Description:**
Create the CLIManager module to spawn Claude CLI via node-pty.

**Acceptance Criteria:**
- [x] `spawn()` starts Claude CLI process
- [x] `write(message)` sends input to CLI
- [x] `kill()` terminates CLI process
- [x] Output streams to registered callbacks
- [x] Process lifecycle managed correctly

**Files Created:**
- `src/main/cli/CLIManager.ts`
- `src/main/cli/types.ts`


---

### Task 3.2: Implement Session Detection
**Status:** ✅ Completed  
**Estimate:** 2 hours

**Description:**
Detect and validate Claude Max session from credentials file.

**Acceptance Criteria:**
- [x] Read `~/.claude/.credentials.json`
- [x] Parse and validate session token
- [x] Detect expired sessions
- [x] Emit session status events

**Files Created:**
- `src/main/credentials/CredentialManager.ts`
- `src/main/credentials/types.ts`


---

### Task 3.3: Implement OAuth Bridge
**Status:** ✅ Completed  
**Estimate:** 2 hours

**Description:**
Trigger OAuth re-authentication when session expires.

**Acceptance Criteria:**
- [x] Detect session expiration
- [x] Open system browser for `/login` flow
- [x] Poll for new credentials after login
- [x] Update session state on success

**Files Created:**
- `src/main/credentials/OAuthBridge.ts`


---

### Task 3.4: Wire CLI to IPC
**Status:** ✅ Completed  
**Estimate:** 1 hour

**Description:**
Connect CLIManager to IPC for renderer communication.

**Acceptance Criteria:**
- [x] `sumerian.cli.send()` works from renderer
- [x] `sumerian.cli.onOutput()` receives streaming output
- [x] `sumerian.cli.getStatus()` returns connection state
- [x] Session events propagate to renderer

**Files Modified:**
- `src/main/ipc/handlers.ts`
- `src/preload.ts`


---

### Task 3.5: Build AgentPanel Chat UI
**Status:** ✅ Completed  
**Estimate:** 3 hours

**Description:**
Create the chat interface for agent interaction.

**Acceptance Criteria:**
- [x] Message input with send button
- [x] Message list with user/agent distinction
- [x] Streaming response display (token by token)
- [x] Auto-scroll to latest message
- [x] Markdown rendering for agent responses

**Files Created:**
- `src/renderer/panels/AgentPanel.tsx`
- `src/renderer/components/ChatMessage.tsx`
- `src/renderer/components/ChatInput.tsx`


---

### Task 3.6: Add Agent State to Zustand
**Status:** ✅ Completed  
**Estimate:** 1 hour

**Description:**
Extend Zustand store with agent/CLI state.

**Acceptance Criteria:**
- [x] Track connection status
- [x] Track conversation history
- [x] Track pending agent actions
- [x] Actions: sendMessage, addResponse, clearHistory

**Files Modified:**
- `src/renderer/stores/useAppStore.ts`


---

### Task 3.7: Implement CLI Watchdog
**Status:** ✅ Completed  
**Estimate:** 1 hour

**Description:**
Auto-restart CLI if it hangs or crashes.

**Acceptance Criteria:**
- [x] Detect unresponsive CLI (>30s no output)
- [x] Auto-restart with preserved context
- [x] Notify user of restart
- [x] Limit restart attempts (max 3)

**Files Modified:**
- `src/main/cli/CLIManager.ts`


---

### Task 3.8: Add Connection Status Indicator
**Status:** ✅ Completed  
**Estimate:** 1 hour

**Description:**
Show CLI connection status in the UI.

**Acceptance Criteria:**
- [x] Status indicator in AgentPanel header
- [x] States: Connected, Disconnected, Reconnecting
- [x] Click to manually reconnect
- [x] Tooltip with details

**Files Created:**
- `src/renderer/components/ConnectionStatus.tsx`


---

## ✅ Sprint Definition of Done

- [x] All tasks marked complete
- [x] Can send messages to Claude CLI
- [x] Responses stream in real-time
- [x] Session expiration triggers OAuth flow
- [x] CLI auto-restarts on crash
- [x] No TypeScript errors


---

## 📊 Sprint Summary

| Metric | Target | Actual |
|--------|--------|--------|
| Tasks Completed | 8/8 | 8/8 |
| Build Status | ✅ | ✅ |
| Test Coverage | >60% | — |


---

## 📝 Notes

_Add session notes and blockers here during the sprint._

---

*Sprint 03 — Sumerian Vibe-Runner IDE*
