import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Message } from '../stores/types';
import { User, Bot, Copy, Check } from 'lucide-react';
import CodeBlock from './CodeBlock';

interface ChatMessageProps {
    message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
    const isUser = message.role === 'user';
    const [copied, setCopied] = useState(false);

    const handleCopyAll = () => {
        navigator.clipboard.writeText(message.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[85%] group ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div
                    className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{
                        backgroundColor: isUser ? 'var(--color-accent)' : 'var(--color-bg-tertiary)',
                        border: isUser ? 'none' : '1px solid var(--color-border)',
                        marginLeft: isUser ? '12px' : '0',
                        marginRight: isUser ? '0' : '12px',
                    }}
                >
                    {isUser ? (
                        <User className="w-5 h-5" style={{ color: '#ffffff' }} />
                    ) : (
                        <Bot className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
                    )}
                </div>

                <div className={`flex flex-col relative ${isUser ? 'items-end' : 'items-start'}`}>
                    {/* Message bubble */}
                    <div
                        className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${isUser ? 'rounded-tr-none' : 'rounded-tl-none'}`}
                        style={{
                            backgroundColor: isUser ? 'var(--color-accent)' : 'var(--color-bg-tertiary)',
                            color: isUser ? '#ffffff' : 'var(--color-fg-primary)',
                            border: isUser ? 'none' : '1px solid var(--color-border)',
                        }}
                    >
                        <ReactMarkdown
                            components={{
                                p: ({ children }) => <p className="mb-2 last:mb-0" style={{ color: 'inherit' }}>{children}</p>,
                                code: (props) => <CodeBlock {...props} />,
                            }}
                        >
                            {message.content}
                        </ReactMarkdown>

                        {/* Attached Images */}
                        {message.images && message.images.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/10">
                                {message.images.map((path, idx) => (
                                    <div key={idx} className="relative group/img overflow-hidden rounded-lg border border-white/20">
                                        <img
                                            src={`file://${path}`}
                                            alt="attachment"
                                            className="max-w-[240px] max-h-[240px] object-contain hover:scale-105 transition-transform duration-300"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Copy Button (Message Level) */}
                    <button
                        onClick={handleCopyAll}
                        className={`absolute top-2 ${isUser ? 'left-[-32px]' : 'right-[-32px]'} p-1.5 rounded-lg bg-nexus-bg-tertiary border border-nexus-border text-nexus-fg-muted hover:text-nexus-fg-primary opacity-0 group-hover:opacity-100 transition-all shadow-lg active:scale-95`}
                        title="Copy message text"
                    >
                        {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    </button>

                    {/* Timestamp */}
                    <span
                        className="text-[10px] mt-1 px-1"
                        style={{ color: 'var(--color-fg-muted)' }}
                    >
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ChatMessage;
