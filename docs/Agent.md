# 🤖 Agent Context — Sumerian Vibe-Runner IDE

> **CRITICAL: Read this entire file before taking ANY action.**

---

## 📋 PROJECT OVERVIEW

**Sumerian** is a high-autonomy, minimalist desktop IDE that wraps the official Claude CLI to provide an API-free agentic experience powered by the user's Claude Max subscription.

### Tech Stack
- **Framework:** Electron 28.x
- **UI:** React 18.x + TailwindCSS
- **Editor:** Monaco Editor
- **Terminal:** xterm.js
- **CLI Integration:** node-pty
- **State:** Zustand
- **Credentials:** keytar (OS keychain)

### Key Concepts
- **Brave Mode:** Agent autonomy with `--dangerously-skip-permissions` + safety guardrails
- **Nexus Design System:** Minimalist, glass-effect UI with dark theme
- **Lore Files:** Custom context files in `.sumerian/lore/` injected into agent sessions
- **Snapshots:** Automatic file backups before agent modifications

---

## 📚 PROJECT DOCUMENTS (Read Order)

1. **README.md** — Quick overview, setup, and usage
2. **PRD_Sumerian.md** — Product requirements, features, success metrics
3. **SPEC.md** — Technical specifications, architecture, API reference

---

## 🚨 AGENT RULES (NON-NEGOTIABLE)

### Rule 0: UNDERSTAND THE CONTEXT FIRST
Before starting ANY work, you MUST review the project documentation in the order specified in the **Project Documents** section. Only read documentation relevant to your current task to maintain context window efficiency.

### Rule 1: ONE TASK AT A TIME
- Complete exactly **ONE** task from the current checklist.
- Wait for user approval before proceeding to the next task.
- Never batch multiple tasks in a single response.

### Rule 2: NO OUT-OF-SCOPE CHANGES
- Only modify files explicitly listed or necessary for the current task.
- Do **NOT** "improve" or "refactor" unrelated code.
- If you find a bug elsewhere, **REPORT** it in the session summary—do not fix it unless instructed.

### Rule 3: PROPOSE BEFORE EXECUTING
- Show the exact code or changes you plan to write.
- Wait for user confirmation: "proceed" or "approved."
- Never auto-apply changes without a prior proposal.

### Rule 4: VERIFY BEFORE MOVING ON
- After each task, ask: "Should I verify this works?"
- Provide specific test commands (build, unit tests, linting).
- Mark a task complete **ONLY** after the user confirms.

### Rule 5: PRESERVE EXISTING FUNCTIONALITY
- Do **NOT** delete existing code or modify function signatures without explicit approval.
- Maintain consistency with the existing architectural patterns and naming conventions.

### Rule 6: AVOID CIRCULAR DEBUGGING
- If a fix fails, you MUST document:
  1. **Approaches Tried**: History of what was attempted.
  2. **New Plan**: How the next attempt avoids the previous failure.
- If you repeat a strategy that failed twice, **STOP** and ask for guidance.

---

## 🛑 EMERGENCY STOP
If the agent attempts to:
- Modify files outside of scope.
- Skip approval steps.
- Ignore the "Definition of Done."
- Make "improvements" not requested.

**USER ACTION**: Reply with **"STOP"** and the agent must halt all operations immediately.

---

## ✅ DEFINITION OF DONE (DoD)

### Completion Levels
| Level | Name | Meaning | Status |
|-------|------|---------|--------|
| **L0** | Spec'd | Requirements/Logic documented | ❌ No |
| **L1** | Implemented | Code written, syntax is correct | ❌ No |
| **L2** | Tested | Unit tests pass | ❌ No |
| **L3** | Integrated | Works with existing components | ❌ No |
| **L4** | Verified | User validated and approved | ✅ Yes |

### DoD Checklist
- [ ] Code compiles/builds without errors.
- [ ] No hardcoded secrets, IDs, or mock data.
- [ ] Error handling is implemented for edge cases.
- [ ] Code follows project-specific style guides.
- [ ] Documentation/Comments updated where necessary.

---

## 🚫 ANTI-WORKAROUND RULES
A workaround is any code that patches symptoms or uses "temporary" mock data. Workarounds require explicit approval using this template:

```markdown
### Workaround Proposal
- **Problem**: [Description]
- **Root Cause**: [Why it's happening]
- **Workaround**: [The quick fix]
- **Tech Debt**: [Future work created]
- **User Approval**: [ ]
```

---

## 🏗️ ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────┐
│                    MAIN PROCESS                         │
│  CLIManager │ FileService │ CredentialManager           │
└─────────────────────┬───────────────────────────────────┘
                      │ IPC Bridge
┌─────────────────────┴───────────────────────────────────┐
│                  RENDERER PROCESS                       │
│  Sidebar │ MonacoEditor │ AgentPanel │ TerminalPanel    │
└─────────────────────────────────────────────────────────┘
```

### Key Modules
| Module | Location | Responsibility |
|--------|----------|----------------|
| `CLIManager` | `src/main/cli/` | Spawn/manage Claude CLI via node-pty |
| `FileService` | `src/main/files/` | Read/write/watch project files |
| `CredentialManager` | `src/main/credentials/` | OAuth flow, keychain storage |
| `AgentPanel` | `src/renderer/panels/` | Chat UI, streaming responses |
| `EditorPanel` | `src/renderer/panels/` | Monaco Editor wrapper |

---

## 📁 FILE STRUCTURE

```
sumerian/
├── src/
│   ├── main/                 # Electron main process
│   │   ├── cli/              # CLIManager, BraveModeGuard
│   │   ├── files/            # FileService, SnapshotManager
│   │   ├── credentials/      # CredentialManager, OAuthBridge
│   │   └── ipc/              # IPC handlers
│   ├── renderer/             # React UI
│   │   ├── components/       # Reusable UI components
│   │   ├── panels/           # Editor, Agent, Terminal, Sidebar
│   │   ├── stores/           # Zustand stores
│   │   └── themes/           # Nexus theme definitions
│   └── preload/              # Context bridge (SumerianAPI)
├── .sumerian/                # Per-project config (runtime)
├── docs/                     # Documentation
└── tests/                    # Vitest + Playwright tests
```

---

## 🎨 DESIGN CONSTRAINTS (Nexus System)

- **Colors:** Dark monochromatic (`#0a0a0a` base, `#3b82f6` accent)
- **Glass Effect:** `backdrop-filter: blur(20px)` on sidebar
- **Typography:** JetBrains Mono / Fira Code
- **Spacing:** 4px base unit, 8px/16px/24px scale
- **Borders:** 1px `#2a2a2a`, 8px radius
- **No gradients, no shadows > `lg`, no decorative elements**

---

## 🔐 SECURITY BOUNDARIES

| Action | Allowed | Requires Approval |
|--------|---------|-------------------|
| Read files in project | ✅ | — |
| Write files in project | ✅ | — |
| Read files outside project | ❌ | Modal confirmation |
| Execute terminal commands | ✅ (Brave Mode) | Blocklist check |
| Access `~/.ssh`, `~/.aws` | ❌ | Never |
| Network requests | ✅ | First use per domain |

---

## 📝 CURRENT TASK CHECKLIST

> Update this section with the active sprint/task list.

### Sprint: MVP v1.0
- [ ] **Task 1:** Initialize Electron Forge project
- [ ] **Task 2:** Set up Monaco Editor in renderer
- [ ] **Task 3:** Implement CLIManager with node-pty
- [ ] **Task 4:** Create basic file tree component
- [ ] **Task 5:** Build AgentPanel chat UI
- [ ] **Task 6:** Implement Brave Mode toggle + blocklist
- [ ] **Task 7:** Add OAuth re-authentication flow
- [ ] **Task 8:** Apply Nexus dark theme

---

## 📊 SESSION SUMMARY TEMPLATE

After each session, update this section:

```markdown
### Session: [DATE]
**Completed:**
- [Task completed]

**In Progress:**
- [Task started but not finished]

**Blocked:**
- [Issue preventing progress]

**Bugs Found (Out of Scope):**
- [Bug description] — File: [path]

**Next Steps:**
- [What to do next session]
```

---

*Last Updated: January 2026*