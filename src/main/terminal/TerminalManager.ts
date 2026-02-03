import * as pty from 'node-pty';
import * as os from 'os';
import { BrowserWindow } from 'electron';
import { ITerminalManager, TerminalEvents } from './terminal_types';

export class TerminalManager {
    private ptyProcesses: Map<string, pty.IPty> = new Map();

    public createTerminal(id: string, cwd: string, events: TerminalEvents): void {
        // If terminal already exists, don't create a new one
        if (this.ptyProcesses.has(id)) {
            return;
        }

        const shell = os.platform() === 'win32' ? 'powershell.exe' : process.env.SHELL || 'bash';

        let ptyProcess: pty.IPty;
        try {
            console.log(`[TerminalManager] Spawning terminal: ${shell} in ${cwd}`);
            ptyProcess = pty.spawn(shell, [], {
                name: 'xterm-color',
                cols: 80,
                rows: 24,
                cwd,
                env: process.env as any
            });
        } catch (err) {
            console.error('[TerminalManager] Failed to spawn terminal:', err);
            return;
        }

        // Broadcast data to ALL windows - each window's renderer will filter by terminal ID
        ptyProcess.onData((data) => {
            BrowserWindow.getAllWindows().forEach(win => {
                if (!win.isDestroyed()) {
                    win.webContents.send(`terminal:data:${id}`, data);
                }
            });
        });

        ptyProcess.onExit(({ exitCode, signal }) => {
            BrowserWindow.getAllWindows().forEach(win => {
                if (!win.isDestroyed()) {
                    win.webContents.send(`terminal:exit:${id}`, { code: exitCode, signal });
                }
            });
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

    public has(id: string): boolean {
        return this.ptyProcesses.has(id);
    }
}
