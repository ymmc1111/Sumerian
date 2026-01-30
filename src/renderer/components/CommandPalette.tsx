import React, { useState, useEffect, useRef } from 'react';
import { Search, Command, ArrowRight } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';

interface CommandItem {
    id: string;
    label: string;
    description: string;
    shortcut?: string;
    action: () => void;
}

const CommandPalette: React.FC = () => {
    const { ui, toggleCommandPalette, toggleSettings, selectProject, toggleShortcutsHelp, agent, setBraveMode, clearHistory } = useAppStore();
    const { isCommandPaletteOpen } = ui;
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const commands: CommandItem[] = [
        { id: 'open-project', label: 'Open Folder', description: 'Open a project directory from your computer', shortcut: '⌘O', action: selectProject },
        { id: 'settings', label: 'Settings', description: 'Configure editor appearance and behavior', shortcut: '⌘,', action: toggleSettings },
        { id: 'shortcuts', label: 'Show Keyboard Shortcuts', description: 'View all keyboard shortcuts', shortcut: '⌘/', action: toggleShortcutsHelp },
        { id: 'brave-mode', label: 'Toggle Brave Mode', description: 'Enable/disable autonomous agent actions', shortcut: '⌘⇧B', action: () => setBraveMode(!agent.braveMode) },
        { id: 'clear-history', label: 'Clear Chat History', description: 'Wipe all agent messages from the session', action: clearHistory },
    ];

    const filteredCommands = commands.filter(c =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.description.toLowerCase().includes(query.toLowerCase())
    );

    useEffect(() => {
        if (isCommandPaletteOpen) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isCommandPaletteOpen]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredCommands[selectedIndex]) {
                const cmd = filteredCommands[selectedIndex];
                cmd.action();
                toggleCommandPalette();
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            toggleCommandPalette();
        }
    };

    if (!isCommandPaletteOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-start justify-center pt-24 p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200" onClick={toggleCommandPalette}>
            <div
                className="w-full max-w-xl bg-nexus-bg-secondary backdrop-blur-2xl border border-nexus-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-top-4 duration-200"
                style={{ backgroundColor: 'var(--color-bg-secondary)' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Search Input */}
                <div className="flex items-center px-4 h-14 border-b border-nexus-border bg-nexus-bg-tertiary">
                    <Search className="w-5 h-5 text-nexus-fg-muted mr-3" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search commands..."
                        className="flex-1 bg-transparent text-nexus-fg-primary text-sm outline-none placeholder:text-nexus-fg-muted"
                    />
                    <div className="flex items-center space-x-1 ml-4">
                        <kbd className="px-1.5 h-5 flex items-center bg-nexus-bg-primary border border-nexus-border rounded text-[10px] text-nexus-fg-muted font-bold">ESC</kbd>
                    </div>
                </div>

                {/* Results */}
                <div className="max-h-[320px] overflow-y-auto p-2">
                    {filteredCommands.length === 0 ? (
                        <div className="py-8 text-center text-nexus-fg-muted text-xs">
                            No commands found for "{query}"
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filteredCommands.map((cmd, index) => (
                                <button
                                    key={cmd.id}
                                    onClick={() => { cmd.action(); toggleCommandPalette(); }}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                    className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all ${index === selectedIndex
                                        ? 'bg-nexus-accent text-white shadow-lg'
                                        : 'text-nexus-fg-secondary hover:bg-nexus-bg-tertiary'
                                        }`}
                                >
                                    <div className="flex items-center text-left">
                                        <Command className={`w-4 h-4 mr-3 ${index === selectedIndex ? 'text-white' : 'text-nexus-accent'}`} />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium leading-none mb-1">{cmd.label}</span>
                                            <span className={`text-[10px] ${index === selectedIndex ? 'text-white/80' : 'text-nexus-fg-muted'}`}>
                                                {cmd.description}
                                            </span>
                                        </div>
                                    </div>
                                    {cmd.shortcut && (
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${index === selectedIndex ? 'bg-white/20 text-white' : 'bg-nexus-bg-primary text-nexus-fg-muted border border-nexus-border'
                                            }`}>
                                            {cmd.shortcut}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2 border-t border-nexus-border bg-nexus-bg-tertiary flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center text-[10px] text-nexus-fg-muted font-bold">
                            <ArrowRight className="w-3 h-3 mr-1" />
                            <span>SELECT</span>
                        </div>
                    </div>
                    <span className="text-[10px] text-nexus-fg-muted uppercase tracking-widest font-bold">Sumerian Command Palette</span>
                </div>
            </div>
        </div>
    );
};

export default CommandPalette;
