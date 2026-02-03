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
import DragGhost from './components/DragGhost';
import ResizeHandle from './components/ResizeHandle';

import WelcomeScreen from './components/WelcomeScreen';
import SettingsModal from './components/SettingsModal';
import CommandPalette from './components/CommandPalette';
import ShortcutsHelp from './components/ShortcutsHelp';
import ProjectSwitcher from './components/ProjectSwitcher';
import DocsViewer from './components/DocsViewer';
import ScanlineOverlay from './components/ScanlineOverlay';
import DetachedPanelWindow from './components/DetachedPanelWindow';
import { ErrorBoundary } from './components/ErrorBoundary';
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
    const { init, project, ui, toggleProjectSwitcher, toggleDocsViewer } = useAppStore();
    const { mode, slots, isDragging, removeDetachedPanel, detachedPanels } = useLayoutStore();
    const { dragState } = useDragPanel();
    useKeyboardShortcuts();

    // Get target slot for drop zone highlighting
    const targetSlotId = dragState.snapTarget?.slotId;

    // Check if this is a detached panel window
    const detachedInfo = getDetachedPanelInfo();

    // Helper to check if a panel type is detached
    const isPanelDetached = (panelType: PanelType) =>
        detachedPanels.some(p => p.panelType === panelType);

    React.useEffect(() => {
        const interval = setInterval(() => {
            const state = useAppStore.getState();
            console.log('[App Health Check]', {
                rootPath: state.project.rootPath,
                fileTreeNodes: state.project.fileTree.length,
                isInitialized: state.agent.isInitialized,
                activePanel: state.ui.activePanel,
                sumerianExists: typeof window.sumerian !== 'undefined'
            });
        }, 5000);

        init();
        return () => clearInterval(interval);
    }, []);

    React.useEffect(() => {
        // Only listen for panel closed events in main window (not in detached panels)
        if (!detachedInfo) {
            const cleanupPanelClosed = window.sumerian.window.onPanelClosed((data: { id: string; panelType: string }) => {
                removeDetachedPanel(data.id);
            });

            // Agent state sync listeners (for updates from detached windows)
            const cleanupAgentMessage = window.sumerian.state.onSync('agent:message', (message: any) => {
                const { agent } = useAppStore.getState();
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

            // Sidebar tab sync from detached windows
            const cleanupSidebarTab = window.sumerian.state.onSync('sidebar:tab', (data: { tab: 'explorer' | 'workforce' }) => {
                const { ui } = useAppStore.getState();
                useAppStore.setState({
                    ui: { ...ui, sidebarActiveTab: data.tab }
                });
            });

            // Listen for resource updates from agents
            const cleanupResourceUpdate = window.sumerian.cli.onResourceUpdate((data: { agentId: string; cpu: number; memory: number }) => {
                useAppStore.getState().updateAgentResources(data.agentId, data.cpu, data.memory);
            });

            return () => {
                cleanupPanelClosed();
                cleanupAgentMessage();
                cleanupAgentStream();
                cleanupAgentStatus();
                cleanupAgentClear();
                cleanupAgentSessionLoaded();
                cleanupSidebarTab();
                cleanupResourceUpdate();
            };
        }
    }, []);

    // If this is a detached panel window, render only that panel
    if (detachedInfo) {
        if (typeof window.sumerian === 'undefined') {
            return (
                <div className="h-screen w-screen bg-black text-red-500 flex items-center justify-center p-8 text-center flex-col gap-4">
                    <div className="text-xl font-bold">API Not Found</div>
                    <div className="text-sm opacity-50">The Sumerian bridge is missing. Please restart the application.</div>
                </div>
            );
        }
        return <DetachedPanelWindow panelType={detachedInfo.panelType} windowId={detachedInfo.windowId} />;
    }

    // Wait for store initialization
    const isInitialized = useAppStore(state => state.agent.isInitialized);
    if (!isInitialized) {
        return (
            <div className="flex flex-col h-screen w-screen bg-nexus-bg-primary text-nexus-fg-primary overflow-hidden font-sans select-none items-center justify-center">
                <div className="animate-pulse text-nexus-accent text-sm font-bold tracking-widest uppercase">Initializing...</div>
            </div>
        );
    }

    if (!project.rootPath) {
        return (
            <div className="flex flex-col h-screen w-screen bg-nexus-bg-primary text-nexus-fg-primary overflow-hidden font-sans select-none">
                <TitleBar />
                <WelcomeScreen />
                <SettingsModal />
                <CommandPalette />
                <ShortcutsHelp />
                <ProjectSwitcher
                    isOpen={ui.isProjectSwitcherOpen}
                    onClose={toggleProjectSwitcher}
                />
                <DocsViewer
                    isOpen={ui.isDocsViewerOpen}
                    onClose={toggleDocsViewer}
                    initialDocId={ui.activeDocId}
                />
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <div className="flex flex-col h-screen w-screen bg-nexus-bg-primary text-nexus-fg-primary overflow-hidden font-sans select-none">
                <TitleBar />

                <div className="flex-1 flex min-h-0 relative">
                    {/* Slot A - Left panel (default: sidebar) */}
                    {!isPanelDetached(slots.A.panelType) && (
                        <div
                            style={{
                                width: slots.A.isCollapsed ? '4px' : `${slots.A.width}px`,
                                transition: isDragging ? 'none' : 'width 200ms ease-out'
                            }}
                            className={`flex-shrink-0 relative border-r border-nexus-border ${slots.A.isCollapsed ? 'overflow-hidden' : ''} ${isDragging && targetSlotId === 'A' ? 'ring-4 ring-blue-500/50 ring-inset' : ''
                                }`}
                        >
                            {!slots.A.isCollapsed && <PanelComponent panelType={slots.A.panelType} slotId="A" />}
                            {!slots.A.isCollapsed && (
                                <ResizeHandle slotId="A" direction="horizontal" position="right" />
                            )}
                        </div>
                    )}

                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col min-w-0">
                        <div className="flex-1 flex min-h-0 min-w-0 relative">
                            {/* Slot B - Center panel (default: editor) */}
                            {!isPanelDetached(slots.B.panelType) && (
                                <div className={`${isPanelDetached(slots.C.panelType) ? 'flex-1' : 'flex-1'} min-w-0 relative ${isDragging && targetSlotId === 'B' ? 'ring-4 ring-blue-500/50 ring-inset' : ''
                                    }`}>
                                    <PanelComponent panelType={slots.B.panelType} slotId="B" />
                                </div>
                            )}

                            {/* Slot C - Right panel (default: agent) */}
                            {!isPanelDetached(slots.C.panelType) && (
                                <div
                                    style={{
                                        width: isPanelDetached(slots.B.panelType)
                                            ? undefined
                                            : slots.C.isCollapsed
                                                ? '4px'
                                                : mode === 'agent-first'
                                                    ? '50%'
                                                    : `${slots.C.width}px`,
                                        transition: isDragging ? 'none' : 'width 200ms ease-out'
                                    }}
                                    className={`${isPanelDetached(slots.B.panelType) ? 'flex-1' : 'flex-shrink-0'} ${!isPanelDetached(slots.B.panelType) ? 'border-l border-nexus-border' : ''} relative ${slots.C.isCollapsed ? 'overflow-hidden' : ''} ${isDragging && targetSlotId === 'C' ? 'ring-4 ring-blue-500/50 ring-inset' : ''
                                        }`}
                                >
                                    {!slots.C.isCollapsed && <PanelComponent panelType={slots.C.panelType} slotId="C" />}
                                    {!slots.C.isCollapsed && !isPanelDetached(slots.B.panelType) && (
                                        <ResizeHandle slotId="C" direction="horizontal" position="left" />
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Slot D - Bottom panel (default: terminal) */}
                        {!isPanelDetached(slots.D.panelType) && (
                            <div
                                style={{
                                    flex: slots.D.isCollapsed ? '0 0 4px' : `${Math.max(0.1, Math.min(0.8, slots.D.height))} 0 0`,
                                    minHeight: slots.D.isCollapsed ? '4px' : `${Math.max(0.1, Math.min(0.8, slots.D.height)) * 100}%`,
                                    transition: isDragging ? 'none' : 'flex 200ms ease-out'
                                }}
                                className={`flex-shrink-0 border-t border-nexus-border relative ${slots.D.isCollapsed ? 'overflow-hidden' : ''} ${isDragging && targetSlotId === 'D' ? 'ring-4 ring-blue-500/50 ring-inset' : ''
                                    }`}
                            >
                                {!slots.D.isCollapsed && <PanelComponent panelType={slots.D.panelType} slotId="D" />}
                                {!slots.D.isCollapsed && (
                                    <ResizeHandle slotId="D" direction="vertical" position="top" />
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <SettingsModal />
                <CommandPalette />
                <ShortcutsHelp />
                <ProjectSwitcher
                    isOpen={ui.isProjectSwitcherOpen}
                    onClose={toggleProjectSwitcher}
                />
                <DocsViewer
                    isOpen={ui.isDocsViewerOpen}
                    onClose={toggleDocsViewer}
                    initialDocId={ui.activeDocId}
                />
                <ScanlineOverlay />

                {/* Ghost Frame for drag preview */}
                <GhostFrame
                    snapTarget={dragState.snapTarget}
                    isVisible={isDragging}
                />

                {/* Cursor-following drag ghost */}
                <DragGhost
                    panelType={dragState.panelType}
                    position={dragState.currentPoint}
                    isVisible={isDragging}
                />
            </div>
        </ErrorBoundary>
    );
};

export default App;
