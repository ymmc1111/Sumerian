import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState, FileNode, OpenFile } from './types';


export const useAppStore = create<AppState>()(
    persist(
        (set, get): AppState => ({
            ui: {
                sidebarWidth: 260,
                agentPanelWidth: 380,
                terminalHeight: 200,
                isTerminalVisible: true,
                activePanel: 'editor' as const,
                isCommandPaletteOpen: false,
                isShortcutsHelpOpen: false,
                terminals: [{ id: 'default', name: 'bash' }],
                activeTerminalId: 'default',
                settings: {
                    fontSize: 14,
                    theme: 'dark' as const,
                    braveModeByDefault: false,
                    isSettingsOpen: false,
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
            },
            agent: {
                status: 'disconnected',
                messages: [],
                braveMode: false,
                loreFiles: [],
                activeFileContext: null,
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
            },
            setActiveTerminal: (id) =>
                set((state) => ({ ui: { ...state.ui, activeTerminalId: id } })),
            toggleCommandPalette: () =>
                set((state) => ({ ui: { ...state.ui, isCommandPaletteOpen: !state.ui.isCommandPaletteOpen } })),
            toggleShortcutsHelp: () =>
                set((state) => ({ ui: { ...state.ui, isShortcutsHelpOpen: !state.ui.isShortcutsHelpOpen } })),
            updateSettings: (settings) =>
                set((state) => ({ ui: { ...state.ui, settings: { ...state.ui.settings, ...settings } } })),
            toggleSettings: () =>
                set((state) => ({ ui: { ...state.ui, settings: { ...state.ui.settings, isSettingsOpen: !state.ui.settings.isSettingsOpen } } })),

            // Project Actions
            setRootPath: async (path) => {
                set((state) => ({ project: { ...state.project, rootPath: path } }));
                if (path) {
                    await window.sumerian.project.open(path);
                    get().refreshFileTree();
                    get().refreshLore();
                    window.sumerian.files.watch(path);
                    // Sync to shared state
                    window.sumerian.state.set('project', { rootPath: path, fileTree: get().project.fileTree });
                }
            },

            setFileTree: (tree) =>
                set((state) => ({ project: { ...state.project, fileTree: tree } })),
            refreshFileTree: async () => {
                const rootPath = get().project.rootPath;
                if (!rootPath) return;
                try {
                    const tree = await window.sumerian.files.list(rootPath);
                    set((state) => ({ project: { ...state.project, fileTree: tree } }));
                    // Sync to shared state
                    window.sumerian.state.set('project', { rootPath, fileTree: tree });
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
                const { openFiles } = get().editor;
                const existingFile = openFiles.find((f) => f.path === path);

                if (existingFile) {
                    set((state) => ({ editor: { ...state.editor, activeFileId: existingFile.id } }));
                    // Sync to shared state
                    window.sumerian.state.set('editor', { activeFileId: existingFile.id, openFiles: get().editor.openFiles });
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
                    set((state) => ({
                        editor: {
                            ...state.editor,
                            openFiles: newOpenFiles,
                            activeFileId: newFile.id,
                        },
                    }));
                    // Sync to shared state
                    window.sumerian.state.set('editor', { activeFileId: newFile.id, openFiles: newOpenFiles });
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
                    return { editor: { ...state.editor, openFiles, activeFileId } };
                });
            },
            setActiveFile: (id) => {
                set((state) => ({ editor: { ...state.editor, activeFileId: id } }));
                get().updateActiveFileContext(id);
                // Sync to shared state
                window.sumerian.state.set('editor', { activeFileId: id, openFiles: get().editor.openFiles });
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
                } catch (error) {
                    console.error('Failed to save file:', error);
                }
            },

            // Agent Actions
            sendMessage: async (content) => {
                const userMessage = {
                    id: Date.now().toString(),
                    role: 'user' as const,
                    content,
                    timestamp: Date.now(),
                    status: 'sent' as const
                };

                set((state) => ({
                    agent: {
                        ...state.agent,
                        messages: [...state.agent.messages, userMessage]
                    }
                }));

                try {
                    await window.sumerian.cli.send(content, get().agent.braveMode);
                } catch (error) {
                    console.error('Failed to send message to CLI:', error);
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
            },
            setAgentStatus: (status) =>
                set((state) => ({ agent: { ...state.agent, status } })),
            setBraveMode: (enabled) => {
                set((state) => ({ agent: { ...state.agent, braveMode: enabled } }));
                window.sumerian.cli.setBraveMode(enabled);
            },
            clearHistory: () =>
                set((state) => ({ agent: { ...state.agent, messages: [] } })),
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

            // Store Initialization
            init: async () => {
                // Load shared state from main process (for detached windows)
                const sharedState = await window.sumerian.state.getAll();
                if (sharedState?.editor) {
                    set((state) => ({ editor: { ...state.editor, ...sharedState.editor } }));
                }
                if (sharedState?.project) {
                    set((state) => ({ project: { ...state.project, ...sharedState.project } }));
                }
                
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

                window.sumerian.cli.onOutput((output) => {
                    get().updateLastAgentMessage(output.content);
                });

                window.sumerian.cli.onStatusChange((status) => {
                    get().setAgentStatus(status);
                });

                // Listen for state updates from main process
                window.sumerian.state.onUpdate(({ key, data }) => {
                    console.log('Received state update:', key, data);
                    if (key === 'editor') {
                        set((state) => ({ editor: { ...state.editor, ...data } }));
                    } else if (key === 'project') {
                        set((state) => ({ project: { ...state.project, ...data } }));
                    }
                });

                get().loadRecentProjects();
            }

        }),

        {
            name: 'sumerian-ui-storage',
            partialize: (state) => ({ ui: state.ui, project: { rootPath: state.project.rootPath } }),
        }
    )
);

