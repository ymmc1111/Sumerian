export interface FileNode {
    name: string;
    path: string;
    isDirectory: boolean;
    children?: FileNode[];
    isOpen?: boolean;
}

export interface OpenFile {
    id: string; // filePath
    name: string;
    path: string;
    content: string;
    isDirty: boolean;
    language: string;
}

export interface Message {
    id: string;
    role: 'user' | 'agent';
    content: string;
    timestamp: number;
    status: 'pending' | 'sent' | 'error';
    images?: string[]; // Array of file paths or base64
}

export interface LoreFile {
    name: string;
    path: string;
    content: string;
}

export type AgentStreamStatus = 'idle' | 'thinking' | 'streaming' | 'tool_use';
export type AgentMode = 'chat' | 'code';

export interface ToolAction {
    id: string;
    name: string;
    input: Record<string, unknown>;
    timestamp: number;
    status: 'running' | 'success' | 'error';
    resultSummary?: string;
    beforeContent?: string;
    afterContent?: string;
}

export interface AgentState {
    status: 'connected' | 'disconnected' | 'connecting' | 'error';
    sessionId: string;
    model: string;
    messages: Message[];
    braveMode: boolean;
    loreFiles: LoreFile[];
    activeFileContext: string | null;
    autoContextEnabled: boolean;
    streamStatus: AgentStreamStatus;
    currentToolName: string | null;
    toolActions: ToolAction[];
    healingLoopActive: boolean;
    healingIteration: number;
    maxHealingIterations: number;
    lastHealingError: string | null;
    pinnedFiles: string[];
    lastTerminalError: string | null;
    usage: {
        input: number;
        output: number;
    } | null;
    mode: AgentMode;
    availableModels: CLIModel[];
}

export interface CLIModel {
    id: string;
    name: string;
    description: string;
    default?: boolean;
}

export interface TerminalInstance {
    id: string;
    name: string;
}

export interface UIState {
    sidebarWidth: number;
    agentPanelWidth: number;
    terminalHeight: number;
    isTerminalVisible: boolean;
    activePanel: 'editor' | 'agent' | 'terminal';
    isCommandPaletteOpen: boolean;
    isShortcutsHelpOpen: boolean;
    terminals: TerminalInstance[];
    activeTerminalId: string | null;
    settings: {
        fontSize: number;
        theme: 'dark';
        braveModeByDefault: boolean;
        isSettingsOpen: boolean;
        terminalMirroring: 'none' | 'raw' | 'formatted';
    };
}

export interface ProjectState {
    rootPath: string | null;
    fileTree: FileNode[];
    recentProjects: string[];
}

export interface EditorState {
    openFiles: OpenFile[];
    activeFileId: string | null;
}

export interface AppState {
    ui: UIState;
    project: ProjectState;
    editor: EditorState;
    agent: AgentState;

    // UI Actions
    setSidebarWidth: (width: number) => void;
    setAgentPanelWidth: (width: number) => void;
    setTerminalHeight: (height: number) => void;
    toggleTerminal: () => void;
    setActivePanel: (panel: 'editor' | 'agent' | 'terminal') => void;
    createTerminal: (name?: string) => void;
    closeTerminal: (id: string) => void;
    setActiveTerminal: (id: string) => void;
    toggleCommandPalette: () => void;
    toggleShortcutsHelp: () => void;
    updateSettings: (settings: Partial<UIState['settings']>) => void;
    toggleSettings: () => void;

    // Project Actions
    setRootPath: (path: string | null) => Promise<void>;
    setFileTree: (tree: FileNode[]) => void;
    refreshFileTree: () => Promise<void>;
    selectProject: () => Promise<void>;
    loadRecentProjects: () => Promise<void>;

    // Editor Actions
    openFile: (path: string) => Promise<void>;
    closeFile: (id: string) => void;
    setActiveFile: (id: string | null) => void;
    setFileContent: (id: string, content: string) => void;
    saveFile: (id: string) => Promise<void>;

    // Agent Actions
    sendMessage: (content: string, images?: string[]) => Promise<void>;
    addAgentMessage: (content: string) => void;
    updateLastAgentMessage: (content: string) => void;
    setAgentStatus: (status: AgentState['status']) => void;
    setBraveMode: (enabled: boolean) => void;
    setModel: (model: string) => void;
    setMode: (mode: AgentMode) => void;
    setAutoContextEnabled: (enabled: boolean) => void;
    clearHistory: () => void;
    refreshLore: () => Promise<void>;
    setStreamStatus: (status: AgentStreamStatus, toolName?: string | null) => void;
    addToolAction: (name: string, id: string, input: Record<string, unknown>) => void;
    updateToolActionStatus: (id: string, status: 'success' | 'error', resultSummary?: string) => void;

    updateActiveFileContext: (path: string | null) => void;
    interruptHealingLoop: () => void;
    pruneHistory: () => void;
    toggleFilePin: (path: string) => void;
    clearTerminalError: () => void;

    saveSession: () => Promise<void>;
    loadSession: (id: string) => Promise<void>;
    listSessions: () => Promise<any[]>;
    refreshModels: () => Promise<void>;
    forceRefreshModels: () => Promise<void>;
    init: () => void;
}
