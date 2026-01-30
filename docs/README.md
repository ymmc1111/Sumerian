# Sumerian Vibe-Runner IDE

<p align="center">
  <strong>A high-autonomy, minimalist desktop IDE powered by your Claude Max subscription</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue" alt="Version">
  <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey" alt="Platform">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License">
</p>

---

## Overview

Sumerian is a premium, agent-driven development environment that wraps the official Claude CLI to provide an **API-free** agentic coding experience. By leveraging your existing Claude Max subscription, you get the power of AI-assisted development with **zero additional API costs**.

### Why Sumerian?

| Feature | Cursor | Windsurf | **Sumerian** |
|---------|--------|----------|--------------|
| API Cost | Pay-per-token | Subscription | **$0 (uses Max)** |
| Privacy | Cloud-processed | Cloud-processed | **Fully local** |
| Agent Autonomy | Limited | Approval-based | **Full autonomy + guardrails** |
| Offline Support | None | None | **Full editing, queued agent** |

---

## Features

### 🎨 Nexus Design System
- **Glass Sidebar** — Semi-transparent, vibrant file explorer with blur effects
- **Monochromatic Editor** — Distraction-free Monaco Editor with high-contrast syntax
- **Agent Command Center** — Right-aligned chat panel for Claude interaction
- **Shadow Terminal** — Bottom-docked terminal mirroring CLI operations

### 🤖 Brave Mode
Full agent autonomy with safety guardrails:
- Auto-execute file operations and terminal commands
- Hardcoded blocklist prevents destructive commands (`rm -rf /`, `sudo rm`, etc.)
- Automatic file snapshots before every modification
- One-click rollback to any previous state

### 🔒 Security First
- Credentials stored in OS keychain (not plaintext)
- Agent sandboxed to project directory by default
- Full audit trail of all agent actions
- Explicit approval required for system-level access

### ⚡ Performance
- Cold start < 3 seconds
- Agent response latency < 300ms
- Handles projects with 50,000+ files
- Memory capped at 512MB

---

## Requirements

### System
- **macOS** 12.0+ (Intel or Apple Silicon)
- **Windows** 10 21H2+
- **Linux** Ubuntu 20.04+ / Fedora 36+

### Software
- [Node.js](https://nodejs.org/) 20.x LTS
- [Claude CLI](https://docs.anthropic.com/claude/docs/claude-cli) (latest)
- [Git](https://git-scm.com/) 2.30+
- Active **Claude Max** subscription

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/your-org/sumerian.git
cd sumerian

# Install dependencies
npm install

# Start in development mode
npm run dev
```

### First Run
1. Launch Sumerian
2. If not authenticated, you'll be redirected to Claude's OAuth flow
3. Open a project folder (`Cmd+O` / `Ctrl+O`)
4. Start chatting with the agent in the right panel

---

## Project Structure

```
sumerian/
├── src/
│   ├── main/              # Electron main process
│   │   ├── cli/           # Claude CLI orchestration
│   │   ├── files/         # File system operations
│   │   └── credentials/   # OAuth & keychain
│   ├── renderer/          # React UI
│   │   ├── components/    # UI components
│   │   ├── panels/        # Editor, Agent, Terminal panels
│   │   └── stores/        # Zustand state
│   └── preload/           # IPC bridge
├── .sumerian/             # Per-project config (created on use)
└── docs/
    ├── PRD_Sumerian.md    # Product Requirements
    └── SPEC.md            # Technical Specifications
```

---

## Configuration

### Global Settings
Located at `~/.sumerian/config.json`:

```json
{
  "theme": "dark",
  "fontSize": 14,
  "braveMode": {
    "defaultEnabled": false,
    "globalBlocklist": []
  },
  "autoUpdate": true
}
```

### Project Settings
Located at `<project>/.sumerian/config.json`:

```json
{
  "loreFiles": ["./docs/design-system.md"],
  "braveMode": {
    "enabled": true,
    "allowlist": ["npm test", "npm run build"]
  },
  "ignorePatterns": ["node_modules", "dist"]
}
```

### Lore Files
Add custom context for the agent in `.sumerian/lore/`:
```
.sumerian/lore/
├── design-system.md      # UI/UX guidelines
├── api-conventions.md    # Code style rules
└── project-context.md    # Domain knowledge
```

---

## Build

```bash
# Development with hot reload
npm run dev

# Production builds
npm run build:mac        # macOS (universal binary)
npm run build:win        # Windows x64
npm run build:linux      # Linux (AppImage, deb, rpm)

# All platforms
npm run build:all
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [PRD_Sumerian.md](./PRD_Sumerian.md) | Product requirements, features, and roadmap |
| [SPEC.md](./SPEC.md) | Technical specifications and architecture |

---

## Keyboard Shortcuts

| Action | macOS | Windows/Linux |
|--------|-------|---------------|
| Open Project | `Cmd+O` | `Ctrl+O` |
| Toggle Brave Mode | `Cmd+Shift+B` | `Ctrl+Shift+B` |
| Focus Agent Panel | `Cmd+J` | `Ctrl+J` |
| Toggle Terminal | `Cmd+\`` | `Ctrl+\`` |
| Undo Agent Action | `Cmd+Z` | `Ctrl+Z` |
| Command Palette | `Cmd+Shift+P` | `Ctrl+Shift+P` |

---

## Roadmap

### v1.0 (MVP)
- [x] Electron shell with Monaco Editor
- [x] Claude CLI integration via node-pty
- [x] Basic file tree
- [x] Agent chat panel with streaming
- [x] Brave Mode with blocklist
- [x] OAuth re-authentication
- [x] Nexus dark theme

### v1.1+
- [ ] Git integration (staging, commits, push)
- [ ] MCP tool extensions
- [ ] Multi-project workspaces
- [ ] Plugin/extension system
- [ ] Custom themes

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT License — see [LICENSE](./LICENSE) for details.

---

<p align="center">
  <strong>Sumerian</strong> — Zero-cost AI coding with maximum autonomy
</p>
