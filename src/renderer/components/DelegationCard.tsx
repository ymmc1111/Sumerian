import React from 'react';
import { Bot } from 'lucide-react';

export interface DelegationProposal {
  id: string;
  persona: {
    id: string;
    model: string;
    systemPrompt: string;
    allowedTools: string[];
    disallowedTools: string[];
    maxBudgetUsd?: number;
  };
  model: string;
  task: string;
  files: string[];
  estimatedCost?: number;
}

interface DelegationCardProps {
  proposal: DelegationProposal;
  onApprove: () => void;
  onReject: () => void;
}

const DelegationCard: React.FC<DelegationCardProps> = ({
  proposal,
  onApprove,
  onReject
}) => {
  return (
    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Bot className="w-5 h-5 text-blue-500" />
        <h3 className="text-sm font-bold text-blue-500">Delegation Proposal</h3>
      </div>
      
      <div className="space-y-2 mb-4">
        <div>
          <span className="text-xs text-nexus-fg-secondary">Agent:</span>
          <span className="text-xs text-nexus-fg-primary ml-2">
            {proposal.persona.id} ({proposal.model})
          </span>
        </div>
        
        <div>
          <span className="text-xs text-nexus-fg-secondary">Task:</span>
          <p className="text-xs text-nexus-fg-primary mt-1">{proposal.task}</p>
        </div>
        
        {proposal.files.length > 0 && (
          <div>
            <span className="text-xs text-nexus-fg-secondary">Files to modify:</span>
            <ul className="mt-1 space-y-1">
              {proposal.files.map(file => (
                <li key={file} className="text-xs text-nexus-fg-muted font-mono">
                  • {file}
                </li>
              ))}
            </ul>
          </div>
        )}

        {proposal.estimatedCost && (
          <div>
            <span className="text-xs text-nexus-fg-secondary">Estimated cost:</span>
            <span className="text-xs text-nexus-fg-primary ml-2">
              ${proposal.estimatedCost.toFixed(2)}
            </span>
          </div>
        )}
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={onApprove}
          className="flex-1 px-3 py-2 rounded bg-blue-500 text-white text-xs font-bold hover:bg-blue-600 transition-colors"
        >
          APPROVE
        </button>
        <button
          onClick={onReject}
          className="flex-1 px-3 py-2 rounded bg-red-500/20 text-red-500 text-xs font-bold hover:bg-red-500/30 transition-colors"
        >
          REJECT
        </button>
      </div>
    </div>
  );
};

export default DelegationCard;
