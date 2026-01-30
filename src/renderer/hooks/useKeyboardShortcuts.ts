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

            // Cmd + O to open project
            if (e.metaKey && e.key.toLowerCase() === 'o') {
                e.preventDefault();
                useAppStore.getState().selectProject();
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
