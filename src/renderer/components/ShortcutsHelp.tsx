import React from 'react';
import { X, Command, Keyboard } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';

const ShortcutsHelp: React.FC = () => {
    const { ui, toggleShortcutsHelp } = useAppStore();
    const { isShortcutsHelpOpen } = ui;

    if (!isShortcutsHelpOpen) return null;

    const shortcutGroups = [
        {
            name: 'General',
            shortcuts: [
                { keys: ['⌘', 'O'], action: 'Open Folder' },
                { keys: ['⌘', ','], action: 'Open Settings' },
                { keys: ['⌘', 'Shift', 'P'], action: 'Command Palette' },
                { keys: ['⌘', '/'], action: 'Show Keyboard Shortcuts' },
                { keys: ['@'], action: 'Reference File in Chat' },
                { keys: ['/'], action: 'Agent Slash Commands' },
            ]
        },
        {
            name: 'Editor',
            shortcuts: [
                { keys: ['⌘', 'S'], action: 'Save File' },
                { keys: ['⌘', 'W'], action: 'Close File' },
                { keys: ['⌘', 'Z'], action: 'Undo Editing' },
            ]
        },
        {
            name: 'Agent & Tools',
            shortcuts: [
                { keys: ['⌘', '`'], action: 'Toggle Terminal' },
                { keys: ['⌘', 'Shift', 'B'], action: 'Toggle Brave Mode' },
                { keys: ['⌘', 'Shift', 'A'], action: 'Focus Agent Input' },
            ]
        }
    ];

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={toggleShortcutsHelp}>
            <div
                className="w-full max-w-lg bg-nexus-bg-secondary border border-nexus-border rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="h-12 px-6 border-b border-nexus-border flex items-center justify-between shrink-0 bg-nexus-bg-tertiary">
                    <div className="flex items-center space-x-2">
                        <Keyboard className="w-4 h-4 text-nexus-accent" />
                        <h2 className="text-xs font-bold uppercase tracking-widest text-nexus-fg-primary">Keyboard Shortcuts</h2>
                    </div>
                    <button
                        onClick={toggleShortcutsHelp}
                        className="p-1 hover:bg-nexus-bg-primary rounded-lg text-nexus-fg-muted hover:text-nexus-fg-primary transition-all"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-nexus-bg-primary">
                    {shortcutGroups.map((group) => (
                        <div key={group.name} className="space-y-4">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-nexus-fg-muted px-1">{group.name}</h3>
                            <div className="space-y-2">
                                {group.shortcuts.map((s) => (
                                    <div key={s.action} className="flex items-center justify-between py-1 px-1 group">
                                        <span className="text-xs text-nexus-fg-secondary group-hover:text-nexus-fg-primary transition-colors">{s.action}</span>
                                        <div className="flex items-center space-x-1">
                                            {s.keys.map((key) => (
                                                <kbd key={key} className="min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-nexus-bg-tertiary border border-nexus-border rounded-md text-[10px] font-bold text-nexus-fg-primary shadow-sm">
                                                    {key}
                                                </kbd>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-nexus-border text-center bg-nexus-bg-tertiary">
                    <span className="text-[10px] text-nexus-fg-muted uppercase tracking-[0.2em]">Press Esc to close</span>
                </div>
            </div>
        </div>
    );
};

export default ShortcutsHelp;
