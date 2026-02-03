import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Pin, Lock } from 'lucide-react';
import { FileNode } from '../stores/types';
import { useAppStore } from '../stores/useAppStore';
import FileIcon from './FileIcon';

interface FileTreeItemProps {
    node: FileNode;
    level: number;
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({ node, level }) => {
    const [lockedBy, setLockedBy] = useState<string | null>(null);
    const { openFile, editor, agent, toggleFilePin, workforce, project, togglePathExpanded } = useAppStore();
    const { activeFileId } = editor;
    const isPinned = agent.pinnedFiles?.includes(node.path) ?? false;
    const isOpen = project.expandedPaths.includes(node.path);

    useEffect(() => {
        if (node.isDirectory) return;

        let foundLock = false;
        for (const agentInstance of workforce.activeAgents.values()) {
            if (agentInstance.lockedFiles.includes(node.path)) {
                setLockedBy(agentInstance.id);
                foundLock = true;
                break;
            }
        }

        if (!foundLock && lockedBy) {
            setLockedBy(null);
        }
    }, [workforce.activeAgents, node.path, node.isDirectory, lockedBy]);

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (node.isDirectory) {
            togglePathExpanded(node.path);
        } else {
            openFile(node.path);
        }
    };

    const handlePin = (e: React.MouseEvent) => {
        e.stopPropagation();
        toggleFilePin(node.path);
    };

    const isActive = activeFileId === node.path;

    return (
        <div
            className={`flex items-center py-1 px-4 cursor-pointer hover:bg-nexus-bg-tertiary text-xs group relative ${isActive ? 'bg-nexus-bg-tertiary border-l-2 border-nexus-accent' : ''
                }`}
            style={{ paddingLeft: `${(level * 12) + 16}px` }}
            onClick={handleClick}
        >
            <div className="w-4 h-4 mr-1 flex items-center justify-center">
                {node.isDirectory && (
                    isOpen ? <ChevronDown className="w-3 h-3 text-nexus-fg-secondary" /> : <ChevronRight className="w-3 h-3 text-nexus-fg-secondary" />
                )}
            </div>
            <FileIcon name={node.name} isDirectory={node.isDirectory} isOpen={isOpen} className="w-3.5 h-3.5 mr-2 shrink-0" />
            <span className={`truncate flex-1 ${isActive ? 'text-nexus-fg-primary font-medium' : 'text-nexus-fg-secondary group-hover:text-nexus-fg-primary'}`}>
                {node.name}
            </span>

            {lockedBy && (
                <div
                    className="mr-1 flex items-center"
                    title={`Locked by agent ${lockedBy.slice(0, 8)}`}
                >
                    <Lock className="w-3 h-3 text-amber-500" />
                </div>
            )}

            {!node.isDirectory && (
                <button
                    onClick={handlePin}
                    className={`p-1 rounded hover:bg-nexus-bg-secondary transition-all ${isPinned ? 'opacity-100 text-nexus-accent' : 'opacity-0 group-hover:opacity-100 text-nexus-fg-muted hover:text-nexus-fg-primary'}`}
                    title={isPinned ? "Unpin from context" : "Pin to context"}
                >
                    <Pin className={`w-3 h-3 ${isPinned ? 'fill-current' : ''}`} />
                </button>
            )}
        </div>
    );
};

export default FileTreeItem;
