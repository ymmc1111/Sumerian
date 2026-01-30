import React, { useState, useRef, useEffect } from 'react';
import { Send, Zap, Eye } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';

const ChatInput: React.FC = () => {
    const [content, setContent] = useState('');
    const { sendMessage, agent } = useAppStore();
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const activeFileName = agent.activeFileContext ? agent.activeFileContext.split(/[/\\]/).pop() : null;

    const handleSend = () => {
        if (content.trim()) {
            sendMessage(content.trim());
            setContent('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    }, [content]);

    return (
        <div className="p-4 bg-nexus-bg-secondary border-t border-nexus-border">
            {activeFileName && (
                <div className="flex items-center space-x-1.5 mb-2 px-1 text-[10px] text-nexus-fg-muted animate-in fade-in slide-in-from-bottom-1">
                    <Eye className="w-2.5 h-2.5 text-nexus-accent" />
                    <span>Agent sees:</span>
                    <span className="text-nexus-fg-secondary font-mono">{activeFileName}</span>
                </div>
            )}
            <div className="relative group">
                <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask Agent anything..."
                    className="w-full bg-nexus-bg-primary text-nexus-fg-primary text-sm rounded-xl py-3 pl-4 pr-12 border border-nexus-border focus:border-nexus-accent focus:ring-1 focus:ring-nexus-accent outline-none transition-all resize-none min-h-[44px] max-h-[200px]"
                    rows={1}
                />
                <button
                    onClick={handleSend}
                    disabled={!content.trim() || agent.status === 'connecting'}
                    className={`absolute right-2 bottom-2 p-1.5 rounded-lg transition-colors ${content.trim() && agent.status !== 'connecting'
                        ? 'bg-nexus-accent text-white hover:bg-opacity-90'
                        : 'text-nexus-fg-muted cursor-not-allowed'
                        }`}
                >
                    <Send className="w-4 h-4" />
                </button>
            </div>
            <div className="flex items-center justify-between mt-2 px-1">
                <div className="flex items-center space-x-2">
                    <Zap className="w-3 h-3 text-nexus-accent" />
                    <span className="text-[10px] text-nexus-fg-muted uppercase tracking-wider">Brave Mode {agent.braveMode ? 'ON' : 'OFF'}</span>
                </div>
                <span className="text-[10px] text-nexus-fg-muted uppercase tracking-wider">
                    Claude CLI Backend
                </span>
            </div>
        </div>
    );
};

export default ChatInput;
