import React from 'react';
import { X } from 'lucide-react';

interface TabProps {
    id: string;
    name: string;
    isActive: boolean;
    isDirty: boolean;
    onClick: () => void;
    onClose: (e: React.MouseEvent) => void;
}

const Tab: React.FC<TabProps> = ({ name, isActive, isDirty, onClick, onClose }) => {
    return (
        <div
            onClick={onClick}
            className={`flex items-center h-full px-4 border-r border-nexus-border cursor-pointer transition-colors group relative min-w-[120px] max-w-[200px] shrink-0 ${isActive
                    ? 'bg-nexus-bg-primary text-nexus-fg-primary'
                    : 'bg-nexus-bg-secondary text-nexus-fg-secondary hover:bg-nexus-bg-tertiary'
                }`}
        >
            <span className="text-xs truncate mr-4">{name}</span>

            <div className="absolute right-2 flex items-center">
                {isDirty && !isActive && (
                    <div className="w-2 h-2 rounded-full bg-nexus-fg-muted mr-1" />
                )}
                {isDirty && isActive && (
                    <div className="w-2 h-2 rounded-full bg-nexus-accent mr-1" />
                )}
                <button
                    onClick={onClose}
                    className={`p-0.5 rounded hover:bg-nexus-bg-tertiary opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'opacity-100' : ''
                        }`}
                >
                    <X className="w-3 h-3 text-nexus-fg-muted hover:text-nexus-fg-primary" />
                </button>
            </div>

            {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-nexus-accent" />
            )}
        </div>
    );
};

export default Tab;
