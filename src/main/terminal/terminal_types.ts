export interface TerminalEvents {
    onData: (data: string) => void;
    onExit: (exitCode: number, signal?: number) => void;
}

export interface ITerminalManager {
    createTerminal(id: string, cwd: string, events: TerminalEvents): void;
    write(id: string, data: string): void;
    resize(id: string, cols: number, rows: number): void;
    kill(id: string): void;
    killAll(): void;
}
