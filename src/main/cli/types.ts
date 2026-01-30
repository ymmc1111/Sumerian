export interface CLIConfig {
    executable: string;
    args: string[];
    cwd: string;
    env: NodeJS.ProcessEnv;
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

export interface CLIManagerEvents {
    onOutput: (output: CLIOutput) => void;
    onExit: (exitCode: number, signal?: number) => void;
    onStatusChange: (status: ConnectionStatus) => void;
    onModelsUpdated?: (models: any[]) => void;
}
