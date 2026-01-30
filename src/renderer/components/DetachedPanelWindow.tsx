import React, { useEffect, useState } from 'react';
import { PanelType } from '../types/layout';
import Sidebar from '../panels/Sidebar';
import EditorPanel from '../panels/EditorPanel';
import AgentPanel from '../panels/AgentPanel';
import TerminalPanel from '../panels/TerminalPanel';
import { useAppStore } from '../stores/useAppStore';
import { X } from 'lucide-react';

interface DetachedPanelWindowProps {
  panelType: PanelType;
  windowId: string;
}

const PANEL_TITLES: Record<PanelType, string> = {
  sidebar: 'Explorer',
  editor: 'Editor',
  agent: 'Agent',
  terminal: 'Terminal',
};

export const DetachedPanelWindow: React.FC<DetachedPanelWindowProps> = ({
  panelType,
  windowId,
}) => {
  const { init, project } = useAppStore();
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    // Initialize the app store for this window
    init();
    setIsReady(true);
  }, [init]);
  
  const handleClose = async () => {
    await window.sumerian.window.reattachPanel(windowId);
  };

  const renderPanel = () => {
    switch (panelType) {
      case 'sidebar':
        return <Sidebar slotId="A" />;
      case 'editor':
        return <EditorPanel slotId="B" />;
      case 'agent':
        return <AgentPanel slotId="C" />;
      case 'terminal':
        return <TerminalPanel slotId="D" />;
      default:
        return <div>Unknown panel type</div>;
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-nexus-bg-primary text-nexus-fg-primary overflow-hidden font-sans">
      {/* Detached window title bar */}
      <div className="h-8 bg-[#1a1a1a] border-b border-[#2a2a2a] flex items-center justify-between px-3 drag-region select-none">
        <div className="flex items-center gap-2" style={{ paddingLeft: '60px' }}>
          <span className="text-xs font-medium text-gray-300">
            {PANEL_TITLES[panelType]}
          </span>
          <span className="text-[10px] text-gray-500">detached</span>
        </div>
        <button
          onClick={handleClose}
          className="no-drag p-1 rounded hover:bg-[#333] text-gray-500 hover:text-gray-300 transition-colors"
          title="Reattach to main window"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      {/* Panel content */}
      <div className="flex-1 overflow-hidden">
        {isReady ? renderPanel() : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Loading...
          </div>
        )}
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

export default DetachedPanelWindow;
