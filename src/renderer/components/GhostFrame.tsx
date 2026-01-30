import React, { useMemo } from 'react';
import { PanelSlotId } from '../types/layout';
import { useLayoutStore } from '../stores/layoutStore';
import { SnapTarget } from '../utils/snapRegions';

interface GhostFrameProps {
  snapTarget: SnapTarget | null;
  isVisible: boolean;
}

export const GhostFrame: React.FC<GhostFrameProps> = ({ snapTarget, isVisible }) => {
  const { slots } = useLayoutStore();

  const frameStyle = useMemo(() => {
    if (!snapTarget || !isVisible) return null;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const titleBarHeight = 40; // TitleBar height

    // Calculate slot rects based on actual layout (pixels, not percentages)
    const getSlotRect = (slotId: PanelSlotId) => {
      const sidebarWidth = slots.A.isCollapsed ? 4 : (slots.A.width || 260);
      const agentWidth = slots.C.isCollapsed ? 4 : (slots.C.width || 380);
      const terminalHeight = slots.D.isCollapsed ? 4 : 200;
      
      switch (slotId) {
        case 'A': // Sidebar
          return { x: 0, y: titleBarHeight, width: sidebarWidth, height: viewportHeight - titleBarHeight };
        case 'B': // Editor
          return { x: sidebarWidth, y: titleBarHeight, width: viewportWidth - sidebarWidth - agentWidth, height: viewportHeight - titleBarHeight - terminalHeight };
        case 'C': // Agent
          return { x: viewportWidth - agentWidth, y: titleBarHeight, width: agentWidth, height: viewportHeight - titleBarHeight - terminalHeight };
        case 'D': // Terminal
          return { x: sidebarWidth, y: viewportHeight - terminalHeight, width: viewportWidth - sidebarWidth, height: terminalHeight };
        default:
          return { x: 0, y: 0, width: 0, height: 0 };
      }
    };

    const rect = getSlotRect(snapTarget.slotId);

    return {
      left: `${rect.x}px`,
      top: `${rect.y}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
    };
  }, [snapTarget, isVisible, slots]);

  if (!isVisible || !frameStyle) return null;

  const isStacking = snapTarget?.edge === 'center';

  return (
    <div
      className={`
        fixed pointer-events-none z-50
        border-2 rounded-lg
        transition-all duration-150 ease-out
        ${isStacking 
          ? 'border-blue-500 bg-blue-500/20' 
          : 'border-blue-400 bg-blue-400/10'
        }
      `}
      style={frameStyle}
    >
      {isStacking && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="px-3 py-1.5 bg-blue-500/80 rounded-md text-white text-sm font-medium">
            Stack panels
          </div>
        </div>
      )}
      
      {/* Corner indicators */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-blue-400 rounded-tl" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-blue-400 rounded-tr" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-blue-400 rounded-bl" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-blue-400 rounded-br" />
    </div>
  );
};

export default GhostFrame;
