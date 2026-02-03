import React, { useEffect } from 'react';
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
  const { init } = useAppStore();

  useEffect(() => {
    // Initialize the app store for this window (loads from shared state)
    init().catch((error: unknown) => {
      console.error('Failed to initialize detached window:', error);
    });

    // Subscribe to state broadcasts from main window
    const cleanupEditorContent = window.sumerian.state.onSync('editor:content', (data: { id: string; content: string }) => {
      const { editor } = useAppStore.getState();
      const file = editor.openFiles.find(f => f.id === data.id);
      if (file && file.content !== data.content) {
        useAppStore.setState({
          editor: {
            ...editor,
            openFiles: editor.openFiles.map(f =>
              f.id === data.id ? { ...f, content: data.content, isDirty: true } : f
            )
          }
        });
      }
    });

    const cleanupEditorClose = window.sumerian.state.onSync('editor:close', (data: { id: string }) => {
      const { editor } = useAppStore.getState();
      const openFiles = editor.openFiles.filter(f => f.id !== data.id);
      let activeFileId = editor.activeFileId;
      if (activeFileId === data.id) {
        activeFileId = openFiles.length > 0 ? openFiles[openFiles.length - 1].id : null;
      }
      useAppStore.setState({
        editor: { ...editor, openFiles, activeFileId }
      });
    });

    const cleanupEditorSave = window.sumerian.state.onSync('editor:save', (data: { id: string }) => {
      const { editor } = useAppStore.getState();
      useAppStore.setState({
        editor: {
          ...editor,
          openFiles: editor.openFiles.map(f =>
            f.id === data.id ? { ...f, isDirty: false } : f
          )
        }
      });
    });

    // Agent state sync
    const cleanupAgentMessage = window.sumerian.state.onSync('agent:message', (message: any) => {
      const { agent } = useAppStore.getState();
      // Check if message already exists to avoid duplicates
      const exists = agent.messages.some(m => m.id === message.id);
      if (!exists) {
        useAppStore.setState({
          agent: {
            ...agent,
            messages: [...agent.messages, message]
          }
        });
      }
    });

    const cleanupAgentStream = window.sumerian.state.onSync('agent:stream', (data: { content: string }) => {
      const { agent } = useAppStore.getState();
      const messages = [...agent.messages];
      const lastIndex = messages.findLastIndex(m => m.role === 'agent');
      if (lastIndex !== -1) {
        messages[lastIndex] = {
          ...messages[lastIndex],
          content: data.content
        };
        useAppStore.setState({
          agent: { ...agent, messages }
        });
      }
    });

    const cleanupAgentStatus = window.sumerian.state.onSync('agent:status', (data: { status: string }) => {
      const { agent } = useAppStore.getState();
      useAppStore.setState({
        agent: { ...agent, status: data.status as any }
      });
    });

    const cleanupAgentClear = window.sumerian.state.onSync('agent:clear', () => {
      const { agent } = useAppStore.getState();
      useAppStore.setState({
        agent: { ...agent, messages: [] }
      });
    });

    const cleanupAgentSessionLoaded = window.sumerian.state.onSync('agent:session-loaded', (data: { sessionId: string; messages: any[]; usage: any }) => {
      const { agent } = useAppStore.getState();
      useAppStore.setState({
        agent: {
          ...agent,
          sessionId: data.sessionId,
          messages: data.messages,
          usage: data.usage
        }
      });
    });

    // Terminal state sync
    const cleanupTerminalCreate = window.sumerian.state.onSync('terminal:create', (data: { id: string; name: string }) => {
      const { ui } = useAppStore.getState();
      const exists = ui.terminals.some(t => t.id === data.id);
      if (!exists) {
        useAppStore.setState({
          ui: {
            ...ui,
            terminals: [...ui.terminals, { id: data.id, name: data.name }],
            activeTerminalId: data.id
          }
        });
      }
    });

    const cleanupTerminalClose = window.sumerian.state.onSync('terminal:close', (data: { id: string }) => {
      const { ui } = useAppStore.getState();
      const terminals = ui.terminals.filter(t => t.id !== data.id);
      let activeTerminalId = ui.activeTerminalId;
      if (activeTerminalId === data.id) {
        activeTerminalId = terminals.length > 0 ? terminals[terminals.length - 1].id : null;
      }
      useAppStore.setState({
        ui: { ...ui, terminals, activeTerminalId }
      });
    });

    const cleanupTerminalActive = window.sumerian.state.onSync('terminal:active', (data: { id: string }) => {
      const { ui } = useAppStore.getState();
      useAppStore.setState({
        ui: { ...ui, activeTerminalId: data.id }
      });
    });

    return () => {
      cleanupEditorContent();
      cleanupEditorClose();
      cleanupEditorSave();
      cleanupAgentMessage();
      cleanupAgentStream();
      cleanupAgentStatus();
      cleanupAgentClear();
      cleanupAgentSessionLoaded();
      cleanupTerminalCreate();
      cleanupTerminalClose();
      cleanupTerminalActive();
    };
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
        {renderPanel()}
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
