import React, { useRef, useEffect } from 'react';
import Tab from './Tab';
import { useAppStore } from '../stores/useAppStore';

const TabBar: React.FC = () => {
    const { editor, setActiveFile, closeFile } = useAppStore();
    const { openFiles, activeFileId } = editor;
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to active tab
    useEffect(() => {
        const activeTab = scrollRef.current?.querySelector(`[data-active="true"]`);
        if (activeTab) {
            activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        }
    }, [activeFileId]);

    if (openFiles.length === 0) {
        return <div className="h-10 border-b border-nexus-border bg-nexus-bg-secondary w-full" />;
    }

    return (
        <div
            ref={scrollRef}
            className="h-10 border-b border-nexus-border bg-nexus-bg-secondary flex overflow-x-auto no-scrollbar scroll-smooth w-full select-none"
        >
            {openFiles.map((file) => (
                <div key={file.id} data-active={activeFileId === file.id}>
                    <Tab
                        id={file.id}
                        name={file.name}
                        isActive={activeFileId === file.id}
                        isDirty={file.isDirty}
                        onClick={() => setActiveFile(file.id)}
                        onClose={(e) => {
                            e.stopPropagation();
                            closeFile(file.id);
                        }}
                    />
                </div>
            ))}
        </div>
    );
};

export default TabBar;
