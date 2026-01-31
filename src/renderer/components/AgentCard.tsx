import React from 'react';
import { Bot, X, CheckCircle, AlertCircle, Clock, FileText } from 'lucide-react';
import { AgentInstance } from '../stores/types';
import ResourceSparkline from './ResourceSparkline';

interface AgentCardProps {
    agent: AgentInstance;
    onFocus: (agentId: string) => void;
    onKill: (agentId: string) => void;
    onReviewChanges?: (agentId: string) => void;
    onRevert?: (agentId: string) => void;
}

const AgentCard: React.FC<AgentCardProps> = ({ agent, onFocus, onKill, onReviewChanges, onRevert }) => {
    const statusColors = {
        idle: 'bg-gray-500',
        active: 'bg-green-500',
        complete: 'bg-blue-500',
        error: 'bg-red-500',
    };

    const statusLabels = {
        idle: 'Idle',
        active: 'Active',
        complete: 'Complete',
        error: 'Error',
    };

    const hasResources = agent.resources && agent.resources.cpuHistory.length > 0;
    const isComplete = agent.status === 'complete' || agent.status === 'error';
    const hasReport = agent.completionReport !== undefined;

    if (isComplete && hasReport) {
        const report = agent.completionReport!;
        const isSuccess = agent.status === 'complete';
        
        return (
            <div
                className={`border rounded-xl p-4 ${
                    isSuccess 
                        ? 'bg-green-500/10 border-green-500/30' 
                        : 'bg-red-500/10 border-red-500/30'
                }`}
            >
                <div className="flex items-center gap-2 mb-3">
                    {isSuccess ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                    <h3 className={`text-sm font-bold ${
                        isSuccess ? 'text-green-500' : 'text-red-500'
                    }`}>
                        {isSuccess ? 'Task Complete' : 'Task Failed'}
                    </h3>
                </div>
                
                <div className="space-y-2 mb-4">
                    <div>
                        <span className="text-xs text-nexus-fg-secondary">Agent:</span>
                        <span className="text-xs text-nexus-fg-primary ml-2 font-mono">
                            {agent.id.slice(0, 8)}
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-nexus-fg-secondary" />
                            <span className="text-xs text-nexus-fg-secondary">Duration:</span>
                            <span className="text-xs text-nexus-fg-primary">
                                {(report.duration / 1000).toFixed(1)}s
                            </span>
                        </div>
                        
                        {report.usage && (
                            <div className="flex items-center gap-1">
                                <FileText className="w-3 h-3 text-nexus-fg-secondary" />
                                <span className="text-xs text-nexus-fg-secondary">Tokens:</span>
                                <span className="text-xs text-nexus-fg-primary">
                                    {report.usage.input + report.usage.output}
                                </span>
                            </div>
                        )}
                    </div>
                    
                    {report.filesModified.length > 0 && (
                        <div>
                            <span className="text-xs text-nexus-fg-secondary">Files modified:</span>
                            <ul className="mt-1 space-y-1 max-h-24 overflow-y-auto">
                                {report.filesModified.map(file => (
                                    <li key={file} className="text-xs text-nexus-fg-muted font-mono truncate" title={file}>
                                        • {file.split('/').pop()}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {report.error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded p-2">
                            <span className="text-xs text-red-400 font-mono">{report.error}</span>
                        </div>
                    )}
                </div>
                
                <div className="flex gap-2">
                    {onReviewChanges && report.filesModified.length > 0 && (
                        <button 
                            onClick={() => onReviewChanges(agent.id)}
                            className="flex-1 px-3 py-2 rounded bg-blue-500 text-white text-xs font-bold hover:bg-blue-600 transition-colors"
                        >
                            REVIEW CHANGES
                        </button>
                    )}
                    {onRevert && report.filesModified.length > 0 && (
                        <button 
                            onClick={() => onRevert(agent.id)}
                            className="flex-1 px-3 py-2 rounded bg-red-500/20 text-red-500 text-xs font-bold hover:bg-red-500/30 transition-colors"
                        >
                            REVERT
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div
            className="bg-nexus-bg-tertiary border border-nexus-border rounded-lg p-3 cursor-pointer hover:border-nexus-accent transition-colors"
            onClick={() => onFocus(agent.id)}
        >
            {/* Header: ID and Status */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-nexus-accent" />
                    <span className="text-xs font-mono text-nexus-fg-primary">
                        {agent.id.slice(0, 8)}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-nexus-fg-muted uppercase">
                        {statusLabels[agent.status]}
                    </span>
                    <div className={`w-2 h-2 rounded-full ${statusColors[agent.status]}`} />
                </div>
            </div>

            {/* Persona and Context */}
            <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold text-nexus-fg-secondary uppercase">
                    {agent.persona.id}
                </span>
                {agent.lockedFiles.length > 0 && (
                    <span className="text-[10px] bg-nexus-accent/20 text-nexus-accent px-1.5 py-0.5 rounded">
                        {agent.lockedFiles.length} {agent.lockedFiles.length === 1 ? 'file' : 'files'}
                    </span>
                )}
            </div>

            {/* Task Description */}
            <p className="text-[11px] text-nexus-fg-muted truncate mb-3" title={agent.task}>
                {agent.task}
            </p>

            {/* Resource Monitoring */}
            {hasResources && (
                <div className="mb-3 space-y-2 pb-3 border-b border-nexus-border">
                    <ResourceSparkline
                        history={agent.resources!.cpuHistory}
                        label="CPU"
                        unit="%"
                        color="text-blue-500"
                    />
                    <ResourceSparkline
                        history={agent.resources!.memoryHistory}
                        label="Memory"
                        unit="MB"
                        color="text-green-500"
                        warningThreshold={512}
                    />
                </div>
            )}

            {/* Kill Button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onKill(agent.id);
                }}
                className="w-full px-2 py-1.5 rounded bg-red-500/20 text-red-500 text-[10px] font-bold hover:bg-red-500/30 transition-colors flex items-center justify-center gap-1.5"
            >
                <X className="w-3 h-3" />
                KILL AGENT
            </button>
        </div>
    );
};

export default AgentCard;
