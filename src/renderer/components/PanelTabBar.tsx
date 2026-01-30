import React from 'react';
import { PanelSlotId, PanelType } from '../types/layout';
import { useLayoutStore } from '../stores/layoutStore';
import { useDragPanel } from '../hooks/useDragPanel';

const PANEL_LABELS: Record<PanelType, { label: string; icon: string }> = {
  sidebar: { label: 'Files', icon: '📁' },
  editor: { label: 'Editor', icon: '📝' },
  agent: { label: 'Agent', icon: '🤖' },
  terminal: { label: 'Terminal', icon: '⌨️' },
};

interface PanelTabBarProps {
  slotId: PanelSlotId;
  className?: string;
}

export const PanelTabBar: React.FC<PanelTabBarProps> = ({ slotId, className = '' }) => {
  const { stacks, setActiveStackPanel, unstackPanel } = useLayoutStore();
  const { onMouseDown } = useDragPanel();

  const stack = stacks.find(s => s.slotId === slotId);
  
  if (!stack || stack.panels.length <= 1) {
    return null;
  }

  return (
    <div className={`
      flex items-center h-8 min-h-[32px]
      bg-[#141414] border-b border-[#2a2a2a]
      overflow-x-auto
      ${className}
    `}>
      {stack.panels.map((panelType, index) => {
        const info = PANEL_LABELS[panelType];
        const isActive = index === stack.activeIndex;

        return (
          <button
            key={panelType}
            onClick={() => setActiveStackPanel(slotId, index)}
            onMouseDown={(e) => {
              // Allow dragging tabs out to unstack
              if (e.button === 0 && stack.panels.length > 1) {
                onMouseDown(e, panelType, slotId);
              }
            }}
            className={`
              flex items-center gap-1.5 px-3 h-full
              text-sm whitespace-nowrap
              border-r border-[#2a2a2a]
              transition-colors duration-150
              ${isActive 
                ? 'bg-[#1a1a1a] text-gray-200 border-b-2 border-b-blue-500' 
                : 'text-gray-400 hover:text-gray-300 hover:bg-[#1a1a1a]/50'
              }
            `}
          >
            <span className="text-xs">{info.icon}</span>
            <span>{info.label}</span>
            
            {/* Close/unstack button */}
            {stack.panels.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  unstackPanel(panelType);
                }}
                className="
                  ml-1 w-4 h-4 flex items-center justify-center
                  text-gray-500 hover:text-gray-300
                  hover:bg-[#333] rounded
                  transition-colors duration-150
                "
                title="Unstack panel"
              >
                ×
              </button>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default PanelTabBar;
