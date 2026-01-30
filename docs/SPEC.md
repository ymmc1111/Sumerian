# Technical Requirements: Sumerian Vibe-Runner IDE
**Version:** 1.0.0  
**Last Updated:** January 2026  
**Related Document:** PRD_Sumerian.md

---

## 1. System Requirements

### 1.1 Supported Platforms
| Platform | Minimum Version | Architecture |
|----------|-----------------|--------------|
| macOS | 12.0 (Monterey) | x64, arm64 (Apple Silicon) |
| Windows | 10 (21H2) | x64 |
| Linux | Ubuntu 20.04 / Fedora 36 | x64 |

### 1.2 Hardware Requirements
| Component | Minimum | Recommended |
|-----------|---------|-------------|
| RAM | 4 GB | 8 GB |
| Storage | 500 MB (app) + project size | 1 GB + project size |
| Display | 1280×720 | 1920×1080 |
| Network | Broadband for Claude CLI | Broadband for Claude CLI |

### 1.3 Software Dependencies
| Dependency | Version | Purpose |
|------------|---------|---------|
| Node.js | 20.x LTS | Runtime for Electron |
| Claude CLI | Latest | Agent backend |
| Git | 2.30+ | Version control integration |

---

## 2. Technology Stack

### 2.1 Core Framework
```
┌─────────────────────────────────────────────────────────┐
│                    Electron 28.x                        │
├─────────────────────────────────────────────────────────┤
│  Main Process          │  Renderer Process             │
│  ─────────────────     │  ────────────────────────     │
│  • CLI Orchestration   │  • React 18.x                 │
│  • File System API     │  • Monaco Editor              │
│  • Credential Manager  │  • xterm.js                   │
│  • IPC Handlers        │  • Zustand (State)            │
│  • node-pty            │  • TailwindCSS                │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Package Dependencies

#### Production Dependencies
```json
{
  "electron": "^28.0.0",
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "monaco-editor": "^0.45.0",
  "xterm": "^5.3.0",
  "xterm-addon-fit": "^0.8.0",
  "xterm-addon-web-links": "^0.9.0",
  "node-pty": "^1.0.0",
  "zustand": "^4.4.0",
  "simple-git": "^3.20.0",
  "electron-store": "^8.1.0",
  "keytar": "^7.9.0"
}
```

#### Development Dependencies
```json
{
  "@electron-forge/cli": "^7.0.0",
  "@electron-forge/maker-squirrel": "^7.0.0",
  "@electron-forge/maker-dmg": "^7.0.0",
  "@electron-forge/maker-deb": "^7.0.0",
  "typescript": "^5.3.0",
  "vite": "^5.0.0",
  "@vitejs/plugin-react": "^4.2.0",
  "tailwindcss": "^3.4.0",
  "eslint": "^8.55.0",
  "vitest": "^1.0.0"
}
```

---

## 3. Architecture Specifications

### 3.1 Process Model

```
┌──────────────────────────────────────────────────────────────┐
│                        MAIN PROCESS                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │
│  │ CLIManager  │  │ FileService │  │ CredentialManager   │   │
│  │             │  │             │  │                     │   │
│  │ • spawn()   │  │ • read()    │  │ • getToken()        │   │
│  │ • write()   │  │ • write()   │  │ • refreshOAuth()    │   │
│  │ • kill()    │  │ • watch()   │  │ • validateSession() │   │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘   │
│         │                │                    │              │
│         └────────────────┼────────────────────┘              │
│                          │                                   │
│                    IPC Bridge                                │
│                          │                                   │
└──────────────────────────┼───────────────────────────────────┘
                           │
┌──────────────────────────┼───────────────────────────────────┐
│                    RENDERER PROCESS                          │
│                          │                                   │
│  ┌───────────────────────┴───────────────────────────────┐   │
│  │                    App Shell                          │   │
│  │  ┌──────────┐  ┌──────────────┐  ┌────────────────┐   │   │
│  │  │ Sidebar  │  │ EditorPanel  │  │ AgentPanel     │   │   │
│  │  │          │  │              │  │                │   │   │
│  │  │ FileTree │  │ MonacoEditor │  │ ChatInterface  │   │   │
│  │  │ Activity │  │ TabBar       │  │ StreamDisplay  │   │   │
│  │  └──────────┘  └──────────────┘  └────────────────┘   │   │
│  │                                                       │   │
│  │  ┌────────────────────────────────────────────────┐   │   │
│  │  │              TerminalPanel (xterm.js)          │   │   │
│  │  └────────────────────────────────────────────────┘   │   │
│  └───────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 IPC Message Contracts

```typescript
// Main → Renderer
interface CLIOutputMessage {
  type: 'cli:output';
  payload: {
    stream: 'stdout' | 'stderr';
    content: string;
    timestamp: number;
  };
}

interface FileChangeMessage {
  type: 'file:changed';
  payload: {
    path: string;
    changeType: 'create' | 'modify' | 'delete';
  };
}

// Renderer → Main
interface CLIInputMessage {
  type: 'cli:input';
  payload: {
    content: string;
    braveMode: boolean;
  };
}

interface FileOperationMessage {
  type: 'file:operation';
  payload: {
    operation: 'read' | 'write' | 'delete' | 'create';
    path: string;
    content?: string;
  };
}
```

### 3.3 State Management Schema

```typescript
interface AppState {
  // UI State
  ui: {
    sidebarWidth: number;
    agentPanelWidth: number;
    terminalHeight: number;
    activePanel: 'editor' | 'agent' | 'terminal';
  };

  // Editor State
  editor: {
    openFiles: OpenFile[];
    activeFileId: string | null;
    unsavedChanges: Map<string, string>;
  };

  // Agent State
  agent: {
    connected: boolean;
    braveMode: boolean;
    conversationHistory: Message[];
    pendingActions: AgentAction[];
  };

  // Project State
  project: {
    rootPath: string;
    fileTree: FileNode[];
    gitStatus: GitStatus | null;
  };
}
```

---

## 4. Claude CLI Integration

### 4.1 CLI Spawning

```typescript
interface CLIConfig {
  executable: string;        // Path to claude binary
  args: string[];            // CLI arguments
  cwd: string;               // Working directory (project root)
  env: NodeJS.ProcessEnv;    // Environment variables
}

// Default configuration
const defaultConfig: CLIConfig = {
  executable: 'claude',
  args: ['--output-format', 'stream-json'],
  cwd: process.cwd(),
  env: {
    ...process.env,
    CLAUDE_CONFIG_DIR: '~/.claude'
  }
};
```

### 4.2 Brave Mode Implementation

```typescript
interface BraveModeConfig {
  enabled: boolean;
  blocklist: RegExp[];
  allowlist: string[];
  requireDryRun: string[];    // Commands that need preview
  maxFileSize: number;        // Max bytes for auto-write
}

const defaultBlocklist: RegExp[] = [
  /rm\s+(-rf?|--recursive)\s+[\/~]/,
  /sudo\s+rm/,
  /mkfs/,
  /dd\s+if=/,
  />\s*\/dev\//,
  /chmod\s+777/,
  /curl.*\|\s*(ba)?sh/
];
```

### 4.3 Session Management

```typescript
interface SessionState {
  authenticated: boolean;
  expiresAt: number;
  refreshToken: string | null;
  credentialPath: string;
}

// Credential file location
const CREDENTIAL_PATHS = {
  darwin: '~/.claude/.credentials.json',
  win32: '%APPDATA%\\Claude\\.credentials.json',
  linux: '~/.claude/.credentials.json'
};
```

---

## 5. File System Specifications

### 5.1 Project Structure

```
~/.sumerian/
├── config.json              # Global app settings
├── audit.log                # Agent action log
├── recent-projects.json     # Recent project list
└── cache/
    └── cli-responses/       # Cached CLI responses

<project-root>/
└── .sumerian/
    ├── config.json          # Project-specific settings
    ├── lore/
    │   └── *.md             # Custom context files
    ├── snapshots/
    │   └── <timestamp>/     # File backups
    └── session/
        └── history.json     # Conversation history
```

### 5.2 Configuration Schema

```typescript
// ~/.sumerian/config.json
interface GlobalConfig {
  version: string;
  theme: 'dark' | 'light' | 'system';
  fontSize: number;
  fontFamily: string;
  braveMode: {
    defaultEnabled: boolean;
    globalBlocklist: string[];
  };
  telemetry: boolean;
  autoUpdate: boolean;
}

// <project>/.sumerian/config.json
interface ProjectConfig {
  version: string;
  loreFiles: string[];
  braveMode: {
    enabled: boolean;
    allowlist: string[];
  };
  ignorePatterns: string[];
}
```

### 5.3 File Watcher Configuration

```typescript
interface WatcherConfig {
  ignored: string[];
  persistent: boolean;
  ignoreInitial: boolean;
  awaitWriteFinish: {
    stabilityThreshold: number;
    pollInterval: number;
  };
}

const defaultWatcherConfig: WatcherConfig = {
  ignored: [
    '**/node_modules/**',
    '**/.git/**',
    '**/.sumerian/snapshots/**',
    '**/dist/**',
    '**/build/**'
  ],
  persistent: true,
  ignoreInitial: true,
  awaitWriteFinish: {
    stabilityThreshold: 100,
    pollInterval: 50
  }
};
```

---

## 6. Security Requirements

### 6.1 Credential Storage

| Platform | Storage Mechanism | Encryption |
|----------|-------------------|------------|
| macOS | Keychain Services via `keytar` | AES-256 |
| Windows | Credential Manager via `keytar` | DPAPI |
| Linux | libsecret via `keytar` | Varies by DE |

### 6.2 Sandboxing Rules

```typescript
interface SandboxConfig {
  allowedPaths: string[];      // Paths agent can access
  deniedPaths: string[];       // Always blocked
  requireConfirmation: string[]; // Needs user approval
}

const defaultSandbox: SandboxConfig = {
  allowedPaths: [
    '${projectRoot}/**'
  ],
  deniedPaths: [
    '/etc/**',
    '/usr/**',
    '/System/**',
    '~/.ssh/**',
    '~/.gnupg/**',
    '~/.aws/**'
  ],
  requireConfirmation: [
    '~/**',                    // Home directory
    '/tmp/**'
  ]
};
```

### 6.3 Audit Log Format

```typescript
interface AuditEntry {
  timestamp: string;           // ISO 8601
  action: 'file:read' | 'file:write' | 'file:delete' | 'command:run';
  actor: 'user' | 'agent';
  target: string;              // File path or command
  braveMode: boolean;
  reversible: boolean;
  snapshotPath?: string;       // Path to backup if reversible
  result: 'success' | 'blocked' | 'error';
  error?: string;
}
```

---

## 7. UI Component Specifications

### 7.1 Layout Dimensions

```typescript
interface LayoutConstraints {
  sidebar: {
    minWidth: 200,
    maxWidth: 400,
    defaultWidth: 260
  };
  agentPanel: {
    minWidth: 300,
    maxWidth: 600,
    defaultWidth: 380
  };
  terminal: {
    minHeight: 100,
    maxHeight: 500,
    defaultHeight: 200
  };
  editor: {
    minWidth: 400  // Remaining space
  };
}
```

### 7.2 Theme Specification (Nexus Dark)

```typescript
const nexusDarkTheme = {
  colors: {
    // Backgrounds
    bgPrimary: '#0a0a0a',
    bgSecondary: '#141414',
    bgTertiary: '#1a1a1a',
    bgGlass: 'rgba(20, 20, 20, 0.85)',

    // Foregrounds
    fgPrimary: '#ffffff',
    fgSecondary: '#a0a0a0',
    fgMuted: '#666666',

    // Accents
    accent: '#3b82f6',
    accentHover: '#60a5fa',
    success: '#22c55e',
    warning: '#eab308',
    error: '#ef4444',

    // Borders
    border: '#2a2a2a',
    borderFocus: '#3b82f6'
  },

  blur: {
    glass: 'blur(20px)'
  },

  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.5)',
    md: '0 4px 6px rgba(0, 0, 0, 0.5)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.5)'
  },

  radii: {
    sm: '4px',
    md: '8px',
    lg: '12px'
  }
};
```

### 7.3 Monaco Editor Configuration

```typescript
const monacoConfig: monaco.editor.IStandaloneEditorConstructionOptions = {
  theme: 'sumerian-dark',
  fontSize: 14,
  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  fontLigatures: true,
  lineNumbers: 'on',
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  wordWrap: 'on',
  tabSize: 2,
  insertSpaces: true,
  automaticLayout: true,
  cursorBlinking: 'smooth',
  cursorSmoothCaretAnimation: 'on',
  smoothScrolling: true,
  renderWhitespace: 'selection',
  bracketPairColorization: { enabled: true }
};
```

---

## 8. Performance Requirements

### 8.1 Benchmarks

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Cold start | < 3s | Time from launch to interactive editor |
| File open | < 100ms | Time to render file in editor |
| Agent response start | < 500ms | Time from send to first token |
| File tree render | < 200ms | Time to render 10,000 file tree |
| Memory (idle) | < 300MB | Electron process memory |
| Memory (active) | < 512MB | During agent operation |

### 8.2 Optimization Strategies

```typescript
// File tree virtualization
interface VirtualTreeConfig {
  itemHeight: 24;
  overscan: 10;
  estimatedItemCount: number;
}

// Lazy loading
interface LazyLoadConfig {
  editorChunkSize: 50000;     // Characters per chunk
  fileTreeDepth: 3;           // Initial depth to load
  historyPageSize: 50;        // Messages per page
}

// Debouncing
interface DebounceConfig {
  fileWatch: 100;             // ms
  editorChange: 300;          // ms
  search: 200;                // ms
  resize: 50;                 // ms
}
```

---

## 9. Testing Requirements

### 9.1 Test Coverage Targets

| Category | Coverage Target |
|----------|-----------------|
| Unit Tests | > 80% |
| Integration Tests | > 60% |
| E2E Tests | Critical paths |

### 9.2 Test Categories

```typescript
// Unit tests (Vitest)
describe('CLIManager', () => {
  test('spawns CLI process correctly');
  test('handles CLI output streaming');
  test('detects session expiration');
  test('blocks dangerous commands in brave mode');
});

// Integration tests
describe('FileService + CLIManager', () => {
  test('agent can read files within project');
  test('agent cannot read files outside sandbox');
  test('file changes trigger context update');
});

// E2E tests (Playwright)
describe('Full workflow', () => {
  test('user can open project and chat with agent');
  test('brave mode executes commands without approval');
  test('file snapshots are created before edits');
});
```

---

## 10. Build & Distribution

### 10.1 Build Targets

| Platform | Format | Signing |
|----------|--------|---------|
| macOS | DMG, ZIP | Apple Developer ID |
| Windows | NSIS, Squirrel | EV Code Signing |
| Linux | AppImage, deb, rpm | GPG |

### 10.2 Build Commands

```bash
# Development
npm run dev              # Start in dev mode with hot reload

# Production builds
npm run build:mac        # macOS universal binary
npm run build:win        # Windows x64
npm run build:linux      # Linux x64

# All platforms
npm run build:all
```

### 10.3 Auto-Update Configuration

```typescript
interface UpdateConfig {
  provider: 'github';
  owner: 'your-org';
  repo: 'sumerian';
  releaseType: 'release';
  channel: 'latest' | 'beta';
}
```

---

## 11. Logging & Diagnostics

### 11.1 Log Levels

```typescript
enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4
}

interface LogConfig {
  level: LogLevel;
  file: string;
  maxSize: '10MB';
  maxFiles: 5;
  console: boolean;
}
```

### 11.2 Log Locations

```
~/.sumerian/logs/
├── main.log           # Main process logs
├── renderer.log       # Renderer process logs
├── cli.log            # Claude CLI interaction logs
└── crash-reports/     # Electron crash dumps
```

---

## 12. API Reference

### 12.1 Preload API (Exposed to Renderer)

```typescript
interface SumerianAPI {
  // CLI
  cli: {
    send(message: string, braveMode: boolean): Promise<void>;
    onOutput(callback: (output: CLIOutput) => void): void;
    getStatus(): Promise<CLIStatus>;
  };

  // Files
  files: {
    read(path: string): Promise<string>;
    write(path: string, content: string): Promise<void>;
    delete(path: string): Promise<void>;
    list(path: string): Promise<FileEntry[]>;
    watch(path: string, callback: (event: FileEvent) => void): void;
  };

  // Project
  project: {
    open(path: string): Promise<void>;
    getRoot(): Promise<string>;
    getConfig(): Promise<ProjectConfig>;
  };

  // System
  system: {
    openExternal(url: string): Promise<void>;
    showItemInFolder(path: string): Promise<void>;
    getVersion(): string;
  };
}
```

---

*Technical Requirements Document for Sumerian Vibe-Runner IDE v1.0.0*
