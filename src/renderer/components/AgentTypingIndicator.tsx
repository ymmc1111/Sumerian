import React from 'react';
import { Loader2 } from 'lucide-react';

interface Props {
    status: 'idle' | 'thinking' | 'streaming' | 'tool_use';
    toolName?: string | null;
}

const AgentTypingIndicator: React.FC<Props> = ({ status, toolName }) => {
    if (status === 'idle') return null;

    return (
        <div className="flex items-center gap-2 px-4 py-2 text-xs text-nexus-fg-muted animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" />
            {status === 'thinking' && <span>Thinking...</span>}
            {status === 'streaming' && (
                <span className="flex items-center gap-1">
                    Responding
                    <span className="inline-flex gap-0.5">
                        <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                        <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                        <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                    </span>
                </span>
            )}
            {status === 'tool_use' && (
                <span>Using tool: <span className="text-nexus-accent">{toolName}</span></span>
            )}
        </div>
    );
};

export default AgentTypingIndicator;
