import React, { useMemo } from 'react';
import * as diff from 'diff';
import { ChevronDown, ChevronRight, FileCode } from 'lucide-react';

interface InlineDiffViewerProps {
    filename?: string;
    before?: string;
    after?: string;
}

const InlineDiffViewer: React.FC<InlineDiffViewerProps> = ({ filename, before = '', after = '' }) => {
    const [isExpanded, setIsExpanded] = React.useState(true);

    const diffLines = useMemo(() => {
        return diff.diffLines(before, after);
    }, [before, after]);

    const hasChanges = diffLines.some(part => part.added || part.removed);

    if (!hasChanges) {
        return (
            <div className="text-[10px] text-nexus-fg-muted italic p-2 bg-nexus-bg-secondary rounded-lg border border-nexus-border">
                No changes detected in {filename || 'file'}.
            </div>
        );
    }

    return (
        <div className="my-3 border border-nexus-border rounded-xl overflow-hidden bg-nexus-bg-secondary shadow-sm">
            {/* Header */}
            <div
                className="flex items-center justify-between px-3 py-2 bg-nexus-bg-tertiary cursor-pointer hover:bg-nexus-bg-secondary transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    <FileCode className="w-3.5 h-3.5 text-nexus-accent shrink-0" />
                    <span className="text-[11px] font-mono text-nexus-fg-secondary truncate">
                        {filename || 'File Edit'}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-nexus-bg-primary text-nexus-fg-muted uppercase tracking-wider font-bold">
                        Diff
                    </span>
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </div>
            </div>

            {/* Content */}
            {isExpanded && (
                <div className="max-h-[300px] overflow-y-auto font-mono text-[11px] leading-relaxed scrollbar-thin">
                    <table className="w-full border-collapse">
                        <tbody>
                            {diffLines.map((part, i) => {
                                const color = part.added
                                    ? 'bg-green-500/10 text-green-400'
                                    : part.removed
                                        ? 'bg-red-500/10 text-red-400'
                                        : 'text-nexus-fg-muted';
                                const prefix = part.added ? '+' : part.removed ? '-' : ' ';

                                return (
                                    <tr key={i} className={`${color}`}>
                                        <td className="w-6 text-center select-none opacity-40 py-0.5 border-r border-nexus-border/20">
                                            {prefix}
                                        </td>
                                        <td className="px-3 whitespace-pre-wrap break-all py-0.5">
                                            {part.value.replace(/\n$/, '')}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default InlineDiffViewer;
