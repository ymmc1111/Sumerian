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

export interface LoopConfig {
    prompt: string;
    completionPromise: string;
    maxIterations: number;
}

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

export interface CompletionReport {
    result: string;
    filesModified: string[];
    duration: number;
    usage: { input: number; output: number };
    error?: string;
}

export interface AgentInstance {
    id: string;
    persona: {
        id: string;
        model: string;
        systemPrompt: string;
        allowedTools: string[];
        disallowedTools: string[];
        maxBudgetUsd?: number;
    };
    status: 'idle' | 'active' | 'complete' | 'error';
    task: string;
    startTime: number;
    lockedFiles: string[];
    messageHistory: Message[];
    completionReport?: CompletionReport;
    resources?: {
        cpuHistory: number[];
        memoryHistory: number[];
        lastUpdate: number;
    };
}

export interface Task {
    id: string;
    persona: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    status: 'queued' | 'assigned' | 'complete';
    assignedAgentId?: string;
}

export interface DelegationProposal {
    id: string;
    persona: {
        id: string;
        model: string;
        systemPrompt: string;
        allowedTools: string[];
        disallowedTools: string[];
        maxBudgetUsd?: number;
    };
    model: string;
    task: string;
    files: string[];
    estimatedCost?: number;
}

export interface QueuedTask {
    id: string;
    type: 'message' | 'loop' | 'spawn';
    content: string;
    config?: any;
    status: 'pending' | 'active' | 'complete' | 'error';
    createdAt: number;
}

export interface WorkforceState {
    activeAgents: Map<string, AgentInstance>;
    taskQueue: Task[];
    pendingProposal: DelegationProposal | null;
    queuedTasks: QueuedTask[];
    queueActive: boolean;
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
    loopActive: boolean;
    loopConfig: LoopConfig | null;
    loopIteration: number;
    autopilotMode: boolean;
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
    isProjectSwitcherOpen: boolean;
    isDocsViewerOpen: boolean;
    activeDocId?: string;
    terminals: TerminalInstance[];
    activeTerminalId: string | null;
    settings: {
        fontSize: number;
        theme: 'dark';
        braveModeByDefault: boolean;
        isSettingsOpen: boolean;
        terminalMirroring: 'none' | 'raw' | 'formatted';
        maxBudgetUsd?: number;
        mcpConfigPath?: string;
        additionalDirs?: string[];
    };
}

export interface ProjectState {
    rootPath: string | null;
    fileTree: FileNode[];
    recentProjects: string[];
}

export interface EditorGroup {
    id: string;
    openFiles: OpenFile[];
    activeFileId: string | null;
}

export type EditorLayout = 'single' | 'split-horizontal' | 'split-vertical';

export interface EditorState {
    openFiles: OpenFile[];
    activeFileId: string | null;
    groups: EditorGroup[];
    activeGroupId: string;
    layout: EditorLayout;
}

export interface AppState {
    ui: UIState;
    project: ProjectState;
    editor: EditorState;
    agent: AgentState;
    workforce: WorkforceState;

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
    toggleProjectSwitcher: () => void;
    toggleDocsViewer: () => void;
    openDocsWithTopic: (docId: string) => void;
    updateSettings: (settings: Partial<UIState['settings']>) => void;
    toggleSettings: () => void;

    // Project Actions
    setRootPath: (path: string | null) => Promise<void>;
    setFileTree: (tree: FileNode[]) => void;
    refreshFileTree: () => Promise<void>;
    selectProject: () => Promise<void>;
    loadRecentProjects: () => Promise<void>;

    // Editor Actions
    openFile: (path: string, groupId?: string) => Promise<void>;
    closeFile: (id: string) => void;
    setActiveFile: (id: string | null) => void;
    setFileContent: (id: string, content: string) => void;
    saveFile: (id: string) => Promise<void>;
    splitEditor: (direction: 'horizontal' | 'vertical') => void;
    closeEditorGroup: (groupId: string) => void;
    setActiveGroup: (groupId: string) => void;
    moveFileToGroup: (fileId: string, targetGroupId: string) => void;

    // Agent Actions
    sendMessage: (content: string, images?: string[]) => Promise<void>;
    addAgentMessage: (content: string) => void;
    updateLastAgentMessage: (content: string) => void;
    setAgentStatus: (status: AgentState['status']) => void;
    setBraveMode: (enabled: boolean) => void;
    setAutopilotMode: (enabled: boolean) => void;
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
    startLoop: (prompt: string, completionPromise: string, maxIterations: number) => Promise<void>;
    cancelLoop: () => Promise<void>;

    saveSession: () => Promise<void>;
    loadSession: (id: string) => Promise<void>;
    listSessions: () => Promise<any[]>;
    refreshModels: () => Promise<void>;
    forceRefreshModels: () => Promise<void>;
    init: () => Promise<void>;
    initDetached: () => Promise<void>;

    // Workforce Actions
    spawnAgent: (persona: AgentInstance['persona'], task: string, workingDir?: string) => Promise<string>;
    terminateAgent: (agentId: string) => Promise<void>;
    getAgent: (agentId: string) => AgentInstance | null;
    getAllAgents: () => AgentInstance[];
    updateAgentResources: (agentId: string, cpu: number, memory: number) => void;
    queueTask: (task: Task) => void;
    dequeueTask: (taskId: string) => void;
    proposeDelegation: (proposal: DelegationProposal) => void;
    approveDelegation: () => Promise<void>;
    rejectDelegation: () => void;
    revertAgent: (agentId: string) => Promise<boolean>;
    
    // Task Queue Actions
    addTaskToQueue: (task: QueuedTask) => void;
    removeTaskFromQueue: (taskId: string) => void;
    reorderTasks: (fromIndex: number, toIndex: number) => void;
    processNextTask: () => Promise<void>;
    setQueueActive: (active: boolean) => void;
    updateTaskStatus: (taskId: string, status: QueuedTask['status']) => void;
}
