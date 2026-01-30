import React, { useState } from 'react';
import { Zap, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';

const BraveModeToggle: React.FC = () => {
    const { agent, setBraveMode } = useAppStore();
    const [showWarning, setShowWarning] = useState(false);

    const handleToggle = () => {
        if (!agent.braveMode) {
            setShowWarning(true);
        } else {
            setBraveMode(false);
        }
    };

    const confirmEnable = () => {
        setBraveMode(true);
        setShowWarning(false);
    };

    return (
        <>
            <button
                onClick={handleToggle}
                className={`status-badge cursor-pointer transition-all ${agent.braveMode
                        ? 'status-badge-danger animate-pulse'
                        : 'status-badge-default'
                    }`}
                title={agent.braveMode ? "Brave Mode Active (High Autonomy)" : "Enable Brave Mode"}
            >
                {agent.braveMode ? <Zap className="fill-current" /> : <ShieldCheck />}
                <span>{agent.braveMode ? 'BRAVE' : 'GUARDED'}</span>
            </button>

            {showWarning && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
                    <div className="border border-red-500/50 rounded-2xl p-6 max-w-sm w-full shadow-2xl" style={{ backgroundColor: '#0a0a0a' }}>
                        <div className="flex items-center space-x-3 text-red-500 mb-4">
                            <ShieldAlert className="w-6 h-6" />
                            <h3 className="text-lg font-bold">Heads Up!</h3>
                        </div>
                        <p className="text-sm text-nexus-fg-secondary mb-6 leading-relaxed">
                            Brave Mode allows the agent to execute commands and modify files without per-action approval.
                            Guardrails are still active, but autonomy is significantly increased. Use with caution.
                        </p>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowWarning(false)}
                                className="flex-1 px-4 py-2 rounded-xl bg-nexus-bg-tertiary text-nexus-fg-primary text-sm font-medium hover:bg-nexus-border transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmEnable}
                                className="flex-1 px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                            >
                                Enable
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default BraveModeToggle;
