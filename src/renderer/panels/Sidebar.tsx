import React, { useState } from 'react';
import FileTree from '../components/FileTree';
import WorkforcePanel from './WorkforcePanel';
import { useAppStore } from '../stores/useAppStore';
import { FolderOpen, Settings as SettingsIcon, Bot } from 'lucide-react';
import PanelHeader from '../components/PanelHeader';
import { PanelSlotId } from '../types/layout';

interface SidebarProps {
    slotId?: PanelSlotId;
}

type SidebarTab = 'explorer' | 'workforce';

const Sidebar: React.FC<SidebarProps> = ({ slotId = 'A' }) => {
    const { project, selectProject, toggleSettings } = useAppStore();
    const [activeTab, setActiveTab] = useState<SidebarTab>('explorer');

    return (
        <div className="w-full h-full bg-nexus-bg-secondary flex flex-col">
            <PanelHeader
                title={activeTab === 'explorer' ? 'Explorer' : 'Workforce'}
                panelType="sidebar"
                slotId={slotId}
                icon={activeTab === 'explorer' ? <FolderOpen className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                actions={
                    activeTab === 'explorer' ? (
                        <button
                            onClick={selectProject}
                            className="icon-btn"
                            title="Open Folder"
                        >
                            <FolderOpen className="w-4 h-4" />
                        </button>
                    ) : null
                }
            />

            {/* Tab Bar */}
            <div className="flex h-10 border-b border-nexus-border bg-nexus-bg-primary">
                <button
                    onClick={() => setActiveTab('explorer')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 h-full text-xs font-medium transition-colors ${activeTab === 'explorer'
                            ? 'text-nexus-fg-primary bg-nexus-bg-secondary border-b-2 border-nexus-accent'
                            : 'text-nexus-fg-muted hover:text-nexus-fg-secondary hover:bg-nexus-bg-tertiary'
                        }`}
                >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>Explorer</span>
                </button>
                <button
                    onClick={() => setActiveTab('workforce')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 h-full text-xs font-medium transition-colors ${activeTab === 'workforce'
                            ? 'text-nexus-fg-primary bg-nexus-bg-secondary border-b-2 border-nexus-accent'
                            : 'text-nexus-fg-muted hover:text-nexus-fg-secondary hover:bg-nexus-bg-tertiary'
                        }`}
                >
                    <Bot className="w-3.5 h-3.5" />
                    <span>Workforce</span>
                </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
                {activeTab === 'explorer' ? <FileTree /> : <WorkforcePanel />}
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

