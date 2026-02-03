import { StateCreator } from 'zustand';
import { AppState, AgentState, AgentStreamStatus, AgentMode, Message } from './types';

export interface AgentActions {
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
}

export interface AgentSlice {
    agent: AgentState;
}

export const createAgentSlice: StateCreator<AppState, [], [], AgentSlice & AgentActions> = (set, get) => ({
    agent: {
        status: 'disconnected',
        sessionId: crypto.randomUUID(),
        model: 'auto',
        messages: [],
        braveMode: false,
        loreFiles: [],
        activeFileContext: null,
        autoContextEnabled: true,
        streamStatus: 'idle',
        currentToolName: null,
        toolActions: [],
        healingLoopActive: false,
        healingIteration: 0,
        maxHealingIterations: 5,
        lastHealingError: null,
        pinnedFiles: [],
        lastTerminalError: null,
        usage: null,
        mode: 'code',
        availableModels: [],
        loopActive: false,
        loopConfig: null,
        loopIteration: 0,
        autopilotMode: false,
        isInitialized: false,
    },

    sendMessage: async (content, images = []) => {
        let finalContent = content;

        if (images.length > 0) {
            const imageContext = images.map(img => `[IMAGE ATTACHED: ${img}]`).join('\n');
            finalContent = `${imageContext}\n\n${finalContent}`;
        }

        const { activeFileContext, autoContextEnabled, mode } = get().agent;

        if (mode === 'chat') {
            finalContent = `[PLANNING MODE] I want to discuss and plan. Please provide architectural guidance or a plan, but DO NOT use any file system or shell tools yet unless I specifically ask for a dry-run or list directory.\n\n${finalContent}`;
        } else {
            finalContent = `[CODE MODE] Please help me implement this. You are encouraged to use tools to read, write, and execute code to achieve the goal.\n\n${finalContent}`;
        }

        if (autoContextEnabled && activeFileContext) {
            try {
                const fileContent = await window.sumerian.files.read(activeFileContext);
                const fileName = activeFileContext.split(/[/\\]/).pop();
                finalContent = `Currently editing: ${fileName} (${activeFileContext})\n\n\`\`\`${fileName?.split('.').pop() || ''}\n${fileContent}\n\`\`\`\n\n${finalContent}`;
            } catch (error) {
                console.error('Failed to read active file for context:', error);
            }
        }

        const { pinnedFiles = [] } = get().agent;
        if (pinnedFiles.length > 0) {
            let pinnedContext = '\n--- PINNED CONTEXT ---\n';
            for (const path of pinnedFiles) {
                try {
                    const content = await window.sumerian.files.read(path);
                    const name = path.split(/[/\\]/).pop();
                    pinnedContext += `\nFile: ${path}\n\`\`\`${name?.split('.').pop() || ''}\n${content}\n\`\`\`\n`;
                } catch (err) {
                    console.error(`Failed to read pinned file ${path}:`, err);
                }
            }
            finalContent = pinnedContext + '\n--- END PINNED CONTEXT ---\n\n' + finalContent;
        }

        const userMessage: Message = {
            id: crypto.randomUUID(),
            role: 'user' as const,
            content,
            timestamp: Date.now(),
            status: 'sent' as const,
            images
        };

        set((state) => ({
            agent: {
                ...state.agent,
                messages: [...(state.agent.messages || []), userMessage]
            }
        }));
        get().saveSession();

        if (typeof window !== 'undefined' && window.sumerian?.state?.set && window.sumerian?.state?.get) {
            window.sumerian.state.get('agent').then((currentState: any) => {
                window.sumerian.state.set('agent', { ...currentState, messages: get().agent.messages });
            }).catch(() => {
                window.sumerian.state.set('agent', { messages: get().agent.messages });
            });
        }

        if (typeof window !== 'undefined' && window.sumerian?.state?.broadcast) {
            window.sumerian.state.broadcast('agent:message', userMessage);
        }

        try {
            await window.sumerian.cli.send(finalContent, get().agent.braveMode);
        } catch (error) {
            console.error('Failed to send message to CLI:', error);
            const errorMessage: Message = {
                id: crypto.randomUUID(),
                role: 'agent' as const,
                content: `❌ **Error**: ${error instanceof Error ? error.message : 'Failed to send message'}\n\n${error instanceof Error && error.message.includes('No project open') ? 'Please open a project folder using **⌘O** or the Command Palette.' : 'Please check the console for details.'}`,
                timestamp: Date.now(),
                status: 'error' as const
            };
            set((state) => ({
                agent: {
                    ...state.agent,
                    messages: [...(state.agent.messages || []), errorMessage]
                }
            }));
        }
    },

    addAgentMessage: (content) => {
        const agentMessage: Message = {
            id: crypto.randomUUID(),
            role: 'agent' as const,
            content,
            timestamp: Date.now(),
            status: 'sent' as const
        };
        set((state) => ({
            agent: {
                ...state.agent,
                messages: [...(state.agent.messages || []), agentMessage]
            }
        }));
        get().saveSession();

        if (typeof window !== 'undefined' && window.sumerian?.state?.set && window.sumerian?.state?.get) {
            window.sumerian.state.get('agent').then((currentState: any) => {
                window.sumerian.state.set('agent', { ...currentState, messages: get().agent.messages });
            }).catch(() => {
                window.sumerian.state.set('agent', { messages: get().agent.messages });
            });
        }

        if (typeof window !== 'undefined' && window.sumerian?.state?.broadcast) {
            window.sumerian.state.broadcast('agent:message', agentMessage);
        }
    },

    updateLastAgentMessage: (content) => {
        console.log('[updateLastAgentMessage] Content chunk length:', content.length);
        set((state) => {
            const messages = [...(state.agent.messages || [])];
            const lastIndex = messages.findLastIndex(m => m.role === 'agent');
            if (lastIndex !== -1) {
                messages[lastIndex] = {
                    ...messages[lastIndex],
                    content: messages[lastIndex].content + content
                };
            } else {
                console.log('[updateLastAgentMessage] Creating new agent message');
                messages.push({
                    id: crypto.randomUUID(),
                    role: 'agent' as const,
                    content,
                    timestamp: Date.now(),
                    status: 'sent' as const
                });
            }
            return { agent: { ...state.agent, messages } };
        });
        get().saveSession();

        if (typeof window !== 'undefined' && window.sumerian?.state?.broadcast) {
            const messages = get().agent.messages;
            const lastMessage = messages[messages.length - 1];
            if (lastMessage && lastMessage.role === 'agent') {
                window.sumerian.state.broadcast('agent:stream', { content: lastMessage.content });
            }
        }
    },

    setAgentStatus: (status) => {
        set((state) => ({ agent: { ...state.agent, status } }));
        if (typeof window !== 'undefined' && window.sumerian?.state?.broadcast) {
            window.sumerian.state.broadcast('agent:status', { status });
        }
    },

    setBraveMode: async (enabled) => {
        set((state) => ({ agent: { ...state.agent, braveMode: enabled } }));
        await window.sumerian.cli.setBraveMode(enabled);
        window.sumerian.state.set('agent', { mode: get().agent.mode, braveMode: enabled, model: get().agent.model });
    },

    setAutopilotMode: (enabled) => {
        set((state) => ({ agent: { ...state.agent, autopilotMode: enabled } }));
        if (typeof window !== 'undefined' && window.sumerian?.state?.broadcast) {
            window.sumerian.state.broadcast('agent:autopilot', { enabled });
        }
    },

    setModel: (model) => {
        set((state) => ({ agent: { ...state.agent, model } }));
        window.sumerian.cli.setModel(model);
        window.sumerian.state.set('agent', { mode: get().agent.mode, braveMode: get().agent.braveMode, model: get().agent.model });
    },

    setMode: (mode) => {
        const prevMode = get().agent.mode;
        if (prevMode === mode) return;

        set((state) => ({ agent: { ...state.agent, mode } }));
        window.sumerian.state.set('agent', { mode: get().agent.mode, braveMode: get().agent.braveMode, model: get().agent.model });

        const systemMessage: Message = {
            id: crypto.randomUUID(),
            role: 'agent' as const,
            content: `Mode switched to **${mode === 'chat' ? 'Planning' : 'Code'}**.`,
            timestamp: Date.now(),
            status: 'sent' as const
        };
        set((state) => ({
            agent: {
                ...state.agent,
                messages: [...(state.agent.messages || []), systemMessage]
            }
        }));
    },

    setAutoContextEnabled: (enabled) =>
        set((state) => ({ agent: { ...state.agent, autoContextEnabled: enabled } })),

    clearHistory: () => {
        set((state) => ({ agent: { ...state.agent, messages: [] } }));
        if (typeof window !== 'undefined' && window.sumerian?.state?.broadcast) {
            window.sumerian.state.broadcast('agent:clear', {});
        }
    },

    refreshLore: async () => {
        const rootPath = get().project.rootPath;
        if (!rootPath) return;
        try {
            const loreFiles = await window.sumerian.lore.list(rootPath);
            set((state) => ({ agent: { ...state.agent, loreFiles } }));
        } catch (error) {
            console.error('Failed to refresh lore:', error);
        }
    },

    setStreamStatus: (status, toolName = null) =>
        set((state) => ({ agent: { ...state.agent, streamStatus: status, currentToolName: toolName } })),

    addToolAction: (name, id, input) => {
        const action = {
            id,
            name,
            input,
            timestamp: Date.now(),
            status: 'running' as const
        };
        set((state) => ({
            agent: { ...state.agent, toolActions: [...state.agent.toolActions, action] }
        }));
    },

    updateToolActionStatus: (id, status, resultSummary) => {
        set((state) => ({
            agent: {
                ...state.agent,
                toolActions: state.agent.toolActions.map(a =>
                    a.id === id ? { ...a, status, resultSummary } : a
                )
            }
        }));
    },

    updateActiveFileContext: async (path) => {
        set((state) => ({ agent: { ...state.agent, activeFileContext: path } }));
        if (path) {
            try {
                await window.sumerian.cli.updateActiveFileContext(path);
            } catch (error) {
                console.error('Failed to update CLIP context:', error);
            }
        }
    },

    interruptHealingLoop: () => {
        set((state) => ({
            agent: {
                ...state.agent,
                healingLoopActive: false,
                healingIteration: 0,
                lastHealingError: null
            }
        }));
    },

    pruneHistory: () => {
        set((state) => ({
            agent: {
                ...state.agent,
                messages: (state.agent.messages || []).slice(-20)
            }
        }));
    },

    toggleFilePin: (path: string) => {
        set((state) => {
            const pinned = [...state.agent.pinnedFiles];
            const index = pinned.indexOf(path);
            if (index > -1) {
                pinned.splice(index, 1);
            } else {
                pinned.push(path);
            }
            return { agent: { ...state.agent, pinnedFiles: pinned } };
        });
    },

    clearTerminalError: () => {
        set((state) => ({ agent: { ...state.agent, lastTerminalError: null } }));
    },

    startLoop: async (prompt, completionPromise, maxIterations) => {
        set((state) => ({
            agent: {
                ...state.agent,
                loopActive: true,
                loopConfig: { prompt, completionPromise, maxIterations },
                loopIteration: 0
            }
        }));
        await window.sumerian.cli.startLoop(prompt, completionPromise, maxIterations);
    },

    cancelLoop: async () => {
        set((state) => ({
            agent: {
                ...state.agent,
                loopActive: false,
                loopConfig: null,
                loopIteration: 0
            }
        }));
        await window.sumerian.cli.cancelLoop();
    },

    saveSession: async () => {
        const { agent } = get();
        if (!agent.sessionId || agent.messages.length === 0) return;
        await window.sumerian.session.save({
            id: agent.sessionId,
            messages: agent.messages,
            timestamp: Date.now(),
            usage: agent.usage
        });
    },

    loadSession: async (id) => {
        const session = await window.sumerian.session.load(id);
        if (session) {
            set((state) => ({
                agent: {
                    ...state.agent,
                    sessionId: session.id,
                    messages: session.messages,
                    usage: session.usage || null
                }
            }));
            if (typeof window !== 'undefined' && window.sumerian?.state?.broadcast) {
                window.sumerian.state.broadcast('agent:session-loaded', {
                    sessionId: session.id,
                    messages: session.messages,
                    usage: session.usage || null
                });
            }
        }
    },

    listSessions: async () => {
        return await window.sumerian.session.list();
    },

    refreshModels: async () => {
        try {
            const models = await window.sumerian.cli.listModels();
            set((state) => ({ agent: { ...state.agent, availableModels: models } }));
        } catch (error) {
            console.error('Failed to refresh models:', error);
        }
    },

    forceRefreshModels: async () => {
        try {
            await window.sumerian.cli.refreshModels();
        } catch (error) {
            console.error('Failed to force refresh models:', error);
        }
    },

    initDetached: async () => {
        try {
            const sharedState = await window.sumerian.state.getAll();
            if (sharedState?.editor) {
                set((state) => ({ editor: { ...state.editor, ...sharedState.editor } }));
            }
            if (sharedState?.project) {
                set((state) => ({ project: { ...state.project, ...sharedState.project } }));
            }
            if (sharedState?.agent) {
                set((state) => ({
                    agent: {
                        ...state.agent,
                        ...sharedState.agent,
                        pinnedFiles: sharedState.agent.pinnedFiles || state.agent.pinnedFiles || [],
                        toolActions: sharedState.agent.toolActions || state.agent.toolActions || [],
                        loreFiles: sharedState.agent.loreFiles || state.agent.loreFiles || [],
                        messages: sharedState.agent.messages || state.agent.messages || [],
                        availableModels: sharedState.agent.availableModels || state.agent.availableModels || [],
                    }
                }));
            }
        } catch (error) {
            console.error('initDetached error:', error);
        }
    },

    init: async () => {
        if (get().agent.isInitialized) {
            console.log('[init] Already initialized, skipping');
            return;
        }

        const isDetachedWindow = window.location.search.includes('detached=');
        try {
            const sharedState = await window.sumerian.state.getAll();
            if (sharedState) {
                console.log('[init] Restoring shared state');
                if (sharedState.editor) set((state) => ({ editor: { ...state.editor, ...sharedState.editor } }));
                if (sharedState.project) set((state) => ({ project: { ...state.project, ...sharedState.project } }));
                if (sharedState.agent) {
                    set((state) => ({
                        agent: {
                            ...state.agent,
                            ...sharedState.agent,
                            pinnedFiles: sharedState.agent.pinnedFiles || state.agent.pinnedFiles || [],
                            toolActions: sharedState.agent.toolActions || state.agent.toolActions || [],
                            loreFiles: sharedState.agent.loreFiles || state.agent.loreFiles || [],
                            messages: sharedState.agent.messages || state.agent.messages || [],
                            availableModels: sharedState.agent.availableModels || state.agent.availableModels || [],
                        }
                    }));
                }
                if (sharedState.ui) {
                    set((state) => ({
                        ui: {
                            ...state.ui,
                            terminals: sharedState.ui.terminals || state.ui.terminals,
                            activeTerminalId: sharedState.ui.activeTerminalId || state.ui.activeTerminalId,
                        }
                    }));
                }
            }

            if (!isDetachedWindow) {
                const persistedRootPath = get().project.rootPath;
                if (persistedRootPath) {
                    console.log('[init] Opening persisted project:', persistedRootPath);
                    await window.sumerian.project.open(persistedRootPath);
                    await get().refreshFileTree();
                    await get().refreshLore();
                    await get().refreshModels();
                    window.sumerian.files.watch(persistedRootPath);
                }
            }
        } catch (error) {
            console.error('[init] Error during initialization:', error);
        }

        try {
            window.sumerian.files.onChanged((event) => {
                get().refreshFileTree();
                const { activeFileId, openFiles } = get().editor;
                if (event.path === activeFileId && event.type === 'modify') {
                    const file = openFiles.find(f => f.id === activeFileId);
                    if (file && !file.isDirty) {
                        get().openFile(event.path);
                    }
                }
            });

            window.sumerian.cli.onModelsUpdated((models: any[]) => {
                set((state) => ({ agent: { ...state.agent, availableModels: models } }));
            });

            window.sumerian.cli.onAssistantMessage(({ text }) => {
                if (text) {
                    console.log('[onAssistantMessage] Received text:', text.substring(0, 50));
                    get().setStreamStatus('streaming');
                    get().updateLastAgentMessage(text);
                }
            });

            window.sumerian.cli.onError((type: string, message: string) => {
                console.error(`[cli.onError] ${type}: ${message}`);
                get().setStreamStatus('idle');
                get().addAgentMessage(`Error (${type}): ${message}`);
            });

            window.sumerian.cli.onExit((info: { exitCode: number; signal?: number }) => {
                const { exitCode, signal } = info;
                console.log(`[cli.onExit] code: ${exitCode}, signal: ${signal}`);
                get().setStreamStatus('idle');
            });

            window.sumerian.cli.onToolAction(async ({ type, name, id, input, content, isError }) => {
                if (type === 'use' && name && input) {
                    get().setStreamStatus('tool_use', name);
                    let beforeContent: string | undefined;
                    const filePath = (input as any)?.path || (input as any)?.target_file;
                    const fileTools = ['str_replace_editor', 'write_to_file', 'insert_content'];

                    if (fileTools.includes(name) && filePath) {
                        try {
                            beforeContent = await window.sumerian.files.read(filePath);
                        } catch (err) {
                            // Ignore read errors for diffing
                        }
                    }

                    get().addToolAction(name, id, input);
                    if (beforeContent) {
                        set((state) => ({
                            agent: {
                                ...state.agent,
                                toolActions: state.agent.toolActions.map(a =>
                                    a.id === id ? { ...a, beforeContent } : a
                                )
                            }
                        }));
                    }
                } else if (type === 'result') {
                    const status = isError ? 'error' : 'success';
                    const summary = content ? content.substring(0, 100) + (content.length > 100 ? '...' : '') : undefined;
                    get().updateToolActionStatus(id, status, summary);

                    if (isError) {
                        const { braveMode, healingIteration, maxHealingIterations } = get().agent;
                        if (braveMode && healingIteration < maxHealingIterations) {
                            set((state) => ({
                                agent: {
                                    ...state.agent,
                                    healingLoopActive: true,
                                    healingIteration: state.agent.healingIteration + 1,
                                    lastHealingError: content || 'Unknown error'
                                }
                            }));
                            window.sumerian.cli.send(`The previous tool execution failed with error: ${content || 'Unknown error'}. Please fix.`, true);
                        } else if (braveMode) {
                            get().interruptHealingLoop();
                            get().addAgentMessage('Stopping auto-fix: Max iterations reached.');
                        }
                    } else if (get().agent.healingLoopActive) {
                        get().interruptHealingLoop();
                    }

                    const action = get().agent.toolActions.find(a => a.id === id);
                    if (action && !isError) {
                        const fileTools = ['str_replace_editor', 'write_to_file', 'insert_content', 'delete_file', 'move_file'];
                        if (fileTools.includes(action.name)) {
                            get().refreshFileTree();
                            const filePath = (action.input as any)?.path || (action.input as any)?.target_file;
                            if (filePath) {
                                window.sumerian.files.read(filePath).then(afterContent => {
                                    set((state) => ({
                                        agent: {
                                            ...state.agent,
                                            toolActions: state.agent.toolActions.map(a =>
                                                a.id === id ? { ...a, afterContent } : a
                                            )
                                        }
                                    }));
                                }).catch(() => { });

                                const { openFiles } = get().editor;
                                const openFile = openFiles.find(f => f.path.endsWith(filePath));
                                if (openFile && !openFile.isDirty) {
                                    get().openFile(openFile.path);
                                }
                            }
                        }
                    }
                }
            });

            window.sumerian.cli.onAgentStatus(({ status, usage, message }) => {
                if (status === 'complete') {
                    get().setStreamStatus('idle');
                    if (usage) set((state) => ({ agent: { ...state.agent, usage } }));
                } else if (status === 'error') {
                    get().setStreamStatus('idle');
                    get().addAgentMessage(`Error: ${message}`);
                }
            });

            window.sumerian.cli.onOutput((output) => {
                const content = output.content;
                const errorPatterns = [/TS[0-9]+:/i, /Error: /i, /Failed to compile/i, /ReferenceError:/i, /TypeError:/i, /SyntaxError:/i];
                if (errorPatterns.some(p => p.test(content)) && !get().agent.healingLoopActive) {
                    set((state) => ({ agent: { ...state.agent, lastTerminalError: content } }));
                    setTimeout(() => {
                        if (get().agent.lastTerminalError === content) set((state) => ({ agent: { ...state.agent, lastTerminalError: null } }));
                    }, 15000);
                }
            });

            window.sumerian.cli.onStatusChange((status) => get().setAgentStatus(status));
            window.sumerian.cli.onLoopIteration(({ iteration }) => set((state) => ({ agent: { ...state.agent, loopIteration: iteration } })));
            window.sumerian.cli.onLoopComplete(({ reason }) => {
                const message = reason === 'promise' ? '✅ Loop completed' : reason === 'max_iterations' ? '⚠️ Loop stopped: Max iterations' : '🛑 Loop cancelled';
                get().addAgentMessage(message);
                set((state) => ({ agent: { ...state.agent, loopActive: false, loopConfig: null, loopIteration: 0 } }));
            });

            window.sumerian.state.onUpdate(({ key, data }) => {
                if (key === 'editor') set((state) => ({ editor: { ...state.editor, ...data } }));
                else if (key === 'project') set((state) => ({ project: { ...state.project, ...data } }));
                else if (key === 'agent') set((state) => ({ agent: { ...state.agent, ...data } }));
            });
        } catch (error) {
            console.error('Failed to register agent events:', error);
        }

        // Project initialization
        try {
            await get().loadRecentProjects();
        } catch (error) {
            console.error('Failed to initialize project state:', error);
        }

        set((state) => ({ agent: { ...state.agent, isInitialized: true } }));
    },
});
