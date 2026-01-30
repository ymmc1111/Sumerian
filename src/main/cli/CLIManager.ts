import * as pty from 'node-pty';
import * as os from 'os';
import * as path from 'path';
import { CLIConfig, CLIOutput, ConnectionStatus, CLIManagerEvents } from './types';

export class CLIManager {
    private ptyProcess: pty.IPty | null = null;
    private config: CLIConfig;
    private events: CLIManagerEvents;
    private status: ConnectionStatus = ConnectionStatus.DISCONNECTED;

    constructor(projectRoot: string, events: CLIManagerEvents) {
        this.events = events;
        this.config = {
            executable: 'claude', // Assumes 'claude' is in PATH
            args: ['--output-format', 'stream-json'],
            cwd: projectRoot,
            env: {
                ...process.env,
                CLAUDE_CONFIG_DIR: path.join(os.homedir(), '.claude')
            }
        };
    }

    private watchdogTimer: NodeJS.Timeout | null = null;
    private restartCount = 0;
    private readonly MAX_RESTARTS = 3;
    private readonly WATCHDOG_TIMEOUT = 30000;

    public spawn(braveMode: boolean = false, initialContext?: string): void {
        if (this.ptyProcess) {
            this.kill();
        }

        const args = [...this.config.args];
        if (braveMode) {
            args.push('--dangerously-skip-permissions');
        }

        this.setStatus(ConnectionStatus.CONNECTING);

        try {
            this.ptyProcess = pty.spawn(this.config.executable, args, {
                name: 'xterm-color',
                cols: 80,
                rows: 30,
                cwd: this.config.cwd,
                env: this.config.env as any
            });

            this.ptyProcess.onData((data) => {
                this.resetWatchdog();
                this.events.onOutput({
                    stream: 'stdout',
                    content: data,
                    timestamp: Date.now()
                });
            });

            this.ptyProcess.onExit(({ exitCode, signal }) => {
                this.stopWatchdog();
                this.ptyProcess = null;
                this.setStatus(ConnectionStatus.DISCONNECTED);
                this.events.onExit(exitCode, signal);

                // Optional: Auto-restart on unexpected exit
                if (exitCode !== 0 && this.restartCount < this.MAX_RESTARTS) {
                    this.restartCount++;
                    console.log(`Auto-restarting CLI (${this.restartCount}/${this.MAX_RESTARTS})...`);
                    this.spawn(braveMode, initialContext);
                }
            });

            this.setStatus(ConnectionStatus.CONNECTED);
            this.startWatchdog();
            this.restartCount = 0;

            if (initialContext) {
                // Give it a tiny bit of time to settle before sending context
                setTimeout(() => {
                    this.write(initialContext + '\n');
                }, 1000);
            }
        } catch (error) {
            console.error('Failed to spawn CLI process:', error);
            this.setStatus(ConnectionStatus.ERROR);
        }
    }

    private startWatchdog(): void {
        this.stopWatchdog();
        this.watchdogTimer = setInterval(() => {
            console.warn('CLI Watchdog: No output for 30s. Restarting process...');
            this.spawn();
        }, this.WATCHDOG_TIMEOUT);
    }

    private resetWatchdog(): void {
        if (this.watchdogTimer) {
            clearInterval(this.watchdogTimer);
            this.startWatchdog();
        }
    }

    private stopWatchdog(): void {
        if (this.watchdogTimer) {
            clearInterval(this.watchdogTimer);
            this.watchdogTimer = null;
        }
    }


    public write(data: string): void {
        if (!this.ptyProcess) {
            console.error('Cannot write to CLI: process not running');
            return;
        }
        this.ptyProcess.write(data);
    }

    public kill(): void {
        if (this.ptyProcess) {
            this.ptyProcess.kill();
            this.ptyProcess = null;
            this.setStatus(ConnectionStatus.DISCONNECTED);
        }
    }

    public getStatus(): ConnectionStatus {
        return this.status;
    }

    private setStatus(status: ConnectionStatus): void {
        this.status = status;
        this.events.onStatusChange(status);
    }

    public getRelativePath(absolutePath: string): string {
        return path.relative(this.config.cwd, absolutePath);
    }
}
