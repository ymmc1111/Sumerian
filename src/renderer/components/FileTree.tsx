import React, { useEffect, useMemo } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { useAppStore } from '../stores/useAppStore';
import { FolderOpen, RefreshCw } from 'lucide-react';
import FileTreeItem from './FileTreeItem';
import { FileNode } from '../stores/types';

interface FlattenedNode {
    node: FileNode;
    level: number;
}

const FileTree: React.FC = () => {
    const { project, refreshFileTree } = useAppStore();
    const { fileTree, expandedPaths, rootPath } = project;

    useEffect(() => {
        if (rootPath) {
            console.log('[FileTree] rootPath changed, refreshing:', rootPath);
            refreshFileTree();
        }
    }, [rootPath]);

    const flattenedTree = useMemo(() => {
        if (!fileTree) return [];

        console.log('[FileTree] Regenerating flattenedTree. fileTree nodes:', fileTree.length);
        const result: FlattenedNode[] = [];
        const flatten = (nodes: FileNode[], level: number) => {
            for (const node of nodes) {
                result.push({ node, level });
                if (node.isDirectory && expandedPaths.includes(node.path) && node.children) {
                    flatten(node.children, level + 1);
                }
            }
        };
        flatten(fileTree, 0);
        console.log('[FileTree] Flattened tree length:', result.length);
        return result;
    }, [fileTree, expandedPaths]);

    if (flattenedTree.length === 0) {
        return (
            <div className="p-8 text-nexus-fg-muted text-xs text-center flex flex-col items-center gap-4">
                <div className="opacity-20"><FolderOpen className="w-12 h-12" /></div>
                <div>Project directory is empty or inaccessible.</div>
                <button
                    onClick={() => refreshFileTree()}
                    className="flex items-center gap-2 px-3 py-1.5 bg-nexus-bg-tertiary hover:bg-nexus-bg-accent transition-colors rounded-lg group"
                >
                    <RefreshCw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" />
                    <span>Refresh Explorer</span>
                </button>
            </div>
        );
    }

    // Use a simple list for small trees to avoid Virtuoso overhead/potential crashes
    if (flattenedTree.length < 100) {
        return (
            <div className="w-full h-full relative explorer-container overflow-y-auto custom-scrollbar">
                <div className="py-2">
                    {flattenedTree.map((item) => (
                        <FileTreeItem
                            key={item.node.path}
                            node={item.node}
                            level={item.level}
                        />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full relative explorer-container">
            <Virtuoso
                data={flattenedTree}
                style={{ height: '100%', width: '100%' }}
                totalCount={flattenedTree.length}
                initialItemCount={30}
                itemContent={(_index, item) => (
                    <FileTreeItem
                        key={item.node.path}
                        node={item.node}
                        level={item.level}
                    />
                )}
            />
            <style>{`
                .explorer-container .virtuoso-grid-list {
                    width: 100%;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: var(--color-border);
                    border-radius: 2px;
                }
            `}</style>
        </div>
    );
};

export default FileTree;
