# Sprint 20: Alternative Options Planning

This plan details three alternative sprint directions for Sprint 20, each focusing on a different priority area beyond Git integration.

---

## Context

Sprint 19 (Integration & Testing) is complete. All backend integration tasks finished:
- ✅ Resource monitoring with CPU/memory tracking
- ✅ Security boundaries with audit logging
- ✅ Agent completion reports
- ✅ Unit and E2E tests created
- ✅ Complete command reference documentation

For Sprint 20, here are three alternative directions:

- **Option A:** MCP Tool Extensions
- **Option B:** Multi-Project Workspaces  
- **Option C:** Performance & Polish

---

## Option A: MCP Tool Extensions

**Focus:** Enable external tool integration via Model Context Protocol  
**Duration:** 1-2 weeks  
**Complexity:** High

### Why This Option?
- Extends agent capabilities beyond file/terminal operations
- Enables Google Search, Sequential Thinking, and custom tools
- Differentiates Sumerian from competitors
- PRD explicitly lists MCP as v1.1+ feature

### Tasks

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| A.1 | **MCP Config Support** - Parse `--mcp-config` flag, load server definitions from JSON | 4h | High |
| A.2 | **MCP Server Manager** - Start/stop MCP servers, health monitoring, auto-restart | 6h | High |
| A.3 | **MCP Settings UI** - Server list in Settings, enable/disable toggles, status indicators | 4h | Medium |
| A.4 | **Tool Discovery** - Query available tools from connected servers, display in UI | 3h | Medium |
| A.5 | **Built-in Servers** - Bundle Google Search + Sequential Thinking server configs | 3h | Low |
| A.6 | **Testing & Docs** - Unit tests for MCP manager, user documentation | 4h | Medium |

**Total Estimate:** 24 hours

### Files to Create
- `src/main/mcp/MCPManager.ts` - Server lifecycle management
- `src/main/mcp/MCPConfig.ts` - Config parsing and validation
- `src/renderer/components/MCPSettings.tsx` - Settings UI panel

### Files to Modify
- `src/main/cli/CLIManager.ts` - Pass MCP config to Claude CLI
- `src/renderer/components/SettingsModal.tsx` - Add MCP tab
- `src/main/ipc/handlers.ts` - MCP IPC handlers

### Dependencies
- Claude CLI must support `--mcp-config` flag
- MCP server packages (user-provided or bundled)

### Risks
- MCP protocol may change
- Server stability varies by implementation
- Increases complexity of agent debugging

---

## Option B: Multi-Project Workspaces

**Focus:** Support multiple projects with isolated sessions  
**Duration:** 1-2 weeks  
**Complexity:** Medium

### Why This Option?
- PRD Section 9 explicitly defines this feature
- Enables professional workflows with multiple codebases
- Each project gets isolated CLI, config, and history
- `Cmd+O` project switcher is a standard IDE feature

### Tasks

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| B.1 | **Project Registry** - Track recent projects in `~/.sumerian/projects.json` | 3h | High |
| B.2 | **Project Switcher Modal** - `Cmd+O` opens recent projects list (last 10) | 4h | High |
| B.3 | **Isolated CLI Sessions** - Each project maintains its own CLIManager instance | 5h | High |
| B.4 | **Session Preservation** - Save/restore conversation history per project | 4h | Medium |
| B.5 | **Project Config** - Per-project `.sumerian/config.json` for settings overrides | 3h | Medium |
| B.6 | **Quick Switch UI** - Project name in title bar, dropdown for fast switching | 3h | Low (SKIPPED) |
| B.7 | **Testing & Docs** - E2E tests for project switching, documentation | 3h | Medium |

**Total Estimate:** 25 hours

### Files to Create
- `src/main/projects/ProjectManager.ts` - Project registry and switching
- `src/main/projects/ProjectConfig.ts` - Per-project config handling
- `src/renderer/components/ProjectSwitcher.tsx` - Modal UI

### Files to Modify
- `src/main.ts` - Initialize ProjectManager, handle project switching
- `src/main/cli/CLIManager.ts` - Support multiple instances
- `src/renderer/App.tsx` - Add `Cmd+O` keyboard shortcut
- `src/main/ipc/handlers.ts` - Project IPC handlers

### Key Behaviors
- Opening a project: Load its config, start fresh CLI, restore history
- Switching projects: Preserve current state, load new project
- Recent list: Max 10 projects, sorted by last opened

### Risks
- Memory usage increases with multiple CLI instances
- State sync complexity between projects
- File watcher conflicts

---

## Option C: Performance & Polish

**Focus:** Optimize memory, startup time, and reliability  
**Duration:** 1-2 weeks  
**Complexity:** Medium

### Why This Option?
- PRD NFR-2 specifies <512MB RAM, <3s startup
- Improves daily user experience
- Crash recovery is critical for Brave Mode trust
- Offline mode enables use without internet

### Tasks

| Task | Description | Estimate | Priority |
|------|-------------|----------|----------|
| C.1 | **Memory Profiling** - Identify leaks, optimize large data structures | 4h | High |
| C.2 | **Lazy Panel Loading** - Load Monaco/Terminal only when visible | 4h | High |
| C.3 | **Startup Optimization** - Defer non-critical initialization, measure cold start | 4h | High |
| C.4 | **Crash Recovery** - Auto-save state every 30s, restore on restart | 5h | High |
| C.5 | **CLI Watchdog** - Detect hung CLI (>30s), auto-restart with context | 4h | Medium |
| C.6 | **Offline Mode** - Queue commands when offline, graceful degradation | 5h | Medium |
| C.7 | **Virtualized File Tree** - Handle 50k+ files without lag | 4h | Low |
| C.8 | **Performance Metrics** - Add startup timing, memory usage to About panel | 2h | Low |

**Total Estimate:** 32 hours

### Files to Create
- `src/main/recovery/StateRecovery.ts` - Crash recovery system
- `src/main/cli/CLIWatchdog.ts` - Hung process detection
- `src/main/offline/OfflineQueue.ts` - Command queuing

### Files to Modify
- `src/main.ts` - Lazy loading, startup optimization
- `src/main/cli/CLIManager.ts` - Watchdog integration
- `src/renderer/App.tsx` - Deferred panel mounting
- `src/renderer/components/FileTree.tsx` - Virtualization

### Success Metrics
- Memory: <512MB under normal operation
- Startup: <3s to interactive editor
- Crash recovery: 100% state restoration
- Offline: Queue up to 50 commands

### Risks
- Lazy loading may cause visible loading states
- Crash recovery complexity with multi-agent
- Offline mode edge cases

---

## Recommendation Matrix

| Criteria | Option A (MCP) | Option B (Workspaces) | Option C (Performance) |
|----------|----------------|----------------------|------------------------|
| User Impact | High (new capabilities) | High (workflow improvement) | Medium (quality of life) |
| Complexity | High | Medium | Medium |
| Risk | Medium | Low | Low |
| PRD Alignment | v1.1+ feature | v1.1+ feature | NFR requirements |
| Dependencies | Claude CLI MCP support | None | None |

### Recommendation

**Option C (Performance & Polish)** is the safest choice if you want stability before adding features. It addresses PRD non-functional requirements and builds user trust.

**Option B (Multi-Project Workspaces)** is ideal if you work across multiple codebases daily. It's well-defined in the PRD and has clear scope.

**Option A (MCP Tool Extensions)** is the most ambitious but depends on Claude CLI's MCP support maturity.

---

## Next Steps

1. **Choose an option** (A, B, or C)
2. Create detailed sprint document in `docs/sprints/sprint-20-*.md`
3. Execute tasks one at a time per Agent Rules

Which option would you like to pursue for Sprint 20?
