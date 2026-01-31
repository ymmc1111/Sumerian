import React from 'react';
import { useAppStore } from '../stores/useAppStore';
import { Play, Pause, Trash2, GripVertical, CheckCircle, XCircle, Clock } from 'lucide-react';

const TaskQueuePanel: React.FC = () => {
    const { workforce, removeTaskFromQueue, setQueueActive } = useAppStore();
    const { queuedTasks, queueActive } = workforce;

    const pendingCount = queuedTasks.filter(t => t.status === 'pending').length;
    const activeTask = queuedTasks.find(t => t.status === 'active');

    const handleToggleQueue = () => {
        setQueueActive(!queueActive);
    };

    const handleRemoveTask = (taskId: string) => {
        removeTaskFromQueue(taskId);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending':
                return <Clock className="w-4 h-4 text-gray-500" />;
            case 'active':
                return <Play className="w-4 h-4 text-blue-500 animate-pulse" />;
            case 'complete':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'error':
                return <XCircle className="w-4 h-4 text-red-500" />;
            default:
                return null;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-gray-500/20 text-gray-500';
            case 'active':
                return 'bg-blue-500/20 text-blue-500';
            case 'complete':
                return 'bg-green-500/20 text-green-500';
            case 'error':
                return 'bg-red-500/20 text-red-500';
            default:
                return 'bg-gray-500/20 text-gray-500';
        }
    };

    return (
        <div className="h-full flex flex-col bg-nexus-bg-secondary">
            {/* Header */}
            <div className="p-4 border-b border-nexus-border">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm font-bold text-nexus-fg-primary">Task Queue</h2>
                    <button
                        onClick={handleToggleQueue}
                        disabled={pendingCount === 0}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                            queueActive
                                ? 'bg-orange-500/20 text-orange-500 hover:bg-orange-500/30'
                                : pendingCount > 0
                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                : 'bg-nexus-bg-tertiary text-nexus-fg-muted cursor-not-allowed'
                        }`}
                    >
                        {queueActive ? (
                            <>
                                <Pause className="w-3 h-3" />
                                PAUSE
                            </>
                        ) : (
                            <>
                                <Play className="w-3 h-3" />
                                START
                            </>
                        )}
                    </button>
                </div>
                <p className="text-xs text-nexus-fg-secondary">
                    {pendingCount} pending • {queuedTasks.filter(t => t.status === 'complete').length} complete
                </p>
            </div>

            {/* Task List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {queuedTasks.length === 0 ? (
                    <div className="text-center py-8 text-xs text-nexus-fg-muted">
                        <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p>No tasks in queue</p>
                        <p className="mt-1 text-[10px]">Use /batch command to add tasks</p>
                    </div>
                ) : (
                    queuedTasks.map((task) => (
                        <div
                            key={task.id}
                            className={`bg-nexus-bg-tertiary border rounded-lg p-3 transition-colors ${
                                task.status === 'active'
                                    ? 'border-blue-500'
                                    : 'border-nexus-border'
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <GripVertical className="w-4 h-4 text-nexus-fg-muted cursor-grab" />
                                    {getStatusIcon(task.status)}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${getStatusColor(task.status)}`}>
                                            {task.type}
                                        </span>
                                        <span className="text-[10px] text-nexus-fg-muted">
                                            {new Date(task.createdAt).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <p className="text-xs text-nexus-fg-primary truncate">
                                        {task.content}
                                    </p>
                                </div>

                                <button
                                    onClick={() => handleRemoveTask(task.id)}
                                    disabled={task.status === 'active'}
                                    className="flex-shrink-0 p-1 rounded hover:bg-red-500/20 text-nexus-fg-muted hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Remove task"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Active Task Info */}
            {activeTask && (
                <div className="p-4 border-t border-nexus-border bg-blue-500/5">
                    <div className="flex items-center gap-2 mb-1">
                        <Play className="w-3 h-3 text-blue-500 animate-pulse" />
                        <span className="text-xs font-bold text-blue-500">Processing...</span>
                    </div>
                    <p className="text-xs text-nexus-fg-secondary truncate">
                        {activeTask.content}
                    </p>
                </div>
            )}
        </div>
    );
};

export default TaskQueuePanel;
