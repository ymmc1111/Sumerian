import React, { useRef, useEffect } from 'react';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';
import ConnectionStatus from '../components/ConnectionStatus';
import BraveModeToggle from '../components/BraveModeToggle';
import { useAppStore } from '../stores/useAppStore';
import { Trash2, RotateCcw, Book, Bot } from 'lucide-react';
import PanelHeader from '../components/PanelHeader';
import { PanelSlotId } from '../types/layout';

interface AgentPanelProps {
    slotId?: PanelSlotId;
}

const AgentPanel: React.FC<AgentPanelProps> = ({ slotId = 'C' }) => {
    const { agent, clearHistory, refreshFileTree } = useAppStore();
    const scrollRef = useRef<HTMLDivElement>(null);

    const handleRollback = async () => {
        const success = await window.sumerian.files.undo();
        if (success) {
            refreshFileTree();
            // Optional: show a toast or notification
            console.log('Last agent action rolled back successfully');
        } else {
            console.warn('No agent actions to roll back');
        }
    };

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [agent.messages]);

    return (
        <div className="w-full h-full bg-nexus-bg-secondary flex flex-col border-l border-nexus-border">
            {/* Header */}
            <PanelHeader
                title="Agent"
                panelType="agent"
                slotId={slotId}
                canDetach={true}
                icon={<Bot className="w-4 h-4" />}
                actions={
                    <div className="flex items-center gap-1">
                        {agent.loreFiles.length > 0 && (
                            <div className="group relative">
                                <div className="status-badge status-badge-default cursor-help">
                                    <Book className="w-3 h-3 text-nexus-accent" />
                                    <span>{agent.loreFiles.length} Lore</span>
                                </div>
                                <div className="absolute top-full left-0 mt-2 w-48 p-3 rounded-lg shadow-xl z-50 invisible group-hover:visible" style={{ backgroundColor: '#141414', border: '1px solid #2a2a2a' }}>
                                    <h6 className="text-nexus-fg-muted mb-2">Active Lore</h6>
                                    <div className="space-y-1">
                                        {agent.loreFiles.map(file => (
                                            <div key={file.path} className="text-[11px] text-nexus-fg-secondary truncate">
                                                • {file.name}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        <button
                            onClick={handleRollback}
                            className="icon-btn"
                            title="Rollback Last Agent Action"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                            onClick={clearHistory}
                            className="icon-btn hover:text-red-400"
                            title="Clear History"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="divider-v" />
                        <BraveModeToggle />
                        <ConnectionStatus />
                    </div>
                }
            />

            {/* Messages */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 scroll-smooth"
            >
                {agent.messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40 font-mono">
                        <div className="w-12 h-12 rounded-2xl bg-nexus-bg-tertiary border border-nexus-border flex items-center justify-center mb-4">
                            <Trash2 className="w-6 h-6 text-nexus-fg-muted" />
                        </div>
                        <h3 className="text-sm font-medium text-nexus-fg-primary mb-1">Start a Conversation</h3>
                        <p className="text-xs text-nexus-fg-secondary">Ask the agent to explain code, fix bugs, or build new features.</p>
                    </div>
                ) : (
                    agent.messages.map((msg) => (
                        <ChatMessage key={msg.id} message={msg} />
                    ))
                )}
            </div>

            {/* Input */}
            <ChatInput />
        </div>
    );
};

export default AgentPanel;

