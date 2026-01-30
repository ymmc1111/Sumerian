import React from 'react';
import { PanelSlotId, PanelType } from '../types/layout';
import { useDragPanel } from '../hooks/useDragPanel';
import { useLayoutStore } from '../stores/layoutStore';
import { ExternalLink } from 'lucide-react';

interface PanelHeaderProps {
  title: string;
  panelType: PanelType;
  slotId: PanelSlotId;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  onDoubleClick?: () => void;
  canDetach?: boolean;
}

export const PanelHeader: React.FC<PanelHeaderProps> = ({
  title,
  panelType,
  slotId,
  icon,
  actions,
  onDoubleClick,
  canDetach = true, // Enabled - uses IPC state sync for multi-window support
}) => {
  const { onMouseDown, onDoubleClick: handleDoubleClickReset, isDragging } = useDragPanel();
  const { detachPanel, detachedPanels } = useLayoutStore();
  
  const isDetached = detachedPanels.some(p => p.panelType === panelType);
  
  const handleDetach = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await detachPanel(panelType);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag from the header area, not from action buttons
    if ((e.target as HTMLElement).closest('[data-no-drag]')) {
      return;
    }
    console.log('PanelHeader mouseDown', { panelType, slotId });
    onMouseDown(e, panelType, slotId);
  };

  const handleDoubleClick = () => {
    if (onDoubleClick) {
      onDoubleClick();
    } else {
      handleDoubleClickReset(slotId);
    }
  };

  return (
    <div
      className={`
        h-8 min-h-[32px] flex items-center justify-between
        px-3 select-none
        bg-[#1a1a1a] border-b border-[#2a2a2a]
        ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
      `}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      <div className="flex items-center gap-2 min-w-0">
        {icon && (
          <span className="text-gray-400 flex-shrink-0">
            {icon}
          </span>
        )}
        <span className="text-sm font-medium text-gray-300 truncate">
          {title}
        </span>
      </div>
      
      <div className="flex items-center gap-1 flex-shrink-0" data-no-drag>
        {actions}
        {canDetach && !isDetached && (
          <button
            onClick={handleDetach}
            className="p-1 rounded hover:bg-[#333] text-gray-500 hover:text-gray-300 transition-colors"
            title="Detach to new window (experimental)"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default PanelHeader;
