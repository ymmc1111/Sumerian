import { ipcMain, dialog, app, BrowserWindow } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync } from 'fs';
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

const fileService = new FileService();
const credentialManager = new CredentialManager();
const oauthBridge = new OAuthBridge();
const terminalManager = new TerminalManager();
let cliManager: CLIManager | null = null;
let sessionManager: SessionManager | null = null;

const RECENT_PROJECTS_FILE = path.join(app.getPath('home'), '.sumerian', 'recent-projects.json');
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

async function getRecentProjects(): Promise<string[]> {
    try {
        if (!existsSync(RECENT_PROJECTS_FILE)) return [];
        const content = await fs.readFile(RECENT_PROJECTS_FILE, 'utf-8');
        return JSON.parse(content);
    } catch (e) {
        return [];
    }
}

async function addRecentProject(projectPath: string) {
    let recent = await getRecentProjects();
    recent = [projectPath, ...recent.filter(p => p !== projectPath)].slice(0, 10);
    const dir = path.dirname(RECENT_PROJECTS_FILE);
    if (!existsSync(dir)) {
        await fs.mkdir(dir, { recursive: true });
    }
    await fs.writeFile(RECENT_PROJECTS_FILE, JSON.stringify(recent, null, 2));
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
        if (!cliManager || !path) return;

        if (contextUpdateTimeout) {
            clearTimeout(contextUpdateTimeout);
        }

        contextUpdateTimeout = setTimeout(() => {
            if (cliManager && cliManager.getStatus() === ConnectionStatus.CONNECTED) {
                // For MVP, we just send a "system hint" message to the CLI
                // This is slightly hacky but keeps the agent focused
                const relativePath = cliManager.getRelativePath(path);
                cliManager.write(`\r# SYSTEM: User is now focusing on file: ${relativePath}\n`);
            }
        }, 1000); // 1s debounce
    });

    ipcMain.handle('cli:setBraveMode', async (_event, enabled: boolean) => {
        if (!cliManager) return false;
        cliManager.spawn(enabled);
        return true;
    });

    ipcMain.handle('cli:setModel', async (_event, model: string) => {
        if (!cliManager) return false;
        cliManager.setModel(model);
        return true;
    });

    ipcMain.handle('cli:listModels', async () => {
        if (!cliManager) return [];
        return await cliManager.listModels();
    });

    ipcMain.handle('cli:refreshModels', async () => {
        if (!cliManager) return false;
        await cliManager.refreshModels();
        return true;
    });

    ipcMain.handle('cli:getStatus', async () => {
        return cliManager ? cliManager.getStatus() : ConnectionStatus.DISCONNECTED;
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
        if (!sessionManager) return false;
        await sessionManager.saveSession(data);
        return true;
    });

    ipcMain.handle('session:load', async (_event, id: string) => {
        if (!sessionManager) return null;
        return await sessionManager.loadSession(id);
    });

    ipcMain.handle('session:getLatestId', async () => {
        if (!sessionManager) return null;
        return await sessionManager.getLatestSessionId();
    });

    ipcMain.handle('session:list', async () => {
        if (!sessionManager) return [];
        return await sessionManager.listSessions();
    });

    ipcMain.handle('session:delete', async (_event, id: string) => {
        if (!sessionManager) return false;
        await sessionManager.deleteSession(id);
        return true;
    });

    ipcMain.handle('project:open', async (event, projectPath: string) => {
        const webContents = event.sender;

        fileService.setProjectRoot(projectPath);
        await addRecentProject(projectPath);
        sessionManager = new SessionManager(projectPath);

        if (cliManager) {
            cliManager.kill();
        }

        cliManager = new CLIManager(projectPath, {
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
            }
        });

        // Wire up parser events for typed IPC channels
        const parser = cliManager.getParser();

        parser.on('assistantText', (text: string, isStreaming: boolean) => {
            if (!webContents.isDestroyed()) {
                webContents.send('cli:assistant-message', { text, isStreaming });
            }
        });

        parser.on('toolUse', (name: string, id: string, input: Record<string, unknown>) => {
            if (!webContents.isDestroyed()) {
                webContents.send('cli:tool-action', { type: 'use', name, id, input });
            }
        });

        parser.on('toolResult', (id: string, content: string, isError: boolean) => {
            if (!webContents.isDestroyed()) {
                webContents.send('cli:tool-action', { type: 'result', id, content, isError });
            }
        });

        parser.on('complete', (result: string, usage?: { input: number; output: number }) => {
            if (!webContents.isDestroyed()) {
                webContents.send('cli:status', { status: 'complete', result, usage });
            }
        });

        parser.on('error', (type: string, message: string) => {
            if (!webContents.isDestroyed()) {
                webContents.send('cli:status', { status: 'error', type, message });
            }
        });

        const loreManager = new LoreManager(projectPath);
        const loreFiles = await loreManager.scanLore();
        const initialContext = loreManager.formatLoreForInjection(loreFiles);

        cliManager.spawn(false, initialContext);
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
        if (existsSync(RECENT_PROJECTS_FILE)) {
            await fs.unlink(RECENT_PROJECTS_FILE);
        }
        return true;
    });

    ipcMain.handle('lore:list', async (_event, projectPath: string) => {
        const loreManager = new LoreManager(projectPath);
        return await loreManager.scanLore();
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
}
