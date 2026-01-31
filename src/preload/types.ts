export interface ProjectEntry {
    path: string;
    name: string;
    lastOpened: number;
    lastSessionId?: string;
    configOverrides?: ProjectConfigOverrides;
}

export interface ProjectConfigOverrides {
    braveMode?: boolean;
    model?: string;
    mcpConfigPath?: string;
    additionalDirs?: string[];
    allowedTools?: string[];
    disallowedTools?: string[];
}

export interface ProjectConfig {
    version: 1;
    name?: string;
    braveMode?: boolean;
    model?: string;
    mcpConfigPath?: string;
    additionalDirs?: string[];
    allowedTools?: string[];
    disallowedTools?: string[];
}

export interface SumerianAPI {
    system: {
        getVersion: () => string;
    };
    cli: {
        send: (content: string, braveMode: boolean) => Promise<void>;
        setBraveMode: (enabled: boolean) => Promise<boolean>;
        getStatus: () => Promise<string>;
        onOutput: (callback: (output: any) => void) => () => void;
        onStatusChange: (callback: (status: any) => void) => () => void;
        onExit: (callback: (info: any) => void) => () => void;
        updateActiveFileContext: (path: string | null) => Promise<void>;
        onAssistantMessage: (callback: (data: { text: string; isStreaming: boolean }) => void) => () => void;
        onToolAction: (callback: (data: { type: 'use' | 'result'; name?: string; id: string; input?: Record<string, unknown>; content?: string; isError?: boolean }) => void) => () => void;
        onAgentStatus: (callback: (data: { status: string; result?: string; usage?: { input: number; output: number }; type?: string; message?: string }) => void) => () => void;
        setModel: (model: string) => Promise<boolean>;
        setMaxBudgetUsd: (budget: number | null) => Promise<boolean>;
        setMcpConfigPath: (path: string | null) => Promise<boolean>;
        setAdditionalDirs: (dirs: string[]) => Promise<boolean>;
        setAllowedTools: (tools: string[]) => Promise<boolean>;
        setDisallowedTools: (tools: string[]) => Promise<boolean>;
        listModels: () => Promise<any[]>;
        refreshModels: () => Promise<boolean>;
        onModelsUpdated: (callback: (models: any[]) => void) => () => void;
        startLoop: (prompt: string, completionPromise: string, maxIterations: number) => Promise<boolean>;
        cancelLoop: () => Promise<boolean>;
        onLoopIteration: (callback: (data: { iteration: number; max: number }) => void) => () => void;
        onLoopComplete: (callback: (data: { reason: 'promise' | 'max_iterations' | 'cancelled' }) => void) => () => void;
        spawnAgent: (persona: any, task: string, workingDir?: string) => Promise<string>;
        terminateAgent: (agentId: string) => Promise<boolean>;
        getAgent: (agentId: string) => Promise<any>;
        getAllAgents: () => Promise<any[]>;
        killAll: () => Promise<boolean>;
        onResourceUpdate: (callback: (data: { agentId: string; cpu: number; memory: number }) => void) => () => void;
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
        listRecent: (limit?: number) => Promise<ProjectEntry[]>;
        get: (path: string) => Promise<ProjectEntry | null>;
        remove: (path: string) => Promise<boolean>;
        updateConfig: (path: string, config: ProjectConfigOverrides) => Promise<boolean>;
        loadConfig: (path: string) => Promise<ProjectConfig | null>;
        saveConfig: (path: string, config: ProjectConfig) => Promise<boolean>;
        updateSession: (path: string, sessionId: string) => Promise<boolean>;
    };
    terminal: {
        create: (id: string, cwd: string) => Promise<boolean>;
        write: (id: string, data: string) => Promise<void>;
        resize: (id: string, cols: number, rows: number) => Promise<void>;
        kill: (id: string) => Promise<boolean>;
        onData: (id: string, callback: (data: string) => void) => () => void;
        onExit: (id: string, callback: (info: any) => void) => () => void;
    };
    files: {
        read: (path: string) => Promise<string>;
        write: (path: string, content: string) => Promise<void>;
        list: (path: string) => Promise<any[]>;
        delete: (path: string) => Promise<boolean>;
        undo: () => Promise<boolean>;
        watch: (path: string) => Promise<void>;
        onChanged: (callback: (event: any) => void) => () => void;
        saveImage: (path: string, base64Data: string) => Promise<string>;
        createCheckpoint: (label: string, files: string[]) => Promise<string>;
        listCheckpoints: () => Promise<any[]>;
        rollbackToCheckpoint: (checkpointId: string) => Promise<void>;
        deleteCheckpoint: (checkpointId: string) => Promise<void>;
    };
    lore: {
        list: (projectPath: string) => Promise<any[]>;
    };
    memory: {
        read: (projectPath: string) => Promise<string>;
        write: (projectPath: string, content: string) => Promise<boolean>;
        append: (projectPath: string, entry: string) => Promise<boolean>;
        clear: (projectPath: string) => Promise<boolean>;
    };
    preferences: {
        get: () => Promise<any>;
        set: (prefs: any) => Promise<any>;
    };
    window: {
        detachPanel: (panelType: string, bounds?: { x: number; y: number; width: number; height: number }) => Promise<string>;
        reattachPanel: (windowId: string) => Promise<boolean>;
        getDetachedPanels: () => Promise<Array<{ id: string; panelType: string }>>;
        focus: (windowId: string) => Promise<boolean>;
        moveToScreen: (windowId: string, screenIndex: number) => Promise<boolean>;
        getScreens: () => Promise<Array<{ index: number; label: string; bounds: { x: number; y: number; width: number; height: number } }>>;
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
    docs: {
        read: (docPath: string) => Promise<string>;
        list: () => Promise<Array<{ id: string; title: string; path: string }>>;
    };
}

declare global {
    interface Window {
        sumerian: SumerianAPI;
    }
}
