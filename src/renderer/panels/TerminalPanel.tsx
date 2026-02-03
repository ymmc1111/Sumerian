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
    const { project } = useAppStore();

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
        if (!terminalRef.current) return;
        
        // In detached windows, wait for project to be loaded
        if (!project.rootPath) {
            console.log('[Terminal] Waiting for project to load...');
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

        term.open(terminalRef.current);
        fitAddon.fit();

        xtermRef.current = term;

        // Create terminal if it doesn't exist (broadcast approach handles multi-window)
        window.sumerian.terminal.create(id, project.rootPath || './');

        const cleanupData = window.sumerian.terminal.onData(id, (data: string) => {
            term.write(data);
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

        // Listen for CLI output to mirror it
        const cleanupCLI = window.sumerian.cli.onOutput((output) => {
            if (id === 'default' || id === 'mirror') {
                term.write(`\r\n\x1b[36m[agent]\x1b[0m ${output.content}`);
            }
        });

        return () => {
            cleanupData();
            cleanupCLI();
            window.removeEventListener('resize', resizeHandler);
            term.dispose();
        };
    }, [id, project.rootPath]);

    useEffect(() => {
        if (isActive && xtermRef.current) {
            xtermRef.current.focus();
            // Refit on activation
            if (fitAddonRef.current) {
                setTimeout(() => {
                    fitAddonRef.current?.fit();
                    // Send resize to trigger terminal refresh
                    if (xtermRef.current && xtermRef.current.cols && xtermRef.current.rows) {
                        window.sumerian.terminal.resize(id, xtermRef.current.cols, xtermRef.current.rows);
                    }
                }, 50);
            }
        }
    }, [isActive, id]);

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
    const { ui, createTerminal, closeTerminal, setActiveTerminal } = useAppStore();

    return (
        <div className="w-full h-full bg-nexus-bg-primary flex flex-col border-t border-nexus-border">
            <PanelHeader
                title="Terminal"
                panelType="terminal"
                slotId={slotId}
                icon={<Terminal className="w-4 h-4" />}
                canDetach={false}
            />
            
            {/* Terminal Tabs */}
            <div className="flex items-center border-b border-nexus-border bg-nexus-bg-secondary overflow-x-auto">
                {ui.terminals.map((term) => (
                    <div
                        key={term.id}
                        className={`group flex items-center h-8 px-3 min-w-[100px] max-w-[180px] border-r border-nexus-border cursor-pointer transition-colors ${
                            ui.activeTerminalId === term.id
                                ? 'bg-nexus-bg-primary text-nexus-accent'
                                : 'text-nexus-fg-muted hover:bg-nexus-bg-tertiary'
                        }`}
                        onClick={() => setActiveTerminal(term.id)}
                    >
                        <Terminal className={`w-3 h-3 mr-2 shrink-0 ${ui.activeTerminalId === term.id ? 'text-nexus-accent' : ''}`} />
                        <span className="text-[10px] font-medium truncate flex-1">
                            {term.name}
                        </span>
                        {ui.terminals.length > 1 && (
                            <button
                                className="opacity-0 group-hover:opacity-100 ml-1 p-0.5 hover:bg-nexus-border rounded transition-all shrink-0"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    closeTerminal(term.id);
                                }}
                            >
                                <span className="text-xs">×</span>
                            </button>
                        )}
                    </div>
                ))}
                <button
                    className="p-2 hover:bg-nexus-bg-tertiary text-nexus-fg-muted transition-colors shrink-0"
                    onClick={() => createTerminal()}
                    title="New Terminal"
                >
                    <span className="text-sm font-bold">+</span>
                </button>
            </div>

            <div className="flex-1 overflow-hidden relative">
                {ui.terminals.map((term) => (
                    <div key={term.id} className={`absolute inset-0 ${ui.activeTerminalId === term.id ? 'block' : 'hidden'}`}>
                        <TerminalInstance
                            id={term.id}
                            isActive={ui.activeTerminalId === term.id}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TerminalPanel;
