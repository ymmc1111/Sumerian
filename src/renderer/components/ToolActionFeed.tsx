import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Terminal, FileEdit, Eye, Search, Check, X } from 'lucide-react';
import InlineDiffViewer from './InlineDiffViewer';

export interface ToolAction {
    id: string;
    name: string;
    input: Record<string, unknown>;
    timestamp: number;
    status: 'running' | 'success' | 'error';
    resultSummary?: string;
    beforeContent?: string;
    afterContent?: string;
}

interface Props {
    actions: ToolAction[];
}

const toolIcons: Record<string, React.ReactNode> = {
    'Edit': <FileEdit className="w-3 h-3" />,
    'Write': <FileEdit className="w-3 h-3" />,
    'str_replace_editor': <FileEdit className="w-3 h-3" />,
    'write_to_file': <FileEdit className="w-3 h-3" />,
    'insert_content': <FileEdit className="w-3 h-3" />,
    'Read': <Eye className="w-3 h-3" />,
    'read_file': <Eye className="w-3 h-3" />,
    'Bash': <Terminal className="w-3 h-3" />,
    'run_command': <Terminal className="w-3 h-3" />,
    'Grep': <Search className="w-3 h-3" />,
    'grep_search': <Search className="w-3 h-3" />,
};

function getToolDescription(action: ToolAction): string {
    const { name, input } = action;
    const filePath = (input.file_path || input.path || input.target_file) as string;

    if ((name === 'Read' || name === 'read_file') && filePath) {
        return `Reading ${filePath.split('/').pop()}`;
    }
    if ((name === 'Edit' || name === 'Write' || name === 'str_replace_editor' || name === 'write_to_file' || name === 'insert_content') && filePath) {
        return `Editing ${filePath.split('/').pop()}`;
    }
    if (name === 'Bash' && input.command) {
        const cmd = String(input.command);
        return cmd.length > 40 ? cmd.substring(0, 40) + '...' : cmd;
    }
    return name;
}

const ToolActionFeed: React.FC<Props> = ({ actions }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (actions.length === 0) return null;

    const recentActions = actions.slice(-5).reverse();
    const latestAction = actions[actions.length - 1];

    return (
        <div className="border-t border-nexus-border bg-nexus-bg-tertiary/50">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs text-nexus-fg-muted hover:text-nexus-fg-secondary transition-colors"
            >
                <div className="flex items-center gap-2">
                    {isExpanded ? (
                        <ChevronDown className="w-3 h-3" />
                    ) : (
                        <ChevronRight className="w-3 h-3" />
                    )}
                    <span>Agent Actions ({actions.length})</span>
                </div>
                {!isExpanded && latestAction && (
                    <span className="text-nexus-fg-muted truncate max-w-[200px]">
                        {getToolDescription(latestAction)}
                    </span>
                )}
            </button>

            {isExpanded && (
                <div className="px-3 pb-2 space-y-1 overflow-y-auto max-h-[400px]">
                    {recentActions.map((action) => (
                        <div key={action.id} className="space-y-1">
                            <div
                                className="flex items-center gap-2 text-xs py-1 px-2 rounded bg-nexus-bg-secondary"
                            >
                                <span className="text-nexus-fg-muted">
                                    {toolIcons[action.name] || <Terminal className="w-3 h-3" />}
                                </span>
                                <span className="flex-1 truncate text-nexus-fg-secondary">
                                    {getToolDescription(action)}
                                </span>
                                {action.status === 'success' && (
                                    <Check className="w-3 h-3 text-green-500" />
                                )}
                                {action.status === 'error' && (
                                    <X className="w-3 h-3 text-red-500" />
                                )}
                                {action.status === 'running' && (
                                    <div className="w-3 h-3 border border-nexus-accent border-t-transparent rounded-full animate-spin" />
                                )}
                            </div>

                            {action.status === 'success' && action.beforeContent !== undefined && action.afterContent !== undefined && (
                                <InlineDiffViewer
                                    filename={String((action.input as any)?.path || (action.input as any)?.target_file || '').split('/').pop()}
                                    before={action.beforeContent}
                                    after={action.afterContent}
                                />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ToolActionFeed;
