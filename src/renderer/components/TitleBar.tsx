import React from 'react';
import LayoutModeToggle from './LayoutModeToggle';
import QuickProjectSwitcher from './QuickProjectSwitcher';
import { useAppStore } from '../stores/useAppStore';

const TitleBar: React.FC = () => {
    const { editor } = useAppStore();
    const hasUnsavedChanges = editor.openFiles.some(file => file.isDirty);

    return (
        <div className="h-10 bg-nexus-bg-secondary border-b border-nexus-border flex items-center justify-between pr-4 drag-region select-none">
            <div className="flex items-center gap-2" style={{ paddingLeft: '80px' }}>
                <span className="text-xs font-bold text-nexus-fg-primary tracking-tighter">SUMERIAN</span>
                <span className="text-[10px] text-nexus-fg-muted uppercase">v1.0.0</span>
            </div>
            <div className="flex-1 h-full cursor-default flex items-center justify-center">
                <div className="no-drag">
                    <QuickProjectSwitcher hasUnsavedChanges={hasUnsavedChanges} />
                </div>
            </div>
            <div className="no-drag">
                <LayoutModeToggle showLabel={false} />
            </div>
            <style>{`
        .drag-region {
          -webkit-app-region: drag;
        }
        .no-drag {
          -webkit-app-region: no-drag;
        }
      `}</style>
        </div>
    );
};

export default TitleBar;
