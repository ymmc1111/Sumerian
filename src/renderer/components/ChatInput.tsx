import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { FileNode } from '../stores/types';
import { useImageSupport } from '../hooks/useImageSupport';
import { Send, Zap, Eye, FileText, Terminal, Trash2, Shield, Layout, Ghost, Book, Image as ImageIcon, X as CloseIcon, MessageSquare, Code, Clock } from 'lucide-react';
import ModelSelector from './ModelSelector';

const COMMANDS = [
    { id: 'clear', label: '/clear', description: 'Clear chat history', icon: Trash2 },
    { id: 'brave', label: '/brave', description: 'Toggle Brave Mode', icon: Shield },
    { id: 'batch', label: '/batch', description: 'Queue loop for overnight processing', icon: Clock },
    { id: 'checkpoint', label: '/checkpoint', description: 'Create labeled checkpoint', icon: FileText },
    { id: 'layout', label: '/layout', description: 'Cycle UI Layout', icon: Layout },
    { id: 'lore', label: '/lore', description: 'Refresh Project Lore', icon: Ghost },
    { id: 'prune', label: '/prune', description: 'Prune history to last 20 msgs', icon: Trash2 },
    { id: 'compact', label: '/compact', description: 'Summarize & auto-compact context', icon: Book },
    { id: 'context', label: '/context', description: 'Show context usage stats', icon: Zap },
    { id: 'review', label: '/review', description: 'Request structured code review', icon: Eye },
    { id: 'summarize', label: '/summarize', description: 'Ask Agent to summarize & prune', icon: Book },
    { id: 'plan', label: '/plan', description: 'Switch to Planning Mode', icon: MessageSquare },
    { id: 'code', label: '/code', description: 'Switch to Code Mode', icon: Code },
    { id: 'spawn', label: '/spawn', description: 'Spawn specialized agent', icon: Zap },
];

const PERSONAS = ['conductor', 'architect', 'builder', 'tester', 'documenter'];

const ChatInput: React.FC = () => {
    const [content, setContent] = useState('');
    const { sendMessage, setAutoContextEnabled, setBraveMode, setMode, clearHistory, pruneHistory, refreshLore, startLoop, cancelLoop, spawnAgent, addAgentMessage, addTaskToQueue, agent, project } = useAppStore();
    const { pendingImages, isDragging, setIsDragging, handlePaste, handleDrop, removeImage, clearPendingImages } = useImageSupport();
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Suggestions state
    const [suggestionState, setSuggestionState] = useState<{
        type: 'none' | 'files' | 'commands';
        filter: string;
        index: number;
        startPos: number;
    }>({ type: 'none', filter: '', index: 0, startPos: 0 });

    const activeFileName = agent.activeFileContext ? agent.activeFileContext.split(/[/\\]/).pop() : null;

    // Flatten file tree for searches
    const allFiles = useMemo(() => {
        const flattened: { name: string; path: string }[] = [];
        const traverse = (nodes: FileNode[]) => {
            if (!nodes || !Array.isArray(nodes)) return;
            nodes.forEach(node => {
                if (!node.isDirectory) {
                    flattened.push({ name: node.name, path: node.path });
                }
                if (node.children) {
                    traverse(node.children);
                }
            });
        };
        traverse(project?.fileTree);
        return flattened;
    }, [project?.fileTree]);

    const filteredSuggestions = useMemo(() => {
        if (suggestionState.type === 'commands') {
            return COMMANDS.filter(c => c.label.toLowerCase().includes(suggestionState.filter.toLowerCase()));
        }
        if (suggestionState.type === 'files') {
            return allFiles
                .filter(f => f.name.toLowerCase().includes(suggestionState.filter.toLowerCase()) ||
                    f.path.toLowerCase().includes(suggestionState.filter.toLowerCase()))
                .slice(0, 10); // Limit to 10 for performance/UI
        }
        return [];
    }, [suggestionState.type, suggestionState.filter, allFiles]);

    const handleSend = () => {
        if (content.trim() || pendingImages.length > 0) {
            sendMessage(content.trim(), pendingImages);
            setContent('');
            clearPendingImages();
        }
    };

    const handleSelectSuggestion = (suggestion: any) => {
        const prefix = content.slice(0, suggestionState.startPos);
        const suffix = content.slice(textareaRef.current?.selectionStart || 0);
        const inserted = suggestionState.type === 'files' ? suggestion.path : suggestion.label + ' ';

        setContent(prefix + inserted + suffix);
        setSuggestionState({ type: 'none', filter: '', index: 0, startPos: 0 });

        // Refocus textarea
        setTimeout(() => textareaRef.current?.focus(), 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (suggestionState.type !== 'none' && filteredSuggestions.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSuggestionState(s => ({ ...s, index: (s.index + 1) % filteredSuggestions.length }));
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSuggestionState(s => ({ ...s, index: (s.index - 1 + filteredSuggestions.length) % filteredSuggestions.length }));
                return;
            }
            if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                handleSelectSuggestion(filteredSuggestions[suggestionState.index]);
                return;
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                setSuggestionState({ type: 'none', filter: '', index: 0, startPos: 0 });
                return;
            }
        }

        if (e.key === 'Enter' && !e.shiftKey) {
            // Check for instant commands
            const trimmed = content.trim();
            if (trimmed === '/clear') {
                e.preventDefault();
                clearHistory();
                setContent('');
                return;
            }
            if (trimmed === '/brave') {
                e.preventDefault();
                setBraveMode(!agent.braveMode);
                setContent('');
                return;
            }
            if (trimmed === '/lore') {
                e.preventDefault();
                refreshLore();
                setContent('');
                return;
            }
            if (trimmed === '/prune') {
                e.preventDefault();
                pruneHistory();
                setContent('');
                return;
            }
            if (trimmed === '/context') {
                e.preventDefault();
                if (agent.usage) {
                    const maxContext = 200000;
                    const percentageNum = (agent.usage.input / maxContext) * 100;
                    const percentage = percentageNum.toFixed(1);
                    const remaining = maxContext - agent.usage.input;
                    const contextPrompt = `Current context usage:
- Input tokens: ${agent.usage.input.toLocaleString()}
- Output tokens: ${agent.usage.output.toLocaleString()}
- Total tokens: ${(agent.usage.input + agent.usage.output).toLocaleString()}
- Context capacity: ${percentage}% used
- Remaining capacity: ~${remaining.toLocaleString()} tokens

${percentageNum > 80 ? '⚠️ Context is nearly full. Consider using /compact to free up space.' : percentageNum > 60 ? '⚡ Context usage is moderate.' : '✅ Context usage is healthy.'}`;
                    sendMessage(contextPrompt);
                } else {
                    sendMessage('No context usage data available yet. Send a message first.');
                }
                setContent('');
                return;
            }
            if (trimmed === '/compact') {
                e.preventDefault();
                const summaryPrompt = 'Please provide a concise summary of our conversation so far, focusing on key decisions, implementations, and current state. Keep it brief but comprehensive.';
                sendMessage(summaryPrompt);
                setContent('');
                
                // Schedule auto-prune after agent response (wait for completion)
                // We'll use a simple timeout approach - in production this should listen to completion events
                setTimeout(() => {
                    pruneHistory();
                }, 5000); // 5 second delay to allow response to complete
                return;
            }
            if (trimmed === '/review' || trimmed.startsWith('/review ')) {
                e.preventDefault();
                const files = trimmed === '/review' ? 'recent changes' : trimmed.replace('/review ', '');
                const reviewPrompt = `Please review ${files} with the following structure:

## Code Review

### ✅ Strengths
- What's done well

### ⚠️ Issues
- Bugs or problems found
- Security concerns
- Performance issues

### 💡 Suggestions
- Improvements
- Best practices
- Refactoring opportunities

### 📋 Checklist
- [ ] Tests included
- [ ] Error handling
- [ ] Documentation
- [ ] Type safety`;
                
                sendMessage(reviewPrompt);
                setContent('');
                return;
            }
            if (trimmed === '/summarize') {
                e.preventDefault();
                sendMessage('Please provide a concise summary of our progress so far, and then I will prune the history.');
                setContent('');
                return;
            }
            if (trimmed === '/plan') {
                e.preventDefault();
                setMode('chat');
                setContent('');
                return;
            }
            if (trimmed === '/code') {
                e.preventDefault();
                setMode('code');
                setContent('');
                return;
            }
            
            // Parse /checkpoint command: /checkpoint "label"
            const checkpointMatch = trimmed.match(/^\/checkpoint\s+"([^"]+)"$/);
            if (checkpointMatch) {
                e.preventDefault();
                const label = checkpointMatch[1];
                
                // Get all open files to checkpoint
                const openFilePaths = allFiles.map(f => f.path);
                
                window.sumerian.files.createCheckpoint(label, openFilePaths)
                    .then((checkpointId) => {
                        addAgentMessage(`✅ Checkpoint created: "${label}" (${checkpointId})`);
                    })
                    .catch((error) => {
                        addAgentMessage(`❌ Failed to create checkpoint: ${error.message}`);
                    });
                
                setContent('');
                return;
            }
            
            // Parse /batch command: /batch "prompt" --promise "DONE" --max 20
            const batchMatch = trimmed.match(/^\/batch\s+"([^"]+)"(?:\s+--promise\s+"([^"]+)")?(?:\s+--max\s+(\d+))?$/);
            if (batchMatch) {
                e.preventDefault();
                const prompt = batchMatch[1];
                const promise = batchMatch[2] || 'COMPLETE';
                const max = parseInt(batchMatch[3] || '20', 10);
                
                addTaskToQueue({
                    id: `batch-${Date.now()}`,
                    type: 'loop',
                    content: prompt,
                    config: { prompt, promise, maxIterations: max },
                    status: 'pending',
                    createdAt: Date.now()
                });
                
                addAgentMessage(`✅ Added to batch queue: "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}"`);
                setContent('');
                return;
            }
            
            // Parse /loop command: /loop "prompt" --promise "DONE" --max 20
            const loopMatch = trimmed.match(/^\/loop\s+"([^"]+)"(?:\s+--promise\s+"([^"]+)")?(?:\s+--max\s+(\d+))?$/);
            if (loopMatch) {
                e.preventDefault();
                const prompt = loopMatch[1];
                const promise = loopMatch[2] || 'COMPLETE';
                const max = parseInt(loopMatch[3] || '20', 10);
                startLoop(prompt, promise, max);
                setContent('');
                return;
            }
            
            if (trimmed === '/cancel-loop') {
                e.preventDefault();
                cancelLoop();
                setContent('');
                return;
            }
            
            // Parse /spawn command: /spawn <persona> "<task>" [--model <model>] [--dir <path>]
            const spawnMatch = trimmed.match(/^\/spawn\s+(\w+)\s+"([^"]+)"(?:\s+--model\s+(\w+))?(?:\s+--dir\s+"([^"]+)")?$/);
            if (spawnMatch) {
                e.preventDefault();
                const [, personaId, task, model, dir] = spawnMatch;
                
                if (!PERSONAS.includes(personaId.toLowerCase())) {
                    addAgentMessage(`❌ Unknown persona: ${personaId}. Available: ${PERSONAS.join(', ')}`);
                    setContent('');
                    return;
                }
                
                // Create persona config
                const persona = {
                    id: personaId.toLowerCase(),
                    model: model || 'claude-sonnet-4-5-20250929',
                    systemPrompt: '',
                    allowedTools: ['*'] as string[],
                    disallowedTools: [] as string[]
                };
                
                spawnAgent(persona, task, dir).then((agentId) => {
                    addAgentMessage(`✅ Spawned ${personaId} agent (${agentId}): ${task}`);
                }).catch((error) => {
                    addAgentMessage(`❌ Failed to spawn agent: ${error.message}`);
                });
                
                setContent('');
                return;
            }

            e.preventDefault();
            handleSend();
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        const pos = e.target.selectionStart;
        setContent(val);

        // Detect triggers
        const lastChar = val[pos - 1];
        const textBefore = val.slice(0, pos);

        if (lastChar === '@') {
            setSuggestionState({ type: 'files', filter: '', index: 0, startPos: pos });
        } else if (lastChar === '/' && (pos === 1 || val[pos - 2] === ' ' || val[pos - 2] === '\n')) {
            setSuggestionState({ type: 'commands', filter: '', index: 0, startPos: pos - 1 });
        } else if (suggestionState.type !== 'none') {
            // Update filter
            const filter = textBefore.slice(suggestionState.startPos + (suggestionState.type === 'files' ? 1 : 0));
            if (filter.includes(' ') || filter.includes('\n')) {
                setSuggestionState({ type: 'none', filter: '', index: 0, startPos: 0 });
            } else {
                setSuggestionState(s => ({ ...s, filter, index: 0 }));
            }
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
        <div
            className={`p-4 relative transition-colors ${isDragging ? 'bg-nexus-accent/5' : 'bg-nexus-bg-secondary'}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            style={{
                borderTop: '1px solid var(--color-border)',
            }}
        >
            {/* Image Drop Overlay */}
            {isDragging && (
                <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-nexus-accent/10 backdrop-blur-[2px] border-2 border-dashed border-nexus-accent rounded-t-2xl m-2 pointer-events-none">
                    <ImageIcon className="w-10 h-10 text-nexus-accent animate-bounce" />
                    <span className="mt-2 text-sm font-bold text-nexus-accent uppercase tracking-widest">Drop images to attach</span>
                </div>
            )}
            {/* Suggestions Popover */}
            {suggestionState.type !== 'none' && filteredSuggestions.length > 0 && (
                <div
                    className="absolute bottom-full left-4 right-4 mb-2 bg-nexus-bg-tertiary backdrop-blur-xl border border-nexus-border rounded-xl shadow-2xl overflow-hidden z-50 animate-in slide-in-from-bottom-2 duration-200"
                    style={{ maxHeight: '240px', backgroundColor: 'var(--color-bg-tertiary)' }}
                >
                    <div className="flex items-center justify-between px-3 py-2 bg-nexus-bg-primary/50 border-b border-nexus-border">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-nexus-fg-muted">
                            {suggestionState.type === 'files' ? 'Reference File' : 'Slash Commands'}
                        </span>
                        <span className="text-[9px] text-nexus-fg-muted uppercase tracking-wider">Arrows to navigate • Enter to select</span>
                    </div>
                    <div className="overflow-y-auto max-h-[190px] p-1">
                        {filteredSuggestions.map((item: any, i) => (
                            <button
                                key={item.id || item.path}
                                onClick={() => handleSelectSuggestion(item)}
                                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-all ${i === suggestionState.index
                                    ? 'bg-nexus-accent text-white shadow-lg scale-[1.02]'
                                    : 'text-nexus-fg-secondary hover:bg-nexus-bg-primary hover:text-nexus-fg-primary'
                                    }`}
                            >
                                {suggestionState.type === 'files' ? (
                                    <FileText className={`w-4 h-4 ${i === suggestionState.index ? 'text-white' : 'text-nexus-accent'}`} />
                                ) : (
                                    <item.icon className={`w-4 h-4 ${i === suggestionState.index ? 'text-white' : 'text-nexus-accent'}`} />
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-bold truncate">{item.label || item.name}</div>
                                    {item.description || item.path !== item.name ? (
                                        <div className={`text-[10px] truncate ${i === suggestionState.index ? 'text-white/80' : 'text-nexus-fg-muted'}`}>
                                            {item.description || item.path}
                                        </div>
                                    ) : null}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between mb-2 px-1">
                {activeFileName ? (
                    <button
                        onClick={() => setAutoContextEnabled(!agent.autoContextEnabled)}
                        className="flex items-center space-x-1.5 transition-opacity hover:opacity-80"
                        style={{ color: agent.autoContextEnabled ? 'var(--color-accent)' : 'var(--color-fg-muted)' }}
                    >
                        <Eye className="w-2.5 h-2.5" />
                        <span className="text-[10px] font-medium uppercase tracking-wider">
                            {agent.autoContextEnabled ? 'Auto-Context On:' : 'Auto-Context Off'}
                        </span>
                        {agent.autoContextEnabled && (
                            <span className="font-mono text-[10px] lowercase text-[#666] truncate max-w-[120px]">
                                {activeFileName}
                            </span>
                        )}
                    </button>
                ) : (
                    <div />
                )}
                <div className="flex items-center space-x-2">
                    <Zap className="w-3 h-3" style={{ color: agent.braveMode ? 'var(--color-accent)' : 'var(--color-fg-muted)' }} />
                    <span
                        className="text-[10px] uppercase tracking-wider"
                        style={{ color: 'var(--color-fg-muted)' }}
                    >
                        Brave {agent.braveMode ? 'ON' : 'OFF'}
                    </span>
                </div>
            </div>

            {/* Pending Images */}
            {pendingImages.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                    {pendingImages.map((path) => (
                        <div key={path} className="group relative w-16 h-16 rounded-lg border border-nexus-border overflow-hidden bg-nexus-bg-primary shadow-lg">
                            <img
                                src={`file://${path}`}
                                alt="preview"
                                className="w-full h-full object-cover"
                            />
                            <button
                                onClick={() => removeImage(path)}
                                className="absolute top-1 right-1 p-0.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-nexus-accent"
                            >
                                <CloseIcon className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                    <div className="flex items-center justify-center w-16 h-16 rounded-lg border border-dashed border-nexus-border bg-nexus-bg-primary/50 text-nexus-fg-muted">
                        <ImageIcon className="w-5 h-5 opacity-30" />
                    </div>
                </div>
            )}

            <div className="relative group">
                <textarea
                    id="agent-chat-input"
                    ref={textareaRef}
                    value={content}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    placeholder="Ask Agent anything (use @ for files, / for commands)..."
                    className="w-full text-sm rounded-xl py-3 pl-4 pr-12 outline-none transition-all resize-none min-h-[44px] max-h-[200px]"
                    style={{
                        backgroundColor: 'var(--color-bg-primary)',
                        color: 'var(--color-fg-primary)',
                        border: '1px solid var(--color-border)',
                    }}
                    rows={1}
                />
                <button
                    onClick={handleSend}
                    disabled={!content.trim() || agent.status === 'connecting'}
                    className="absolute right-2 bottom-2 p-1.5 rounded-lg transition-colors"
                    style={{
                        backgroundColor: content.trim() && agent.status !== 'connecting' ? 'var(--color-accent)' : 'transparent',
                        color: content.trim() && agent.status !== 'connecting' ? '#ffffff' : 'var(--color-fg-muted)',
                        cursor: content.trim() && agent.status !== 'connecting' ? 'pointer' : 'not-allowed',
                    }}
                >
                    <Send className="w-4 h-4" />
                </button>
            </div>
            <div className="flex items-center justify-between mt-3 px-1">
                <div className="flex items-center bg-nexus-bg-primary border border-nexus-border rounded-lg p-0.5">
                    <button
                        onClick={() => setMode('chat')}
                        className={`flex items-center space-x-1.5 px-2 py-1 rounded-md transition-all ${agent.mode === 'chat'
                            ? 'bg-nexus-accent text-white shadow-sm'
                            : 'text-nexus-fg-muted hover:text-nexus-fg-secondary'
                            }`}
                    >
                        <MessageSquare className="w-3 h-3" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Planning</span>
                    </button>
                    <button
                        onClick={() => setMode('code')}
                        className={`flex items-center space-x-1.5 px-2 py-1 rounded-md transition-all ${agent.mode === 'code'
                            ? 'bg-nexus-accent text-white shadow-sm'
                            : 'text-nexus-fg-muted hover:text-nexus-fg-secondary'
                            }`}
                    >
                        <Code className="w-3 h-3" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Code</span>
                    </button>
                </div>

                <div className="flex items-center space-x-3">
                    <ModelSelector />
                </div>
            </div>

            <div className="flex items-center justify-between mt-3 px-1 text-[9px] uppercase tracking-[0.1em]" style={{ color: 'var(--color-fg-muted)', opacity: 0.6 }}>
                <div className="flex items-center space-x-2">
                    <span className="w-1 h-1 rounded-full bg-nexus-accent animate-pulse" />
                    <span>Agent System Ready</span>
                </div>
                <span>Workspace: {agent.activeFileContext ? 'File Focused' : 'Project Wide'}</span>
            </div>
        </div>
    );
};

export default ChatInput;
