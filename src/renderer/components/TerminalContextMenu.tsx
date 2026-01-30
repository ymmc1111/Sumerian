import React, { useEffect, useRef } from 'react';
import { Copy, Clipboard, Trash2, StopCircle } from 'lucide-react';

interface TerminalContextMenuProps {
    x: number;
    y: number;
    onClose: () => void;
    onCopy: () => void;
    onPaste: () => void;
    onClear: () => void;
    onKill: () => void;
}

const TerminalContextMenu: React.FC<TerminalContextMenuProps> = ({
    x, y, onClose, onCopy, onPaste, onClear, onKill
}) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    return (
        <div
            ref={menuRef}
            className="fixed z-[200] w-48 bg-nexus-bg-secondary backdrop-blur-xl border border-nexus-border rounded-lg shadow-2xl py-1 animate-in fade-in zoom-in-95 duration-100"
            style={{ top: y, left: x, backgroundColor: 'var(--color-bg-secondary)' }}
        >
            <button
                onClick={() => { onCopy(); onClose(); }}
                className="w-full flex items-center px-3 py-2 text-xs text-nexus-fg-secondary hover:bg-nexus-accent hover:text-white transition-colors"
            >
                <Copy className="w-3.5 h-3.5 mr-2" />
                <span>Copy</span>
            </button>
            <button
                onClick={() => { onPaste(); onClose(); }}
                className="w-full flex items-center px-3 py-2 text-xs text-nexus-fg-secondary hover:bg-nexus-accent hover:text-white transition-colors"
            >
                <Clipboard className="w-3.5 h-3.5 mr-2" />
                <span>Paste</span>
            </button>
            <div className="my-1 border-t border-nexus-border" />
            <button
                onClick={() => { onClear(); onClose(); }}
                className="w-full flex items-center px-3 py-2 text-xs text-nexus-fg-secondary hover:bg-nexus-bg-tertiary transition-colors"
            >
                <Trash2 className="w-3.5 h-3.5 mr-2" />
                <span>Clear Terminal</span>
            </button>
            <button
                onClick={() => { onKill(); onClose(); }}
                className="w-full flex items-center px-3 py-2 text-xs text-red-400 hover:bg-red-500 hover:text-white transition-colors"
            >
                <StopCircle className="w-3.5 h-3.5 mr-2" />
                <span>Kill Process</span>
            </button>
        </div>
    );
};

export default TerminalContextMenu;
