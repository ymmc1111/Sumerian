import React from 'react';
import { ShieldAlert, Check, X } from 'lucide-react';

interface DryRunPreviewProps {
    type: 'delete' | 'command';
    target: string;
    onApprove: () => void;
    onCancel: () => void;
}

const DryRunPreview: React.FC<DryRunPreviewProps> = ({ type, target, onApprove, onCancel }) => {
    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-nexus-bg-secondary border border-nexus-accent/50 rounded-2xl p-6 max-w-md w-full shadow-2xl">
                <div className="flex items-center space-x-3 text-nexus-accent mb-4">
                    <ShieldAlert className="w-6 h-6" />
                    <h3 className="text-lg font-bold">Action Preview</h3>
                </div>

                <div className="mb-6">
                    <p className="text-xs text-nexus-fg-muted uppercase tracking-widest mb-2 font-bold">
                        {type === 'delete' ? 'Destructive Operation' : 'System Command'}
                    </p>
                    <div className="bg-nexus-bg-tertiary border border-nexus-border rounded-lg p-3 font-mono text-sm break-all">
                        {type === 'delete' ? `rm ${target}` : target}
                    </div>
                </div>

                <p className="text-sm text-nexus-fg-secondary mb-8">
                    An agent action is requesting your approval. Review the details above before proceeding.
                </p>

                <div className="flex space-x-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-nexus-bg-tertiary text-nexus-fg-primary text-sm font-medium hover:bg-nexus-border transition-colors flex items-center justify-center"
                    >
                        <X className="w-4 h-4 mr-2" />
                        Decline
                    </button>
                    <button
                        onClick={onApprove}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-nexus-accent text-white text-sm font-bold hover:bg-opacity-90 transition-colors shadow-lg shadow-nexus-accent/20 flex items-center justify-center"
                    >
                        <Check className="w-4 h-4 mr-2" />
                        Approve
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DryRunPreview;
