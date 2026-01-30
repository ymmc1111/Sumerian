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
    },
    session: {
        getStatus: () => ipcRenderer.invoke('session:getStatus'),
        login: () => ipcRenderer.invoke('session:login'),
    },
    project: {
        open: (path: string) => ipcRenderer.invoke('project:open', path),
        select: () => ipcRenderer.invoke('project:select'),
        getRecent: () => ipcRenderer.invoke('project:getRecent'),
        clearRecent: () => ipcRenderer.invoke('project:clearRecent'),
    },
    terminal: {
        create: (id: string, cwd: string) => ipcRenderer.invoke('terminal:create', { id, cwd }),
        write: (id: string, data: string) => ipcRenderer.invoke('terminal:write', { id, data }),
        resize: (id: string, cols: number, rows: number) => ipcRenderer.invoke('terminal:resize', { id, cols, rows }),
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
    },
    lore: {
        list: (projectPath: string) => ipcRenderer.invoke('lore:list', projectPath),
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
    }
});
