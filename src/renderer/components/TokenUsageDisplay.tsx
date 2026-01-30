import React from 'react';
import { Zap } from 'lucide-react';

interface TokenUsageDisplayProps {
    usage: {
        input: number;
        output: number;
    } | null;
}

const TokenUsageDisplay: React.FC<TokenUsageDisplayProps> = ({ usage }) => {
    if (!usage) return null;

    const total = usage.input + usage.output;

    return (
        <div className="flex items-center gap-3 px-3 py-1.5 bg-nexus-bg-tertiary border border-nexus-border rounded-full text-[10px] font-mono text-nexus-fg-secondary">
            <div className="flex items-center gap-1.5 border-r border-nexus-border pr-3">
                <Zap className="w-3 h-3 text-nexus-accent" />
                <span className="text-nexus-fg-primary font-bold">Token Metrics</span>
            </div>
            <div className="flex gap-4">
                <div className="flex items-center gap-1.5">
                    <span className="opacity-40 uppercase tracking-tighter">In:</span>
                    <span className="text-nexus-fg-primary">{usage.input.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="opacity-40 uppercase tracking-tighter">Out:</span>
                    <span className="text-nexus-fg-primary">{usage.output.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1.5 border-l border-nexus-border pl-4">
                    <span className="opacity-40 uppercase tracking-tighter">Total:</span>
                    <span className="text-nexus-accent font-bold">{total.toLocaleString()}</span>
                </div>
            </div>
        </div>
    );
};

export default TokenUsageDisplay;
