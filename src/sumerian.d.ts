export interface SumerianAPI {
    system: {
        getVersion: () => string;
    };
    cli: {
        send: (content: string, braveMode: boolean) => Promise<void>;
        setBraveMode: (enabled: boolean) => Promise<boolean>;
        getStatus: () => Promise<any>;
        onOutput: (callback: (output: any) => void) => () => void;
        onStatusChange: (callback: (status: any) => void) => () => void;
        onExit: (callback: (info: any) => void) => () => void;
        updateActiveFileContext: (path: string | null) => Promise<void>;
        onAssistantMessage: (callback: (data: { text: string; isStreaming: boolean }) => void) => () => void;
        onToolAction: (callback: (data: { type: 'use' | 'result'; name?: string; id: string; input?: Record<string, unknown>; content?: string; isError?: boolean }) => void) => () => void;
        onAgentStatus: (callback: (data: { status: string; result?: string; usage?: { input: number; output: number }; type?: string; message?: string }) => void) => () => void;
        setModel: (model: string) => Promise<boolean>;
        listModels: () => Promise<any[]>;
    };
    session: {
        getStatus: () => Promise<any>;
        login: () => Promise<boolean>;
        save: (data: any) => Promise<boolean>;
        load: (id: string) => Promise<any>;
        getLatestId: () => Promise<string | null>;
        list: () => Promise<any[]>;
        delete: (id: string) => Promise<boolean>;
    };
    project: {
        open: (path: string) => Promise<boolean>;
        select: () => Promise<string | null>;
        getRecent: () => Promise<string[]>;
        clearRecent: () => Promise<boolean>;
    };
    terminal: {
        create: (id: string, cwd: string) => Promise<boolean>;
        write: (id: string, data: string) => Promise<void>;
        resize: (id: string, cols: number, rows: number) => Promise<void>;
        onData: (id: string, callback: (data: string) => void) => () => void;
        onExit: (id: string, callback: (info: any) => void) => () => void;
    };
    files: {
        read: (path: string) => Promise<string>;
        write: (path: string, content: string) => Promise<boolean>;
        list: (path: string) => Promise<any[]>;
        delete: (path: string) => Promise<boolean>;
        undo: () => Promise<boolean>;
        watch: (path: string) => Promise<boolean>;
        onChanged: (callback: (event: any) => void) => () => void;
        saveImage: (path: string, base64Data: string) => Promise<string>;
    };
    lore: {
        list: (projectPath: string) => Promise<any[]>;
    };
    preferences: {
        get: () => Promise<any>;
        set: (prefs: any) => Promise<any>;
    };
    window: {
        detachPanel: (panelType: string, bounds?: { x: number; y: number; width: number; height: number }) => Promise<string>;
        reattachPanel: (windowId: string) => Promise<boolean>;
        getDetachedPanels: () => Promise<any[]>;
        focus: (windowId: string) => Promise<void>;
        moveToScreen: (windowId: string, screenIndex: number) => Promise<void>;
        getScreens: () => Promise<any[]>;
        onPanelClosed: (callback: (data: { id: string; panelType: string }) => void) => () => void;
    };
    state: {
        set: (key: string, data: any) => Promise<void>;
        get: (key: string) => Promise<any>;
        getAll: () => Promise<any>;
        broadcast: (channel: string, data: any) => Promise<void>;
        onUpdate: (callback: (data: { key: string; data: any }) => void) => () => void;
        onSync: (channel: string, callback: (data: any) => void) => () => void;
    };
}

declare global {
    interface Window {
        sumerian: SumerianAPI;
    }
}
