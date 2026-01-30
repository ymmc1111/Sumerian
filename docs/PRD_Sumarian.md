# PRD: Sumerian Vibe-Runner IDE
**Version:** 1.0.0  
**Vision:** A high-autonomy, minimalist desktop IDE that wraps the official Claude CLI to provide an "API-free" agentic experience powered by the user's Claude Max subscription.

---

## 1. Product Objective
To provide a premium, agent-driven development environment—comparable to Windsurf or Cursor—that utilizes the user's existing **Claude Max** consumer subscription. By wrapping the official Anthropic CLI, the app avoids per-token API billing while maintaining full agentic capabilities.

## 2. Core Layout & Aesthetic (Nexus Design System)
Following the minimalist principles of **Project Nexus**:
* **The "Glass" Sidebar:** A semi-transparent, vibrant (blurred) file explorer and activity bar.
* **Monochromatic Editor:** A centered, distraction-free Monaco Editor instance with high-contrast syntax highlighting.
* **Agent Command Center:** A right-aligned chat panel for interacting with the Claude CLI.
* **Shadow Terminal:** A bottom-docked terminal using `xterm.js` that mirrors the Claude CLI’s background operations.

## 3. Functional Requirements

### FR-1: Headless CLI Orchestration
* The system must spawn a persistent background process for the `claude` CLI via `node-pty`.
* The system must detect the user's local Max plan session (`~/.claude/.credentials.json`).
* **OAuth Bridge:** If the session expires, the app must trigger the official `/login` flow through the system browser.

### FR-2: Agent Autonomy (Brave Mode)
* **Tool Execution:** The agent must be able to create, read, and edit files across the local directory.
* **Auto-Confirm:** A UI toggle for "Brave Mode" (`--dangerously-skip-permissions`) to allow the agent to run terminal commands and save files without individual user approvals.
* **Self-Healing Loops:** If a terminal command (e.g., `npm test`) fails, the output is piped back to the agent for immediate troubleshooting.

### FR-3: Project Context & Design Lore
* **Lore Injection:** Every session automatically pre-loads the `Project_Nexus_Design.md` as a system instruction to ensure all generated code follows the Jony Ive minimalist aesthetic.
* **Active File Mirroring:** The app maintains a `current_file.context` that updates as the user clicks through the file tree, keeping the agent synced with the user’s focus.

### FR-4: GitHub & Tool Integration
* **Source Control:** Integrated `simple-git` dashboard for staging, committing, and pushing changes.
* **Extension Support:** Ability to pipe in MCP (Model Context Protocol) tools for Google Search or Sequential Thinking.

## 4. Technical Stack
* **Framework:** Electron.js (Desktop Shell)
* **Editor Engine:** Monaco Editor (VS Code core)
* **Communication:** `node-pty` for stateful terminal piping
* **Styling:** Tailwind CSS with high-contrast dark mode configuration

## 5. Success Metrics
* **Cost:** Total monthly API spend = $0.00.
* **Performance:** Agent action-to-execution latency < 300ms.
* **Compliance:** 100% adherence to Project Nexus design constraints in generated UI code.
* **Reliability:** CLI connection uptime > 99.5%, crash rate < 0.1%.
* **User Experience:** Time to first productive action < 60 seconds.
* **Agent Quality:** Task completion rate > 85%, user override frequency < 15%.

## 6. Non-Functional Requirements

### NFR-1: Security
* **Credential Storage:** All credentials stored in OS keychain (macOS Keychain, Windows Credential Manager) rather than plaintext files.
* **Sandboxing:** Agent file operations restricted to project directory by default; explicit user approval required for system-level access.
* **Audit Trail:** All agent actions logged to `~/.sumerian/audit.log` with timestamps and reversibility metadata.

### NFR-2: Performance
* **Memory:** Electron process capped at 512MB RAM under normal operation.
* **Startup:** Cold start to interactive editor < 3 seconds.
* **File Operations:** File tree indexing for projects up to 50,000 files.

### NFR-3: Reliability
* **Crash Recovery:** Auto-save editor state every 30 seconds; restore on restart.
* **CLI Watchdog:** Automatic CLI process restart on hang detection (>30s unresponsive).
* **Offline Mode:** Graceful degradation with cached context; queue commands for when connection resumes.

### NFR-4: Accessibility
* Full keyboard navigation (no mouse required).
* Screen reader compatibility (ARIA labels on all interactive elements).
* Configurable font size (12px–24px) and high-contrast theme option.

## 7. Brave Mode Guardrails

### 7.1 Command Safety
* **Blocklist:** Hardcoded prevention of destructive commands:
  - `rm -rf /`, `rm -rf ~`, `sudo rm`, `mkfs`, `dd if=`
  - Any command containing `> /dev/` or system paths
* **Allowlist Mode:** Optional user-defined list of pre-approved commands.
* **Dry-Run Preview:** For file deletions and system commands, show preview before execution.

### 7.2 Reversibility
* **File Snapshots:** Before any file modification, create `.sumerian/snapshots/{timestamp}/` backup.
* **Undo Stack:** Last 50 agent actions reversible via `Cmd+Z` or UI button.
* **Session Rollback:** Restore entire project state to any previous checkpoint.

### 7.3 Scope Limits
* Agent cannot access files outside the active project directory without explicit modal confirmation.
* Network requests by agent-generated code require user approval on first use per domain.

## 8. Error Handling & Edge Cases

| Scenario | Behavior |
|----------|----------|
| Claude CLI not installed | Show installation wizard with one-click install option |
| Credentials file missing/corrupted | Trigger OAuth flow; offer to reset credentials |
| CLI process crashes | Auto-restart with last 5 messages of context preserved |
| CLI hangs (>30s) | Kill process, notify user, offer retry |
| Rate limiting detected | Queue requests, show cooldown timer in UI |
| Network offline | Switch to offline mode, disable agent, allow local editing |

## 9. Multi-Project & Workspace Support

* **Project Switcher:** `Cmd+O` opens recent projects list (last 10).
* **Workspace Concept:** Each project maintains its own:
  - `.sumerian/config.json` — project-specific settings
  - `.sumerian/lore/` — custom context files for agent
  - `.sumerian/snapshots/` — file change history
* **Isolated Sessions:** Each project runs its own CLI instance; switching projects preserves conversation history.

## 10. Technical Architecture Details

### 10.1 IPC Architecture
* **Main Process:** CLI orchestration, file system access, credential management.
* **Renderer Process:** Monaco Editor, UI components, user input handling.
* **Communication:** Electron IPC with typed message contracts; no direct Node access from renderer.

### 10.2 State Management
* **Zustand** for UI state (panels, modals, preferences).
* **File-based persistence** for session history and project metadata.

### 10.3 Update Mechanism
* Electron `autoUpdater` with Squirrel (macOS/Windows).
* Silent background downloads; user-prompted install on next launch.

## 11. Competitive Differentiation

| Feature | Cursor | Windsurf | **Sumerian** |
|---------|--------|----------|---------------|
| API Cost | Pay-per-token | Subscription | **$0 (uses Max)** |
| Privacy | Cloud-processed | Cloud-processed | **Fully local** |
| Brave Mode | Limited | Approval-based | **Full autonomy + guardrails** |
| Design System | Generic | Generic | **Nexus minimalism** |
| Offline Support | None | None | **Full editing, queued agent** |

**Unique Value:** Sumerian is the only IDE that combines zero marginal cost, full local privacy, and maximum agent autonomy with safety guardrails.

## 12. MVP Scope (v1.0)

### In Scope
- [x] Electron shell with Monaco Editor
- [x] Claude CLI integration via node-pty
- [x] Basic file tree (open, save, create)
- [x] Agent chat panel with streaming responses
- [x] Brave Mode toggle with basic blocklist
- [x] OAuth re-authentication flow
- [x] Nexus dark theme

### Deferred to v1.1+
- [ ] Git integration (simple-git dashboard)
- [ ] MCP tool extensions
- [ ] Multi-project workspaces
- [ ] Plugin/extension system
- [ ] Collaborative editing
- [ ] Custom themes

## 13. Risk & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Anthropic changes CLI/auth flow | Medium | High | Abstract CLI layer; monitor Anthropic changelog |
| Brave Mode causes data loss | Medium | Critical | Mandatory snapshots; blocklist; dry-run previews |
| Electron performance issues | Low | Medium | Lazy-load panels; virtualized file tree |
| Claude Max ToS violation | Low | Critical | Legal review; ensure CLI wrapper is permitted use |

---

## Implementation Note
To start this app on your machine today, initialize a basic Electron Forge project and install `node-pty`.

---
*Document generated for Sumerian / Vibe-Runner Development.*