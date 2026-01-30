import React from 'react';
import { RefreshCw, AlertCircle, StopCircle } from 'lucide-react';

interface SelfHealingIndicatorProps {
    iteration: number;
    maxIterations: number;
    lastError?: string;
    onInterrupt: () => void;
}

const SelfHealingIndicator: React.FC<SelfHealingIndicatorProps> = ({
    iteration,
    maxIterations,
    lastError,
    onInterrupt
}) => {
    return (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 text-red-500">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="text-xs font-bold uppercase tracking-wider">Self-Healing Loop</span>
                </div>
                <span className="text-[10px] font-mono bg-red-500 text-white px-1.5 py-0.5 rounded">
                    {iteration}/{maxIterations}
                </span>
            </div>

            {lastError && (
                <div className="flex items-start space-x-2 bg-black/20 rounded-lg p-2 mb-3">
                    <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-red-200 font-mono break-all line-clamp-2">
                        {lastError}
                    </p>
                </div>
            )}

            <button
                onClick={onInterrupt}
                className="w-full flex items-center justify-center space-x-2 px-3 py-1.5 rounded-lg bg-red-500 text-white text-[10px] font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
            >
                <StopCircle className="w-3.5 h-3.5" />
                <span>INTERRUPT LOOP</span>
            </button>
        </div>
    );
};

export default SelfHealingIndicator;
