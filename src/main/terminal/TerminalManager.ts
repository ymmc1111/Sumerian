import * as pty from 'node-pty';
import * as os from 'os';
import { ITerminalManager, TerminalEvents } from './terminal_types';

export class TerminalManager {
    private ptyProcesses: Map<string, pty.IPty> = new Map();

    public createTerminal(id: string, cwd: string, events: TerminalEvents): void {
        const shell = os.platform() === 'win32' ? 'powershell.exe' : process.env.SHELL || 'bash';

        const ptyProcess = pty.spawn(shell, [], {
            name: 'xterm-color',
            cols: 80,
            rows: 24,
            cwd,
            env: process.env as any
        });

        ptyProcess.onData((data) => {
            events.onData(data);
        });

        ptyProcess.onExit(({ exitCode, signal }) => {
            events.onExit(exitCode, signal);
            this.ptyProcesses.delete(id);
        });

        this.ptyProcesses.set(id, ptyProcess);
    }

    public write(id: string, data: string): void {
        const ptyProcess = this.ptyProcesses.get(id);
        if (ptyProcess) {
            ptyProcess.write(data);
        }
    }

    public resize(id: string, cols: number, rows: number): void {
        const ptyProcess = this.ptyProcesses.get(id);
        if (ptyProcess) {
            ptyProcess.resize(cols, rows);
        }
    }

    public kill(id: string): void {
        const ptyProcess = this.ptyProcesses.get(id);
        if (ptyProcess) {
            ptyProcess.kill();
            this.ptyProcesses.delete(id);
        }
    }

    public killAll(): void {
        for (const [id, ptyProcess] of this.ptyProcesses) {
            ptyProcess.kill();
        }
        this.ptyProcesses.clear();
    }
}
