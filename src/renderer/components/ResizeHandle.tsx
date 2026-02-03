import React, { useCallback, useRef, useState, useEffect } from 'react';
import { PanelSlotId } from '../types/layout';
import { useLayoutStore, PANEL_CONFIGS } from '../stores/layoutStore';

export type ResizeDirection = 'horizontal' | 'vertical' | 'both';

interface ResizeHandleProps {
  slotId: PanelSlotId;
  direction: ResizeDirection;
  position: 'left' | 'right' | 'top' | 'bottom';
  className?: string;
}

export const ResizeHandle: React.FC<ResizeHandleProps> = ({
  slotId,
  direction,
  position,
  className = '',
}) => {
  const { slots, resizeSlot } = useLayoutStore();
  const [isResizing, setIsResizing] = useState(false);
  const startRef = useRef<{ x: number; y: number; width: number; height: number; containerHeight?: number } | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);

  const slot = slots[slotId];
  const config = PANEL_CONFIGS[slot.panelType];

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();

    // Get the container element for ratio calculations (slot D)
    const target = e.target as HTMLElement;
    const container = target.closest('.flex-col') as HTMLElement;
    containerRef.current = container;

    startRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: slot.width,
      height: slot.height,
      containerHeight: container?.clientHeight,
    };

    setIsResizing(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!startRef.current) return;

      const deltaX = moveEvent.clientX - startRef.current.x;
      const deltaY = moveEvent.clientY - startRef.current.y;

      let newWidth = startRef.current.width;
      let newHeight = startRef.current.height;

      if (direction === 'horizontal' || direction === 'both') {
        if (position === 'right') {
          newWidth = startRef.current.width + deltaX;
        } else if (position === 'left') {
          newWidth = startRef.current.width - deltaX;
        }

        // Apply constraints
        newWidth = Math.max(config.constraints.minWidth, Math.min(config.constraints.maxWidth, newWidth));
      }

      if (direction === 'vertical' || direction === 'both') {
        if (slotId === 'D' && startRef.current.containerHeight) {
          // For slot D, convert pixel delta to ratio
          const deltaRatio = deltaY / startRef.current.containerHeight;
          if (position === 'bottom') {
            newHeight = startRef.current.height + deltaRatio;
          } else if (position === 'top') {
            // Dragging the top handle up decreases terminal height (increases editor)
            newHeight = startRef.current.height - deltaRatio;
          }
          // Clamp ratio between 0.1 and 0.8 (10% to 80%)
          newHeight = Math.max(0.1, Math.min(0.8, newHeight));
        } else {
          // Legacy pixel-based for other slots
          if (position === 'bottom') {
            newHeight = startRef.current.height + deltaY;
          } else if (position === 'top') {
            newHeight = startRef.current.height - deltaY;
          }
          // Apply constraints
          newHeight = Math.max(config.constraints.minHeight, Math.min(config.constraints.maxHeight, newHeight));
        }
      }

      resizeSlot(slotId, newWidth, newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      startRef.current = null;
      containerRef.current = null;
      document.body.style.cursor = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    // Set cursor based on direction
    if (direction === 'horizontal') {
      document.body.style.cursor = 'col-resize';
    } else if (direction === 'vertical') {
      document.body.style.cursor = 'row-resize';
    } else {
      document.body.style.cursor = position === 'right' || position === 'left' ? 'col-resize' : 'row-resize';
    }

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [slot, slotId, direction, position, config, resizeSlot]);

  const getCursor = () => {
    if (direction === 'horizontal') return 'cursor-col-resize';
    if (direction === 'vertical') return 'cursor-row-resize';
    return position === 'right' || position === 'left' ? 'cursor-col-resize' : 'cursor-row-resize';
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'left':
        return 'left-0 top-0 w-[2px] h-full -translate-x-1/2';
      case 'right':
        return 'right-0 top-0 w-[2px] h-full translate-x-1/2';
      case 'top':
        return 'top-0 left-0 h-[2px] w-full -translate-y-1/2';
      case 'bottom':
        return 'bottom-0 left-0 h-[2px] w-full translate-y-1/2';
    }
  };

  return (
    <div
      className={`
        absolute z-20
        ${getPositionClasses()}
        ${getCursor()}
        ${isResizing ? 'bg-[#2563eb]' : 'bg-transparent hover:bg-[#3b82f6]'}
        transition-all duration-150
        ${isResizing ? 'shadow-[0_0_10px_rgba(37,99,235,0.5)]' : ''}
        ${className}
      `}
      onMouseDown={handleMouseDown}
    >
      {/* Larger hit area - 6px */}
      <div className={`
        absolute
        ${direction === 'horizontal' ? 'w-[6px] h-full -left-[2px]' : 'h-[6px] w-full -top-[2px]'}
      `} />
    </div>
  );
};

export default ResizeHandle;
