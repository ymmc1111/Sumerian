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
}

export interface LoreFile {
    name: string;
    path: string;
    content: string;
}

export interface AgentState {
    status: 'connected' | 'disconnected' | 'connecting' | 'error';
    messages: Message[];
    braveMode: boolean;
    loreFiles: LoreFile[];
    activeFileContext: string | null;
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
    sendMessage: (content: string) => Promise<void>;
    addAgentMessage: (content: string) => void;
    updateLastAgentMessage: (content: string) => void;
    setAgentStatus: (status: AgentState['status']) => void;
    setBraveMode: (enabled: boolean) => void;
    clearHistory: () => void;
    refreshLore: () => Promise<void>;

    updateActiveFileContext: (path: string | null) => void;

    init: () => void;
}



