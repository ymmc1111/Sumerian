import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface AuditLogEntry {
  timestamp: number;
  action: string;
  actor: 'user' | 'agent';
  target: string;
  result: 'success' | 'blocked' | 'error';
  details?: string;
  reversible?: boolean;
  snapshotPath?: string;
}

interface AuditLogViewerProps {
  onClose: () => void;
}

const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ onClose }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    try {
      // This would read from ~/.sumerian/audit.log
      // For now, we'll use a placeholder implementation
      // In a real implementation, this would call window.sumerian.audit.getLogs()
      setLogs([]);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
      setLoading(false);
    }
  };

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'blocked':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-nexus-bg-secondary border border-nexus-border rounded-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-nexus-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-nexus-accent" />
            <h2 className="text-lg font-bold text-nexus-fg-primary">Audit Log</h2>
          </div>
          <button
            onClick={onClose}
            className="text-nexus-fg-secondary hover:text-nexus-fg-primary transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center text-nexus-fg-secondary py-8">
              Loading audit logs...
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center text-nexus-fg-secondary py-8">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No audit logs found</p>
              <p className="text-xs mt-2">Agent actions will be logged here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className="bg-nexus-bg-tertiary border border-nexus-border rounded-lg p-3"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getResultIcon(log.result)}
                      <span className="text-xs font-mono text-nexus-fg-primary">
                        {log.action}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        log.actor === 'agent' 
                          ? 'bg-blue-500/20 text-blue-500' 
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {log.actor}
                      </span>
                    </div>
                    <span className="text-xs text-nexus-fg-muted">
                      {formatTimestamp(log.timestamp)}
                    </span>
                  </div>

                  <div className="text-xs text-nexus-fg-secondary font-mono truncate">
                    {log.target}
                  </div>

                  {log.details && (
                    <div className="mt-2 text-xs text-nexus-fg-muted">
                      {log.details}
                    </div>
                  )}

                  {log.reversible && (
                    <div className="mt-2 text-xs text-green-500">
                      ✓ Reversible (snapshot available)
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-nexus-border">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 rounded bg-nexus-bg-tertiary text-nexus-fg-primary text-xs font-bold hover:bg-nexus-bg-quaternary transition-colors border border-nexus-border"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditLogViewer;
