# Sprint 20-A: MCP Tool Extensions
**Duration:** 1-2 weeks  
**Goal:** Enable external tool integration via Model Context Protocol (MCP) for enhanced agent capabilities.  
**Status:** 🔄 **IN PROGRESS**

---

## 🎯 Sprint Objective

Integrate Model Context Protocol (MCP) support to extend agent capabilities beyond file/terminal operations. Enable Google Search, Sequential Thinking, and custom tool servers with full lifecycle management and UI controls.

**Duration:** 1-2 weeks

---

## 📋 Task Checklist

### Task 20-A.1: MCP Config Support
**Estimate:** 4 hours  
**Priority:** High

**Description:**
Parse and load MCP server definitions from JSON configuration files.

**Acceptance Criteria:**
- [ ] Parse `--mcp-config` flag in CLIManager
- [ ] Load server definitions from `~/.sumerian/mcp-config.json`
- [ ] Validate server config schema (name, command, args, env)
- [ ] Support per-project MCP config in `.sumerian/mcp-config.json`
- [ ] Merge global and project configs
- [ ] Error handling for malformed configs

**Files to Create:**
- `src/main/mcp/MCPConfig.ts`

**Files to Modify:**
- `src/main/cli/CLIManager.ts`

**Implementation Details:**
```typescript
// MCPConfig.ts
export interface MCPServerConfig {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
  enabled: boolean;
}

export interface MCPConfiguration {
  servers: MCPServerConfig[];
}

export class MCPConfig {
  private globalConfigPath: string;
  private projectConfigPath: string;
  
  constructor(projectRoot: string) {
    this.globalConfigPath = path.join(app.getPath('home'), '.sumerian', 'mcp-config.json');
    this.projectConfigPath = path.join(projectRoot, '.sumerian', 'mcp-config.json');
  }
  
  public async load(): Promise<MCPConfiguration> {
    const global = await this.loadConfig(this.globalConfigPath);
    const project = await this.loadConfig(this.projectConfigPath);
    return this.merge(global, project);
  }
  
  private async loadConfig(path: string): Promise<MCPConfiguration> {
    try {
      const content = await fs.readFile(path, 'utf-8');
      return JSON.parse(content);
    } catch {
      return { servers: [] };
    }
  }
  
  private merge(global: MCPConfiguration, project: MCPConfiguration): MCPConfiguration {
    // Project config overrides global
    const serverMap = new Map<string, MCPServerConfig>();
    
    for (const server of global.servers) {
      serverMap.set(server.name, server);
    }
    
    for (const server of project.servers) {
      serverMap.set(server.name, server);
    }
    
    return { servers: Array.from(serverMap.values()) };
  }
  
  public validate(config: MCPConfiguration): boolean {
    for (const server of config.servers) {
      if (!server.name || !server.command) return false;
    }
    return true;
  }
}
```

---

### Task 20-A.2: MCP Server Manager
**Estimate:** 6 hours  
**Priority:** High

**Description:**
Manage MCP server lifecycle: start, stop, health monitoring, auto-restart.

**Acceptance Criteria:**
- [ ] Start MCP servers as child processes
- [ ] Monitor server health (ping every 30s)
- [ ] Auto-restart on crash (max 3 retries)
- [ ] Graceful shutdown on app exit
- [ ] Server status tracking (starting/running/stopped/error)
- [ ] Broadcast status updates via IPC
- [ ] Log server output to `~/.sumerian/logs/mcp-{name}.log`

**Files to Create:**
- `src/main/mcp/MCPManager.ts`

**Files to Modify:**
- `src/main/ipc/handlers.ts`
- `src/main.ts`

**Implementation Details:**
```typescript
// MCPManager.ts
import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { app } from 'electron';

export type MCPServerStatus = 'starting' | 'running' | 'stopped' | 'error';

export interface MCPServer {
  name: string;
  config: MCPServerConfig;
  process: ChildProcess | null;
  status: MCPServerStatus;
  restartCount: number;
  lastError?: string;
}

export class MCPManager {
  private servers: Map<string, MCPServer> = new Map();
  private config: MCPConfig;
  private logDir: string;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private onStatusChange?: (name: string, status: MCPServerStatus) => void;
  
  constructor(projectRoot: string, onStatusChange?: (name: string, status: MCPServerStatus) => void) {
    this.config = new MCPConfig(projectRoot);
    this.logDir = path.join(app.getPath('home'), '.sumerian', 'logs');
    this.onStatusChange = onStatusChange;
  }
  
  public async initialize(): Promise<void> {
    await fs.mkdir(this.logDir, { recursive: true });
    const configuration = await this.config.load();
    
    for (const serverConfig of configuration.servers) {
      if (serverConfig.enabled) {
        await this.startServer(serverConfig);
      }
    }
    
    this.startHealthCheck();
  }
  
  private async startServer(config: MCPServerConfig): Promise<void> {
    const server: MCPServer = {
      name: config.name,
      config,
      process: null,
      status: 'starting',
      restartCount: 0
    };
    
    this.servers.set(config.name, server);
    this.notifyStatusChange(config.name, 'starting');
    
    try {
      const logPath = path.join(this.logDir, `mcp-${config.name}.log`);
      const logStream = await fs.open(logPath, 'a');
      
      const proc = spawn(config.command, config.args || [], {
        env: { ...process.env, ...config.env },
        stdio: ['pipe', logStream.fd, logStream.fd]
      });
      
      server.process = proc;
      
      proc.on('spawn', () => {
        server.status = 'running';
        this.notifyStatusChange(config.name, 'running');
        console.log(`[MCPManager] Server ${config.name} started`);
      });
      
      proc.on('error', (err) => {
        server.status = 'error';
        server.lastError = err.message;
        this.notifyStatusChange(config.name, 'error');
        console.error(`[MCPManager] Server ${config.name} error:`, err);
      });
      
      proc.on('exit', (code) => {
        server.status = 'stopped';
        server.process = null;
        this.notifyStatusChange(config.name, 'stopped');
        console.log(`[MCPManager] Server ${config.name} exited with code ${code}`);
        
        // Auto-restart on crash (max 3 times)
        if (code !== 0 && server.restartCount < 3) {
          server.restartCount++;
          console.log(`[MCPManager] Restarting ${config.name} (attempt ${server.restartCount}/3)`);
          setTimeout(() => this.startServer(config), 5000);
        }
      });
      
    } catch (err) {
      server.status = 'error';
      server.lastError = (err as Error).message;
      this.notifyStatusChange(config.name, 'error');
      console.error(`[MCPManager] Failed to start ${config.name}:`, err);
    }
  }
  
  public async stopServer(name: string): Promise<void> {
    const server = this.servers.get(name);
    if (!server || !server.process) return;
    
    server.process.kill('SIGTERM');
    server.status = 'stopped';
    this.notifyStatusChange(name, 'stopped');
  }
  
  public async stopAll(): Promise<void> {
    for (const [name] of this.servers) {
      await this.stopServer(name);
    }
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }
  
  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(() => {
      for (const [name, server] of this.servers) {
        if (server.status === 'running' && server.process) {
          // Simple health check: verify process is still alive
          if (server.process.killed || server.process.exitCode !== null) {
            server.status = 'stopped';
            this.notifyStatusChange(name, 'stopped');
          }
        }
      }
    }, 30000); // Every 30 seconds
  }
  
  private notifyStatusChange(name: string, status: MCPServerStatus): void {
    if (this.onStatusChange) {
      this.onStatusChange(name, status);
    }
  }
  
  public getServerStatus(name: string): MCPServerStatus | undefined {
    return this.servers.get(name)?.status;
  }
  
  public getAllServers(): Array<{ name: string; status: MCPServerStatus; lastError?: string }> {
    return Array.from(this.servers.values()).map(s => ({
      name: s.name,
      status: s.status,
      lastError: s.lastError
    }));
  }
}
```

---

### Task 20-A.3: MCP Settings UI
**Estimate:** 4 hours  
**Priority:** Medium

**Description:**
Add MCP server management UI in Settings modal.

**Acceptance Criteria:**
- [ ] New "MCP Tools" tab in Settings
- [ ] List all configured servers with status indicators
- [ ] Enable/disable toggle per server
- [ ] Start/stop/restart buttons
- [ ] Status badges (running/stopped/error)
- [ ] Add new server form
- [ ] Delete server button
- [ ] Real-time status updates

**Files to Create:**
- `src/renderer/components/MCPSettings.tsx`

**Files to Modify:**
- `src/renderer/components/SettingsModal.tsx`
- `src/preload/types.ts`
- `src/preload.ts`

**Implementation Details:**
```typescript
// MCPSettings.tsx
import React, { useEffect, useState } from 'react';
import { Server, Play, Square, RefreshCw, Trash2, Plus } from 'lucide-react';

interface MCPServerInfo {
  name: string;
  status: 'starting' | 'running' | 'stopped' | 'error';
  lastError?: string;
}

const MCPSettings: React.FC = () => {
  const [servers, setServers] = useState<MCPServerInfo[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  
  useEffect(() => {
    loadServers();
    
    // Listen for status updates
    const unsubscribe = window.sumerian.mcp.onStatusChange((name: string, status: string) => {
      setServers(prev => prev.map(s => 
        s.name === name ? { ...s, status: status as any } : s
      ));
    });
    
    return () => unsubscribe();
  }, []);
  
  const loadServers = async () => {
    const list = await window.sumerian.mcp.listServers();
    setServers(list);
  };
  
  const handleStart = async (name: string) => {
    await window.sumerian.mcp.startServer(name);
  };
  
  const handleStop = async (name: string) => {
    await window.sumerian.mcp.stopServer(name);
  };
  
  const handleRestart = async (name: string) => {
    await window.sumerian.mcp.stopServer(name);
    setTimeout(() => window.sumerian.mcp.startServer(name), 1000);
  };
  
  const handleDelete = async (name: string) => {
    if (confirm(`Delete MCP server "${name}"?`)) {
      await window.sumerian.mcp.deleteServer(name);
      loadServers();
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-nexus-fg-primary">MCP Servers</h3>
          <p className="text-xs text-nexus-fg-muted mt-1">
            Manage Model Context Protocol tool servers
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-nexus-accent text-white text-xs font-bold hover:bg-nexus-accent/80"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Server
        </button>
      </div>
      
      <div className="space-y-2">
        {servers.map(server => (
          <div
            key={server.name}
            className="bg-nexus-bg-tertiary border border-nexus-border rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Server className="w-4 h-4 text-nexus-fg-muted" />
                <span className="text-sm font-bold text-nexus-fg-primary">{server.name}</span>
              </div>
              
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                server.status === 'running' ? 'bg-green-500/20 text-green-500' :
                server.status === 'starting' ? 'bg-blue-500/20 text-blue-500' :
                server.status === 'error' ? 'bg-red-500/20 text-red-500' :
                'bg-gray-500/20 text-gray-500'
              }`}>
                {server.status.toUpperCase()}
              </span>
            </div>
            
            {server.lastError && (
              <p className="text-xs text-red-500 mb-3">{server.lastError}</p>
            )}
            
            <div className="flex items-center gap-2">
              {server.status === 'running' ? (
                <button
                  onClick={() => handleStop(server.name)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/20 text-red-500 text-xs font-bold hover:bg-red-500/30"
                >
                  <Square className="w-3 h-3" />
                  Stop
                </button>
              ) : (
                <button
                  onClick={() => handleStart(server.name)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded bg-green-500/20 text-green-500 text-xs font-bold hover:bg-green-500/30"
                >
                  <Play className="w-3 h-3" />
                  Start
                </button>
              )}
              
              <button
                onClick={() => handleRestart(server.name)}
                className="flex items-center gap-1.5 px-2 py-1 rounded bg-blue-500/20 text-blue-500 text-xs font-bold hover:bg-blue-500/30"
              >
                <RefreshCw className="w-3 h-3" />
                Restart
              </button>
              
              <button
                onClick={() => handleDelete(server.name)}
                className="flex items-center gap-1.5 px-2 py-1 rounded bg-gray-500/20 text-gray-500 text-xs font-bold hover:bg-gray-500/30 ml-auto"
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
            </div>
          </div>
        ))}
        
        {servers.length === 0 && (
          <div className="text-center py-8 text-nexus-fg-muted text-xs">
            No MCP servers configured
          </div>
        )}
      </div>
    </div>
  );
};

export default MCPSettings;
```

---

### Task 20-A.4: Tool Discovery
**Estimate:** 3 hours  
**Priority:** Medium

**Description:**
Query and display available tools from connected MCP servers.

**Acceptance Criteria:**
- [ ] Query tools from each running server
- [ ] Display tool list in Settings UI
- [ ] Show tool name, description, parameters
- [ ] Cache tool metadata
- [ ] Refresh on server restart
- [ ] Show tool count per server

**Files to Modify:**
- `src/main/mcp/MCPManager.ts`
- `src/renderer/components/MCPSettings.tsx`

---

### Task 20-A.5: Built-in Servers
**Estimate:** 3 hours  
**Priority:** Low

**Description:**
Bundle default MCP server configurations for common tools.

**Acceptance Criteria:**
- [ ] Default config includes Google Search server
- [ ] Default config includes Sequential Thinking server
- [ ] Auto-create `~/.sumerian/mcp-config.json` on first run
- [ ] One-click enable for bundled servers
- [ ] Documentation for each bundled server

**Files to Create:**
- `src/main/mcp/default-servers.json`

---

### Task 20-A.6: Testing & Documentation
**Estimate:** 4 hours  
**Priority:** Medium

**Description:**
Add tests and user documentation for MCP features.

**Acceptance Criteria:**
- [ ] Unit tests for MCPConfig
- [ ] Unit tests for MCPManager lifecycle
- [ ] E2E test for Settings UI
- [ ] User guide: "Adding MCP Servers"
- [ ] User guide: "Using MCP Tools"
- [ ] Troubleshooting guide

**Files to Create:**
- `tests/unit/MCPConfig.test.ts`
- `tests/unit/MCPManager.test.ts`
- `docs/guides/mcp-setup.md`

---

## ✅ Sprint Definition of Done

- [ ] MCP config loading from global and project files
- [ ] MCP servers start/stop/restart automatically
- [ ] Health monitoring with auto-restart on crash
- [ ] Settings UI shows all servers with real-time status
- [ ] Tool discovery displays available tools
- [ ] Default servers bundled and documented
- [ ] Unit tests pass with >80% coverage
- [ ] User documentation complete

---

## 📦 Dependencies

**Required:**
- Claude CLI with `--mcp-config` flag support
- MCP server packages (user-provided or npm installable)

**Optional:**
- `@modelcontextprotocol/server-google-search`
- `@modelcontextprotocol/server-sequential-thinking`

---

## 🚨 Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Claude CLI doesn't support MCP yet | High | Verify CLI version, defer if unsupported |
| MCP protocol changes | Medium | Abstract MCP layer, version lock servers |
| Server crashes affect agent | Medium | Isolate server processes, graceful degradation |
| Complex debugging | Low | Comprehensive logging, status UI |

---

## 📚 Documentation Updates

- [ ] Add MCP section to README
- [ ] Create `docs/guides/mcp-setup.md`
- [ ] Update `docs/COMMANDS.md` with MCP-related commands
- [ ] Add MCP troubleshooting to FAQ

---

*Sprint 20-A — Sumerian Agent Workflow System*
