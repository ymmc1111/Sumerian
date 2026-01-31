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
        fixed pointer-events-none z-[100]
        border-4 rounded-xl
        transition-all duration-200 ease-out
        ${isStacking
          ? 'border-[#3b82f6] bg-[#3b82f6]/20 shadow-[0_0_40px_rgba(59,130,246,0.6),0_0_80px_rgba(59,130,246,0.3)]'
          : 'border-[#3b82f6] bg-[#3b82f6]/15 shadow-[0_0_30px_rgba(59,130,246,0.4),0_0_60px_rgba(59,130,246,0.2)]'
        }
        animate-pulse-glow
      `}
      style={frameStyle}
    >
      {/* Animated gradient border effect */}
      <div className="absolute inset-0 overflow-hidden rounded-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-blue-500/10 to-transparent pointer-events-none animate-gradient" />
        <div className="absolute inset-0 bg-gradient-to-tl from-blue-300/10 to-transparent pointer-events-none" />
      </div>

      {/* Drop label with icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`
          px-6 py-3 rounded-xl text-white font-bold tracking-wide uppercase
          flex items-center gap-3 shadow-2xl backdrop-blur-sm
          ${isStacking 
            ? 'bg-[#3b82f6] text-lg' 
            : 'bg-[#2563eb] text-base'
          }
        `}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
          <span>{isStacking ? 'Stack Into Tab' : 'Drop Here to Swap'}</span>
        </div>
      </div>

      {/* Corner indicators - Larger and brighter */}
      <div className="absolute top-3 left-3 w-6 h-6 border-t-4 border-l-4 border-blue-400 rounded-tl-md opacity-90" />
      <div className="absolute top-3 right-3 w-6 h-6 border-t-4 border-r-4 border-blue-400 rounded-tr-md opacity-90" />
      <div className="absolute bottom-3 left-3 w-6 h-6 border-b-4 border-l-4 border-blue-400 rounded-bl-md opacity-90" />
      <div className="absolute bottom-3 right-3 w-6 h-6 border-b-4 border-r-4 border-blue-400 rounded-br-md opacity-90" />

      <style>{`
        @keyframes pulse-glow {
          0%, 100% { 
            opacity: 1; 
            transform: scale(1);
            filter: brightness(1);
          }
          50% { 
            opacity: 0.9; 
            transform: scale(0.998);
            filter: brightness(1.1);
          }
        }
        .animate-pulse-glow {
          animation: pulse-glow 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes gradient {
          0% { transform: rotate(0deg) scale(1.5); }
          100% { transform: rotate(360deg) scale(1.5); }
        }
        .animate-gradient {
          animation: gradient 8s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default GhostFrame;
