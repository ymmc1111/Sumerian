# Sprint 11: Agent Experience & Full Chat Interface
**Duration:** 2 weeks  
**Goal:** Transform raw CLI output into a world-class conversational UX with file context, smart references, slash commands, and session management

**Prerequisites:** Sprint 10 complete (or can run in parallel with theming sprints)

---

## 🎯 Sprint Objective
Implement a CLIOutputParser layer that routes Claude CLI JSON output to appropriate UI components, enabling natural language conversation in AgentPanel while providing real-time feedback on tool actions and automatic file refresh when Claude modifies the workspace.

---

## 📋 Task Checklist

### Task 11.1: Define CLI Output Types
**Status:** ⬜ Not Started  
**Estimate:** 1 hour

**Description:**
Create TypeScript types for all Claude CLI `stream-json` message types.

**Acceptance Criteria:**
- [ ] Type definitions for `system`, `assistant`, `user`, `result` messages
- [ ] Type definitions for `tool_use` and `tool_result` messages
- [ ] Type definitions for `error` and `status` messages
- [ ] Discriminated union `CLIMessage` for type-safe parsing

**Files to Create:**
- `src/main/cli/CLIOutputTypes.ts`

---

### Task 11.2: Implement CLIOutputParser
**Status:** ⬜ Not Started  
**Estimate:** 3 hours

**Description:**
Create a parser that processes raw CLI output and emits typed events.

**Acceptance Criteria:**
- [ ] Parse newline-delimited JSON from CLI stdout
- [ ] Handle partial/chunked JSON lines (buffer incomplete lines)
- [ ] Emit typed events: `onAssistantText`, `onToolUse`, `onToolResult`, `onError`, `onComplete`
- [ ] Extract text content from `assistant.message.content[]` array
- [ ] Handle streaming tokens (partial message accumulation)
- [ ] Gracefully ignore unknown message types

**Files to Create:**
- `src/main/cli/CLIOutputParser.ts`

**Files to Modify:**
- `src/main/cli/CLIManager.ts` — integrate parser

---

### Task 11.3: Route Parsed Output to Renderer
**Status:** ⬜ Not Started  
**Estimate:** 2 hours

**Description:**
Update IPC handlers to emit parsed/typed events instead of raw output.

**Acceptance Criteria:**
- [ ] New IPC channel: `cli:assistant-message` for natural language text
- [ ] New IPC channel: `cli:tool-action` for tool use events
- [ ] New IPC channel: `cli:status` for thinking/complete states
- [ ] Existing `cli:output` channel remains for raw terminal mirroring (optional)
- [ ] Preload API updated with new event handlers

**Files to Modify:**
- `src/main/ipc/handlers.ts`
- `src/preload.ts`
- `src/preload/types.ts`

---

### Task 11.4: Update AgentPanel Message Handling
**Status:** ⬜ Not Started  
**Estimate:** 2 hours

**Description:**
Refactor AgentPanel to consume parsed assistant messages.

**Acceptance Criteria:**
- [ ] Subscribe to `cli:assistant-message` for chat content
- [ ] Remove JSON parsing logic from `useAppStore.ts` (move to parser)
- [ ] Messages render as natural language (no raw JSON visible)
- [ ] Support streaming text accumulation (token by token)

**Files to Modify:**
- `src/renderer/stores/useAppStore.ts`
- `src/renderer/panels/AgentPanel.tsx` (if needed)

---

### Task 11.5: Add Streaming Status Indicators
**Status:** ⬜ Not Started  
**Estimate:** 2 hours

**Description:**
Show visual feedback when Claude is thinking or responding.

**Acceptance Criteria:**
- [ ] Typing indicator (animated dots) when waiting for first token
- [ ] "Thinking..." state when Claude is processing
- [ ] "Using tool: [name]" indicator during tool execution
- [ ] Smooth transition from indicator to actual response
- [ ] Status clears when response complete or error

**Files to Create:**
- `src/renderer/components/AgentTypingIndicator.tsx`

**Files to Modify:**
- `src/renderer/stores/types.ts` — add `agentStatus` field
- `src/renderer/stores/useAppStore.ts` — track status
- `src/renderer/panels/AgentPanel.tsx` — render indicator

---

### Task 11.6: Implement Tool Action Display
**Status:** ⬜ Not Started  
**Estimate:** 2 hours

**Description:**
Show a non-intrusive indicator when Claude uses tools (Read, Edit, Bash, etc.).

**Acceptance Criteria:**
- [ ] Collapsible "Agent Actions" section in AgentPanel or status bar
- [ ] Show tool name and brief description (e.g., "Reading src/app.ts")
- [ ] Show tool result summary (success/failure)
- [ ] Don't overwhelm UI — collapse by default, expand on click
- [ ] Optional: mirror tool commands to terminal (configurable)

**Files to Create:**
- `src/renderer/components/ToolActionFeed.tsx`

**Files to Modify:**
- `src/renderer/panels/AgentPanel.tsx` — integrate feed

---

### Task 11.7: Implement File Refresh on Claude Edits
**Status:** ⬜ Not Started  
**Estimate:** 2 hours

**Description:**
Automatically refresh Monaco Editor and file tree when Claude modifies files.

**Acceptance Criteria:**
- [ ] Detect `tool_result` for Edit/Write tools with file paths
- [ ] Trigger file tree refresh after file creation/deletion
- [ ] Reload open file in Monaco if Claude edited it
- [ ] Show subtle notification: "File updated by agent"
- [ ] Handle conflict: user has unsaved changes when Claude edits same file

**Files to Modify:**
- `src/renderer/stores/useAppStore.ts` — add refresh triggers
- `src/renderer/panels/EditorPanel.tsx` — handle external changes
- `src/main/files/FileService.ts` — may need file watcher events

---

### Task 11.8: Send Active File Context to Claude
**Status:** ⬜ Not Started  
**Estimate:** 2 hours

**Description:**
Automatically include current editor file in Claude context.

**Acceptance Criteria:**
- [ ] Track active file path in agent state
- [ ] On message send, prepend context: "Currently editing: [path]\n```\n[content]\n```"
- [ ] Option to include selection only (if user has highlighted code)
- [ ] User can disable auto-context via toggle
- [ ] Context shown in message as collapsible "Context" block

**Files to Modify:**
- `src/renderer/stores/useAppStore.ts` — `sendMessage` enhancement
- `src/renderer/stores/types.ts` — add `activeFileContext` config
- `src/renderer/components/ChatInput.tsx` — optional context preview

---

### Task 11.9: Filter Terminal Raw JSON (Optional)
**Status:** ⬜ Not Started  
**Estimate:** 1 hour

**Description:**
Clean up terminal output to not show raw JSON spam.

**Acceptance Criteria:**
- [ ] Option A: Only show Bash tool commands/output in terminal
- [ ] Option B: Show formatted tool actions (not raw JSON)
- [ ] Option C: Disable CLI mirroring to terminal entirely
- [ ] User preference stored in settings

**Files to Modify:**
- `src/renderer/panels/TerminalPanel.tsx`
- `src/renderer/stores/useAppStore.ts` — add preference

---

### Task 11.10: Add App Keyboard Shortcuts
**Status:** ⬜ Not Started  
**Estimate:** 1 hour

**Description:**
Global keyboard shortcuts for agent interaction within Sumerian.

**Acceptance Criteria:**
- [ ] `Cmd+Shift+A` — Focus agent input
- [ ] `Cmd+Enter` — Send message (when in agent input)
- [ ] `Escape` — Cancel current agent response
- [ ] `Cmd+Shift+E` — Send selection to agent with "Explain this"
- [ ] Shortcuts work globally within app
- [ ] Shortcut hints shown in UI tooltips

**Files to Create:**
- `src/renderer/hooks/useAppShortcuts.ts`

**Files to Modify:**
- `src/renderer/App.tsx` — register shortcuts

---

### Task 11.11: Copy Message & Code Blocks
**Status:** ⬜ Not Started  
**Estimate:** 2 hours

**Description:**
One-click copying of messages and code blocks with visual feedback.

**Acceptance Criteria:**
- [ ] Copy button on each chat message (appears on hover)
- [ ] Copy button on each code block within messages
- [ ] Visual feedback on copy (checkmark, toast, or button state change)
- [ ] Copies plain text for messages, raw code for code blocks
- [ ] Keyboard shortcut: `Cmd+C` when message is focused

**Files to Modify:**
- `src/renderer/components/ChatMessage.tsx` — add copy buttons
- `src/renderer/components/CodeBlock.tsx` — add copy button (create if needed)

---

### Task 11.12: @ File Reference System
**Status:** ⬜ Not Started  
**Estimate:** 3 hours

**Description:**
Type `@` in chat input to search and reference workspace files.

**Acceptance Criteria:**
- [ ] Typing `@` triggers file search dropdown
- [ ] Fuzzy search across project files (fast, <100ms)
- [ ] Show file icon, name, and relative path in dropdown
- [ ] Select file to insert reference: `@src/app.ts`
- [ ] On send, referenced files are included as context
- [ ] Multiple file references supported in one message
- [ ] Escape or click outside closes dropdown

**Files to Create:**
- `src/renderer/components/FileReferencePicker.tsx`
- `src/renderer/hooks/useFileSearch.ts`

**Files to Modify:**
- `src/renderer/components/ChatInput.tsx` — integrate picker
- `src/renderer/stores/useAppStore.ts` — resolve file references on send

---

### Task 11.13: / Slash Commands
**Status:** ⬜ Not Started  
**Estimate:** 3 hours

**Description:**
Type `/` in chat input to access Claude CLI slash commands.

**Acceptance Criteria:**
- [ ] Typing `/` triggers command palette dropdown
- [ ] Show available commands: `/review`, `/cost`, `/config`, `/memory`, etc.
- [ ] Commands pulled from CLI's `slash_commands` array (from init message)
- [ ] Select command to insert and optionally execute
- [ ] Custom commands from `.sumerian/commands/` (future)
- [ ] Command descriptions shown in dropdown

**Files to Create:**
- `src/renderer/components/SlashCommandPicker.tsx`

**Files to Modify:**
- `src/renderer/components/ChatInput.tsx` — integrate picker
- `src/renderer/stores/types.ts` — store available commands
- `src/renderer/stores/useAppStore.ts` — parse commands from init

---

### Task 11.14: Image Paste & Drag-Drop
**Status:** ⬜ Not Started  
**Estimate:** 3 hours

**Description:**
Support images in chat via paste and drag-drop.

**Acceptance Criteria:**
- [ ] `Cmd+V` pastes clipboard images into chat input
- [ ] Drag-drop images onto chat input area
- [ ] Image preview shown before sending
- [ ] Images saved to `.sumerian/images/` with unique names
- [ ] Image path sent to Claude as context
- [ ] Support formats: PNG, JPG, GIF, WebP
- [ ] Remove image button before sending

**Files to Create:**
- `src/renderer/components/ImageAttachment.tsx`
- `src/renderer/hooks/useImagePaste.ts`

**Files to Modify:**
- `src/renderer/components/ChatInput.tsx` — integrate image handling
- `src/main/files/FileService.ts` — save images to project
- `src/preload.ts` — expose image save API

---

### Task 11.15: Model Selection Dropdown
**Status:** ⬜ Not Started  
**Estimate:** 2 hours

**Description:**
Allow user to switch between Claude models.

**Acceptance Criteria:**
- [ ] Dropdown in AgentPanel header or settings
- [ ] Options: Opus, Sonnet, Default (from CLI)
- [ ] Selection persists across sessions (localStorage)
- [ ] Model passed to CLI via `--model` flag
- [ ] Visual indicator of current model in UI
- [ ] Tooltip explaining model differences

**Files to Create:**
- `src/renderer/components/ModelSelector.tsx`

**Files to Modify:**
- `src/renderer/panels/AgentPanel.tsx` — add selector
- `src/renderer/stores/types.ts` — add `selectedModel` to state
- `src/renderer/stores/useAppStore.ts` — persist selection
- `src/main/cli/CLIManager.ts` — use selected model

---

### Task 11.16: Cost & Token Tracking
**Status:** ⬜ Not Started  
**Estimate:** 2 hours

**Description:**
Display real-time token usage and estimated cost.

**Acceptance Criteria:**
- [ ] Parse `usage` field from CLI result messages
- [ ] Track: input tokens, output tokens, total tokens
- [ ] Display in AgentPanel footer or status bar
- [ ] Show session total and per-message breakdown
- [ ] Estimated cost calculation (based on model pricing)
- [ ] Reset on new session

**Files to Create:**
- `src/renderer/components/TokenUsageDisplay.tsx`

**Files to Modify:**
- `src/renderer/stores/types.ts` — add `tokenUsage` to agent state
- `src/renderer/stores/useAppStore.ts` — accumulate usage
- `src/main/cli/CLIOutputParser.ts` — extract usage from messages
- `src/renderer/panels/AgentPanel.tsx` — display usage

---

### Task 11.17: Session Save & Restore
**Status:** ⬜ Not Started  
**Estimate:** 3 hours

**Description:**
Automatically save conversation history and restore on app restart.

**Acceptance Criteria:**
- [ ] Save messages to `.sumerian/sessions/[session-id].json`
- [ ] Auto-save after each message (debounced)
- [ ] Restore last session on app start (optional, user preference)
- [ ] Session list in sidebar or settings
- [ ] Delete old sessions (manual or auto after 30 days)
- [ ] Export session as markdown

**Files to Create:**
- `src/main/sessions/SessionManager.ts`
- `src/renderer/components/SessionList.tsx`

**Files to Modify:**
- `src/preload.ts` — expose session API
- `src/renderer/stores/useAppStore.ts` — save/restore integration

---

### Task 11.18: Checkpoint Restore UI
**Status:** ⬜ Not Started  
**Estimate:** 2 hours

**Description:**
Expose existing snapshot system with a browsable UI.

**Acceptance Criteria:**
- [ ] List available snapshots in a modal or sidebar section
- [ ] Show snapshot timestamp, file count, trigger (which message)
- [ ] One-click restore to any checkpoint
- [ ] Confirm dialog before restore
- [ ] Visual diff of what will change (optional, stretch)

**Files to Create:**
- `src/renderer/components/CheckpointBrowser.tsx`

**Files to Modify:**
- `src/renderer/panels/AgentPanel.tsx` — add checkpoint button/modal
- `src/main/files/SnapshotManager.ts` — expose list API if needed
- `src/preload.ts` — expose snapshot list

---

### Task 11.19: Thinking Mode Selector
**Status:** ⬜ Not Started  
**Estimate:** 2 hours

**Description:**
Allow user to select thinking intensity for Claude responses.

**Acceptance Criteria:**
- [ ] Toggle or dropdown: Normal, Think, Think Hard, Ultrathink
- [ ] Maps to CLI `--betas interleaved-thinking` or prompt prefixes
- [ ] Visual indicator of current mode
- [ ] Mode persists per session
- [ ] Tooltip explaining token cost implications

**Files to Create:**
- `src/renderer/components/ThinkingModeSelector.tsx`

**Files to Modify:**
- `src/renderer/stores/types.ts` — add `thinkingMode` to state
- `src/renderer/stores/useAppStore.ts` — persist mode
- `src/main/cli/CLIManager.ts` — apply mode to CLI args

---

### Task 11.20: Inline Diff Viewer for Edits
**Status:** ✅ Completed  
**Estimate:** 3 hours

**Description:**
Show file diffs inline when Claude edits files.

**Acceptance Criteria:**
- [ ] Detect Edit/Write tool results with before/after content
- [ ] Render inline diff in chat message (green/red highlighting)
- [ ] Collapsible by default for large diffs
- [ ] "Open in Editor" button to view full diff in Monaco
- [ ] Syntax highlighting in diff view

**Files to Create:**
- `src/renderer/components/InlineDiffViewer.tsx`

**Files to Modify:**
- `src/renderer/components/ChatMessage.tsx` — render diff for tool results
- `src/renderer/components/ToolActionFeed.tsx` — optional diff preview

---

## ✅ Sprint Definition of Done

### Core (Tasks 11.1–11.10)
- [ ] Raw JSON never visible to user in AgentPanel
- [ ] Natural language conversation flows smoothly
- [ ] Typing/thinking indicators show during response
- [ ] Tool actions visible but non-intrusive
- [ ] Files auto-refresh when Claude edits them
- [ ] Active file context sent with messages
- [ ] Keyboard shortcuts for power users

### Enhanced Chat (Tasks 11.11–11.14)
- [ ] One-click copy for messages and code blocks
- [ ] `@` triggers file reference picker
- [ ] `/` triggers slash command picker
- [ ] Images can be pasted/dropped into chat

### Power Features (Tasks 11.15–11.20)
- [ ] Model selection works and persists
- [ ] Token/cost tracking visible in UI
- [ ] Sessions auto-save and can be restored
- [ ] Checkpoints browsable and restorable
- [ ] Thinking mode selector functional
- [ ] Inline diffs shown for file edits

### Quality
- [ ] No TypeScript errors
- [ ] All existing tests pass

---

## 📊 Sprint Summary

| Metric | Target | Actual |
|--------|--------|--------|
| Tasks Completed | 20/20 | —/20 |
| Build Status | ✅ | — |
| Test Coverage | >60% | — |

---

## 📝 Notes

**Key Architecture Decision:**
The CLIOutputParser sits between CLIManager and IPC handlers. It receives raw stdout, parses JSON lines, and emits typed events. This keeps parsing logic centralized and testable.

```
CLIManager.onData(raw) → CLIOutputParser.parse(raw) → IPC events → Renderer
```

**Message Type Reference (from Claude CLI stream-json):**
- `{"type":"system","subtype":"init",...}` — Session init, ignore in chat
- `{"type":"assistant","message":{"content":[{"type":"text","text":"..."}]}}` — Chat response
- `{"type":"tool_use","name":"Edit","input":{...}}` — Tool being called
- `{"type":"tool_result","content":"..."}` — Tool output
- `{"type":"result","result":"..."}` — Final response text

---

*Sprint 11 — Sumerian Vibe-Runner IDE*
