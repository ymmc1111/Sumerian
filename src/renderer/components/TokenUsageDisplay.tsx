import React from 'react';
import { Zap, AlertTriangle } from 'lucide-react';

interface TokenUsageDisplayProps {
    usage: {
        input: number;
        output: number;
    } | null;
}

const MAX_CONTEXT_TOKENS = 200000; // Claude's typical context window

const TokenUsageDisplay: React.FC<TokenUsageDisplayProps> = ({ usage }) => {
    if (!usage) return null;

    const total = usage.input + usage.output;
    const contextPercentage = (usage.input / MAX_CONTEXT_TOKENS) * 100;
    
    // Color-coded based on usage
    const gaugeColor = contextPercentage > 80 ? 'bg-red-500' : contextPercentage > 60 ? 'bg-yellow-500' : 'bg-green-500';
    const textColor = contextPercentage > 80 ? 'text-red-500' : contextPercentage > 60 ? 'text-yellow-500' : 'text-green-500';

    return (
        <div className="flex flex-col gap-2">
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
            
            {/* Context Usage Gauge */}
            <div className="px-3">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] uppercase tracking-wider text-nexus-fg-muted">Context Usage</span>
                    <span className={`text-[9px] font-bold ${textColor}`}>{contextPercentage.toFixed(1)}%</span>
                </div>
                <div className="w-full h-1.5 bg-nexus-bg-primary rounded-full overflow-hidden">
                    <div 
                        className={`h-full ${gaugeColor} transition-all duration-300`}
                        style={{ width: `${Math.min(contextPercentage, 100)}%` }}
                    />
                </div>
                {contextPercentage > 80 && (
                    <div className="flex items-center gap-1 mt-1">
                        <AlertTriangle className="w-3 h-3 text-yellow-500" />
                        <p className="text-[9px] text-yellow-500">
                            Context nearly full. Consider using /compact
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TokenUsageDisplay;
