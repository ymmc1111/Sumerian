# Sumerian Sprint Documentation

## Overview

This folder contains sprint planning documents for the Sumerian Vibe-Runner IDE development.

## Sprint Schedule

| Sprint | Name | Duration | Goal |
|--------|------|----------|------|
| 01 | Foundation | 1 week | Electron project skeleton with basic UI shell |
| 02 | Editor | 1 week | Monaco Editor with file system operations |
| 03 | CLI | 1 week | Claude CLI integration with node-pty |
| 04 | Brave Mode | 1 week | Safety guardrails and file snapshots |
| 05 | Terminal | 1 week | xterm.js terminal with CLI mirroring |
| 06 | Polish | 1 week | Final polish, testing, MVP release |
| **07** | **Theme Foundation** | 1 week | CSS variable system, ThemeProvider, Settings UI |
| **08** | **Layout Engine** | 1 week | Drag-drop panels, layout toggles, snap regions |
| **09** | **GRID Theme** | 1 week | Tron 80s aesthetic with animations and effects |
| **10** | **LOVE Theme** | 1 week | Ive minimalist aesthetic with light/dark modes |
| **11** | **Agent Experience** | 2 weeks | Full chat interface: parsing, @ mentions, /commands, images, sessions |
| **12** | **Self-Healing** | 1 week | Autonomous error recovery loops and advanced context management |
| **13** | **Loop Mode (Ralph Wiggum)** | 1 week | Autonomous iteration with promise detection |
| **14** | **CLI Enhancements** | 1 week | Missing flags, slash commands, thinking levels |
| **15** | **Multi-Agent Core** | 2 weeks | Agent pool, WorkforceState, spawning |
| **16** | **Workforce UI** | 1 week | Sidebar tab, agent cards, terminal grid |
| **17** | **Orchestration UX** | 1 week | Delegation cards, file locking, inline diff |
| **18** | **Advanced Features** | 1 week | Autopilot, checkpoints, task queue |
| **19** | **Integration & Testing** | 1-2 weeks | Backend integration, resource monitoring, security, testing |

## Sprint Documents

### MVP (Complete)
- [Sprint 01: Foundation](./sprint-01-foundation.md)
- [Sprint 02: Monaco Editor](./sprint-02-editor.md)
- [Sprint 03: Claude CLI](./sprint-03-cli.md)
- [Sprint 04: Brave Mode](./sprint-04-brave-mode.md)
- [Sprint 05: Terminal](./sprint-05-terminal.md)
- [Sprint 06: Polish & Release](./sprint-06-polish.md)

### v2.0 — Theming System
- [Sprint 07: Theme Foundation](./sprint-07-theming.md)
- [Sprint 08: Layout Engine](./sprint-08-layout.md)
- [Sprint 09: GRID Theme](./sprint-09-grid-theme.md)
- [Sprint 10: LOVE Theme](./sprint-10-love-theme.md)

### v3.0 — Agent Experience
- [Sprint 11: Agent Experience & VSCode Parity](./sprint-11-agent-experience.md)
- [Sprint 12: Self-Healing & Advanced Context](./sprint-12-self-healing.md)

### v4.0 — Agent Workflow System
- [Sprint 13: Loop Mode (Ralph Wiggum)](./sprint-13-loop-mode.md)
- [Sprint 14: CLI Enhancements](./sprint-14-cli-enhancements.md)
- [Sprint 15: Multi-Agent Core](./sprint-15-multi-agent-core.md)
- [Sprint 16: Workforce UI](./sprint-16-workforce-ui.md)
- [Sprint 17: Orchestration UX](./sprint-17-orchestration-ux.md)
- [Sprint 18: Advanced Features](./sprint-18-advanced-features.md)
- [Sprint 19: Integration & Testing](./sprint-19-integration-testing.md)

## How to Use

1. Start with Sprint 01 and complete all tasks before moving to the next sprint
2. Each sprint has prerequisites that must be met
3. Follow the task checklist in order
4. Mark tasks complete only after user verification
5. Update the sprint summary after completion

## Task Status Legend

| Symbol | Meaning |
|--------|---------|
| ⬜ | Not Started |
| 🔄 | In Progress |
| ✅ | Complete |
| ❌ | Blocked |

## Running a Sprint

Use the `/sprints` workflow command to get guidance on sprint execution.

---

*Total Estimated Duration: 20 weeks (6 weeks MVP + 4 weeks Theming + 2 weeks Agent Experience + 8 weeks Agent Workflow System)*
