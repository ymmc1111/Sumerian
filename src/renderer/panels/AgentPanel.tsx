import React, { useRef, useEffect } from 'react';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';
import AgentTypingIndicator from '../components/AgentTypingIndicator';
import ToolActionFeed from '../components/ToolActionFeed';
import ConnectionStatus from '../components/ConnectionStatus';
import BraveModeToggle from '../components/BraveModeToggle';
import SelfHealingIndicator from '../components/SelfHealingIndicator';
import { useAppStore } from '../stores/useAppStore';
import { PanelSlotId } from '../types/layout';
import SessionList from '../components/SessionList';
import TokenUsageDisplay from '../components/TokenUsageDisplay';
import PanelHeader from '../components/PanelHeader';
import ModelSelector from '../components/ModelSelector';
import { Trash2, RotateCcw, Book, Bot, History } from 'lucide-react';

interface AgentPanelProps {
    slotId?: PanelSlotId;
}

const AgentPanel: React.FC<AgentPanelProps> = ({ slotId = 'C' }) => {
    const { agent, clearHistory, refreshFileTree, interruptHealingLoop, clearTerminalError } = useAppStore();
    const [showSessions, setShowSessions] = React.useState(false);
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
                    <div className="flex items-center gap-2">
                        {agent.loreFiles.length > 0 && (
                            <div className="group relative">
                                <div className="status-badge status-badge-default cursor-help">
                                    <Book className="w-3 h-3 text-nexus-accent" />
                                    <span>{agent.loreFiles.length} Lore</span>
                                </div>
                                <div className="absolute top-full left-0 mt-2 w-48 p-3 rounded-lg shadow-xl z-50 invisible group-hover:visible" style={{ backgroundColor: '#141414', border: '1px solid #2a2a2a' }}>
                                    <h6 className="text-nexus-fg-muted mb-2">Active Lore</h6>
                                    <div className="space-y-1">
                                        {agent.loreFiles.map((file: any) => (
                                            <div key={file.path} className="text-[11px] text-nexus-fg-secondary truncate">
                                                • {file.name}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        <button
                            onClick={() => setShowSessions(true)}
                            className="p-1.5 rounded-lg hover:bg-nexus-bg-tertiary text-nexus-fg-muted hover:text-nexus-fg-primary transition-all active:scale-95"
                            title="Conversation History"
                        >
                            <History className="w-3.5 h-3.5" />
                        </button>
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
                {agent.lastTerminalError && (
                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 mb-6 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center space-x-3 overflow-hidden">
                            <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center shrink-0">
                                <Bot className="w-5 h-5 text-orange-500" />
                            </div>
                            <div className="min-w-0">
                                <div className="text-[10px] font-bold text-orange-500 uppercase tracking-wider mb-0.5">Terminal Error Detected</div>
                                <div className="text-[11px] text-orange-200/70 truncate font-mono">{agent.lastTerminalError}</div>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                useAppStore.getState().sendMessage(`I encountered an error in the terminal:\n\n${agent.lastTerminalError}\n\nPlease help me fix it.`);
                                clearTerminalError();
                            }}
                            className="ml-4 px-3 py-1.5 rounded-lg bg-orange-500 text-white text-[10px] font-bold hover:bg-orange-600 transition-colors shrink-0"
                        >
                            FIX WITH AGENT
                        </button>
                    </div>
                )}
                {agent.messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40 font-mono">
                        <div className="w-12 h-12 rounded-2xl bg-nexus-bg-tertiary border border-nexus-border flex items-center justify-center mb-4">
                            <Trash2 className="w-6 h-6 text-nexus-fg-muted" />
                        </div>
                        <h3 className="text-sm font-medium text-nexus-fg-primary mb-1">Start a Conversation</h3>
                        <p className="text-xs text-nexus-fg-secondary">Ask the agent to explain code, fix bugs, or build new features.</p>
                    </div>
                ) : (
                    <>
                        {agent.messages.map((msg: any) => (
                            <ChatMessage key={msg.id} message={msg} />
                        ))}

                        {agent.healingLoopActive && (
                            <SelfHealingIndicator
                                iteration={agent.healingIteration}
                                maxIterations={agent.maxHealingIterations}
                                lastError={agent.lastHealingError || undefined}
                                onInterrupt={interruptHealingLoop}
                            />
                        )}

                        <AgentTypingIndicator
                            status={agent.streamStatus}
                            toolName={agent.currentToolName}
                        />
                    </>
                )}
            </div>

            {/* Tool Actions Feed */}
            <ToolActionFeed actions={agent.toolActions} />

            <div className="px-4 py-2 flex justify-end">
                <TokenUsageDisplay usage={agent.usage} />
            </div>

            {/* Input */}
            <ChatInput />

            {/* Session History Overlay */}
            {showSessions && <SessionList onClose={() => setShowSessions(false)} />}
        </div>
    );
};

export default AgentPanel;

