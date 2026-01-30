import React from 'react';
import { Plus, X, Terminal as TerminalIcon } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';

const TerminalTabs: React.FC = () => {
    const { ui, createTerminal, closeTerminal, setActiveTerminal } = useAppStore();

    return (
        <div className="flex items-center bg-nexus-bg-secondary border-b border-nexus-border overflow-x-auto no-scrollbar shrink-0">
            {ui.terminals.map((term) => (
                <div
                    key={term.id}
                    className={`group flex items-center h-8 px-3 min-w-[120px] max-w-[200px] border-r border-nexus-border cursor-pointer transition-colors ${ui.activeTerminalId === term.id
                            ? 'bg-nexus-bg-primary text-nexus-fg-primary'
                            : 'text-nexus-fg-muted hover:bg-nexus-bg-tertiary'
                        }`}
                    onClick={() => setActiveTerminal(term.id)}
                >
                    <TerminalIcon className={`w-3 h-3 mr-2 ${ui.activeTerminalId === term.id ? 'text-nexus-accent' : ''}`} />
                    <span className="text-[10px] font-bold uppercase tracking-tight truncate flex-1">
                        {term.name}
                    </span>
                    <button
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-nexus-border rounded transition-all"
                        onClick={(e) => {
                            e.stopPropagation();
                            closeTerminal(term.id);
                        }}
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            ))}
            <button
                className="p-2 hover:bg-nexus-bg-tertiary text-nexus-fg-muted transition-colors"
                onClick={() => createTerminal()}
                title="New Terminal"
            >
                <Plus className="w-3.5 h-3.5" />
            </button>
        </div>
    );
};

export default TerminalTabs;
