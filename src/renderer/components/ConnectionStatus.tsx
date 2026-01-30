import React from 'react';
import { useAppStore } from '../stores/useAppStore';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';

const ConnectionStatus: React.FC = () => {
    const { agent } = useAppStore();

    const getStatusConfig = () => {
        switch (agent.status) {
            case 'connected':
                return {
                    icon: <Wifi />,
                    label: 'Connected',
                    badgeClass: 'status-badge-success'
                };
            case 'connecting':
                return {
                    icon: <RefreshCw className="animate-spin" />,
                    label: 'Connecting',
                    badgeClass: 'status-badge-warning'
                };
            case 'error':
                return {
                    icon: <AlertCircle />,
                    label: 'Error',
                    badgeClass: 'status-badge-danger'
                };
            default:
                return {
                    icon: <WifiOff />,
                    label: 'Offline',
                    badgeClass: 'status-badge-default'
                };
        }
    };

    const config = getStatusConfig();

    return (
        <div className="group relative">
            <div className={`status-badge ${config.badgeClass}`}>
                {config.icon}
                <span>{config.label}</span>
            </div>

            {/* Tooltip */}
            <div className="absolute top-full right-0 mt-2 w-48 p-3 rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50" style={{ backgroundColor: '#141414', border: '1px solid #2a2a2a' }}>
                <p className="text-[11px] text-nexus-fg-secondary">
                    {agent.status === 'connected'
                        ? 'Claude CLI is active and ready.'
                        : 'Not connected to Claude CLI.'}
                </p>
                {agent.status === 'error' && (
                    <button
                        className="mt-2 text-[11px] text-nexus-accent hover:underline flex items-center"
                        onClick={() => window.location.reload()}
                    >
                        <RefreshCw className="w-3 h-3 mr-1" /> Reconnect
                    </button>
                )}
            </div>
        </div>
    );
};

export default ConnectionStatus;
