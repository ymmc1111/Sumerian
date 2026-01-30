import React, { useEffect, useState } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { History, MessageSquare, Trash2, X, Clock } from 'lucide-react';

interface SessionListProps {
    onClose: () => void;
}

const SessionList: React.FC<SessionListProps> = ({ onClose }) => {
    const { listSessions, loadSession } = useAppStore();
    const [sessions, setSessions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSessions = async () => {
            const list = await listSessions();
            setSessions(list);
            setIsLoading(false);
        };
        fetchSessions();
    }, [listSessions]);

    const handleLoad = async (id: string) => {
        await loadSession(id);
        onClose();
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        await window.sumerian.session.delete(id);
        setSessions(sessions.filter(s => s.id !== id));
    };

    return (
        <div className="absolute inset-0 z-50 bg-nexus-bg-primary/95 backdrop-blur-sm flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-nexus-border">
                <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-nexus-accent" />
                    <h3 className="text-sm font-bold text-nexus-fg-primary uppercase tracking-wider">Conversation History</h3>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 rounded-lg hover:bg-nexus-bg-tertiary transition-colors"
                >
                    <X className="w-5 h-5 text-nexus-fg-muted" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full text-nexus-fg-muted">
                        <div className="w-6 h-6 border-2 border-nexus-accent border-t-transparent rounded-full animate-spin mb-4" />
                        <span className="text-xs">Loading sessions...</span>
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-nexus-fg-muted opacity-40">
                        <MessageSquare className="w-12 h-12 mb-4" />
                        <span className="text-sm">No saved sessions found</span>
                    </div>
                ) : (
                    sessions.map((session) => (
                        <div
                            key={session.id}
                            onClick={() => handleLoad(session.id)}
                            className="group relative p-4 rounded-xl border border-nexus-border bg-nexus-bg-secondary hover:border-nexus-accent hover:bg-nexus-bg-tertiary transition-all cursor-pointer overflow-hidden"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 text-[10px] text-nexus-fg-muted">
                                    <Clock className="w-3 h-3" />
                                    <span>{new Date(session.timestamp).toLocaleString()}</span>
                                </div>
                                <button
                                    onClick={(e) => handleDelete(e, session.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-nexus-fg-muted hover:text-red-500 hover:bg-red-500/10 transition-all active:scale-95"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <div className="text-xs text-nexus-fg-primary font-medium line-clamp-2 pr-6">
                                {session.messages?.[0]?.content || "Empty Session"}
                            </div>
                            <div className="mt-3 flex items-center gap-3 text-[10px] text-nexus-fg-muted uppercase tracking-tighter">
                                <span>{session.messages?.length || 0} Messages</span>
                                {session.usage && (
                                    <span className="border-l border-nexus-border pl-3">
                                        {(session.usage.input + session.usage.output).toLocaleString()} Tokens
                                    </span>
                                )}
                            </div>

                            {/* Accent Glow */}
                            <div className="absolute top-0 right-0 w-[100px] h-[100px] bg-nexus-accent/5 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-nexus-accent/10 transition-colors" />
                        </div>
                    ))
                )}
            </div>

            <div className="p-4 border-t border-nexus-border text-center">
                <p className="text-[10px] text-nexus-fg-muted italic">
                    Sessions are automatically saved as you chat.
                </p>
            </div>
        </div>
    );
};

export default SessionList;
