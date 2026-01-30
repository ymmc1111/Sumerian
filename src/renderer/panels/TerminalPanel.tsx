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
        term.loadAddon(fitAddon);
        term.loadAddon(new WebLinksAddon());

        term.open(terminalRef.current);
        fitAddon.fit();

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
        // Note: In a real app we might want to mirror only to the 'default' or a specific terminal
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
    }, []);

    useEffect(() => {
        if (isActive && xtermRef.current) {
            xtermRef.current.focus();
            // Refit on activation
            const fitAddon = new FitAddon();
            xtermRef.current.loadAddon(fitAddon);
            setTimeout(() => fitAddon.fit(), 10);
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
