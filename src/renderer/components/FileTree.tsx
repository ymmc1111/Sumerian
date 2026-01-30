import React, { useEffect } from 'react';
import { useAppStore } from '../stores/useAppStore';
import FileTreeItem from './FileTreeItem';
import { FileNode } from '../stores/types';

const FileTree: React.FC = () => {
    const { project, refreshFileTree } = useAppStore();

    useEffect(() => {
        if (project.rootPath) {
            refreshFileTree();
        }
    }, [project.rootPath]);

    if (!project.rootPath) {
        return (
            <div className="p-4 text-nexus-fg-muted text-xs text-center">
                No project open
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto py-2">
            {(project.fileTree || []).map((node) => (
                <FileTreeItem key={node.path} node={node} level={0} />
            ))}
        </div>
    );
};

export default FileTree;
