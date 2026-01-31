import React from 'react';
import { RefreshCw, CheckCircle, StopCircle } from 'lucide-react';

interface LoopIndicatorProps {
    iteration: number;
    maxIterations: number;
    prompt: string;
    completionPromise: string;
    onCancel: () => void;
}

const LoopIndicator: React.FC<LoopIndicatorProps> = ({
    iteration,
    maxIterations,
    prompt,
    completionPromise,
    onCancel
}) => {
    const progress = (iteration / maxIterations) * 100;
    
    return (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 text-blue-500">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="text-xs font-bold uppercase tracking-wider">Loop Mode Active</span>
                </div>
                <span className="text-[10px] font-mono bg-blue-500 text-white px-1.5 py-0.5 rounded">
                    {iteration}/{maxIterations}
                </span>
            </div>
            
            {/* Progress bar */}
            <div className="w-full h-1 bg-blue-500/20 rounded-full mb-3 overflow-hidden">
                <div 
                    className="h-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                />
            </div>
            
            <div className="bg-black/20 rounded-lg p-2 mb-3 space-y-1">
                <div className="flex items-center space-x-2">
                    <CheckCircle className="w-3 h-3 text-blue-400 shrink-0" />
                    <p className="text-[10px] text-blue-200 font-mono">
                        Promise: <span className="text-blue-400">{completionPromise}</span>
                    </p>
                </div>
                <p className="text-[11px] text-blue-200/70 font-mono truncate pl-5">
                    {prompt.substring(0, 80)}...
                </p>
            </div>

            <button
                onClick={onCancel}
                className="w-full flex items-center justify-center space-x-2 px-3 py-1.5 rounded-lg bg-blue-500 text-white text-[10px] font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20"
            >
                <StopCircle className="w-3.5 h-3.5" />
                <span>CANCEL LOOP</span>
            </button>
        </div>
    );
};

export default LoopIndicator;
