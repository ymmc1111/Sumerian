import React from 'react';
import FileTree from '../components/FileTree';
import { useAppStore } from '../stores/useAppStore';
import { FolderOpen, Settings as SettingsIcon } from 'lucide-react';
import PanelHeader from '../components/PanelHeader';
import { PanelSlotId } from '../types/layout';

interface SidebarProps {
    slotId?: PanelSlotId;
}

const Sidebar: React.FC<SidebarProps> = ({ slotId = 'A' }) => {
    const { project, selectProject, toggleSettings } = useAppStore();

    return (
        <div className="w-full h-full bg-nexus-bg-secondary flex flex-col border-r border-nexus-border">
            <PanelHeader
                title="Explorer"
                panelType="sidebar"
                slotId={slotId}
                icon={<FolderOpen className="w-4 h-4" />}
                actions={
                    <button
                        onClick={selectProject}
                        className="icon-btn"
                        title="Open Folder"
                    >
                        <FolderOpen className="w-4 h-4" />
                    </button>
                }
            />

            <div className="flex-1 overflow-hidden">
                <FileTree />
            </div>

            {/* Bottom Actions */}
            <div className="p-2 border-t border-nexus-border shrink-0">
                <button
                    onClick={toggleSettings}
                    className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-nexus-fg-muted hover:text-nexus-fg-primary hover:bg-nexus-bg-tertiary transition-all group"
                    title="Settings"
                >
                    <SettingsIcon className="w-4 h-4 group-hover:rotate-45 transition-transform duration-300" />
                    <span className="text-xs font-medium">Settings</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;

