import React, { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { FileNode } from '../stores/types';
import { useAppStore } from '../stores/useAppStore';
import FileIcon from './FileIcon';

interface FileTreeItemProps {
    node: FileNode;
    level: number;
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({ node, level }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { openFile, editor } = useAppStore();
    const { activeFileId } = editor;


    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (node.isDirectory) {
            setIsOpen(!isOpen);
        } else {
            openFile(node.path);
        }
    };

    const isActive = activeFileId === node.path;

    return (
        <div>
            <div
                className={`flex items-center py-1 px-4 cursor-pointer hover:bg-nexus-bg-tertiary text-xs group ${isActive ? 'bg-nexus-bg-tertiary border-l-2 border-nexus-accent' : ''
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
                <span className={`truncate ${isActive ? 'text-nexus-fg-primary font-medium' : 'text-nexus-fg-secondary group-hover:text-nexus-fg-primary'}`}>
                    {node.name}
                </span>
            </div>

            {node.isDirectory && isOpen && node.children && (
                <div>
                    {node.children.map((child) => (
                        <FileTreeItem key={child.path} node={child} level={level + 1} />
                    ))}
                </div>
            )}

            {/* If directory is open but children are not loaded yet (nested loading not implemented yet in this version) */}
            {node.isDirectory && isOpen && !node.children && (
                <DirectoryLoader path={node.path} level={level + 1} />
            )}
        </div>
    );
};

// Simple sub-component for loading nested directories (TODO: improve this)
const DirectoryLoader: React.FC<{ path: string; level: number }> = ({ path, level }) => {
    const [children, setChildren] = useState<FileNode[]>([]);
    const [loading, setLoading] = useState(true);

    useState(() => {
        window.sumerian.files.list(path).then(res => {
            setChildren(res);
            setLoading(false);
        });
    });

    if (loading) return null;

    return (
        <>
            {children.map((child) => (
                <FileTreeItem key={child.path} node={child} level={level} />
            ))}
        </>
    );
};

export default FileTreeItem;
