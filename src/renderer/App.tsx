import React, { useEffect, useState } from 'react';
import TitleBar from './components/TitleBar';
import Sidebar from './panels/Sidebar';
import EditorPanel from './panels/EditorPanel';
import AgentPanel from './panels/AgentPanel';
import TerminalPanel from './panels/TerminalPanel';
import { useAppStore } from './stores/useAppStore';
import { useLayoutStore } from './stores/layoutStore';
import { useDragPanel } from './hooks/useDragPanel';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import GhostFrame from './components/GhostFrame';

import WelcomeScreen from './components/WelcomeScreen';
import SettingsModal from './components/SettingsModal';
import CommandPalette from './components/CommandPalette';
import ShortcutsHelp from './components/ShortcutsHelp';
import ScanlineOverlay from './components/ScanlineOverlay';
import DetachedPanelWindow from './components/DetachedPanelWindow';
import { PanelSlotId, PanelType } from './types/layout';

// Check if this is a detached panel window
function getDetachedPanelInfo(): { panelType: PanelType; windowId: string } | null {
  const params = new URLSearchParams(window.location.search);
  const detached = params.get('detached') as PanelType | null;
  const windowId = params.get('windowId');
  
  if (detached && windowId) {
    return { panelType: detached, windowId };
  }
  return null;
}

const PanelComponent: React.FC<{ panelType: PanelType; slotId: PanelSlotId }> = ({ panelType, slotId }) => {
    switch (panelType) {
        case 'sidebar':
            return <Sidebar slotId={slotId} />;
        case 'editor':
            return <EditorPanel slotId={slotId} />;
        case 'agent':
            return <AgentPanel slotId={slotId} />;
        case 'terminal':
            return <TerminalPanel slotId={slotId} />;
        default:
            return null;
    }
};

const App: React.FC = () => {
    const { ui, setTerminalHeight, init, project } = useAppStore();
    const { mode, slots, isDragging, removeDetachedPanel, detachedPanels } = useLayoutStore();
    const { dragState } = useDragPanel();
    useKeyboardShortcuts();
    
    // Check if this is a detached panel window
    const detachedInfo = getDetachedPanelInfo();
    
    // Helper to check if a panel type is detached
    const isPanelDetached = (panelType: PanelType) => 
        detachedPanels.some(p => p.panelType === panelType);

    React.useEffect(() => {
        init();
        
        // Listen for panel closed events from main process
        const cleanup = window.sumerian.window.onPanelClosed((data) => {
            removeDetachedPanel(data.id);
        });
        
        return cleanup;
    }, []);
    
    // If this is a detached panel window, render only that panel
    if (detachedInfo) {
        return (
            <DetachedPanelWindow 
                panelType={detachedInfo.panelType} 
                windowId={detachedInfo.windowId} 
            />
        );
    }

    const handleTerminalResize = (e: React.MouseEvent) => {
        const startY = e.clientY;
        const startHeight = ui.terminalHeight;

        const onMouseMove = (moveEvent: MouseEvent) => {
            const deltaY = startY - moveEvent.clientY;
            const newHeight = Math.max(100, Math.min(600, startHeight + deltaY));
            setTerminalHeight(newHeight);
        };

        const onMouseUp = () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    };

    if (!project.rootPath) {
        return (
            <div className="flex flex-col h-screen w-screen bg-nexus-bg-primary text-nexus-fg-primary overflow-hidden font-sans select-none">
                <TitleBar />
                <WelcomeScreen />
                <SettingsModal />
                <CommandPalette />
                <ShortcutsHelp />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen w-screen bg-nexus-bg-primary text-nexus-fg-primary overflow-hidden font-sans select-none">
            <TitleBar />

            <div className="flex-1 flex min-h-0">
                {/* Slot A - Left panel (default: sidebar) */}
                {!isPanelDetached(slots.A.panelType) && (
                    <div
                        style={{ 
                            width: slots.A.isCollapsed ? `${slots.A.width}px` : `${ui.sidebarWidth}px`,
                            transition: 'width 200ms ease-out'
                        }}
                        className={`flex-shrink-0 ${slots.A.isCollapsed ? 'overflow-hidden' : ''}`}
                    >
                        {!slots.A.isCollapsed && <PanelComponent panelType={slots.A.panelType} slotId="A" />}
                    </div>
                )}

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex-1 flex min-h-0 min-w-0">
                        {/* Slot B - Center panel (default: editor) */}
                        {!isPanelDetached(slots.B.panelType) && (
                            <div 
                                className="min-w-0 transition-all duration-200"
                                style={{ 
                                    flex: mode === 'agent-first' ? '0 0 50%' : '1 1 auto'
                                }}
                            >
                                <PanelComponent panelType={slots.B.panelType} slotId="B" />
                            </div>
                        )}

                        {/* Slot C - Right panel (default: agent) */}
                        {!isPanelDetached(slots.C.panelType) && (
                            <div
                                style={{ 
                                    width: slots.C.isCollapsed 
                                        ? `${slots.C.width}px` 
                                        : mode === 'agent-first' 
                                            ? '50%' 
                                            : `${ui.agentPanelWidth}px`,
                                    transition: 'width 200ms ease-out'
                                }}
                                className={`flex-shrink-0 border-l border-nexus-border ${slots.C.isCollapsed ? 'overflow-hidden' : ''}`}
                            >
                                {!slots.C.isCollapsed && <PanelComponent panelType={slots.C.panelType} slotId="C" />}
                            </div>
                        )}
                    </div>

                    {/* Slot D - Bottom panel (default: terminal) */}
                    {ui.isTerminalVisible && !slots.D.isCollapsed && !isPanelDetached(slots.D.panelType) && (
                        <>
                            <div
                                className="h-1 bg-transparent hover:bg-nexus-accent/30 cursor-row-resize transition-colors"
                                onMouseDown={handleTerminalResize}
                            />
                            <div
                                style={{ height: `${ui.terminalHeight}px` }}
                                className="flex-shrink-0"
                            >
                                <PanelComponent panelType={slots.D.panelType} slotId="D" />
                            </div>
                        </>
                    )}
                    {slots.D.isCollapsed && (
                        <div 
                            style={{ height: `${slots.D.height}px` }}
                            className="flex-shrink-0 bg-nexus-bg-secondary"
                        />
                    )}
                </div>
            </div>
            <SettingsModal />
            <CommandPalette />
            <ShortcutsHelp />
            <ScanlineOverlay />
            
            {/* Ghost Frame for drag preview */}
            <GhostFrame 
                snapTarget={dragState.snapTarget} 
                isVisible={isDragging} 
            />
        </div>
    );
};

export default App;
