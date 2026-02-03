import { StateCreator } from 'zustand';
import { AppState, EditorState } from './types';

export interface EditorActions {
    openFile: (path: string, groupId?: string) => Promise<void>;
    closeFile: (id: string) => void;
    setActiveFile: (id: string | null) => void;
    setFileContent: (id: string, content: string) => void;
    saveFile: (id: string) => Promise<void>;
    splitEditor: (direction: 'horizontal' | 'vertical') => void;
    closeEditorGroup: (groupId: string) => void;
    setActiveGroup: (groupId: string) => void;
    moveFileToGroup: (fileId: string, targetGroupId: string) => void;
}

export interface EditorSlice {
    editor: EditorState;
}

export const createEditorSlice: StateCreator<AppState, [], [], EditorSlice & EditorActions> = (set, get) => ({
    editor: {
        openFiles: [],
        activeFileId: null,
        groups: [{ id: 'default', openFiles: [], activeFileId: null }],
        activeGroupId: 'default',
        layout: 'single',
    },

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
});
