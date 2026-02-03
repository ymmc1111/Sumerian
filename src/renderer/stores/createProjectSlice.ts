import { StateCreator } from 'zustand';
import { AppState, ProjectState, FileNode } from './types';

export interface ProjectActions {
    setRootPath: (path: string | null) => Promise<void>;
    setFileTree: (tree: FileNode[]) => void;
    refreshFileTree: () => Promise<void>;
    selectProject: () => Promise<void>;
    loadRecentProjects: () => Promise<void>;
    togglePathExpanded: (path: string) => void;
    setPathExpanded: (path: string, expanded: boolean) => void;
    loadDirectoryChildren: (path: string) => Promise<void>;
}

export interface ProjectSlice {
    project: ProjectState;
}

export const createProjectSlice: StateCreator<AppState, [], [], ProjectSlice & ProjectActions> = (set, get) => ({
    project: {
        rootPath: null,
        fileTree: [],
        recentProjects: [],
        expandedPaths: [],
    },

    setRootPath: async (path) => {
        console.log('[setRootPath] Requested path:', path);
        // Save current session before switching projects
        const currentPath = get().project.rootPath;
        if (currentPath && currentPath !== path) {
            console.log('[setRootPath] Saving previous session for:', currentPath);
            await get().saveSession();
            // Update project with current session ID
            const currentSessionId = get().agent.sessionId;
            if (currentSessionId) {
                await window.sumerian.project.updateSession(currentPath, currentSessionId);
            }
        }

        set((state) => ({ project: { ...state.project, rootPath: path, fileTree: [] } }));
        if (path) {
            console.log('[setRootPath] Initializing backend for:', path);
            try {
                await window.sumerian.project.open(path);
                console.log('[setRootPath] Backend project:open successful');
                await get().refreshFileTree();
                await get().refreshLore();
                await get().refreshModels();
                window.sumerian.files.watch(path);
            } catch (err) {
                console.error('[setRootPath] Failed to open project on backend:', err);
                return;
            }

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
        if (!rootPath || !window.sumerian?.files) {
            console.log('[refreshFileTree] Skipping: rootPath or window.sumerian.files missing');
            return;
        }

        console.log('[refreshFileTree] Refreshing for rootPath:', rootPath);
        try {
            const expandedPaths = get().project.expandedPaths;

            // Helper for recursive refresh
            const refreshSubtree = async (path: string): Promise<FileNode[]> => {
                const nodes = await window.sumerian.files.list(path);
                console.log(`[refreshFileTree] Listed ${nodes.length} nodes for path: ${path}`);
                for (const node of nodes) {
                    if (node.isDirectory && expandedPaths.includes(node.path)) {
                        node.children = await refreshSubtree(node.path);
                    }
                }
                return nodes;
            };

            const tree = await refreshSubtree(rootPath);
            console.log('[refreshFileTree] New tree root node count:', tree.length);
            if (tree.length > 0) {
                console.log('[refreshFileTree] First few nodes:', tree.slice(0, 3).map(n => n.path));
            } else {
                console.warn('[refreshFileTree] Tree is EMPTY for path:', rootPath);
            }

            set((state) => ({ project: { ...state.project, fileTree: tree } }));

            // Sync to shared state
            if (window.sumerian?.state) {
                window.sumerian.state.set('project', { rootPath, fileTree: tree });
            }
        } catch (error) {
            console.error('[refreshFileTree] Failed to refresh file tree:', error);
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
    togglePathExpanded: async (path: string) => {
        const isCurrentlyExpanded = get().project.expandedPaths.includes(path);

        set((state) => {
            const expandedSet = new Set(state.project.expandedPaths);
            if (isCurrentlyExpanded) expandedSet.delete(path);
            else expandedSet.add(path);
            return { project: { ...state.project, expandedPaths: Array.from(expandedSet) } };
        });

        // If newly expanded, ensure children are loaded
        if (!isCurrentlyExpanded) {
            await get().loadDirectoryChildren(path);
        }
    },
    setPathExpanded: (path: string, expanded: boolean) => {
        set((state) => {
            const expandedSet = new Set(state.project.expandedPaths);
            if (expanded) expandedSet.add(path);
            else expandedSet.delete(path);
            return { project: { ...state.project, expandedPaths: Array.from(expandedSet) } };
        });
    },
    loadDirectoryChildren: async (path: string) => {
        if (!window.sumerian?.files) return;
        try {
            const children = await window.sumerian.files.list(path);

            set((state) => {
                const updateTree = (nodes: FileNode[]): FileNode[] => {
                    return nodes.map(node => {
                        if (node.path === path) {
                            return { ...node, children };
                        }
                        if (node.children) {
                            return { ...node, children: updateTree(node.children) };
                        }
                        return node;
                    });
                };
                return { project: { ...state.project, fileTree: updateTree(state.project.fileTree) } };
            });
        } catch (error) {
            console.error(`Failed to load children for ${path}:`, error);
        }
    },
});
