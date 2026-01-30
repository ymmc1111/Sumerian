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
        if (!terminalRef.current) return;

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
        // Delay initial fit to ensure container has dimensions
        requestAnimationFrame(() => {
            try {
                fitAddon.fit();
            } catch (e) {
                // Terminal not ready yet, will fit on resize
            }
        });


        xtermRef.current = term;

        // Initialize terminal via IPC
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
        let cleanupCLI = () => { };

        if (id === 'default' || id === 'mirror') {
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
    const { ui } = useAppStore();

    return (
        <div className="w-full h-full bg-nexus-bg-primary flex flex-col border-t border-nexus-border">
            <PanelHeader
                title="Terminal"
                panelType="terminal"
                slotId={slotId}
                icon={<Terminal className="w-4 h-4" />}
                actions={<TerminalTabs />}
            />
            <div className="flex-1 overflow-hidden p-2">
                {ui.terminals.map((term) => (
                    <TerminalInstance
                        key={term.id}
                        id={term.id}
                        isActive={ui.activeTerminalId === term.id}
                    />
                ))}
            </div>
        </div>
    );
};

export default TerminalPanel;
