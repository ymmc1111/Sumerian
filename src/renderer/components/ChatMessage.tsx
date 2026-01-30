import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Message } from '../stores/types';
import { User, Bot } from 'lucide-react';

interface ChatMessageProps {
    message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
    const isUser = message.role === 'user';

    return (
        <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${isUser ? 'bg-nexus-accent ml-3' : 'bg-nexus-bg-tertiary mr-3 border border-nexus-border'
                    }`}>
                    {isUser ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-nexus-accent" />}
                </div>

                <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${isUser
                        ? 'bg-nexus-accent text-white rounded-tr-none'
                        : 'bg-nexus-bg-secondary text-nexus-fg-primary border border-nexus-border rounded-tl-none'
                        }`}>
                        <div className="prose prose-invert prose-sm max-w-none">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                    </div>

                    <span className="text-[10px] text-nexus-fg-muted mt-1 px-1">
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ChatMessage;
