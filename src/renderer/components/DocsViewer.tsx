import React, { useState, useEffect } from 'react';
import { X, Book, Sparkles, Terminal, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import CodeBlock from './CodeBlock';

interface DocItem {
    id: string;
    title: string;
    path: string;
}

interface DocSection {
    id: string;
    title: string;
    icon: React.ComponentType<any>;
    items: DocItem[];
}

interface DocsViewerProps {
    isOpen: boolean;
    onClose: () => void;
    initialDocId?: string;
}

const DocsViewer: React.FC<DocsViewerProps> = ({ isOpen, onClose, initialDocId }) => {
    const [activeDocId, setActiveDocId] = useState<string>(initialDocId || 'multi-project');
    const [content, setContent] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const docSections: DocSection[] = [
        {
            id: 'getting-started',
            title: 'Getting Started',
            icon: Book,
            items: [
                { id: 'multi-project', title: 'Multi-Project Workspaces', path: 'guides/multi-project-workspaces.md' }
            ]
        },
        {
            id: 'features',
            title: 'Features',
            icon: Sparkles,
            items: [
                { id: 'mcp-setup', title: 'MCP Setup', path: 'guides/mcp-setup.md' },
                { id: 'mcp-usage', title: 'MCP Usage', path: 'guides/mcp-usage.md' }
            ]
        },
        {
            id: 'reference',
            title: 'Reference',
            icon: Terminal,
            items: [
                { id: 'commands', title: 'Commands & Shortcuts', path: 'COMMANDS.md' }
            ]
        }
    ];

    const allDocs = docSections.flatMap(section => section.items);

    useEffect(() => {
        if (isOpen && activeDocId) {
            loadDocument(activeDocId);
        }
    }, [isOpen, activeDocId]);

    useEffect(() => {
        if (initialDocId && isOpen) {
            setActiveDocId(initialDocId);
        }
    }, [initialDocId, isOpen]);

    const loadDocument = async (docId: string) => {
        const doc = allDocs.find(d => d.id === docId);
        if (!doc) return;

        setLoading(true);
        try {
            const docContent = await window.sumerian.docs.read(doc.path);
            setContent(docContent);
        } catch (error) {
            console.error('Failed to load document:', error);
            setContent('# Error\n\nFailed to load documentation. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDocClick = (docId: string) => {
        setActiveDocId(docId);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && isOpen) {
            onClose();
        }
    };

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="w-full max-w-5xl h-[600px] bg-nexus-bg-secondary border border-nexus-border rounded-3xl shadow-2xl flex overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
                style={{ backgroundColor: 'var(--color-bg-secondary)' }}
            >
                {/* Sidebar */}
                <div className="w-60 bg-nexus-bg-tertiary border-r border-nexus-border flex flex-col" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                    {/* Header */}
                    <div className="h-12 px-4 border-b border-nexus-border flex items-center justify-between shrink-0">
                        <div className="flex items-center space-x-2">
                            <Book className="w-4 h-4 text-nexus-accent" />
                            <span className="text-xs font-bold uppercase tracking-widest text-nexus-fg-primary">Documentation</span>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        {docSections.map((section) => (
                            <div key={section.id} className="space-y-2">
                                <div className="flex items-center space-x-2 px-2 mb-2">
                                    <section.icon className="w-3 h-3 text-nexus-fg-muted" />
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-nexus-fg-muted">
                                        {section.title}
                                    </h3>
                                </div>
                                <div className="space-y-1">
                                    {section.items.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => handleDocClick(item.id)}
                                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                                                activeDocId === item.id
                                                    ? 'bg-nexus-bg-primary text-nexus-accent border border-nexus-border'
                                                    : 'text-nexus-fg-secondary hover:text-nexus-fg-primary hover:bg-nexus-bg-primary/50'
                                            }`}
                                        >
                                            <span>{item.title}</span>
                                            {activeDocId === item.id && (
                                                <ChevronRight className="w-3 h-3" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col min-w-0 bg-nexus-bg-primary" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
                    {/* Header */}
                    <div className="h-12 px-6 border-b border-nexus-border flex items-center justify-between shrink-0 bg-nexus-bg-secondary">
                        <h2 className="text-sm font-bold text-nexus-fg-primary">
                            {allDocs.find(d => d.id === activeDocId)?.title || 'Documentation'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-nexus-bg-tertiary rounded-lg text-nexus-fg-muted hover:text-nexus-fg-primary transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-8 bg-nexus-bg-primary">
                        {loading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-xs text-nexus-fg-muted">Loading documentation...</div>
                            </div>
                        ) : (
                            <div className="prose prose-sm max-w-none bg-nexus-bg-primary">
                                <ReactMarkdown
                                    components={{
                                        h1: ({ children }) => (
                                            <h1 className="text-lg font-bold text-nexus-fg-primary mb-4 mt-6 first:mt-0">
                                                {children}
                                            </h1>
                                        ),
                                        h2: ({ children }) => (
                                            <h2 className="text-base font-bold text-nexus-fg-primary mb-3 mt-6 pb-2 border-b border-nexus-border">
                                                {children}
                                            </h2>
                                        ),
                                        h3: ({ children }) => (
                                            <h3 className="text-sm font-bold text-nexus-fg-secondary mb-2 mt-4">
                                                {children}
                                            </h3>
                                        ),
                                        p: ({ children }) => (
                                            <p className="text-xs text-nexus-fg-secondary mb-3 leading-relaxed">
                                                {children}
                                            </p>
                                        ),
                                        ul: ({ children }) => (
                                            <ul className="text-xs text-nexus-fg-secondary mb-3 ml-4 space-y-1 list-disc">
                                                {children}
                                            </ul>
                                        ),
                                        ol: ({ children }) => (
                                            <ol className="text-xs text-nexus-fg-secondary mb-3 ml-4 space-y-1 list-decimal">
                                                {children}
                                            </ol>
                                        ),
                                        li: ({ children }) => (
                                            <li className="text-xs text-nexus-fg-secondary">
                                                {children}
                                            </li>
                                        ),
                                        code: ({ inline, className, children, ...props }: any) => {
                                            if (inline) {
                                                return (
                                                    <code className="px-1.5 py-0.5 rounded bg-nexus-bg-tertiary text-nexus-accent text-[11px] font-mono">
                                                        {children}
                                                    </code>
                                                );
                                            }
                                            return <CodeBlock inline={false} className={className}>{children}</CodeBlock>;
                                        },
                                        pre: ({ children }) => (
                                            <div className="mb-4">
                                                {children}
                                            </div>
                                        ),
                                        a: ({ href, children }) => (
                                            <a
                                                href={href}
                                                className="text-nexus-accent hover:underline"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                {children}
                                            </a>
                                        ),
                                        blockquote: ({ children }) => (
                                            <blockquote className="border-l-2 border-nexus-accent pl-4 py-2 my-3 bg-nexus-bg-tertiary/50 rounded-r-lg">
                                                {children}
                                            </blockquote>
                                        ),
                                        table: ({ children }) => (
                                            <div className="overflow-x-auto mb-4">
                                                <table className="min-w-full border border-nexus-border rounded-lg">
                                                    {children}
                                                </table>
                                            </div>
                                        ),
                                        thead: ({ children }) => (
                                            <thead className="bg-nexus-bg-tertiary">
                                                {children}
                                            </thead>
                                        ),
                                        th: ({ children }) => (
                                            <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-nexus-fg-primary border-b border-nexus-border">
                                                {children}
                                            </th>
                                        ),
                                        td: ({ children }) => (
                                            <td className="px-3 py-2 text-xs text-nexus-fg-secondary border-b border-nexus-border">
                                                {children}
                                            </td>
                                        ),
                                        hr: () => (
                                            <hr className="my-6 border-nexus-border" />
                                        ),
                                    }}
                                >
                                    {content}
                                </ReactMarkdown>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocsViewer;
