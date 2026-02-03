import { StateCreator } from 'zustand';
import { AppState, UIState, SidebarTab } from './types';

export interface UiActions {
    setSidebarWidth: (width: number) => void;
    setAgentPanelWidth: (width: number) => void;
    setTerminalHeight: (height: number) => void;
    toggleTerminal: () => void;
    setActivePanel: (panel: 'editor' | 'agent' | 'terminal') => void;
    createTerminal: (name?: string) => void;
    closeTerminal: (id: string) => void;
    setActiveTerminal: (id: string) => void;
    toggleCommandPalette: () => void;
    toggleShortcutsHelp: () => void;
    toggleProjectSwitcher: () => void;
    toggleDocsViewer: () => void;
    openDocsWithTopic: (docId: string) => void;
    updateSettings: (settings: Partial<UIState['settings']>) => void;
    toggleSettings: () => void;
    setSidebarActiveTab: (tab: SidebarTab) => void;
}

export interface UiSlice {
    ui: UIState;
}

export const createUiSlice: StateCreator<AppState, [], [], UiSlice & UiActions> = (set) => ({
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
});
