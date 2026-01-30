import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
    inline?: boolean;
    className?: string;
    children?: React.ReactNode;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ inline, className, children }) => {
    const [copied, setCopied] = useState(false);
    const code = String(children).replace(/\n$/, '');

    // Extract language from className (e.g., language-javascript)
    const match = /language-(\w+)/.exec(className || '');
    const lang = match ? match[1] : '';

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (inline) {
        return (
            <code className="bg-nexus-bg-secondary px-1.5 py-0.5 rounded text-[11px] font-mono text-nexus-fg-primary">
                {children}
            </code>
        );
    }

    return (
        <div className="relative group my-4 rounded-xl overflow-hidden border border-nexus-border bg-nexus-bg-primary/50">
            {lang && (
                <div className="flex items-center justify-between px-4 py-2 bg-nexus-bg-tertiary/50 border-b border-nexus-border">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-nexus-fg-muted">
                        {lang}
                    </span>
                    <button
                        onClick={handleCopy}
                        className="p-1 hover:bg-nexus-bg-tertiary rounded-lg text-nexus-fg-muted hover:text-nexus-fg-primary transition-all flex items-center space-x-1.5"
                    >
                        {copied ? (
                            <>
                                <Check className="w-3 h-3 text-green-500" />
                                <span className="text-[9px] font-bold text-green-500 uppercase tracking-wider">Copied</span>
                            </>
                        ) : (
                            <>
                                <Copy className="w-3 h-3" />
                                <span className="text-[9px] font-bold uppercase tracking-wider">Copy</span>
                            </>
                        )}
                    </button>
                </div>
            )}
            {!lang && (
                <button
                    onClick={handleCopy}
                    className="absolute right-2 top-2 p-1.5 bg-nexus-bg-tertiary/80 hover:bg-nexus-bg-tertiary rounded-lg text-nexus-fg-muted hover:text-nexus-fg-primary transition-all opacity-0 group-hover:opacity-100 z-10 border border-nexus-border"
                    title="Copy code"
                >
                    {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                </button>
            )}
            <pre className="p-4 overflow-x-auto text-[12px] font-mono leading-relaxed text-nexus-fg-secondary">
                <code>{children}</code>
            </pre>
        </div>
    );
};

export default CodeBlock;
