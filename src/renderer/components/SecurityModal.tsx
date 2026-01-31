import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface SecurityModalProps {
  agentId: string;
  action: string;
  path: string;
  onAllow: () => void;
  onDeny: () => void;
}

const SecurityModal: React.FC<SecurityModalProps> = ({
  agentId,
  action,
  path,
  onAllow,
  onDeny
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-nexus-bg-secondary border border-red-500 rounded-xl p-6 max-w-md">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-6 h-6 text-red-500" />
          <h2 className="text-lg font-bold text-red-500">Security Boundary</h2>
        </div>
        
        <p className="text-sm text-nexus-fg-primary mb-4">
          Agent <code className="text-nexus-accent font-mono">{agentId}</code> is requesting:
        </p>
        
        <div className="bg-black/30 rounded p-3 mb-4">
          <p className="text-xs text-nexus-fg-secondary mb-1">Action:</p>
          <p className="text-sm text-nexus-fg-primary font-mono">{action}</p>
          
          <p className="text-xs text-nexus-fg-secondary mt-2 mb-1">Path:</p>
          <p className="text-sm text-nexus-fg-primary font-mono break-all">{path}</p>
        </div>
        
        <p className="text-xs text-yellow-500 mb-4">
          ⚠️ This violates default project sandboxing.
        </p>
        
        <div className="flex gap-2">
          <button 
            onClick={onAllow} 
            className="flex-1 px-4 py-2 rounded bg-blue-500 text-white text-xs font-bold hover:bg-blue-600 transition-colors"
          >
            ALLOW
          </button>
          <button 
            onClick={onDeny} 
            className="flex-1 px-4 py-2 rounded bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors"
          >
            DENY
          </button>
        </div>
      </div>
    </div>
  );
};

export default SecurityModal;
