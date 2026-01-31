import React, { useState, useEffect } from 'react';
import { Brain, Save, Trash2, AlertCircle, RefreshCw } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';

const MemoryViewer: React.FC = () => {
    const { project } = useAppStore();
    const [memory, setMemory] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDirty, setIsDirty] = useState(false);
    const [saving, setSaving] = useState(false);

    const loadMemory = async () => {
        if (!project.rootPath) {
            setError('No project open');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const content = await window.sumerian.memory.read(project.rootPath);
            setMemory(content);
            setIsDirty(false);
        } catch (err) {
            console.error('Failed to load memory:', err);
            setError('Failed to load memory');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMemory();
    }, [project.rootPath]);

    const handleSave = async () => {
        if (!project.rootPath) return;

        try {
            setSaving(true);
            setError(null);
            await window.sumerian.memory.write(project.rootPath, memory);
            setIsDirty(false);
        } catch (err) {
            console.error('Failed to save memory:', err);
            setError('Failed to save memory');
        } finally {
            setSaving(false);
        }
    };

    const handleClear = async () => {
        if (!project.rootPath) return;
        if (!confirm('Clear all agent memory? This cannot be undone.')) return;

        try {
            setError(null);
            await window.sumerian.memory.clear(project.rootPath);
            await loadMemory();
        } catch (err) {
            console.error('Failed to clear memory:', err);
            setError('Failed to clear memory');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setMemory(e.target.value);
        setIsDirty(true);
    };

    if (loading) {
        return (
            <div className="p-4">
                <h3 className="text-sm font-bold text-nexus-fg-primary mb-3">Agent Memory</h3>
                <div className="text-xs text-nexus-fg-muted">Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4">
                <h3 className="text-sm font-bold text-nexus-fg-primary mb-3">Agent Memory</h3>
                <div className="flex items-center gap-2 text-xs text-red-500">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-nexus-accent" />
                    <h3 className="text-sm font-bold text-nexus-fg-primary">Agent Memory</h3>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={loadMemory}
                        className="icon-btn"
                        title="Refresh"
                    >
                        <RefreshCw className="w-3 h-3" />
                    </button>
                    <button
                        onClick={handleClear}
                        className="icon-btn text-red-500 hover:bg-red-500/20"
                        title="Clear memory"
                    >
                        <Trash2 className="w-3 h-3" />
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!isDirty || saving}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold transition-colors ${
                            isDirty && !saving
                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                : 'bg-nexus-bg-tertiary text-nexus-fg-muted cursor-not-allowed'
                        }`}
                        title="Save memory"
                    >
                        <Save className="w-3 h-3" />
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>

            <div className="text-xs text-nexus-fg-muted mb-2">
                Persistent context that survives session clears. The agent can read this on every message.
            </div>

            <textarea
                value={memory}
                onChange={handleChange}
                className="flex-1 w-full p-3 rounded-lg text-xs font-mono resize-none outline-none border transition-colors"
                style={{
                    backgroundColor: 'var(--color-bg-primary)',
                    color: 'var(--color-fg-primary)',
                    borderColor: isDirty ? 'var(--color-accent)' : 'var(--color-border)',
                }}
                placeholder="# Agent Memory

Write important context here that the agent should remember across sessions..."
            />

            {isDirty && (
                <div className="mt-2 text-xs text-nexus-accent">
                    • Unsaved changes
                </div>
            )}
        </div>
    );
};

export default MemoryViewer;
