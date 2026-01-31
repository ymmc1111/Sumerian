import React from 'react';

interface ResourceSparklineProps {
    history: number[];
    label: string;
    unit: string;
    color?: string;
    warningThreshold?: number;
}

const ResourceSparkline: React.FC<ResourceSparklineProps> = ({
    history,
    label,
    unit,
    color = 'text-nexus-accent',
    warningThreshold,
}) => {
    if (history.length === 0) {
        return null;
    }

    const max = Math.max(...history, 1);
    const current = history[history.length - 1];
    const isWarning = warningThreshold !== undefined && current > warningThreshold;

    const points = history
        .map((val, i) => {
            const x = (i / Math.max(history.length - 1, 1)) * 100;
            const y = 100 - (val / max) * 100;
            return `${x},${y}`;
        })
        .join(' ');

    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between">
                <span className="text-[9px] text-nexus-fg-muted uppercase">{label}</span>
                <span
                    className={`text-[9px] font-mono ${
                        isWarning ? 'text-yellow-500' : 'text-nexus-fg-secondary'
                    }`}
                >
                    {current.toFixed(1)}
                    {unit}
                </span>
            </div>
            <svg
                className="w-full h-6"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
            >
                <polyline
                    points={points}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className={isWarning ? 'text-yellow-500' : color}
                />
            </svg>
        </div>
    );
};

export default ResourceSparkline;
