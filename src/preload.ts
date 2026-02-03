import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('sumerian', {
    system: {
        getVersion: () => process.versions.electron,
    },
    cli: {
        send: (content: string, braveMode: boolean) => ipcRenderer.invoke('cli:send', { content, braveMode }),
        setBraveMode: (enabled: boolean) => ipcRenderer.invoke('cli:setBraveMode', enabled),
        getStatus: () => ipcRenderer.invoke('cli:getStatus'),
        onOutput: (callback: (output: any) => void) => {
            ipcRenderer.on('cli:output', (_event, value) => callback(value));
            return () => ipcRenderer.removeAllListeners('cli:output');
        },
        onStatusChange: (callback: (status: any) => void) => {
            ipcRenderer.on('cli:status-change', (_event, value) => callback(value));
            return () => ipcRenderer.removeAllListeners('cli:status-change');
        },
        onExit: (callback: (info: any) => void) => {
            ipcRenderer.on('cli:exit', (_event, value) => callback(value));
            return () => ipcRenderer.removeAllListeners('cli:exit');
        },
        updateActiveFileContext: (path: string | null) => ipcRenderer.invoke('cli:updateActiveFileContext', path),
        onAssistantMessage: (callback: (data: { text: string; isStreaming: boolean }) => void) => {
            ipcRenderer.on('cli:assistant-message', (_event, value) => callback(value));
            return () => ipcRenderer.removeAllListeners('cli:assistant-message');
        },
        onToolAction: (callback: (data: { type: 'use' | 'result'; name?: string; id: string; input?: Record<string, unknown>; content?: string; isError?: boolean }) => void) => {
            const handler = (_event: any, value: any) => callback(value);
            ipcRenderer.on('cli:tool-action', handler);
            return () => ipcRenderer.removeListener('cli:tool-action', handler);
        },
        onAgentStatus: (callback: (data: { status: string; result?: string; usage?: { input: number; output: number }; type?: string; message?: string }) => void) => {
            ipcRenderer.on('cli:status', (_event, value) => callback(value));
            return () => ipcRenderer.removeAllListeners('cli:status');
        },
        onError: (callback: (type: string, message: string) => void) => {
            const handler = (_event: any, data: any) => callback(data.type, data.message);
            ipcRenderer.on('cli:error', handler);
            return () => ipcRenderer.removeListener('cli:error', handler);
        },
        setModel: (model: string) => ipcRenderer.invoke('cli:setModel', model),
        setMaxBudgetUsd: (budget: number | null) => ipcRenderer.invoke('cli:setMaxBudgetUsd', budget),
        setMcpConfigPath: (path: string | null) => ipcRenderer.invoke('cli:setMcpConfigPath', path),
        setAdditionalDirs: (dirs: string[]) => ipcRenderer.invoke('cli:setAdditionalDirs', dirs),
        setAllowedTools: (tools: string[]) => ipcRenderer.invoke('cli:setAllowedTools', tools),
        setDisallowedTools: (tools: string[]) => ipcRenderer.invoke('cli:setDisallowedTools', tools),
        listModels: () => ipcRenderer.invoke('cli:listModels'),
        refreshModels: () => ipcRenderer.invoke('cli:refreshModels'),
        onModelsUpdated: (callback: (models: any[]) => void) => {
            ipcRenderer.on('cli:models-updated', (_event, value) => callback(value));
            return () => ipcRenderer.removeAllListeners('cli:models-updated');
        },
        startLoop: (prompt: string, completionPromise: string, maxIterations: number) =>
            ipcRenderer.invoke('cli:start-loop', prompt, completionPromise, maxIterations),
        cancelLoop: () => ipcRenderer.invoke('cli:cancel-loop'),
        onLoopIteration: (callback: (data: { iteration: number; max: number }) => void) => {
            ipcRenderer.on('cli:loop-iteration', (_event, value) => callback(value));
            return () => ipcRenderer.removeAllListeners('cli:loop-iteration');
        },
        onLoopComplete: (callback: (data: { reason: 'promise' | 'max_iterations' | 'cancelled' }) => void) => {
            ipcRenderer.on('cli:loop-complete', (_event, value) => callback(value));
            return () => ipcRenderer.removeAllListeners('cli:loop-complete');
        },
        spawnAgent: (persona: any, task: string, workingDir?: string) =>
            ipcRenderer.invoke('cli:spawn-agent', { persona, task, workingDir }),
        terminateAgent: (agentId: string) => ipcRenderer.invoke('cli:terminate-agent', agentId),
        getAgent: (agentId: string) => ipcRenderer.invoke('cli:get-agent', agentId),
        getAllAgents: () => ipcRenderer.invoke('cli:get-all-agents'),
        killAll: () => ipcRenderer.invoke('cli:kill-all'),
        onResourceUpdate: (callback: (data: { agentId: string; cpu: number; memory: number }) => void) => {
            const handler = (_event: any, value: any) => callback(value);
            ipcRenderer.on('workforce:resource-update', handler);
            return () => ipcRenderer.removeListener('workforce:resource-update', handler);
        },
    },
    session: {
        getStatus: () => ipcRenderer.invoke('session:getStatus'),
        login: () => ipcRenderer.invoke('session:login'),
        save: (data: any) => ipcRenderer.invoke('session:save', data),
        load: (id: string) => ipcRenderer.invoke('session:load', id),
        getLatestId: () => ipcRenderer.invoke('session:getLatestId'),
        list: () => ipcRenderer.invoke('session:list'),
        delete: (id: string) => ipcRenderer.invoke('session:delete', id),
    },
    project: {
        open: (path: string) => ipcRenderer.invoke('project:open', path),
        select: () => ipcRenderer.invoke('project:select'),
        getRecent: () => ipcRenderer.invoke('project:getRecent'),
        clearRecent: () => ipcRenderer.invoke('project:clearRecent'),
        listRecent: (limit?: number) => ipcRenderer.invoke('project:list-recent', limit),
        get: (path: string) => ipcRenderer.invoke('project:get', path),
        remove: (path: string) => ipcRenderer.invoke('project:remove', path),
        updateConfig: (path: string, config: any) => ipcRenderer.invoke('project:update-config', { projectPath: path, config }),
        loadConfig: (path: string) => ipcRenderer.invoke('project:load-config', path),
        saveConfig: (path: string, config: any) => ipcRenderer.invoke('project:save-config', { projectPath: path, config }),
        updateSession: (path: string, sessionId: string) => ipcRenderer.invoke('project:update-session', { projectPath: path, sessionId }),
    },
    terminal: {
        create: (id: string, cwd: string) => ipcRenderer.invoke('terminal:create', { id, cwd }),
        write: (id: string, data: string) => ipcRenderer.invoke('terminal:write', { id, data }),
        resize: (id: string, cols: number, rows: number) => ipcRenderer.invoke('terminal:resize', { id, cols, rows }),
        kill: (id: string) => ipcRenderer.invoke('terminal:kill', { id }),
        exists: (id: string) => ipcRenderer.invoke('terminal:exists', { id }),
        onData: (id: string, callback: (data: string) => void) => {
            const channel = `terminal:data:${id}`;
            const listener = (_event: any, value: string) => callback(value);
            ipcRenderer.on(channel, listener);
            return () => ipcRenderer.removeListener(channel, listener);
        },
        onExit: (id: string, callback: (info: any) => void) => {
            const channel = `terminal:exit:${id}`;
            const listener = (_event: any, value: any) => callback(value);
            ipcRenderer.on(channel, listener);
            return () => ipcRenderer.removeListener(channel, listener);
        }
    },
    files: {

        read: (path: string) => ipcRenderer.invoke('file:read', path),
        write: (path: string, content: string) => ipcRenderer.invoke('file:write', { path, content }),
        list: (path: string) => ipcRenderer.invoke('file:list', path),
        delete: (path: string) => ipcRenderer.invoke('file:delete', path),
        undo: () => ipcRenderer.invoke('file:undo'),
        watch: (path: string) => ipcRenderer.invoke('file:watch', path),
        onChanged: (callback: (event: any) => void) => {
            ipcRenderer.on('file:changed', (_event, value) => callback(value));
            return () => ipcRenderer.removeAllListeners('file:changed');
        },
        saveImage: (path: string, base64Data: string) => ipcRenderer.invoke('file:saveImage', { path, base64Data }),
        createCheckpoint: (label: string, files: string[]) => ipcRenderer.invoke('checkpoint:create', { label, files }),
        listCheckpoints: () => ipcRenderer.invoke('checkpoint:list'),
        rollbackToCheckpoint: (checkpointId: string) => ipcRenderer.invoke('checkpoint:rollback', checkpointId),
        deleteCheckpoint: (checkpointId: string) => ipcRenderer.invoke('checkpoint:delete', checkpointId),
    },
    lore: {
        list: (projectPath: string) => ipcRenderer.invoke('lore:list', projectPath),
    },
    memory: {
        read: (projectPath: string) => ipcRenderer.invoke('memory:read', projectPath),
        write: (projectPath: string, content: string) => ipcRenderer.invoke('memory:write', { projectPath, content }),
        append: (projectPath: string, entry: string) => ipcRenderer.invoke('memory:append', { projectPath, entry }),
        clear: (projectPath: string) => ipcRenderer.invoke('memory:clear', projectPath),
    },
    preferences: {
        get: () => ipcRenderer.invoke('preferences:get'),
        set: (prefs: any) => ipcRenderer.invoke('preferences:set', prefs),
    },
    window: {
        detachPanel: (panelType: string, bounds?: { x: number; y: number; width: number; height: number }) =>
            ipcRenderer.invoke('window:detach-panel', { panelType, bounds }),
        reattachPanel: (windowId: string) => ipcRenderer.invoke('window:reattach-panel', windowId),
        getDetachedPanels: () => ipcRenderer.invoke('window:get-detached-panels'),
        focus: (windowId: string) => ipcRenderer.invoke('window:focus', windowId),
        moveToScreen: (windowId: string, screenIndex: number) =>
            ipcRenderer.invoke('window:move-to-screen', { windowId, screenIndex }),
        getScreens: () => ipcRenderer.invoke('window:get-screens'),
        onPanelClosed: (callback: (data: { id: string; panelType: string }) => void) => {
            ipcRenderer.on('window:panel-closed', (_event, value) => callback(value));
            return () => ipcRenderer.removeAllListeners('window:panel-closed');
        },
    },
    state: {
        set: (key: string, data: any) => ipcRenderer.invoke('state:set', { key, data }),
        get: (key: string) => ipcRenderer.invoke('state:get', key),
        getAll: () => ipcRenderer.invoke('state:getAll'),
        broadcast: (channel: string, data: any) => ipcRenderer.invoke('state:broadcast', { channel, data }),
        onUpdate: (callback: (data: { key: string; data: any }) => void) => {
            const handler = (_event: any, value: any) => callback(value);
            ipcRenderer.on('state:update', handler);
            return () => ipcRenderer.removeListener('state:update', handler);
        },
        onSync: (channel: string, callback: (data: any) => void) => {
            const handler = (_event: any, value: any) => callback(value);
            ipcRenderer.on(`state:${channel}`, handler);
            return () => ipcRenderer.removeListener(`state:${channel}`, handler);
        },
    },
    docs: {
        read: (docPath: string) => ipcRenderer.invoke('docs:read', docPath),
        list: () => ipcRenderer.invoke('docs:list'),
    }
});
