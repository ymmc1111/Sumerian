import * as pty from 'node-pty';
import * as os from 'os';
import * as path from 'path';
import { execSync, exec } from 'child_process';
import { app } from 'electron';
import * as fs from 'fs/promises';
import { existsSync } from 'fs';
import { CLIConfig, CLIOutput, ConnectionStatus, CLIManagerEvents } from './types';
import { resolveClaudePathSync } from './resolveClaudePath';
import { CLIOutputParser } from './CLIOutputParser';

function getShellPath(): string {
    try {
        const shell = process.env.SHELL || '/bin/zsh';
        return execSync(`${shell} -ilc "echo \\$PATH"`, { encoding: 'utf8', timeout: 3000 }).trim();
    } catch {
        return process.env.PATH || '';
    }
}

export class CLIManager {
    private ptyProcess: pty.IPty | null = null;
    private config: CLIConfig;
    private events: CLIManagerEvents;
    private status: ConnectionStatus = ConnectionStatus.DISCONNECTED;
    private braveMode: boolean = false;
    private model: string = 'claude-sonnet-4-5-20250929';
    private isFirstMessage: boolean = true;
    private parser: CLIOutputParser;
    private static readonly MODELS_CACHE_FILE = path.join(app.getPath('home'), '.sumerian', 'models-cache.json');
    private isRefreshingModels: boolean = false;

    constructor(projectRoot: string, events: CLIManagerEvents) {
        this.events = events;
        this.parser = new CLIOutputParser();
        this.setupParserEvents();
        const shellPath = getShellPath();
        console.log('[CLIManager] Using shell PATH:', shellPath.substring(0, 100) + '...');
        this.config = {
            executable: resolveClaudePathSync(),
            args: ['-p', '--output-format', 'stream-json', '--verbose'],
            cwd: projectRoot,
            env: {
                ...process.env,
                PATH: shellPath
            }
        };
    }

    public spawn(braveMode: boolean = false, initialContext?: string): void {
        this.braveMode = braveMode;
        this.isFirstMessage = true;
        this.setStatus(ConnectionStatus.CONNECTED);
        console.log('[CLIManager] Ready in print mode. Brave mode:', braveMode);

        // If there's initial context, send it as the first message
        if (initialContext) {
            this.sendMessage(initialContext);
        }
    }

    public sendMessage(prompt: string): void {
        if (this.ptyProcess) {
            // Kill any existing process before starting new one
            this.ptyProcess.kill();
            this.ptyProcess = null;
        }

        const args = [...this.config.args];

        // Use --continue for subsequent messages to maintain context
        if (!this.isFirstMessage) {
            args.push('--continue');
        }
        this.isFirstMessage = false;

        if (this.braveMode) {
            args.push('--dangerously-skip-permissions');
        }

        // Detect thinking mode
        let finalModel = this.model;
        let isThinking = false;
        if (finalModel.endsWith('-thinking')) {
            finalModel = finalModel.replace('-thinking', '');
            isThinking = true;
        }

        // Add model if not auto
        if (finalModel && finalModel !== 'auto') {
            args.push('--model', finalModel);
        }

        // Add thinking flag if requested
        if (isThinking) {
            args.push('--think');
        }

        // Add the prompt as the final argument
        args.push(prompt);

        this.setStatus(ConnectionStatus.CONNECTING);

        try {
            console.log('[CLIManager] Sending message:', this.config.executable, args.slice(0, 5).join(' ') + '...');

            this.ptyProcess = pty.spawn(this.config.executable, args, {
                name: 'xterm-color',
                cols: 120,
                rows: 30,
                cwd: this.config.cwd,
                env: this.config.env as any
            });

            console.log('[CLIManager] Process spawned with PID:', this.ptyProcess.pid);
            this.setStatus(ConnectionStatus.CONNECTED);

            this.ptyProcess.onData((data) => {
                console.log('[CLIManager] Data received:', data.substring(0, 300));
                // Send raw output for terminal mirroring
                this.events.onOutput({
                    stream: 'stdout',
                    content: data,
                    timestamp: Date.now()
                });
                // Parse for typed events
                this.parser.parse(data);
            });

            this.ptyProcess.onExit(({ exitCode, signal }) => {
                console.log('[CLIManager] Process exited:', exitCode, signal);
                this.parser.flush();
                this.ptyProcess = null;
                this.events.onExit(exitCode, signal);
            });

        } catch (error) {
            console.error('Failed to spawn CLI process:', error);
            this.setStatus(ConnectionStatus.ERROR);
        }
    }

    public write(data: string): void {
        // In print mode, we don't write to stdin - we send new messages
        // This method now triggers a new message
        const trimmed = data.trim();
        if (trimmed) {
            this.sendMessage(trimmed);
        }
    }

    public kill(): void {
        if (this.ptyProcess) {
            this.ptyProcess.kill();
            this.ptyProcess = null;
        }
        this.setStatus(ConnectionStatus.DISCONNECTED);
    }

    public setModel(model: string): void {
        this.model = model;
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

    public getParser(): CLIOutputParser {
        return this.parser;
    }

    private setupParserEvents(): void {
        this.parser.on('assistantText', (text: string, isStreaming: boolean) => {
            console.log('[CLIManager] Parser: assistantText', text.substring(0, 100));
        });

        this.parser.on('toolUse', (name: string, id: string, input: Record<string, unknown>) => {
            console.log('[CLIManager] Parser: toolUse', name, id);
        });

        this.parser.on('error', (type: string, message: string) => {
            console.error('[CLIManager] Parser: error', type, message);
        });

        this.parser.on('complete', (result: string, usage?: { input: number; output: number }) => {
            console.log('[CLIManager] Parser: complete', usage);
        });
    }

    public async listModels(): Promise<any[]> {
        const cache = await this.readModelsCache();
        const now = Date.now();
        const sevenDays = 7 * 24 * 60 * 60 * 1000;

        // If cache exists and is fresh, return it
        if (cache && (now - cache.lastUpdated < sevenDays)) {
            console.log('[CLIManager] Returning fresh models from cache');
            return cache.models;
        }

        // If cache exists but is stale, return it and trigger background refresh
        if (cache) {
            console.log('[CLIManager] Cache stale, triggering background refresh');
            this.refreshModels();
            return cache.models;
        }

        // No cache, use fallbacks and trigger refresh
        console.log('[CLIManager] No cache, using fallbacks and triggering refresh');
        this.refreshModels();
        return [
            { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5', description: 'Best for Coding/Agents', default: true },
            { id: 'claude-opus-4-5-20251101', name: 'Claude Opus 4.5', description: 'Premium Reasoning' },
            { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', description: 'Fastest / Cheapest' }
        ];
    }

    public async refreshModels(): Promise<void> {
        if (this.isRefreshingModels) return;
        this.isRefreshingModels = true;

        const executable = this.config.executable;
        const args = ['models', '--output-format', 'json'];

        console.log('[CLIManager] Background refreshing models:', executable, args.join(' '));

        exec(`${executable} ${args.join(' ')}`, {
            env: this.config.env as any,
            timeout: 15000
        }, async (error, stdout, stderr) => {
            this.isRefreshingModels = false;

            if (error) {
                console.error('[CLIManager] Background refresh failed:', error);
                return;
            }

            try {
                const models = JSON.parse(stdout);
                await this.writeModelsCache(models);
                console.log('[CLIManager] Models cache updated background');

                if (this.events.onModelsUpdated) {
                    this.events.onModelsUpdated(models);
                }
            } catch (err) {
                console.error('[CLIManager] Failed to parse background models output:', err);
            }
        });
    }

    private async readModelsCache(): Promise<{ lastUpdated: number; models: any[] } | null> {
        try {
            if (!existsSync(CLIManager.MODELS_CACHE_FILE)) return null;
            const content = await fs.readFile(CLIManager.MODELS_CACHE_FILE, 'utf-8');
            return JSON.parse(content);
        } catch (e) {
            return null;
        }
    }

    private async writeModelsCache(models: any[]): Promise<void> {
        try {
            const dir = path.dirname(CLIManager.MODELS_CACHE_FILE);
            if (!existsSync(dir)) {
                await fs.mkdir(dir, { recursive: true });
            }
            await fs.writeFile(CLIManager.MODELS_CACHE_FILE, JSON.stringify({
                lastUpdated: Date.now(),
                models
            }, null, 2));
        } catch (e) {
            console.error('[CLIManager] Failed to write models cache:', e);
        }
    }
}
