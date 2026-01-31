import * as pty from 'node-pty';
import * as os from 'os';
import * as path from 'path';
import { execSync, exec } from 'child_process';
import { app } from 'electron';
import * as fs from 'fs/promises';
import { existsSync } from 'fs';
import { CLIConfig, CLIOutput, ConnectionStatus, CLIManagerEvents, AgentProcess, Persona, Message } from './types';
import { resolveClaudePathSync } from './resolveClaudePath';
import { CLIOutputParser } from './CLIOutputParser';
import { WorkforceSync } from '../workforce/WorkforceSync';

function getShellPath(): string {
    try {
        const shell = process.env.SHELL || '/bin/zsh';
        return execSync(`${shell} -ilc "echo \\$PATH"`, { encoding: 'utf8', timeout: 3000 }).trim();
    } catch {
        return process.env.PATH || '';
    }
}

export class CLIManager {
    private agentPool: Map<string, AgentProcess> = new Map();
    private mainAgentId: string = 'main';
    private currentAgentId: string = 'main';
    private config: CLIConfig;
    private events: CLIManagerEvents;
    private status: ConnectionStatus = ConnectionStatus.DISCONNECTED;
    private braveMode: boolean = false;
    private model: string = 'claude-sonnet-4-5-20250929';
    private isFirstMessage: boolean = true;
    private parser: CLIOutputParser;
    private static readonly MODELS_CACHE_FILE = path.join(app.getPath('home'), '.sumerian', 'models-cache.json');
    private isRefreshingModels: boolean = false;
    private loopPrompt: string | null = null;
    private loopPromise: string | null = null;
    private loopMaxIterations: number = 0;
    private loopCurrentIteration: number = 0;
    private loopActive: boolean = false;
    private workforceSync: WorkforceSync;
    private mcpConfigPath: string | null = null;

    constructor(projectRoot: string, events: CLIManagerEvents) {
        this.events = events;
        this.parser = new CLIOutputParser();
        this.setupParserEvents();
        this.workforceSync = new WorkforceSync(projectRoot);
        const shellPath = getShellPath();
        console.log('[CLIManager] Using shell PATH:', shellPath.substring(0, 100) + '...');
        
        // Check for MCP config (project-specific overrides global)
        const projectMcpPath = path.join(projectRoot, '.sumerian', 'mcp-config.json');
        const globalMcpPath = path.join(app.getPath('home'), '.sumerian', 'mcp-config.json');
        
        if (existsSync(projectMcpPath)) {
            this.mcpConfigPath = projectMcpPath;
            console.log('[CLIManager] Using project MCP config:', projectMcpPath);
        } else if (existsSync(globalMcpPath)) {
            this.mcpConfigPath = globalMcpPath;
            console.log('[CLIManager] Using global MCP config:', globalMcpPath);
        }
        
        const baseArgs = ['-p', '--output-format', 'stream-json', '--verbose'];
        const mcpArgs = this.mcpConfigPath ? ['--mcp-config', this.mcpConfigPath] : [];
        
        this.config = {
            executable: resolveClaudePathSync(),
            args: [...baseArgs, ...mcpArgs],
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
        this.currentAgentId = this.mainAgentId;
        this.setStatus(ConnectionStatus.CONNECTED);
        console.log('[CLIManager] Ready in print mode. Brave mode:', braveMode);

        // If there's initial context, send it as the first message
        if (initialContext) {
            this.sendMessage(initialContext);
        }
    }

    public spawnAgent(persona: Persona, task: string, workingDir?: string): string {
        const agentId = `sumerian-agent-${Date.now()}`;
        console.log('[CLIManager] Spawning agent:', agentId, 'persona:', persona.id, 'task:', task);

        const agent: AgentProcess = {
            id: agentId,
            persona,
            status: 'idle',
            pty: null as any,
            messageHistory: [],
            context: {
                workingDir: workingDir || this.config.cwd,
                lockedFiles: []
            },
            startTime: Date.now(),
            task
        };

        this.agentPool.set(agentId, agent);
        
        // Register agent with workforce sync
        this.workforceSync.registerAgent(agentId).catch(err => {
            console.error('[CLIManager] Failed to register agent:', err);
        });
        
        // Start the agent with the task
        this.sendAgentMessage(agentId, task);
        
        return agentId;
    }

    public terminateAgent(agentId: string): void {
        const agent = this.agentPool.get(agentId);
        if (agent) {
            console.log('[CLIManager] Terminating agent:', agentId);
            if (agent.pty) {
                agent.pty.kill();
            }
            
            // Stop resource monitoring
            this.stopResourceMonitoring(agentId);
            
            // Unregister from workforce sync (unlocks all files)
            this.workforceSync.unregisterAgent(agentId).catch(err => {
                console.error('[CLIManager] Failed to unregister agent:', err);
            });
            
            this.agentPool.delete(agentId);
        }
    }

    public getAgent(agentId: string): AgentProcess | null {
        return this.agentPool.get(agentId) || null;
    }

    public getAllAgents(): AgentProcess[] {
        return Array.from(this.agentPool.values());
    }

    public sendMessage(prompt: string): void {
        this.sendAgentMessage(this.mainAgentId, prompt);
    }

    private sendAgentMessage(agentId: string, prompt: string): void {
        const agent = this.agentPool.get(agentId);
        const isMainAgent = agentId === this.mainAgentId;
        
        // For main agent, use existing ptyProcess logic for backward compatibility
        if (isMainAgent && agent && agent.pty) {
            agent.pty.kill();
            agent.pty = null;
        } else if (agent && agent.pty) {
            agent.pty.kill();
            agent.pty = null;
        }

        this.currentAgentId = agentId;

        const args = [...this.config.args];

        // Use --continue for subsequent messages to maintain context
        // For main agent, use isFirstMessage; for spawned agents, check message history
        const isFirst = isMainAgent ? this.isFirstMessage : (!agent || agent.messageHistory.length === 0);
        if (!isFirst) {
            args.push('--continue');
        }
        if (isMainAgent) {
            this.isFirstMessage = false;
        }

        // Use brave mode for main agent, or persona config for spawned agents
        const useBraveMode = isMainAgent ? this.braveMode : true; // Spawned agents always use brave mode
        if (useBraveMode) {
            args.push('--dangerously-skip-permissions');
        }

        // Use model from persona if spawned agent, otherwise use main model
        let finalModel = agent && agent.persona ? agent.persona.model : this.model;
        let isThinking = false;
        if (finalModel.endsWith('-thinking')) {
            finalModel = finalModel.replace('-thinking', '');
            isThinking = true;
        }

        // Detect thinking mode from prompt prefix
        const thinkingPrefixes = ['[ultrathink]', '[think harder]', '[think hard]', '[think]'];
        for (const prefix of thinkingPrefixes) {
            if (prompt.toLowerCase().startsWith(prefix.toLowerCase())) {
                isThinking = true;
                prompt = prompt.substring(prefix.length).trim();
                break;
            }
        }

        // Add model if not auto
        if (finalModel && finalModel !== 'auto') {
            args.push('--model', finalModel);
        }

        // Add thinking flag if requested (all levels use same flag)
        if (isThinking) {
            args.push('--think');
        }

        // Add budget limit from persona or config
        const budgetLimit = (agent && agent.persona && agent.persona.maxBudgetUsd) || this.config.maxBudgetUsd;
        if (budgetLimit) {
            args.push('--max-budget-usd', budgetLimit.toString());
        }

        // Add MCP config if configured
        if (this.config.mcpConfigPath) {
            args.push('--mcp-config', this.config.mcpConfigPath);
        }

        // Add additional directories if configured
        if (this.config.additionalDirs && this.config.additionalDirs.length > 0) {
            this.config.additionalDirs.forEach(dir => {
                args.push('--add-dir', dir);
            });
        }

        // Add tool restrictions from persona or config
        const disallowedTools = (agent && agent.persona && agent.persona.disallowedTools.length > 0) 
            ? agent.persona.disallowedTools 
            : this.config.disallowedTools;
        const allowedTools = (agent && agent.persona && agent.persona.allowedTools.length > 0) 
            ? agent.persona.allowedTools 
            : this.config.allowedTools;

        if (disallowedTools && disallowedTools.length > 0) {
            args.push('--disallowedTools', disallowedTools.join(','));
        }

        if (allowedTools && allowedTools.length > 0 && !allowedTools.includes('*')) {
            args.push('--allowedTools', allowedTools.join(','));
        }

        // Add the prompt as the final argument
        args.push(prompt);

        this.setStatus(ConnectionStatus.CONNECTING);

        try {
            console.log('[CLIManager] Sending message for agent:', agentId, this.config.executable, args.slice(0, 5).join(' ') + '...');

            const workingDir = agent ? agent.context.workingDir : this.config.cwd;
            const ptyProcess = pty.spawn(this.config.executable, args, {
                name: 'xterm-color',
                cols: 120,
                rows: 30,
                cwd: workingDir,
                env: this.config.env as any
            });

            console.log('[CLIManager] Process spawned with PID:', ptyProcess.pid, 'for agent:', agentId);
            
            // Store pty in agent or create main agent entry
            if (!agent) {
                // Create main agent entry if it doesn't exist
                const mainAgent: AgentProcess = {
                    id: this.mainAgentId,
                    persona: {
                        id: 'main',
                        model: this.model,
                        systemPrompt: '',
                        allowedTools: ['*'],
                        disallowedTools: []
                    },
                    status: 'active',
                    pty: ptyProcess,
                    messageHistory: [{ role: 'user', content: prompt, timestamp: Date.now() }],
                    context: {
                        workingDir: this.config.cwd,
                        lockedFiles: []
                    },
                    startTime: Date.now(),
                    task: 'main',
                    pid: ptyProcess.pid
                };
                this.agentPool.set(this.mainAgentId, mainAgent);
                
                // Start resource monitoring for main agent
                this.startResourceMonitoring(this.mainAgentId);
            } else {
                agent.pty = ptyProcess;
                agent.status = 'active';
                agent.pid = ptyProcess.pid;
                agent.messageHistory.push({ role: 'user', content: prompt, timestamp: Date.now() });
                
                // Start resource monitoring for spawned agent
                if (agentId !== this.mainAgentId) {
                    this.startResourceMonitoring(agentId);
                }
            }
            
            this.setStatus(ConnectionStatus.CONNECTED);

            ptyProcess.onData((data) => {
                console.log('[CLIManager] Data received for agent:', agentId, data.substring(0, 100));
                // Send raw output for terminal mirroring
                const output: CLIOutput = {
                    stream: 'stdout',
                    content: data,
                    timestamp: Date.now()
                };
                
                // Send to main output handler (for backward compatibility)
                this.events.onOutput(output);
                
                // Also send agent-specific output if handler exists
                if (this.events.onAgentOutput) {
                    this.events.onAgentOutput(agentId, output);
                }
                
                // Parse for typed events
                this.parser.parse(data);
            });

            ptyProcess.onExit(({ exitCode, signal }) => {
                console.log('[CLIManager] Process exited for agent:', agentId, exitCode, signal);
                this.parser.flush();
                
                const currentAgent = this.agentPool.get(agentId);
                if (currentAgent) {
                    currentAgent.pty = null;
                    currentAgent.status = exitCode === 0 ? 'complete' : 'error';
                }
                
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
        const mainAgent = this.agentPool.get(this.mainAgentId);
        if (mainAgent && mainAgent.pty) {
            mainAgent.pty.kill();
            mainAgent.pty = null;
        }
        this.setStatus(ConnectionStatus.DISCONNECTED);
    }

    public setModel(model: string): void {
        this.model = model;
    }

    public setBraveMode(enabled: boolean): void {
        this.braveMode = enabled;
        console.log('[CLIManager] Brave mode updated:', enabled);
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
            
            const agentId = this.currentAgentId;
            const agent = this.agentPool.get(agentId);
            
            // Handle agent completion for non-main agents
            if (agentId !== this.mainAgentId && agent) {
                agent.status = 'complete';
                
                // Generate completion report
                const report = {
                    agentId,
                    status: 'complete' as const,
                    result: result || 'Task completed',
                    usage,
                    filesModified: agent.context.lockedFiles,
                    duration: Date.now() - agent.startTime
                };
                
                console.log('[CLIManager] Agent completed:', report);
                
                // Notify via event
                if (this.events.onAgentComplete) {
                    this.events.onAgentComplete(report);
                }
                
                // Update workforce sync status
                this.workforceSync.updateAgentStatus(agentId, 'complete').catch(err => {
                    console.error('[CLIManager] Failed to update agent status:', err);
                });
                
                // Auto-terminate after completion
                setTimeout(() => {
                    console.log('[CLIManager] Auto-terminating completed agent:', agentId);
                    this.terminateAgent(agentId);
                }, 2000); // 2s delay to allow final output to be processed
            }
            
            // If loop is active and promise wasn't detected, continue loop
            if (this.loopActive) {
                setTimeout(() => this.runLoopIteration(), 1000); // 1s delay between iterations
            }
        });
        
        this.parser.on('promiseDetected', (promise: string) => {
            console.log('[CLIManager] Promise detected:', promise);
            if (this.loopActive) {
                this.loopActive = false;
                this.parser.setPromisePattern(null);
                if (this.events.onLoopComplete) {
                    this.events.onLoopComplete('promise');
                }
            }
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

    public startLoop(prompt: string, completionPromise: string, maxIterations: number): void {
        this.loopPrompt = prompt;
        this.loopPromise = completionPromise;
        this.loopMaxIterations = maxIterations;
        this.loopCurrentIteration = 0;
        this.loopActive = true;
        
        // Set promise pattern in parser
        this.parser.setPromisePattern(completionPromise);
        
        // Start first iteration
        this.runLoopIteration();
    }

    public cancelLoop(): void {
        this.loopActive = false;
        this.loopPrompt = null;
        this.parser.setPromisePattern(null);
        if (this.events.onLoopComplete) {
            this.events.onLoopComplete('cancelled');
        }
    }

    private runLoopIteration(): void {
        if (!this.loopActive || !this.loopPrompt) return;
        
        this.loopCurrentIteration++;
        
        if (this.loopCurrentIteration > this.loopMaxIterations) {
            this.loopActive = false;
            this.parser.setPromisePattern(null);
            if (this.events.onLoopComplete) {
                this.events.onLoopComplete('max_iterations');
            }
            return;
        }
        
        if (this.events.onLoopIteration) {
            this.events.onLoopIteration(this.loopCurrentIteration, this.loopMaxIterations);
        }
        
        // Send the loop prompt
        this.sendMessage(this.loopPrompt);
    }

    public setMaxBudgetUsd(budget: number | null): void {
        if (budget !== null) {
            this.config.maxBudgetUsd = budget;
        } else {
            delete this.config.maxBudgetUsd;
        }
    }

    public setMcpConfigPath(path: string | null): void {
        this.mcpConfigPath = path;
        
        // Rebuild args array with or without MCP config
        const baseArgs = ['-p', '--output-format', 'stream-json', '--verbose'];
        const mcpArgs = this.mcpConfigPath ? ['--mcp-config', this.mcpConfigPath] : [];
        this.config.args = [...baseArgs, ...mcpArgs];
        
        console.log('[CLIManager] MCP config path updated:', this.mcpConfigPath);
        console.log('[CLIManager] CLI args:', this.config.args.join(' '));
    }

    public setAdditionalDirs(dirs: string[]): void {
        this.config.additionalDirs = dirs.length > 0 ? dirs : undefined;
    }

    public setAllowedTools(tools: string[]): void {
        this.config.allowedTools = tools.length > 0 ? tools : undefined;
    }

    public setDisallowedTools(tools: string[]): void {
        this.config.disallowedTools = tools.length > 0 ? tools : undefined;
    }

    public getWorkforceSync(): WorkforceSync {
        return this.workforceSync;
    }

    private startResourceMonitoring(agentId: string): void {
        const agent = this.agentPool.get(agentId);
        if (!agent || !agent.pid) return;

        // Clear any existing interval
        if (agent.resourceInterval) {
            clearInterval(agent.resourceInterval);
        }

        // Monitor resources every 2 seconds
        agent.resourceInterval = setInterval(() => {
            this.monitorAgentResources(agentId);
        }, 2000);

        console.log('[CLIManager] Started resource monitoring for agent:', agentId);
    }

    private stopResourceMonitoring(agentId: string): void {
        const agent = this.agentPool.get(agentId);
        if (agent && agent.resourceInterval) {
            clearInterval(agent.resourceInterval);
            agent.resourceInterval = undefined;
            console.log('[CLIManager] Stopped resource monitoring for agent:', agentId);
        }
    }

    private async monitorAgentResources(agentId: string): Promise<void> {
        const agent = this.agentPool.get(agentId);
        if (!agent || !agent.pid || agent.status === 'complete' || agent.status === 'error') {
            this.stopResourceMonitoring(agentId);
            return;
        }

        try {
            // Use ps command to get CPU and memory usage
            const { exec } = await import('child_process');
            const util = await import('util');
            const execPromise = util.promisify(exec);

            // Get CPU percentage and memory in KB
            const { stdout } = await execPromise(`ps -p ${agent.pid} -o %cpu,rss`);
            const lines = stdout.trim().split('\n');
            
            if (lines.length > 1) {
                const values = lines[1].trim().split(/\s+/);
                const cpu = parseFloat(values[0]) || 0;
                const memoryKB = parseInt(values[1]) || 0;
                const memoryMB = memoryKB / 1024;

                // Send resource update event
                if (this.events.onResourceUpdate) {
                    this.events.onResourceUpdate({
                        agentId,
                        cpu,
                        memory: memoryMB
                    });
                }
            }
        } catch (error) {
            // Process might have exited, stop monitoring
            console.log('[CLIManager] Failed to monitor resources for agent:', agentId, error);
            this.stopResourceMonitoring(agentId);
        }
    }

    public killAll(): void {
        console.log('[CLIManager] Killing all agents');
        for (const [agentId, agent] of this.agentPool.entries()) {
            if (agent.pty) {
                agent.pty.kill();
            }
            this.stopResourceMonitoring(agentId);
            
            // Unregister from workforce sync
            this.workforceSync.unregisterAgent(agentId).catch(err => {
                console.error('[CLIManager] Failed to unregister agent during killAll:', err);
            });
        }
        this.agentPool.clear();
        this.setStatus(ConnectionStatus.DISCONNECTED);
    }
}
