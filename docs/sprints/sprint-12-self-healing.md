# Sprint 12: Self-Healing & Advanced Context
**Duration:** 2 weeks  
**Goal:** Implement automated error recovery (Self-Healing) and advanced context management to handle long sessions and complex debugging loops.

---

## 🎯 Sprint Objective
Enable Sumerian to detect failure states (bash errors, lint failures, build crashes) and automatically guide the agent through an autonomous repair loop. Additionally, optimize the context window by implementing smart pruning and pinned file context.

---

## 📋 Task Checklist

### Task 12.1: Implement Self-Healing Detection Logic
**Status:** ✅ Completed  
**Estimate:** 3 hours

**Description:**
Update the store to detect when a tool action results in an error and, if in Brave Mode, automatically send the error back to Claude with a repair prompt.

**Acceptance Criteria:**
- [ ] Detect `isError: true` in `toolResult` events
- [ ] Track iteration count of self-healing loops
- [ ] Auto-send "The previous command failed with: [error]. Please fix it."
- [ ] Max iteration limit (default 5) to prevent infinite loops
- [ ] Manual override to stop the loop

**Files to Modify:**
- `src/renderer/stores/useAppStore.ts`
- `src/renderer/stores/types.ts`

---

### Task 12.2: Integrate Self-Healing UI
**Status:** ✅ Completed  
**Estimate:** 2 hours

**Description:**
Display the `SelfHealingIndicator` in the `AgentPanel` when a repair loop is active.

**Acceptance Criteria:**
- [ ] Indicator shows current iteration vs max iterations
- [ ] Interrupt button stops the loop and clears health state
- [ ] Indicator pulses red/amber during healing
- [ ] Toast notification when self-healing starts

**Files to Modify:**
- `src/renderer/panels/AgentPanel.tsx`
- `src/renderer/components/SelfHealingIndicator.tsx`

---

### Task 12.3: Conversation Pruning & Summarization
**Status:** ✅ Completed  
**Estimate:** 3 hours

**Description:**
Manage the context window by pruning old messages or grouping tool actions to save tokens.

**Acceptance Criteria:**
- [ ] Algorithm to detect when history exceeds token threshold (approximate)
- [ ] Older tool results collapsed or removed from active context
- [ ] Option to "Summarize Session" to clear history but keep progress
- [ ] UI indicator for context window pressure

**Files to Modify:**
- `src/renderer/stores/useAppStore.ts`
- `src/renderer/components/TokenUsageDisplay.tsx`

---

### Task 12.4: Pinned File Context
**Status:** ✅ Completed  
**Estimate:** 2 hours

**Description:**
Allow users to "Pin" specific files that should always be sent as part of the system/user prompt context.

**Acceptance Criteria:**
- [ ] "Pin" icon in file tree and tab bar
- [ ] Pinned files list in Agent settings
- [ ] Pinned contents prepended/appended to every user message
- [ ] Visual indicator in ChatInput of total pinned files

**Files to Modify:**
- `src/renderer/stores/types.ts`
- `src/renderer/components/FileTreeItem.tsx`
- `src/renderer/components/Tab.tsx`

---

### Task 12.5: Build/Lint Error Sensing
**Status:** ✅ Completed  
**Estimate:** 3 hours

**Description:**
Listen for background build or lint tasks and trigger self-healing if they fail.

**Acceptance Criteria:**
- [ ] Capture stderr from `npm run dev` or `tsc`
- [ ] Detect standard error patterns (e.g., "TS2322", "Module not found")
- [ ] Prompt user: "Build failed. Let Agent fix it?"
- [ ] If accepted, send full error stack to agent

**Files to Modify:**
- `src/main/terminal/TerminalManager.ts`
- `src/renderer/stores/useAppStore.ts`

---

## ✅ Sprint Definition of Done
- [ ] Agent can recover from a bash command typo autonomously
- [ ] Self-healing loops have a clear UI and interrupt mechanism
- [ ] Large conversations don't crash the context window
- [ ] Pinned files effectively guide the agent's knowledge

---

*Sprint 12 — Sumerian Vibe-Runner IDE*
