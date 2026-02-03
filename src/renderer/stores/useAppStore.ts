import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState, FileNode, OpenFile, AgentStreamStatus, ToolAction, AgentInstance, Task } from './types';

export const useAppStore = create<AppState>()(
    persist(
        (set, get): AppState => ({
            ui: {
                sidebarWidth: 260,
                agentPanelWidth: 380,
                terminalHeight: 200,
                isTerminalVisible: true,
                activePanel: 'editor' as const,
                sidebarActiveTab: 'explorer' as const,
                isCommandPaletteOpen: false,
                isShortcutsHelpOpen: false,
                isProjectSwitcherOpen: false,
                isDocsViewerOpen: false,
                activeDocId: undefined,
                terminals: [{ id: 'default', name: 'bash' }],
                activeTerminalId: 'default',
                settings: {
                    fontSize: 14,
                    theme: 'dark' as const,
                    braveModeByDefault: false,
                    isSettingsOpen: false,
                    terminalMirroring: 'formatted' as const,
                },
            },
            project: {
                rootPath: null as string | null,
                fileTree: [] as any[],
                recentProjects: [] as string[],
            },
            editor: {
                openFiles: [] as OpenFile[],
                activeFileId: null as string | null,
                groups: [{ id: 'default', openFiles: [], activeFileId: null }],
                activeGroupId: 'default',
                layout: 'single' as const,
            },
            agent: {
                status: 'disconnected',
                sessionId: crypto.randomUUID(),
                model: 'auto',
                messages: [],
                braveMode: false,
                loreFiles: [],
                activeFileContext: null,
                autoContextEnabled: true,
                streamStatus: 'idle' as AgentStreamStatus,
                currentToolName: null as string | null,
                toolActions: [] as ToolAction[],
                healingLoopActive: false,
                healingIteration: 0,
                maxHealingIterations: 5,
                lastHealingError: null,
                pinnedFiles: [],
                lastTerminalError: null,
                usage: null as { input: number; output: number } | null,
                mode: 'code' as const,
                availableModels: [],
                loopActive: false,
                loopConfig: null,
                loopIteration: 0,
                autopilotMode: false,
            },
            workforce: {
                activeAgents: new Map<string, AgentInstance>(),
                taskQueue: [] as Task[],
                pendingProposal: null,
                queuedTasks: [],
                queueActive: false,
            },




            // UI Actions
            setSidebarWidth: (width) =>
                set((state) => ({ ui: { ...state.ui, sidebarWidth: width } })),
            setAgentPanelWidth: (width) =>
                set((state) => ({ ui: { ...state.ui, agentPanelWidth: width } })),
            setTerminalHeight: (height) =>
                set((state) => ({ ui: { ...state.ui, terminalHeight: height } })),
            toggleTerminal: () =>
                set((state) => ({ ui: { ...state.ui, isTerminalVisible: !state.ui.isTerminalVisible } })),
            setActivePanel: (panel) =>
                set((state) => ({ ui: { ...state.ui, activePanel: panel } })),
            createTerminal: (name = 'bash') => {
                const id = Math.random().toString(36).substring(7);
                const newTerminal = { id, name };
                set((state) => ({
                    ui: {
                        ...state.ui,
                        terminals: [...state.ui.terminals, newTerminal],
                        activeTerminalId: id,
                        isTerminalVisible: true
                    }
                }));
                // Broadcast to detached windows
                if (typeof window !== 'undefined' && window.sumerian?.state?.broadcast) {
                    window.sumerian.state.broadcast('terminal:create', { id, name });
                }
            },
            closeTerminal: (id) => {
                set((state) => {
                    const terminals = state.ui.terminals.filter(t => t.id !== id);
                    let activeTerminalId = state.ui.activeTerminalId;
                    if (activeTerminalId === id) {
                        activeTerminalId = terminals.length > 0 ? terminals[terminals.length - 1].id : null;
                    }
                    return { ui: { ...state.ui, terminals, activeTerminalId } };
                });
                // Broadcast to detached windows
                if (typeof window !== 'undefined' && window.sumerian?.state?.broadcast) {
                    window.sumerian.state.broadcast('terminal:close', { id });
                }
            },
            setActiveTerminal: (id) => {
                set((state) => ({ ui: { ...state.ui, activeTerminalId: id } }));
                // Broadcast to detached windows
                if (typeof window !== 'undefined' && window.sumerian?.state?.broadcast) {
                    window.sumerian.state.broadcast('terminal:active', { id });
                }
            },
            toggleCommandPalette: () =>
                set((state) => ({ ui: { ...state.ui, isCommandPaletteOpen: !state.ui.isCommandPaletteOpen } })),
            toggleShortcutsHelp: () =>
                set((state) => ({ ui: { ...state.ui, isShortcutsHelpOpen: !state.ui.isShortcutsHelpOpen } })),
            toggleProjectSwitcher: () =>
                set((state) => ({ ui: { ...state.ui, isProjectSwitcherOpen: !state.ui.isProjectSwitcherOpen } })),
            toggleDocsViewer: () =>
                set((state) => ({ ui: { ...state.ui, isDocsViewerOpen: !state.ui.isDocsViewerOpen } })),
            openDocsWithTopic: (docId: string) =>
                set((state) => ({ ui: { ...state.ui, isDocsViewerOpen: true, activeDocId: docId } })),
            updateSettings: (settings) =>
                set((state) => ({ ui: { ...state.ui, settings: { ...state.ui.settings, ...settings } } })),
            toggleSettings: () =>
                set((state) => ({ ui: { ...state.ui, settings: { ...state.ui.settings, isSettingsOpen: !state.ui.settings.isSettingsOpen } } })),
            setSidebarActiveTab: (tab) => {
                set((state) => ({ ui: { ...state.ui, sidebarActiveTab: tab } }));
                // Broadcast to other windows
                if (typeof window !== 'undefined' && window.sumerian?.state?.broadcast) {
                    window.sumerian.state.broadcast('sidebar:tab', { tab });
                }
            },

            // Project Actions
            setRootPath: async (path) => {
                // Save current session before switching projects
                const currentPath = get().project.rootPath;
                if (currentPath && currentPath !== path) {
                    await get().saveSession();
                    // Update project with current session ID
                    const currentSessionId = get().agent.sessionId;
                    if (currentSessionId) {
                        await window.sumerian.project.updateSession(currentPath, currentSessionId);
                    }
                }

                set((state) => ({ project: { ...state.project, rootPath: path } }));
                if (path) {
                    await window.sumerian.project.open(path);
                    get().refreshFileTree();
                    get().refreshLore();
                    get().refreshModels();
                    window.sumerian.files.watch(path);
                    
                    // Restore last session for this project
                    try {
                        const projectEntry = await window.sumerian.project.get(path);
                        if (projectEntry?.lastSessionId) {
                            console.log('[setRootPath] Restoring last session:', projectEntry.lastSessionId);
                            await get().loadSession(projectEntry.lastSessionId);
                        } else {
                            // No previous session, get latest from SessionManager
                            const latestSessionId = await window.sumerian.session.getLatestId();
                            if (latestSessionId) {
                                console.log('[setRootPath] Restoring latest session:', latestSessionId);
                                await get().loadSession(latestSessionId);
                            } else {
                                // Fresh start - create new session ID
                                console.log('[setRootPath] Starting fresh session');
                                set((state) => ({
                                    agent: {
                                        ...state.agent,
                                        sessionId: crypto.randomUUID(),
                                        messages: []
                                    }
                                }));
                            }
                        }
                    } catch (error) {
                        console.error('[setRootPath] Failed to restore session:', error);
                        // Fallback to new session
                        set((state) => ({
                            agent: {
                                ...state.agent,
                                sessionId: crypto.randomUUID(),
                                messages: []
                            }
                        }));
                    }
                    
                    // Sync to shared state
                    window.sumerian.state.set('project', { rootPath: path, fileTree: get().project.fileTree });
                }
            },

            setFileTree: (tree) =>
                set((state) => ({ project: { ...state.project, fileTree: tree } })),
            refreshFileTree: async () => {
                const rootPath = get().project.rootPath;
                if (!rootPath || !window.sumerian?.files) return;
                try {
                    const tree = await window.sumerian.files.list(rootPath);
                    set((state) => ({ project: { ...state.project, fileTree: tree } }));
                    // Sync to shared state
                    if (window.sumerian?.state) {
                        window.sumerian.state.set('project', { rootPath, fileTree: tree });
                    }
                } catch (error) {
                    console.error('Failed to refresh file tree:', error);
                }
            },
            selectProject: async () => {
                const path = await window.sumerian.project.select();
                if (path) {
                    await get().setRootPath(path);
                }
            },
            loadRecentProjects: async () => {
                const recent = await window.sumerian.project.getRecent();
                set((state) => ({ project: { ...state.project, recentProjects: recent } }));
            },

            // Editor Actions
            openFile: async (path) => {
                if (!window.sumerian?.files) {
                    console.error('Cannot open file: window.sumerian.files not available');
                    return;
                }

                const { openFiles, groups, activeGroupId } = get().editor;
                const existingFile = openFiles.find((f) => f.path === path);

                if (existingFile) {
                    set((state) => {
                        const updatedGroups = state.editor.groups.map(g => {
                            if (g.id === activeGroupId) {
                                const fileInGroup = g.openFiles.find(f => f.id === existingFile.id);
                                if (!fileInGroup) {
                                    return {
                                        ...g,
                                        openFiles: [...g.openFiles, existingFile],
                                        activeFileId: existingFile.id
                                    };
                                }
                                return { ...g, activeFileId: existingFile.id };
                            }
                            return g;
                        });
                        return {
                            editor: {
                                ...state.editor,
                                activeFileId: existingFile.id,
                                groups: updatedGroups
                            }
                        };
                    });
                    // Sync to shared state
                    if (window.sumerian?.state) {
                        const editorState = get().editor;
                        window.sumerian.state.set('editor', { 
                            activeFileId: editorState.activeFileId, 
                            openFiles: editorState.openFiles,
                            groups: editorState.groups,
                            activeGroupId: editorState.activeGroupId
                        });
                    }
                    return;
                }

                try {
                    const content = await window.sumerian.files.read(path);
                    const name = path.split(/[/\\]/).pop() || 'untitled';
                    const newFile = {
                        id: path,
                        name,
                        path,
                        content,
                        isDirty: false,
                        language: name.split('.').pop() || 'text',
                    };

                    const newOpenFiles = [...get().editor.openFiles, newFile];
                    set((state) => {
                        const updatedGroups = state.editor.groups.map(g => {
                            if (g.id === activeGroupId) {
                                return {
                                    ...g,
                                    openFiles: [...g.openFiles, newFile],
                                    activeFileId: newFile.id
                                };
                            }
                            return g;
                        });
                        return {
                            editor: {
                                ...state.editor,
                                openFiles: newOpenFiles,
                                activeFileId: newFile.id,
                                groups: updatedGroups
                            }
                        };
                    });
                    // Sync to shared state
                    if (window.sumerian?.state) {
                        const editorState = get().editor;
                        window.sumerian.state.set('editor', { 
                            activeFileId: editorState.activeFileId, 
                            openFiles: editorState.openFiles,
                            groups: editorState.groups,
                            activeGroupId: editorState.activeGroupId
                        });
                    }
                } catch (error) {
                    console.error('Failed to open file:', error);
                }
            },
            closeFile: (id) => {
                set((state) => {
                    const openFiles = state.editor.openFiles.filter((f) => f.id !== id);
                    let activeFileId = state.editor.activeFileId;
                    if (activeFileId === id) {
                        activeFileId = openFiles.length > 0 ? openFiles[openFiles.length - 1].id : null;
                    }
                    
                    // Also remove from all groups
                    const updatedGroups = state.editor.groups.map(group => {
                        const groupFiles = group.openFiles.filter(f => f.id !== id);
                        let groupActiveFileId = group.activeFileId;
                        if (groupActiveFileId === id) {
                            groupActiveFileId = groupFiles.length > 0 ? groupFiles[groupFiles.length - 1].id : null;
                        }
                        return {
                            ...group,
                            openFiles: groupFiles,
                            activeFileId: groupActiveFileId
                        };
                    });
                    
                    return { 
                        editor: { 
                            ...state.editor, 
                            openFiles, 
                            activeFileId,
                            groups: updatedGroups
                        } 
                    };
                });
                
                // Sync to shared state
                if (window.sumerian?.state) {
                    const editorState = get().editor;
                    window.sumerian.state.set('editor', { 
                        activeFileId: editorState.activeFileId, 
                        openFiles: editorState.openFiles,
                        groups: editorState.groups,
                        activeGroupId: editorState.activeGroupId
                    });
                }
                
                // Immediate broadcast for file close
                if (typeof window !== 'undefined' && window.sumerian?.state?.broadcast) {
                    window.sumerian.state.broadcast('editor:close', { id });
                }
            },
            setActiveFile: (id) => {
                set((state) => ({ editor: { ...state.editor, activeFileId: id } }));
                get().updateActiveFileContext(id);
                // Sync to shared state
                const editorState = get().editor;
                window.sumerian.state.set('editor', { 
                    activeFileId: id, 
                    openFiles: editorState.openFiles,
                    groups: editorState.groups,
                    activeGroupId: editorState.activeGroupId
                });
            },
            setFileContent: (id, content) => {
                set((state) => ({
                    editor: {
                        ...state.editor,
                        openFiles: state.editor.openFiles.map((f) =>
                            f.id === id ? { ...f, content, isDirty: true } : f
                        ),
                    },
                }));
                
                // Debounced broadcast for high-frequency updates (typing)
                if (typeof window !== 'undefined' && window.sumerian?.state?.broadcast) {
                    const debounceKey = `file-content-${id}`;
                    if ((window as any)[debounceKey]) {
                        clearTimeout((window as any)[debounceKey]);
                    }
                    (window as any)[debounceKey] = setTimeout(() => {
                        window.sumerian.state.broadcast('editor:content', { id, content });
                    }, 500);
                }
            },
            saveFile: async (id) => {
                const file = get().editor.openFiles.find((f) => f.id === id);
                if (!file) return;

                try {
                    await window.sumerian.files.write(file.path, file.content);
                    set((state) => ({
                        editor: {
                            ...state.editor,
                            openFiles: state.editor.openFiles.map((f) =>
                                f.id === id ? { ...f, isDirty: false } : f
                            ),
                        },
                    }));
                    
                    // Immediate broadcast for file save
                    if (typeof window !== 'undefined' && window.sumerian?.state?.broadcast) {
                        window.sumerian.state.broadcast('editor:save', { id });
                    }
                } catch (error) {
                    console.error('Failed to save file:', error);
                }
            },

            // Editor Group Actions
            splitEditor: (direction) => {
                const newGroupId = `group-${Date.now()}`;
                const newLayout = direction === 'horizontal' ? 'split-horizontal' : 'split-vertical';
                
                set((state) => ({
                    editor: {
                        ...state.editor,
                        groups: [...state.editor.groups, { id: newGroupId, openFiles: [], activeFileId: null }],
                        activeGroupId: newGroupId,
                        layout: newLayout,
                    },
                }));
            },

            closeEditorGroup: (groupId) => {
                const { groups, activeGroupId } = get().editor;
                
                // Don't close if it's the only group
                if (groups.length <= 1) return;
                
                const newGroups = groups.filter(g => g.id !== groupId);
                const newActiveGroupId = activeGroupId === groupId ? newGroups[0].id : activeGroupId;
                const newLayout = newGroups.length === 1 ? 'single' : get().editor.layout;
                
                set((state) => ({
                    editor: {
                        ...state.editor,
                        groups: newGroups,
                        activeGroupId: newActiveGroupId,
                        layout: newLayout,
                    },
                }));
            },

            setActiveGroup: (groupId) => {
                set((state) => ({
                    editor: { ...state.editor, activeGroupId: groupId },
                }));
            },

            moveFileToGroup: (fileId, targetGroupId) => {
                const { groups, openFiles } = get().editor;
                const file = openFiles.find(f => f.id === fileId);
                if (!file) return;
                
                // Remove file from all groups
                const updatedGroups = groups.map(group => ({
                    ...group,
                    openFiles: group.openFiles.filter(f => f.id !== fileId),
                    activeFileId: group.activeFileId === fileId ? null : group.activeFileId,
                }));
                
                // Add file to target group
                const targetGroup = updatedGroups.find(g => g.id === targetGroupId);
                if (targetGroup) {
                    targetGroup.openFiles.push(file);
                    targetGroup.activeFileId = file.id;
                }
                
                set((state) => ({
                    editor: { ...state.editor, groups: updatedGroups, activeGroupId: targetGroupId },
                }));
            },

            // Agent Actions
            sendMessage: async (content, images = []) => {
                let finalContent = content;

                // If there are images, let the agent know where they are
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

                // Append pinned files
                const { pinnedFiles } = get().agent;
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

                const userMessage = {
                    id: Date.now().toString(),
                    role: 'user' as const,
                    content, // We store the original message in history
                    timestamp: Date.now(),
                    status: 'sent' as const,
                    images
                };

                set((state) => ({
                    agent: {
                        ...state.agent,
                        messages: [...state.agent.messages, userMessage]
                    }
                }));
                get().saveSession();

                // Sync messages to shared state for detached windows
                if (typeof window !== 'undefined' && window.sumerian?.state?.set && window.sumerian?.state?.get) {
                    window.sumerian.state.get('agent').then((currentState: any) => {
                        window.sumerian.state.set('agent', { ...currentState, messages: get().agent.messages });
                    }).catch(() => {
                        window.sumerian.state.set('agent', { messages: get().agent.messages });
                    });
                }

                // Broadcast message to detached windows
                if (typeof window !== 'undefined' && window.sumerian?.state?.broadcast) {
                    window.sumerian.state.broadcast('agent:message', userMessage);
                }

                try {
                    await window.sumerian.cli.send(finalContent, get().agent.braveMode);
                } catch (error) {
                    console.error('Failed to send message to CLI:', error);
                    
                    // Add error message to chat
                    const errorMessage = {
                        id: Date.now().toString(),
                        role: 'agent' as const,
                        content: `❌ **Error**: ${error instanceof Error ? error.message : 'Failed to send message'}\n\n${error instanceof Error && error.message.includes('No project open') ? 'Please open a project folder using **⌘O** or the Command Palette.' : 'Please check the console for details.'}`,
                        timestamp: Date.now(),
                        status: 'sent' as const
                    };
                    
                    set((state) => ({
                        agent: {
                            ...state.agent,
                            messages: [...state.agent.messages, errorMessage]
                        }
                    }));
                }
            },
            addAgentMessage: (content) => {
                const agentMessage = {
                    id: Date.now().toString(),
                    role: 'agent' as const,
                    content,
                    timestamp: Date.now(),
                    status: 'sent' as const
                };
                set((state) => ({
                    agent: {
                        ...state.agent,
                        messages: [...state.agent.messages, agentMessage]
                    }
                }));
                get().saveSession();

                // Sync messages to shared state for detached windows
                if (typeof window !== 'undefined' && window.sumerian?.state?.set && window.sumerian?.state?.get) {
                    window.sumerian.state.get('agent').then((currentState: any) => {
                        window.sumerian.state.set('agent', { ...currentState, messages: get().agent.messages });
                    }).catch(() => {
                        window.sumerian.state.set('agent', { messages: get().agent.messages });
                    });
                }

                // Broadcast message to detached windows
                if (typeof window !== 'undefined' && window.sumerian?.state?.broadcast) {
                    window.sumerian.state.broadcast('agent:message', agentMessage);
                }
            },
            updateLastAgentMessage: (content) => {
                set((state) => {
                    const messages = [...state.agent.messages];
                    const lastIndex = messages.findLastIndex(m => m.role === 'agent');
                    if (lastIndex !== -1) {
                        messages[lastIndex] = {
                            ...messages[lastIndex],
                            content: messages[lastIndex].content + content
                        };
                    } else {
                        // First token of a new agent response
                        messages.push({
                            id: Date.now().toString(),
                            role: 'agent' as const,
                            content,
                            timestamp: Date.now(),
                            status: 'sent' as const
                        });
                    }
                    return { agent: { ...state.agent, messages } };
                });
                get().saveSession();

                // Broadcast streaming update to detached windows
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

                // Broadcast status to detached windows
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
                // Broadcast to detached windows
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

                // Add a system notification message
                const systemMessage = {
                    id: `mode-change-${Date.now()}`,
                    role: 'agent' as const,
                    content: `Mode switched to **${mode === 'chat' ? 'Planning' : 'Code'}**.`,
                    timestamp: Date.now(),
                    status: 'sent' as const
                };
                set((state) => ({
                    agent: {
                        ...state.agent,
                        messages: [...state.agent.messages, systemMessage]
                    }
                }));
            },
            setAutoContextEnabled: (enabled) =>
                set((state) => ({ agent: { ...state.agent, autoContextEnabled: enabled } })),
            clearHistory: () => {
                set((state) => ({ agent: { ...state.agent, messages: [] } }));
                
                // Broadcast clear to detached windows
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
                const action: ToolAction = {
                    id,
                    name,
                    input,
                    timestamp: Date.now(),
                    status: 'running'
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
                        messages: state.agent.messages.slice(-20)
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

            startLoop: async (prompt: string, completionPromise: string, maxIterations: number) => {
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
                if (!agent.sessionId) {
                    console.log('[saveSession] No sessionId, skipping save');
                    return;
                }
                if (agent.messages.length === 0) {
                    console.log('[saveSession] No messages, skipping save');
                    return;
                }

                console.log('[saveSession] Saving session:', agent.sessionId, 'with', agent.messages.length, 'messages');
                await window.sumerian.session.save({
                    id: agent.sessionId,
                    messages: agent.messages,
                    timestamp: Date.now(),
                    usage: agent.usage
                });
                console.log('[saveSession] Session saved successfully');
            },

            loadSession: async (id: string) => {
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

                    // Broadcast loaded session to all windows
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

                    // If current model is 'auto' but we have a default model, we could set it
                    // But usually Claude CLI handles 'auto' itself.
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

            // Lightweight initialization for detached windows - only sync state, don't spawn CLI
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

            // Store Initialization
            init: async () => {
                // Check if this is a detached window (has ?detached= in URL)
                const isDetachedWindow = window.location.search.includes('detached=');
                
                try {
                    // Load shared state from main process (for detached windows)
                    const sharedState = await window.sumerian.state.getAll();
                    if (sharedState?.editor) {
                        set((state) => ({ editor: { ...state.editor, ...sharedState.editor } }));
                    }
                    if (sharedState?.project) {
                        set((state) => ({ project: { ...state.project, ...sharedState.project } }));
                    }
                    if (sharedState?.agent) {
                        // Ensure default values are preserved for missing fields
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
                    // Load UI state (terminals) for detached windows
                    if (sharedState?.ui) {
                        set((state) => ({
                            ui: {
                                ...state.ui,
                                terminals: sharedState.ui.terminals || state.ui.terminals,
                                activeTerminalId: sharedState.ui.activeTerminalId || state.ui.activeTerminalId,
                            }
                        }));
                    }

                    // Only re-open project in main window, not in detached windows
                    // Detached windows should only sync state, not spawn new CLI processes
                    if (!isDetachedWindow) {
                        const currentState = get();
                        const persistedRootPath = currentState?.project?.rootPath;
                        if (persistedRootPath) {
                            await window.sumerian.project.open(persistedRootPath);
                            const store = get();
                            store.refreshFileTree();
                            store.refreshLore();
                            store.refreshModels();
                            window.sumerian.files.watch(persistedRootPath);
                        }
                    }
                } catch (error) {
                    console.error('Init error:', error);
                    // Continue initialization even if some parts fail
                }

                // Register event listeners (safe to call even if window.sumerian is not fully ready)
                try {
                    window.sumerian.files.onChanged((event) => {
                        console.log('File change detected:', event);
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
                        console.log('[Store] Models updated via background fetch:', models);
                        set((state) => ({ agent: { ...state.agent, availableModels: models } }));
                    });

                    // Subscribe to typed parsed events (no JSON parsing in renderer)
                    window.sumerian.cli.onAssistantMessage(({ text, isStreaming }) => {
                        if (text) {
                            get().setStreamStatus('streaming');
                            get().updateLastAgentMessage(text);
                        }
                    });

                    window.sumerian.cli.onToolAction(async ({ type, name, id, input, content, isError }) => {
                    console.log(`[Agent] Tool ${type}: ${name || id}`, id);

                    if (type === 'use' && name && input) {
                        get().setStreamStatus('tool_use', name);

                        // Capture "before" content for diffing
                        let beforeContent: string | undefined;
                        const filePath = (input as any)?.path || (input as any)?.target_file;
                        const fileTools = ['str_replace_editor', 'write_to_file', 'insert_content'];

                        if (fileTools.includes(name) && filePath) {
                            try {
                                beforeContent = await window.sumerian.files.read(filePath);
                            } catch (err) {
                                console.warn('Could not read before content for diff:', err);
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

                        // Self-Healing Logic
                        if (isError) {
                            const { braveMode, healingIteration, maxHealingIterations } = get().agent;
                            if (braveMode && healingIteration < maxHealingIterations) {
                                console.log(`[Agent] Initiating self-healing loop: ${healingIteration + 1}/${maxHealingIterations}`);
                                set((state) => ({
                                    agent: {
                                        ...state.agent,
                                        healingLoopActive: true,
                                        healingIteration: state.agent.healingIteration + 1,
                                        lastHealingError: content || 'Unknown error'
                                    }
                                }));

                                // Send error back to agent
                                const fixPrompt = `The previous tool execution failed with the following error:\n\n${content || 'Unknown error'}\n\nPlease analyze this error and take corrective action.`;
                                window.sumerian.cli.send(fixPrompt, true);
                            } else if (braveMode) {
                                console.warn('[Agent] Max self-healing iterations reached.');
                                get().interruptHealingLoop();
                                get().addAgentMessage('Stopping auto-fix: Max iterations reached.');
                            }
                        } else if (get().agent.healingLoopActive) {
                            console.log('[Agent] Self-healing successful.');
                            get().interruptHealingLoop();
                        }

                        // If tool indicates a file refresh might be needed
                        const action = get().agent.toolActions.find(a => a.id === id);
                        if (action && !isError) {
                            const fileTools = ['str_replace_editor', 'write_to_file', 'insert_content', 'delete_file', 'move_file'];
                            if (fileTools.includes(action.name)) {
                                console.log(`[Agent] Tool completion triggered refresh: ${action.name}`);
                                get().refreshFileTree();

                                // Specific file reload and capture "after" content
                                const filePath = (action.input as any)?.path || (action.input as any)?.target_file;
                                if (filePath) {
                                    // Capture after content for diffing
                                    try {
                                        const afterContent = await window.sumerian.files.read(filePath);
                                        set((state) => ({
                                            agent: {
                                                ...state.agent,
                                                toolActions: state.agent.toolActions.map(a =>
                                                    a.id === id ? { ...a, afterContent } : a
                                                )
                                            }
                                        }));
                                    } catch (err) {
                                        console.warn('Could not read after content for diff:', err);
                                    }

                                    const { activeFileId, openFiles } = get().editor;
                                    // Make sure we have the full path if the tool uses relative
                                    // For now we assume if it's open, it's the one
                                    const openFile = openFiles.find(f => f.path.endsWith(filePath));
                                    if (openFile && !openFile.isDirty) {
                                        console.log(`[Agent] Reloading edited file: ${openFile.path}`);
                                        get().openFile(openFile.path);
                                    }
                                }
                            }
                        }
                    }
                    });

                    window.sumerian.cli.onAgentStatus(({ status, result, usage, type, message }) => {
                        if (status === 'complete') {
                            get().setStreamStatus('idle');
                            console.log('[Agent] Complete, usage:', usage);
                            if (usage) {
                                set((state) => ({ agent: { ...state.agent, usage } }));
                            }
                        } else if (status === 'error') {
                            get().setStreamStatus('idle');
                            console.error(`[Agent] Error: ${type} - ${message}`);
                            get().addAgentMessage(`Error: ${message}`);
                        }
                    });

                    // Keep raw output for terminal mirroring (optional debug)
                    window.sumerian.cli.onOutput((output) => {
                        // Error sensing logic
                        const content = output.content;
                        
                        // Ignore shell initialization errors and warnings
                        const ignorePatterns = [
                            /compinit:/i,
                            /command not found: ng/i,
                            /no such file or directory:.*zsh/i,
                            /\.zshrc:/i,
                        ];
                        
                        const shouldIgnore = ignorePatterns.some(p => p.test(content));
                        
                        const errorPatterns = [
                            /TS[0-9]+:/i,
                            /Error: /i,
                            /Failed to compile/i,
                            /ReferenceError:/i,
                            /TypeError:/i,
                            /SyntaxError:/i,
                        ];

                        const hasError = errorPatterns.some(p => p.test(content));
                        if (hasError && !shouldIgnore && !get().agent.healingLoopActive) {
                            set((state) => ({ agent: { ...state.agent, lastTerminalError: content } }));

                            // Clear error after 15 seconds
                            setTimeout(() => {
                                if (get().agent.lastTerminalError === content) {
                                    set((state) => ({ agent: { ...state.agent, lastTerminalError: null } }));
                                }
                            }, 15000);
                        }
                    });

                    window.sumerian.cli.onStatusChange((status) => {
                        get().setAgentStatus(status);
                    });

                    // Listen for loop events
                    window.sumerian.cli.onLoopIteration(({ iteration, max }) => {
                        set((state) => ({
                            agent: { ...state.agent, loopIteration: iteration }
                        }));
                    });

                    window.sumerian.cli.onLoopComplete(({ reason }) => {
                        const message = reason === 'promise' 
                            ? '✅ Loop completed: Promise detected!'
                            : reason === 'max_iterations'
                            ? '⚠️ Loop stopped: Max iterations reached'
                            : '🛑 Loop cancelled by user';
                        
                        get().addAgentMessage(message);
                        
                        set((state) => ({
                            agent: {
                                ...state.agent,
                                loopActive: false,
                                loopConfig: null,
                                loopIteration: 0
                            }
                        }));
                    });

                    // Listen for state updates from main process
                    window.sumerian.state.onUpdate(({ key, data }) => {
                        if (key === 'editor') {
                            set((state) => ({ editor: { ...state.editor, ...data } }));
                        } else if (key === 'project') {
                            set((state) => ({ project: { ...state.project, ...data } }));
                        } else if (key === 'agent') {
                            set((state) => ({ agent: { ...state.agent, ...data } }));
                        }
                    });
                } catch (error) {
                    console.error('Error registering event listeners:', error);
                }

                // Load recent projects (safe to fail)
                try {
                    await get().loadRecentProjects();
                } catch (error) {
                    console.error('Error loading recent projects:', error);
                }
            },

            // Workforce Actions
            spawnAgent: async (persona, task, workingDir) => {
                try {
                    const agentId = await window.sumerian.cli.spawnAgent(persona, task, workingDir);
                    
                    const agentInstance: AgentInstance = {
                        id: agentId,
                        persona,
                        status: 'active',
                        task,
                        startTime: Date.now(),
                        lockedFiles: [],
                        messageHistory: []
                    };
                    
                    set((state) => {
                        const newActiveAgents = new Map(state.workforce.activeAgents);
                        newActiveAgents.set(agentId, agentInstance);
                        return {
                            workforce: {
                                ...state.workforce,
                                activeAgents: newActiveAgents
                            }
                        };
                    });
                    
                    return agentId;
                } catch (error) {
                    console.error('Failed to spawn agent:', error);
                    throw error;
                }
            },

            terminateAgent: async (agentId) => {
                try {
                    await window.sumerian.cli.terminateAgent(agentId);
                    
                    set((state) => {
                        const newActiveAgents = new Map(state.workforce.activeAgents);
                        newActiveAgents.delete(agentId);
                        return {
                            workforce: {
                                ...state.workforce,
                                activeAgents: newActiveAgents
                            }
                        };
                    });
                } catch (error) {
                    console.error('Failed to terminate agent:', error);
                    throw error;
                }
            },

            getAgent: (agentId) => {
                return get().workforce.activeAgents.get(agentId) || null;
            },

            getAllAgents: () => {
                return Array.from(get().workforce.activeAgents.values());
            },

            updateAgentResources: (agentId, cpu, memory) => {
                set((state) => {
                    const agent = state.workforce.activeAgents.get(agentId);
                    if (!agent) return state;

                    const maxHistoryLength = 30; // Keep last 30 data points (1 minute at 2s intervals)
                    const cpuHistory = [...(agent.resources?.cpuHistory || []), cpu].slice(-maxHistoryLength);
                    const memoryHistory = [...(agent.resources?.memoryHistory || []), memory].slice(-maxHistoryLength);

                    const updatedAgent: AgentInstance = {
                        ...agent,
                        resources: {
                            cpuHistory,
                            memoryHistory,
                            lastUpdate: Date.now()
                        }
                    };

                    const newActiveAgents = new Map(state.workforce.activeAgents);
                    newActiveAgents.set(agentId, updatedAgent);

                    return {
                        workforce: {
                            ...state.workforce,
                            activeAgents: newActiveAgents
                        }
                    };
                });
            },

            queueTask: (task) => {
                set((state) => ({
                    workforce: {
                        ...state.workforce,
                        taskQueue: [...state.workforce.taskQueue, task]
                    }
                }));
            },

            dequeueTask: (taskId) => {
                set((state) => ({
                    workforce: {
                        ...state.workforce,
                        taskQueue: state.workforce.taskQueue.filter(t => t.id !== taskId)
                    }
                }));
            },

            proposeDelegation: (proposal) => {
                set((state) => ({
                    workforce: {
                        ...state.workforce,
                        pendingProposal: proposal
                    }
                }));
            },

            approveDelegation: async () => {
                const { pendingProposal } = get().workforce;
                if (!pendingProposal) return;

                try {
                    await get().spawnAgent(
                        pendingProposal.persona,
                        pendingProposal.task,
                        get().project.rootPath || undefined
                    );
                    
                    set((state) => ({
                        workforce: {
                            ...state.workforce,
                            pendingProposal: null
                        }
                    }));
                } catch (error) {
                    console.error('Failed to approve delegation:', error);
                }
            },

            rejectDelegation: () => {
                set((state) => ({
                    workforce: {
                        ...state.workforce,
                        pendingProposal: null
                    }
                }));
            },

            revertAgent: async (agentId: string) => {
                const agent = get().workforce.activeAgents.get(agentId);
                if (!agent || !agent.completionReport) {
                    console.warn('Cannot revert: agent not found or no completion report');
                    return false;
                }

                try {
                    const filesModified = agent.completionReport.filesModified;
                    let allSuccess = true;

                    for (const filePath of filesModified) {
                        const success = await window.sumerian.files.undo();
                        if (!success) {
                            console.warn(`Failed to revert file: ${filePath}`);
                            allSuccess = false;
                        }
                    }

                    if (allSuccess) {
                        await get().refreshFileTree();
                    }

                    return allSuccess;
                } catch (error) {
                    console.error('Failed to revert agent changes:', error);
                    return false;
                }
            },

            // Task Queue Actions
            addTaskToQueue: (task) => {
                set((state) => ({
                    workforce: {
                        ...state.workforce,
                        queuedTasks: [...state.workforce.queuedTasks, task]
                    }
                }));
            },

            removeTaskFromQueue: (taskId) => {
                set((state) => ({
                    workforce: {
                        ...state.workforce,
                        queuedTasks: state.workforce.queuedTasks.filter(t => t.id !== taskId)
                    }
                }));
            },

            reorderTasks: (fromIndex, toIndex) => {
                set((state) => {
                    const tasks = [...state.workforce.queuedTasks];
                    const [removed] = tasks.splice(fromIndex, 1);
                    tasks.splice(toIndex, 0, removed);
                    return {
                        workforce: {
                            ...state.workforce,
                            queuedTasks: tasks
                        }
                    };
                });
            },

            processNextTask: async () => {
                const { queuedTasks } = get().workforce;
                const nextTask = queuedTasks.find(t => t.status === 'pending');
                if (!nextTask) {
                    get().setQueueActive(false);
                    return;
                }

                // Mark as active
                get().updateTaskStatus(nextTask.id, 'active');

                try {
                    if (nextTask.type === 'message') {
                        await get().sendMessage(nextTask.content);
                    } else if (nextTask.type === 'loop') {
                        const { prompt, promise, maxIterations } = nextTask.config;
                        await get().startLoop(prompt, promise, maxIterations);
                    } else if (nextTask.type === 'spawn') {
                        const { persona, task, workingDir } = nextTask.config;
                        await get().spawnAgent(persona, task, workingDir);
                    }

                    get().updateTaskStatus(nextTask.id, 'complete');

                    // Process next task after delay
                    if (get().workforce.queueActive) {
                        setTimeout(() => get().processNextTask(), 2000);
                    }
                } catch (error) {
                    console.error('Task execution failed:', error);
                    get().updateTaskStatus(nextTask.id, 'error');
                    get().setQueueActive(false);
                }
            },

            setQueueActive: (active) => {
                set((state) => ({
                    workforce: {
                        ...state.workforce,
                        queueActive: active
                    }
                }));

                if (active) {
                    get().processNextTask();
                }
            },

            updateTaskStatus: (taskId, status) => {
                set((state) => ({
                    workforce: {
                        ...state.workforce,
                        queuedTasks: state.workforce.queuedTasks.map(t =>
                            t.id === taskId ? { ...t, status } : t
                        )
                    }
                }));
            }
        }),

        {
            name: 'sumerian-ui-storage',
            partialize: (state) => ({
                ui: {
                    ...state.ui,
                    // Don't persist modal open states
                    isCommandPaletteOpen: false,
                    isShortcutsHelpOpen: false,
                    isProjectSwitcherOpen: false,
                    isDocsViewerOpen: false,
                    settings: {
                        ...state.ui.settings,
                        isSettingsOpen: false,
                    },
                },
                project: { rootPath: state.project.rootPath },
                agent: { mode: state.agent.mode }
            }),
        }
    )
);


