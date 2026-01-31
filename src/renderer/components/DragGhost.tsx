import React from 'react';
import { PanelType } from '../types/layout';
import { Code, FolderTree, Bot, Terminal } from 'lucide-react';

interface DragGhostProps {
  panelType: PanelType | null;
  position: { x: number; y: number } | null;
  isVisible: boolean;
}

const PANEL_INFO: Record<PanelType, { label: string; icon: React.ReactNode; color: string }> = {
  sidebar: { 
    label: 'Explorer', 
    icon: <FolderTree className="w-5 h-5" />,
    color: 'from-amber-500 to-orange-500'
  },
  editor: { 
    label: 'Editor', 
    icon: <Code className="w-5 h-5" />,
    color: 'from-blue-500 to-cyan-500'
  },
  agent: { 
    label: 'Agent', 
    icon: <Bot className="w-5 h-5" />,
    color: 'from-purple-500 to-pink-500'
  },
  terminal: { 
    label: 'Terminal', 
    icon: <Terminal className="w-5 h-5" />,
    color: 'from-green-500 to-emerald-500'
  },
};

export const DragGhost: React.FC<DragGhostProps> = ({ panelType, position, isVisible }) => {
  if (!isVisible || !panelType || !position) return null;

  const info = PANEL_INFO[panelType];

  return (
    <div
      className="fixed pointer-events-none z-[200] transition-opacity duration-150"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -50%)',
        opacity: isVisible ? 1 : 0,
      }}
    >
      <div className={`
        relative px-6 py-4 rounded-xl
        bg-gradient-to-br ${info.color}
        shadow-2xl backdrop-blur-sm
        flex items-center gap-3
        text-white font-bold
        border-2 border-white/30
        animate-float
      `}>
        {/* Glow effect */}
        <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${info.color} blur-xl opacity-50`} />
        
        {/* Content */}
        <div className="relative z-10 flex items-center gap-3">
          {info.icon}
          <span className="text-lg">{info.label}</span>
        </div>

        {/* Trailing effect */}
        <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-white/20 to-transparent opacity-50 blur-sm" />
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { 
            transform: translate(-50%, -50%) translateY(0px) rotate(0deg);
          }
          50% { 
            transform: translate(-50%, -50%) translateY(-4px) rotate(1deg);
          }
        }
        .animate-float {
          animation: float 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default DragGhost;
