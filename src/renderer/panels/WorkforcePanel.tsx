import React from 'react';
import { useAppStore } from '../stores/useAppStore';
import AgentCard from '../components/AgentCard';
import { Bot } from 'lucide-react';

const WorkforcePanel: React.FC = () => {
    const { workforce, terminateAgent } = useAppStore();
    const activeAgents = Array.from(workforce.activeAgents.values());

    const handleFocusAgent = (agentId: string) => {
        // TODO: Focus agent terminal when terminal grid is implemented
        console.log('Focus agent:', agentId);
    };

    const handleKillAgent = async (agentId: string) => {
        if (confirm(`Kill agent ${agentId.slice(0, 8)}? This cannot be undone.`)) {
            try {
                await terminateAgent(agentId);
            } catch (error) {
                console.error('Failed to kill agent:', error);
            }
        }
    };

    if (activeAgents.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <Bot className="w-16 h-16 text-nexus-fg-muted mb-4 opacity-50" />
                <h3 className="text-sm font-medium text-nexus-fg-secondary mb-2">
                    No Active Agents
                </h3>
                <p className="text-xs text-nexus-fg-muted max-w-xs">
                    Spawn agents using the CLI or agent panel to see them here.
                </p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {activeAgents.map((agent) => (
                <AgentCard
                    key={agent.id}
                    agent={agent}
                    onFocus={handleFocusAgent}
                    onKill={handleKillAgent}
                />
            ))}
        </div>
    );
};

export default WorkforcePanel;
