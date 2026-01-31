import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import 'xterm/css/xterm.css';
import { nexusTerminalTheme } from '../themes/xtermTheme';
import { useAppStore } from '../stores/useAppStore';
import TerminalTabs from '../components/TerminalTabs';
import TerminalContextMenu from '../components/TerminalContextMenu';
import PanelHeader from '../components/PanelHeader';
import { Terminal } from 'lucide-react';
import { PanelSlotId } from '../types/layout';

interface TerminalInstanceProps {
    id: string;
    isActive: boolean;
}

const TerminalInstance: React.FC<TerminalInstanceProps> = ({ id, isActive }) => {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<XTerm | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    const [menuPos, setMenuPos] = useState<{ x: number, y: number } | null>(null);
    const { project, ui } = useAppStore();
    const { terminalMirroring } = ui.settings;

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        setMenuPos({ x: e.clientX, y: e.clientY });
    };

    const handleCopy = () => {
        const selection = xtermRef.current?.getSelection();
        if (selection) {
            navigator.clipboard.writeText(selection);
        }
    };

    const handlePaste = async () => {
        const text = await navigator.clipboard.readText();
        if (text && xtermRef.current) {
            window.sumerian.terminal.write(id, text);
        }
    };

    const handleClear = () => {
        xtermRef.current?.clear();
    };

    const handleKill = () => {
        // In a real implementation we might send a kill signal via IPC
        xtermRef.current?.write('\r\n\x1b[31m[Process Terminated]\x1b[0m\r\n');
    };

    useEffect(() => {
        if (!terminalRef.current || !window.sumerian?.terminal) {
            console.warn('Terminal not initialized: container or API not available');
            return;
        }

        const term = new XTerm({
            theme: nexusTerminalTheme,
            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
            fontSize: 12,
            lineHeight: 1.4,
            cursorBlink: true,
            allowProposedApi: true,
            convertEol: true,
        });

        const fitAddon = new FitAddon();
        fitAddonRef.current = fitAddon;
        term.loadAddon(fitAddon);
        term.loadAddon(new WebLinksAddon());

        xtermRef.current = term;

        // Use requestAnimationFrame to ensure DOM is ready, then open terminal
        requestAnimationFrame(() => {
            if (!terminalRef.current) return;
            
            try {
                term.open(terminalRef.current);
                
                // Fit after a short delay to ensure terminal has rendered
                setTimeout(() => {
                    try {
                        if (terminalRef.current && terminalRef.current.offsetWidth > 0) {
                            fitAddon.fit();
                        }
                    } catch (e) {
                        console.warn('Initial fit failed:', e);
                    }
                }, 100);
            } catch (e) {
                console.error('Failed to open terminal:', e);
                // Retry once after a delay if initial open fails
                setTimeout(() => {
                    try {
                        if (terminalRef.current) {
                            term.open(terminalRef.current);
                            setTimeout(() => fitAddon.fit(), 100);
                        }
                    } catch (retryError) {
                        console.error('Terminal initialization failed after retry:', retryError);
                    }
                }, 200);
            }
        });

        // Initialize terminal via IPC
        window.sumerian.terminal.create(id, project.rootPath || './');

        let initialDataReceived = false;
        const cleanupData = window.sumerian.terminal.onData(id, (data: string) => {
            term.write(data);
            
            // Scroll to top after initial shell output is received
            if (!initialDataReceived) {
                initialDataReceived = true;
                setTimeout(() => {
                    term.scrollToTop();
                }, 150);
            }
        });

        term.onData((data) => {
            window.sumerian.terminal.write(id, data);
        });

        const resizeHandler = () => {
            fitAddon.fit();
            if (term.cols && term.rows) {
                window.sumerian.terminal.resize(id, term.cols, term.rows);
            }
        };

        window.addEventListener('resize', resizeHandler);

        // Add ResizeObserver to detect panel height changes
        const resizeObserver = new ResizeObserver(() => {
            requestAnimationFrame(() => {
                try {
                    fitAddon.fit();
                    if (term.cols && term.rows) {
                        window.sumerian.terminal.resize(id, term.cols, term.rows);
                    }
                } catch (e) {
                    // Terminal not ready yet
                }
            });
        });

        if (terminalRef.current) {
            resizeObserver.observe(terminalRef.current);
        }

        // Listen for CLI output to mirror it
        let cleanupCLI = () => { };

        if ((id === 'default' || id === 'mirror') && window.sumerian?.cli) {
            if (terminalMirroring === 'raw') {
                cleanupCLI = window.sumerian.cli.onOutput((output) => {
                    term.write(`\r\n\x1b[36m[agent]\x1b[0m ${output.content}`);
                });
            } else if (terminalMirroring === 'formatted') {
                const cleanupTool = window.sumerian.cli.onToolAction((action) => {
                    if (action.type === 'use') {
                        term.write(`\r\n\x1b[35m[agent:tool]\x1b[0m Using \x1b[1m${action.name}\x1b[0m...\r\n`);
                    } else if (action.type === 'result') {
                        const color = action.isError ? '\x1b[31m' : '\x1b[32m';
                        term.write(`\x1b[35m[agent:tool]\x1b[0m Result: ${color}${action.isError ? 'Error' : 'Success'}\x1b[0m\r\n`);
                    }
                });

                const cleanupStatus = window.sumerian.cli.onAgentStatus((status) => {
                    if (status.status === 'complete') {
                        term.write(`\x1b[36m[agent]\x1b[0m Response complete.\r\n`);
                    }
                });

                cleanupCLI = () => {
                    cleanupTool();
                    cleanupStatus();
                };
            }
        }

        return () => {
            cleanupData();
            cleanupCLI();
            window.removeEventListener('resize', resizeHandler);
            resizeObserver.disconnect();
            term.dispose();
        };
    }, [id, terminalMirroring]); // Now terminalMirroring is in the dependency array, so the effect will re-run if it changes.

    useEffect(() => {
        if (isActive && xtermRef.current && fitAddonRef.current) {
            xtermRef.current.focus();
            // Refit on activation using existing addon
            requestAnimationFrame(() => {
                try {
                    fitAddonRef.current?.fit();
                } catch (e) {
                    // Terminal not ready yet
                }
            });
        }
    }, [isActive]);

    return (
        <div
            className={`w-full h-full ${isActive ? 'block' : 'hidden'}`}
            onContextMenu={handleContextMenu}
        >
            <div ref={terminalRef} className="w-full h-full" />
            {menuPos && (
                <TerminalContextMenu
                    x={menuPos.x}
                    y={menuPos.y}
                    onClose={() => setMenuPos(null)}
                    onCopy={handleCopy}
                    onPaste={handlePaste}
                    onClear={handleClear}
                    onKill={handleKill}
                />
            )}
        </div>
    );
};

interface TerminalPanelProps {
    slotId?: PanelSlotId;
}

const TerminalPanel: React.FC<TerminalPanelProps> = ({ slotId = 'D' }) => {
    const { ui, workforce, terminateAgent } = useAppStore();
    const [layout, setLayout] = useState<'tabs' | 'grid'>('tabs');
    const [focusedTerminal, setFocusedTerminal] = useState<string>(ui.activeTerminalId || 'default');
    const [isHalting, setIsHalting] = useState(false);

    const activeAgents = Array.from(workforce.activeAgents.values());
    
    // Combine main terminals with agent terminals
    const allTerminals = [
        ...ui.terminals,
        ...activeAgents.map(agent => ({
            id: `agent-${agent.id}`,
            name: `Agent: ${agent.id.slice(0, 8)}`
        }))
    ];

    const handleTerminalClick = (termId: string) => {
        setFocusedTerminal(termId);
        if (!termId.startsWith('agent-')) {
            // Only set active terminal for non-agent terminals
            const { setActiveTerminal } = useAppStore.getState();
            setActiveTerminal(termId);
        }
    };

    const handleHaltAll = async () => {
        if (activeAgents.length === 0) return;
        
        if (confirm(`Kill all ${activeAgents.length} active agent(s)? This cannot be undone.`)) {
            setIsHalting(true);
            try {
                // Kill all agents in parallel
                await Promise.all(
                    activeAgents.map(agent => terminateAgent(agent.id))
                );
            } catch (error) {
                console.error('Failed to halt all agents:', error);
            } finally {
                setIsHalting(false);
            }
        }
    };

    return (
        <div className="w-full h-full bg-nexus-bg-primary flex flex-col border-t border-nexus-border">
            <PanelHeader
                title="Terminal"
                panelType="terminal"
                slotId={slotId}
                icon={<Terminal className="w-4 h-4" />}
                actions={
                    <div className="flex items-center gap-2">
                        {activeAgents.length > 0 && (
                            <button
                                onClick={handleHaltAll}
                                disabled={isHalting}
                                className="px-2 py-1 rounded bg-red-500 text-white text-[10px] font-bold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Kill all active agents"
                            >
                                {isHalting ? 'HALTING...' : 'HALT ALL'}
                            </button>
                        )}
                        {allTerminals.length > 1 && (
                            <button
                                onClick={() => setLayout(layout === 'tabs' ? 'grid' : 'tabs')}
                                className="icon-btn"
                                title={layout === 'tabs' ? 'Grid View' : 'Tab View'}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {layout === 'tabs' ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    )}
                                </svg>
                            </button>
                        )}
                    </div>
                }
            />

            {/* Terminal Tabs */}
            {layout === 'tabs' && (
                <div className="flex items-center border-b border-nexus-border bg-nexus-bg-secondary overflow-x-auto">
                    {allTerminals.map((term) => {
                        const isAgent = term.id.startsWith('agent-');
                        const isActive = focusedTerminal === term.id;
                        
                        return (
                            <button
                                key={term.id}
                                onClick={() => handleTerminalClick(term.id)}
                                className={`px-3 py-2 text-xs font-medium whitespace-nowrap border-r border-nexus-border transition-colors ${
                                    isActive
                                        ? 'bg-nexus-bg-primary text-nexus-accent border-b-2 border-b-nexus-accent'
                                        : 'text-nexus-fg-muted hover:text-nexus-fg-secondary hover:bg-nexus-bg-tertiary'
                                }`}
                            >
                                {isAgent && '🤖 '}
                                {term.name}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Terminal Content */}
            {layout === 'tabs' ? (
                <div className="flex-1 overflow-hidden p-2">
                    {ui.terminals.map((term) => (
                        <TerminalInstance
                            key={term.id}
                            id={term.id}
                            isActive={focusedTerminal === term.id}
                        />
                    ))}
                    {activeAgents.map((agent) => (
                        <TerminalInstance
                            key={`agent-${agent.id}`}
                            id={`agent-${agent.id}`}
                            isActive={focusedTerminal === `agent-${agent.id}`}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex-1 grid grid-cols-2 gap-2 p-2 overflow-hidden">
                    {allTerminals.slice(0, 4).map((term) => (
                        <div
                            key={term.id}
                            className="border border-nexus-border rounded overflow-hidden bg-nexus-bg-secondary"
                        >
                            <div className="px-2 py-1 bg-nexus-bg-tertiary border-b border-nexus-border text-[10px] text-nexus-fg-muted">
                                {term.name}
                            </div>
                            <div className="h-[calc(100%-24px)]">
                                <TerminalInstance
                                    id={term.id}
                                    isActive={true}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TerminalPanel;
