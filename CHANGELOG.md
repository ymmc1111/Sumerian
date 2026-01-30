# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-01-30

### Added
- **Lore Injection**: Support for loading context files from `.sumerian/lore/` to provide the agent with project-specific knowledge.
- **Active File Context**: The agent now automatically stays in sync with your currently focused file in the editor (includes a visual "Agent sees" indicator).
- **Project Selection**: New Welcome Screen with a directory picker and a "Recent Projects" list (persists last 10 projects).
- **Terminal Integration**: Full xterm.js terminal with multi-tab support and Claude CLI output mirroring.
- **Settings Panel**: Configure font size, theme, and Brave Mode defaults through a new glassmorphic modal.
- **Command Palette**: Searchable interface for IDE commands (`Cmd+Shift+P`).
- **Shortcuts Help**: Quick reference for all keyboard shortcuts (`Cmd+/`).
- **State Management**: Robust persistence for UI layout, editor state, and terminal sessions using Zustand.
- **Testing Infrastructure**: Unit tests with Vitest and E2E tests with Playwright.

### Core Features
- Real-time interaction with the Claude CLI.
- Intelligent file system operations with safety guards (Brave Mode).
- Automatic snapshots and undo capabilities for agent-driven edits.
- Modern, minimalist UI with a premium dark-mode aesthetic.
