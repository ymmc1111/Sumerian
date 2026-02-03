export interface CLIConfig {
    executable: string;
    args: string[];
    cwd: string;
    env: NodeJS.ProcessEnv;
    maxBudgetUsd?: number;
    mcpConfigPath?: string;
    additionalDirs?: string[];
    allowedTools?: string[];
    disallowedTools?: string[];
}

export interface CLIOutput {
    stream: 'stdout' | 'stderr';
    content: string;
    timestamp: number;
}

export enum ConnectionStatus {
    CONNECTED = 'connected',
    DISCONNECTED = 'disconnected',
    CONNECTING = 'connecting',
    ERROR = 'error'
}

export interface Persona {
    id: string;
    model: string;
    systemPrompt: string;
    allowedTools: string[];
    disallowedTools: string[];
    maxBudgetUsd?: number;
}

export interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

export interface AgentProcess {
    id: string;
    persona: Persona;
    status: 'idle' | 'active' | 'complete' | 'error';
    pty: any; // IPty type
    messageHistory: Message[];
    context: {
        workingDir: string;
        lockedFiles: string[];
    };
    startTime: number;
    task: string;
    resourceInterval?: NodeJS.Timeout;
    pid?: number;
}

export interface AgentCompletionReport {
    agentId: string;
    status: 'complete' | 'error';
    result: string;
    usage?: { input: number; output: number };
    filesModified: string[];
    duration: number;
}

export interface ResourceUpdate {
    agentId: string;
    cpu: number;
    memory: number;
}

export interface CLIManagerEvents {
    onOutput: (output: CLIOutput) => void;
    onExit: (exitCode: number, signal?: number) => void;
    onStatusChange: (status: ConnectionStatus) => void;
    onModelsUpdated?: (models: any[]) => void;
    onLoopIteration?: (iteration: number, max: number) => void;
    onLoopComplete?: (reason: 'promise' | 'max_iterations' | 'cancelled') => void;
    onAgentComplete?: (report: AgentCompletionReport) => void;
    onAgentOutput?: (agentId: string, output: CLIOutput) => void;
    onResourceUpdate?: (update: ResourceUpdate) => void;
    onAssistantText?: (text: string, isStreaming: boolean, accumulatedText: string) => void;
    onToolUse?: (name: string, id: string, input: Record<string, unknown>) => void;
    onToolResult?: (toolUseId: string, content: string, isError: boolean) => void;
    onError?: (type: string, message: string) => void;
}
