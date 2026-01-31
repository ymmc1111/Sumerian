import { ipcMain, dialog, app, BrowserWindow } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync } from 'fs';
import chokidar from 'chokidar';
import { FileService } from '../files/FileService';
import { CLIManager } from '../cli/CLIManager';
import { CredentialManager } from '../credentials/CredentialManager';
import { OAuthBridge } from '../credentials/OAuthBridge';
import { ConnectionStatus } from '../cli/types';
import { BraveModeGuard } from '../cli/BraveModeGuard';
import { TerminalManager } from '../terminal/TerminalManager';
import { LoreManager } from '../context/LoreManager';
import { windowManager } from '../windows/WindowManager';
import { PanelType } from '../../renderer/types/layout';
import { SessionManager, SessionData } from '../sessions/SessionManager';
import { projectManager } from '../projects/ProjectManager';
import { ProjectConfigOverrides } from '../projects/types';
import { cliSessionManager } from '../projects/CLISessionManager';

const fileService = new FileService();
const credentialManager = new CredentialManager();
const oauthBridge = new OAuthBridge();
const terminalManager = new TerminalManager();

// Legacy - now handled by ProjectManager
// const RECENT_PROJECTS_FILE = path.join(app.getPath('home'), '.sumerian', 'recent-projects.json');
const PREFERENCES_FILE = path.join(app.getPath('home'), '.sumerian', 'preferences.json');

interface UserPreferences {
    theme: string;
    reducedMotion: boolean;
}

const defaultPreferences: UserPreferences = {
    theme: 'nexus',
    reducedMotion: false,
};

async function getPreferences(): Promise<UserPreferences> {
    try {
        if (!existsSync(PREFERENCES_FILE)) return defaultPreferences;
        const content = await fs.readFile(PREFERENCES_FILE, 'utf-8');
        return { ...defaultPreferences, ...JSON.parse(content) };
    } catch (e) {
        return defaultPreferences;
    }
}

async function setPreferences(prefs: Partial<UserPreferences>): Promise<UserPreferences> {
    const current = await getPreferences();
    const updated = { ...current, ...prefs };
    const dir = path.dirname(PREFERENCES_FILE);
    if (!existsSync(dir)) {
        await fs.mkdir(dir, { recursive: true });
    }
    await fs.writeFile(PREFERENCES_FILE, JSON.stringify(updated, null, 2));
    return updated;
}

// Legacy functions replaced by ProjectManager
async function getRecentProjects(): Promise<string[]> {
    const projects = await projectManager.getRecentProjects();
    return projects.map(p => p.path);
}

async function addRecentProject(projectPath: string) {
    await projectManager.addProject(projectPath);
}

// Helper to get active CLI manager from session manager
function getActiveCLIManager(): CLIManager | null {
    const session = cliSessionManager.getActiveSession();
    return session ? session.cliManager : null;
}

// Helper to get active session manager from session manager
function getActiveSessionManager(): SessionManager | null {
    const session = cliSessionManager.getActiveSession();
    return session ? session.sessionManager : null;
}

export function setupHandlers() {
    ipcMain.handle('terminal:create', async (event, { id, cwd }: { id: string, cwd: string }) => {
        const webContents = event.sender;
        terminalManager.createTerminal(id, cwd, {
            onData: (data: string) => {
                if (!webContents.isDestroyed()) {
                    webContents.send(`terminal:data:${id}`, data);
                }
            },
            onExit: (code: number, signal?: number) => {
                if (!webContents.isDestroyed()) {
                    webContents.send(`terminal:exit:${id}`, { code, signal });
                }
            }
        });
        return true;
    });

    ipcMain.handle('terminal:write', async (_event, { id, data }: { id: string, data: string }) => {
        terminalManager.write(id, data);
    });

    ipcMain.handle('terminal:resize', async (_event, { id, cols, rows }: { id: string, cols: number, rows: number }) => {
        terminalManager.resize(id, cols, rows);
    });
    ipcMain.handle('cli:send', async (_event, { content, braveMode }: { content: string, braveMode: boolean }) => {
        const cliManager = getActiveCLIManager();
        if (!cliManager) {
            throw new Error('Project not open - CLIManager not initialized');
        }

        const validation = BraveModeGuard.validateCommand(content);
        if (!validation.allowed) {
            console.error(`Command blocked: ${validation.reason}`);
            throw new Error(`Safety Guard: ${validation.reason}`);
        }

        cliManager.write(content + '\n');
    });

    let contextUpdateTimeout: NodeJS.Timeout | null = null;
    ipcMain.handle('cli:updateActiveFileContext', async (_event, path: string | null) => {
        const cliManager = getActiveCLIManager();
        if (!cliManager || !path) return;

        if (contextUpdateTimeout) {
            clearTimeout(contextUpdateTimeout);
        }

        contextUpdateTimeout = setTimeout(() => {
            const cliManager = getActiveCLIManager();
            if (cliManager && cliManager.getStatus() === ConnectionStatus.CONNECTED) {
                // For MVP, we just send a "system hint" message to the CLI
                // This is slightly hacky but keeps the agent focused
                const relativePath = cliManager.getRelativePath(path);
                cliManager.write(`\r# SYSTEM: User is now focusing on file: ${relativePath}\n`);
            }
        }, 1000); // 1s debounce
    });

    ipcMain.handle('cli:setBraveMode', async (_event, enabled: boolean) => {
        const cliManager = getActiveCLIManager();
        if (!cliManager) return false;
        cliManager.setBraveMode(enabled);
        return true;
    });

    ipcMain.handle('cli:setModel', async (_event, model: string) => {
        const cliManager = getActiveCLIManager();
        if (!cliManager) return false;
        cliManager.setModel(model);
        return true;
    });

    ipcMain.handle('cli:setMaxBudgetUsd', async (_event, budget: number | null) => {
        const cliManager = getActiveCLIManager();
        if (!cliManager) return false;
        cliManager.setMaxBudgetUsd(budget);
        return true;
    });

    ipcMain.handle('cli:setMcpConfigPath', async (_event, path: string | null) => {
        const cliManager = getActiveCLIManager();
        if (!cliManager) return false;
        cliManager.setMcpConfigPath(path);
        return true;
    });

    ipcMain.handle('cli:setAdditionalDirs', async (_event, dirs: string[]) => {
        const cliManager = getActiveCLIManager();
        if (!cliManager) return false;
        cliManager.setAdditionalDirs(dirs);
        return true;
    });

    ipcMain.handle('cli:setAllowedTools', async (_event, tools: string[]) => {
        const cliManager = getActiveCLIManager();
        if (!cliManager) return false;
        cliManager.setAllowedTools(tools);
        return true;
    });

    ipcMain.handle('cli:setDisallowedTools', async (_event, tools: string[]) => {
        const cliManager = getActiveCLIManager();
        if (!cliManager) return false;
        cliManager.setDisallowedTools(tools);
        return true;
    });

    ipcMain.handle('cli:start-loop', async (event, prompt: string, completionPromise: string, maxIterations: number) => {
        const cliManager = getActiveCLIManager();
        if (cliManager) {
            cliManager.startLoop(prompt, completionPromise, maxIterations);
            return true;
        }
        return false;
    });

    ipcMain.handle('cli:cancel-loop', async () => {
        const cliManager = getActiveCLIManager();
        if (cliManager) {
            cliManager.cancelLoop();
            return true;
        }
        return false;
    });

    ipcMain.handle('cli:listModels', async () => {
        const cliManager = getActiveCLIManager();
        if (!cliManager) return [];
        return await cliManager.listModels();
    });

    ipcMain.handle('cli:refreshModels', async () => {
        const cliManager = getActiveCLIManager();
        if (!cliManager) return false;
        await cliManager.refreshModels();
        return true;
    });

    ipcMain.handle('cli:getStatus', async () => {
        const cliManager = getActiveCLIManager();
        return cliManager ? cliManager.getStatus() : ConnectionStatus.DISCONNECTED;
    });

    // Workforce Management Handlers
    ipcMain.handle('cli:spawn-agent', async (_event, { persona, task, workingDir }: { persona: any, task: string, workingDir?: string }) => {
        const cliManager = getActiveCLIManager();
        if (!cliManager) {
            throw new Error('Project not open - CLIManager not initialized');
        }
        return cliManager.spawnAgent(persona, task, workingDir);
    });

    ipcMain.handle('cli:terminate-agent', async (_event, agentId: string) => {
        const cliManager = getActiveCLIManager();
        if (!cliManager) return false;
        cliManager.terminateAgent(agentId);
        return true;
    });

    ipcMain.handle('cli:get-agent', async (_event, agentId: string) => {
        const cliManager = getActiveCLIManager();
        if (!cliManager) return null;
        return cliManager.getAgent(agentId);
    });

    ipcMain.handle('cli:get-all-agents', async () => {
        const cliManager = getActiveCLIManager();
        if (!cliManager) return [];
        return cliManager.getAllAgents();
    });

    ipcMain.handle('cli:kill-all', async () => {
        const cliManager = getActiveCLIManager();
        if (!cliManager) return false;
        cliManager.killAll();
        return true;
    });

    ipcMain.handle('session:getStatus', async () => {
        return await credentialManager.getSessionStatus();
    });

    ipcMain.handle('session:login', async () => {
        oauthBridge.openLoginPage();
        oauthBridge.startPolling(async () => {
            // Success - session refreshed
            const status = await credentialManager.getSessionStatus();
            // Send event to all windows
            // (In this simple app we can just return or use a better event system)
        });
        return true;
    });

    ipcMain.handle('session:save', async (_event, data: SessionData) => {
        const sessionManager = getActiveSessionManager();
        console.log('[IPC] session:save called, sessionManager exists:', !!sessionManager);
        console.log('[IPC] session:save data:', { id: data.id, messageCount: data.messages?.length });
        if (!sessionManager) {
            console.log('[IPC] session:save failed - no sessionManager');
            return false;
        }
        await sessionManager.saveSession(data);
        console.log('[IPC] session:save completed');
        return true;
    });

    ipcMain.handle('session:load', async (_event, id: string) => {
        const sessionManager = getActiveSessionManager();
        if (!sessionManager) return null;
        return await sessionManager.loadSession(id);
    });

    ipcMain.handle('session:getLatestId', async () => {
        const sessionManager = getActiveSessionManager();
        if (!sessionManager) return null;
        return await sessionManager.getLatestSessionId();
    });

    ipcMain.handle('session:list', async () => {
        const sessionManager = getActiveSessionManager();
        console.log('[IPC] session:list called, sessionManager exists:', !!sessionManager);
        if (!sessionManager) {
            console.log('[IPC] session:list returning empty - no sessionManager');
            return [];
        }
        const sessions = await sessionManager.listSessions();
        console.log('[IPC] session:list found', sessions.length, 'sessions');
        return sessions;
    });

    ipcMain.handle('session:delete', async (_event, id: string) => {
        const sessionManager = getActiveSessionManager();
        if (!sessionManager) return false;
        await sessionManager.deleteSession(id);
        return true;
    });

    ipcMain.handle('project:open', async (event, projectPath: string) => {
        const webContents = event.sender;

        fileService.setProjectRoot(projectPath);
        await addRecentProject(projectPath);

        // Get or create session for this project
        const session = cliSessionManager.getOrCreateSession(projectPath, {
            onOutput: (output) => {
                if (!webContents.isDestroyed()) {
                    webContents.send('cli:output', output);
                }
            },
            onExit: (code, signal) => {
                if (!webContents.isDestroyed()) {
                    webContents.send('cli:exit', { code, signal });
                }
            },
            onStatusChange: (status) => {
                if (!webContents.isDestroyed()) {
                    webContents.send('cli:status-change', status);
                }
            },
            onModelsUpdated: (models) => {
                if (!webContents.isDestroyed()) {
                    webContents.send('cli:models-updated', models);
                }
            },
            onLoopIteration: (iteration, max) => {
                BrowserWindow.getAllWindows().forEach(win => {
                    if (!win.isDestroyed()) {
                        win.webContents.send('cli:loop-iteration', { iteration, max });
                    }
                });
            },
            onLoopComplete: (reason) => {
                BrowserWindow.getAllWindows().forEach(win => {
                    if (!win.isDestroyed()) {
                        win.webContents.send('cli:loop-complete', { reason });
                    }
                });
            },
            onResourceUpdate: (update) => {
                BrowserWindow.getAllWindows().forEach(win => {
                    if (!win.isDestroyed()) {
                        win.webContents.send('workforce:resource-update', update);
                    }
                });
            },
            onAgentComplete: (report) => {
                BrowserWindow.getAllWindows().forEach(win => {
                    if (!win.isDestroyed()) {
                        win.webContents.send('workforce:agent-complete', report);
                    }
                });
            }
        });

        // Switch to this session
        cliSessionManager.switchSession(projectPath);

        // Wire up parser events for typed IPC channels
        const parser = session.cliManager.getParser();

        parser.on('assistantText', (text: string, isStreaming: boolean) => {
            // Broadcast to all windows (main + detached)
            BrowserWindow.getAllWindows().forEach(win => {
                if (!win.isDestroyed()) {
                    win.webContents.send('cli:assistant-message', { text, isStreaming });
                }
            });
        });

        parser.on('toolUse', (name: string, id: string, input: Record<string, unknown>) => {
            // Broadcast to all windows (main + detached)
            BrowserWindow.getAllWindows().forEach(win => {
                if (!win.isDestroyed()) {
                    win.webContents.send('cli:tool-action', { type: 'use', name, id, input });
                }
            });
        });

        parser.on('toolResult', (id: string, content: string, isError: boolean) => {
            // Broadcast to all windows (main + detached)
            BrowserWindow.getAllWindows().forEach(win => {
                if (!win.isDestroyed()) {
                    win.webContents.send('cli:tool-action', { type: 'result', id, content, isError });
                }
            });
        });

        parser.on('complete', (result: string, usage?: { input: number; output: number }) => {
            // Broadcast to all windows (main + detached)
            BrowserWindow.getAllWindows().forEach(win => {
                if (!win.isDestroyed()) {
                    win.webContents.send('cli:status', { status: 'complete', result, usage });
                }
            });
        });

        parser.on('error', (type: string, message: string) => {
            // Broadcast to all windows (main + detached)
            BrowserWindow.getAllWindows().forEach(win => {
                if (!win.isDestroyed()) {
                    win.webContents.send('cli:status', { status: 'error', type, message });
                }
            });
        });

        const loreManager = new LoreManager(projectPath);
        const loreFiles = await loreManager.scanLore();
        const initialContext = loreManager.formatLoreForInjection(loreFiles);

        session.cliManager.spawn(false, initialContext);
        return true;
    });

    ipcMain.handle('project:select', async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openDirectory']
        });

        if (result.canceled || result.filePaths.length === 0) {
            return null;
        }

        return result.filePaths[0];
    });

    ipcMain.handle('project:getRecent', async () => {
        return await getRecentProjects();
    });

    ipcMain.handle('project:clearRecent', async () => {
        await projectManager.clearRegistry();
        return true;
    });

    // Enhanced project registry handlers
    ipcMain.handle('project:list-recent', async (_event, limit?: number) => {
        return await projectManager.getRecentProjects(limit);
    });

    ipcMain.handle('project:get', async (_event, projectPath: string) => {
        return await projectManager.getProjectByPath(projectPath);
    });

    ipcMain.handle('project:remove', async (_event, projectPath: string) => {
        return await projectManager.removeProject(projectPath);
    });

    ipcMain.handle('project:update-config', async (_event, { projectPath, config }: { projectPath: string; config: ProjectConfigOverrides }) => {
        await projectManager.updateProjectConfig(projectPath, config);
        return true;
    });

    ipcMain.handle('project:load-config', async (_event, projectPath: string) => {
        return await projectManager.loadProjectConfig(projectPath);
    });

    ipcMain.handle('project:save-config', async (_event, { projectPath, config }: { projectPath: string; config: any }) => {
        await projectManager.saveProjectConfig(projectPath, config);
        return true;
    });

    ipcMain.handle('project:update-session', async (_event, { projectPath, sessionId }: { projectPath: string; sessionId: string }) => {
        await projectManager.updateProjectSession(projectPath, sessionId);
        return true;
    });

    ipcMain.handle('lore:list', async (_event, projectPath: string) => {
        const loreManager = new LoreManager(projectPath);
        return await loreManager.scanLore();
    });

    ipcMain.handle('memory:read', async (_event, projectPath: string) => {
        const loreManager = new LoreManager(projectPath);
        const memoryManager = loreManager.getMemoryManager();
        return await memoryManager.read();
    });

    ipcMain.handle('memory:write', async (_event, { projectPath, content }: { projectPath: string, content: string }) => {
        const loreManager = new LoreManager(projectPath);
        const memoryManager = loreManager.getMemoryManager();
        await memoryManager.write(content);
        return true;
    });

    ipcMain.handle('memory:append', async (_event, { projectPath, entry }: { projectPath: string, entry: string }) => {
        const loreManager = new LoreManager(projectPath);
        const memoryManager = loreManager.getMemoryManager();
        await memoryManager.append(entry);
        return true;
    });

    ipcMain.handle('memory:clear', async (_event, projectPath: string) => {
        const loreManager = new LoreManager(projectPath);
        const memoryManager = loreManager.getMemoryManager();
        await memoryManager.clear();
        return true;
    });

    ipcMain.handle('file:read', async (_event, path: string) => {
        return await fileService.read(path);
    });

    ipcMain.handle('file:write', async (_event, { path, content }: { path: string, content: string }) => {
        return await fileService.write(path, content);
    });

    ipcMain.handle('file:list', async (_event, path: string) => {
        return await fileService.list(path);
    });

    ipcMain.handle('file:saveImage', async (_event, { path, base64Data }: { path: string, base64Data: string }) => {
        return await fileService.saveImage(path, base64Data);
    });


    ipcMain.handle('file:delete', async (_event, path: string) => {
        return await fileService.delete(path);
    });

    ipcMain.handle('file:undo', async () => {
        return await fileService.undo();
    });

    ipcMain.handle('checkpoint:create', async (_event, { label, files }: { label: string, files: string[] }) => {
        return await fileService.createCheckpoint(label, files);
    });

    ipcMain.handle('checkpoint:list', async () => {
        return await fileService.listCheckpoints();
    });

    ipcMain.handle('checkpoint:rollback', async (_event, checkpointId: string) => {
        return await fileService.rollbackToCheckpoint(checkpointId);
    });

    ipcMain.handle('checkpoint:delete', async (_event, checkpointId: string) => {
        return await fileService.deleteCheckpoint(checkpointId);
    });

    // Handle watching - this is slightly different as it pushes to renderer
    let watcherCleanup: (() => void) | null = null;

    ipcMain.handle('file:watch', async (event, path: string) => {
        if (watcherCleanup) {
            watcherCleanup();
        }

        const webContents = event.sender;
        watcherCleanup = fileService.watch(path, (fileEvent) => {
            if (!webContents.isDestroyed()) {
                webContents.send('file:changed', fileEvent);
            }
        });

        return true;
    });

    ipcMain.handle('preferences:get', async () => {
        return await getPreferences();
    });

    ipcMain.handle('preferences:set', async (_event, prefs: Partial<UserPreferences>) => {
        return await setPreferences(prefs);
    });

    // Window management handlers for multi-monitor support
    ipcMain.handle('window:detach-panel', async (_event, { panelType, bounds }: { panelType: PanelType; bounds?: { x: number; y: number; width: number; height: number } }) => {
        return windowManager.detachPanel(panelType, bounds);
    });

    ipcMain.handle('window:reattach-panel', async (_event, windowId: string) => {
        return windowManager.reattachPanel(windowId);
    });

    ipcMain.handle('window:get-detached-panels', async () => {
        return windowManager.getDetachedPanels();
    });

    ipcMain.handle('window:focus', async (_event, windowId: string) => {
        return windowManager.focusWindow(windowId);
    });

    ipcMain.handle('window:move-to-screen', async (_event, { windowId, screenIndex }: { windowId: string; screenIndex: number }) => {
        return windowManager.moveWindowToScreen(windowId, screenIndex);
    });

    ipcMain.handle('window:get-screens', async () => {
        return windowManager.getAvailableScreens();
    });

    // State sync for multi-window support
    let sharedState: any = {};

    ipcMain.handle('state:set', async (_event, { key, data }) => {
        sharedState[key] = data;
        // Broadcast to all windows
        BrowserWindow.getAllWindows().forEach(win => {
            if (!win.isDestroyed()) {
                win.webContents.send(`state:update`, { key, data });
            }
        });
    });

    ipcMain.handle('state:get', async (_event, key: string) => {
        return sharedState[key];
    });

    ipcMain.handle('state:getAll', async () => {
        return sharedState;
    });

    ipcMain.handle('state:broadcast', async (event, { channel, data }) => {
        // Broadcast state update to all windows except sender
        const senderWindow = BrowserWindow.fromWebContents(event.sender);
        BrowserWindow.getAllWindows().forEach(win => {
            if (win !== senderWindow && !win.isDestroyed()) {
                win.webContents.send(`state:${channel}`, data);
            }
        });
    });

    // Security boundary handlers
    ipcMain.handle('security:request', async (event, { agentId, action, path }) => {
        // Broadcast security request to all windows for user approval
        BrowserWindow.getAllWindows().forEach(win => {
            if (!win.isDestroyed()) {
                win.webContents.send('security:boundary-violation', { agentId, action, path });
            }
        });
        return true;
    });

    ipcMain.handle('security:allow', async (_event, { agentId, action, path }) => {
        console.log('[Security] Allowed:', agentId, action, path);
        // Broadcast approval to resume agent
        BrowserWindow.getAllWindows().forEach(win => {
            if (!win.isDestroyed()) {
                win.webContents.send('security:approved', { agentId, action, path });
            }
        });
        return true;
    });

    ipcMain.handle('security:deny', async (_event, { agentId, action, path }) => {
        console.log('[Security] Denied:', agentId, action, path);
        // Broadcast denial to stop agent
        BrowserWindow.getAllWindows().forEach(win => {
            if (!win.isDestroyed()) {
                win.webContents.send('security:denied', { agentId, action, path });
            }
        });
        return true;
    });

    // Audit log handlers
    ipcMain.handle('audit:get-logs', async () => {
        try {
            const auditLogPath = path.join(app.getPath('home'), '.sumerian', 'audit.log');
            if (!existsSync(auditLogPath)) {
                return [];
            }
            const content = await fs.readFile(auditLogPath, 'utf-8');
            const lines = content.trim().split('\n').filter(line => line);
            return lines.map(line => JSON.parse(line));
        } catch (error) {
            console.error('[Audit] Failed to read audit log:', error);
            return [];
        }
    });

    ipcMain.handle('audit:stream', async (event) => {
        // Stream audit log updates to renderer
        const auditLogPath = path.join(app.getPath('home'), '.sumerian', 'audit.log');
        
        // Watch for changes to audit log
        const watcher = chokidar.watch(auditLogPath, {
            persistent: true,
            ignoreInitial: true
        });

        watcher.on('change', async () => {
            try {
                const content = await fs.readFile(auditLogPath, 'utf-8');
                const lines = content.trim().split('\n').filter(line => line);
                const logs = lines.map(line => JSON.parse(line));
                
                if (!event.sender.isDestroyed()) {
                    event.sender.send('audit:update', logs);
                }
            } catch (error) {
                console.error('[Audit] Failed to stream audit log:', error);
            }
        });

        // Cleanup on window close
        event.sender.on('destroyed', () => {
            watcher.close();
        });

        return true;
    });

    // Documentation handlers
    ipcMain.handle('docs:read', async (event, docPath: string) => {
        try {
            const docsDir = path.join(app.getAppPath(), 'docs');
            const fullPath = path.join(docsDir, docPath);
            
            // Security: ensure path is within docs directory
            const normalizedPath = path.normalize(fullPath);
            if (!normalizedPath.startsWith(docsDir)) {
                throw new Error('Invalid documentation path');
            }

            if (!existsSync(normalizedPath)) {
                throw new Error('Documentation file not found');
            }

            const content = await fs.readFile(normalizedPath, 'utf-8');
            return content;
        } catch (error) {
            console.error('[Docs] Failed to read documentation:', error);
            throw error;
        }
    });

    ipcMain.handle('docs:list', async () => {
        try {
            const docs = [
                { id: 'multi-project', title: 'Multi-Project Workspaces', path: 'guides/multi-project-workspaces.md' },
                { id: 'mcp-setup', title: 'MCP Setup', path: 'guides/mcp-setup.md' },
                { id: 'mcp-usage', title: 'MCP Usage', path: 'guides/mcp-usage.md' },
                { id: 'commands', title: 'Commands & Shortcuts', path: 'COMMANDS.md' }
            ];
            return docs;
        } catch (error) {
            console.error('[Docs] Failed to list documentation:', error);
            return [];
        }
    });
}
