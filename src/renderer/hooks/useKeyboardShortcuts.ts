import { useEffect } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { useLayoutStore } from '../stores/layoutStore';

export const useKeyboardShortcuts = () => {
    const { toggleTerminal, setBraveMode, agent } = useAppStore();
    const { cycleLayoutMode } = useLayoutStore();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Cmd + ` to toggle terminal
            if (e.metaKey && e.key === '`') {
                e.preventDefault();
                toggleTerminal();
            }

            // Cmd + Shift + B to toggle Brave Mode
            if (e.metaKey && e.shiftKey && e.key.toLowerCase() === 'b') {
                e.preventDefault();
                setBraveMode(!agent.braveMode);
            }

            // Cmd + O to open project switcher
            if (e.metaKey && e.key.toLowerCase() === 'o') {
                e.preventDefault();
                useAppStore.getState().toggleProjectSwitcher();
            }

            // Cmd + , to open settings
            if (e.metaKey && e.key === ',') {
                e.preventDefault();
                useAppStore.getState().toggleSettings();
            }

            // Cmd + Shift + P for Command Palette
            if (e.metaKey && e.shiftKey && e.key.toLowerCase() === 'p') {
                e.preventDefault();
                useAppStore.getState().toggleCommandPalette();
            }

            // Cmd + / for Shortcuts Help
            if (e.metaKey && e.key === '/') {
                e.preventDefault();
                useAppStore.getState().toggleShortcutsHelp();
            }

            // Cmd + Shift + A to focus agent input
            if (e.metaKey && e.shiftKey && e.key.toLowerCase() === 'a') {
                e.preventDefault();
                const input = document.getElementById('agent-chat-input');
                if (input) {
                    input.focus();
                }
            }

            // Escape to close active UI or focus editor
            if (e.key === 'Escape') {
                const state = useAppStore.getState();
                if (state.ui.settings.isSettingsOpen) {
                    state.toggleSettings();
                } else if (state.ui.isCommandPaletteOpen) {
                    state.toggleCommandPalette();
                } else if (state.ui.isShortcutsHelpOpen) {
                    state.toggleShortcutsHelp();
                } else if (state.ui.isProjectSwitcherOpen) {
                    state.toggleProjectSwitcher();
                }
            }

            // Cmd + \ to cycle layout mode
            if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
                e.preventDefault();
                cycleLayoutMode();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggleTerminal, setBraveMode, agent.braveMode, cycleLayoutMode]);
};
