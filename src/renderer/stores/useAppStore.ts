import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState } from './types';
import { createUiSlice } from './createUiSlice';
import { createProjectSlice } from './createProjectSlice';
import { createEditorSlice } from './createEditorSlice';
import { createAgentSlice } from './createAgentSlice';
import { createWorkforceSlice } from './createWorkforceSlice';

export const useAppStore = create<AppState>()(
    persist(
        (set, get, store) => ({
            ...createUiSlice(set, get, store),
            ...createProjectSlice(set, get, store),
            ...createEditorSlice(set, get, store),
            ...createAgentSlice(set, get, store),
            ...createWorkforceSlice(set, get, store),
        }),
        {
            name: 'sumerian-ui-storage',
            partialize: (state) => ({
                ui: {
                    ...state.ui,
                    isCommandPaletteOpen: false,
                    isShortcutsHelpOpen: false,
                    isProjectSwitcherOpen: false,
                    isDocsViewerOpen: false,
                    settings: {
                        ...state.ui.settings,
                        isSettingsOpen: false,
                    },
                },
                project: {
                    rootPath: state.project.rootPath,
                    expandedPaths: state.project.expandedPaths
                },
                agent: { mode: state.agent.mode }
            }),
            merge: (persistedState: any, currentState) => {
                const merged = { ...currentState, ...(persistedState as any) };
                // Ensure sub-objects are also merged safely to preserve missing keys
                if (persistedState.project) {
                    merged.project = { ...currentState.project, ...persistedState.project };
                }
                if (persistedState.ui) {
                    merged.ui = { ...currentState.ui, ...persistedState.ui };
                }
                if (persistedState.agent) {
                    merged.agent = { ...currentState.agent, ...persistedState.agent };
                }
                return merged;
            }
        }
    )
);

// Re-export types for convenience
export * from './types';
