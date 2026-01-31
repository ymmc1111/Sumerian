import React, { useState, useEffect } from 'react';
import { Clock, RotateCcw, Trash2, AlertCircle } from 'lucide-react';

interface LabeledCheckpoint {
    id: string;
    label: string;
    timestamp: number;
    files: { path: string; content: string }[];
}

const CheckpointTimeline: React.FC = () => {
    const [checkpoints, setCheckpoints] = useState<LabeledCheckpoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadCheckpoints = async () => {
        try {
            setLoading(true);
            setError(null);
            const list = await window.sumerian.files.listCheckpoints();
            setCheckpoints(list);
        } catch (err) {
            console.error('Failed to load checkpoints:', err);
            setError('Failed to load checkpoints');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCheckpoints();
    }, []);

    const handleRollback = async (checkpointId: string, label: string) => {
        if (!confirm(`Rollback to checkpoint "${label}"?\n\nThis will restore all files to their state at that checkpoint. Current changes will be lost.`)) {
            return;
        }

        try {
            await window.sumerian.files.rollbackToCheckpoint(checkpointId);
            // Refresh file tree after rollback
            window.location.reload();
        } catch (err) {
            console.error('Failed to rollback:', err);
            alert('Failed to rollback to checkpoint');
        }
    };

    const handleDelete = async (checkpointId: string, label: string) => {
        if (!confirm(`Delete checkpoint "${label}"?`)) {
            return;
        }

        try {
            await window.sumerian.files.deleteCheckpoint(checkpointId);
            await loadCheckpoints();
        } catch (err) {
            console.error('Failed to delete checkpoint:', err);
            alert('Failed to delete checkpoint');
        }
    };

    const formatTimestamp = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString();
    };

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    if (loading) {
        return (
            <div className="p-4">
                <h3 className="text-sm font-bold text-nexus-fg-primary mb-3">Checkpoints</h3>
                <div className="text-xs text-nexus-fg-muted">Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4">
                <h3 className="text-sm font-bold text-nexus-fg-primary mb-3">Checkpoints</h3>
                <div className="flex items-center gap-2 text-xs text-red-500">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-2">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-nexus-fg-primary">Checkpoints</h3>
                <span className="text-xs text-nexus-fg-muted">
                    {checkpoints.length}/20
                </span>
            </div>

            {checkpoints.length === 0 ? (
                <div className="text-center py-8 text-xs text-nexus-fg-muted">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>No checkpoints yet</p>
                    <p className="mt-1 text-[10px]">Use /checkpoint "label"</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {checkpoints.map((checkpoint, index) => (
                        <div 
                            key={checkpoint.id}
                            className="bg-nexus-bg-tertiary border border-nexus-border rounded-lg p-3 hover:border-nexus-accent/50 transition-colors"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-bold text-nexus-fg-primary truncate">
                                        {checkpoint.label}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Clock className="w-3 h-3 text-nexus-fg-muted" />
                                        <span className="text-[10px] text-nexus-fg-muted">
                                            {formatTimestamp(checkpoint.timestamp)}
                                        </span>
                                        <span className="text-[10px] text-nexus-fg-muted">
                                            • {formatTime(checkpoint.timestamp)}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(checkpoint.id, checkpoint.label)}
                                    className="p-1 rounded hover:bg-red-500/20 text-nexus-fg-muted hover:text-red-500 transition-colors"
                                    title="Delete checkpoint"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                            
                            <div className="text-[10px] text-nexus-fg-muted mb-2">
                                {checkpoint.files.length} file{checkpoint.files.length !== 1 ? 's' : ''}
                            </div>

                            <button
                                onClick={() => handleRollback(checkpoint.id, checkpoint.label)}
                                className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-500 text-[10px] font-bold hover:bg-blue-500/30 transition-colors"
                            >
                                <RotateCcw className="w-3 h-3" />
                                ROLLBACK
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CheckpointTimeline;
