import { useCallback, useRef, useState } from 'react';
import { PanelSlotId } from '../types/layout';
import { useLayoutStore, PANEL_CONFIGS } from '../stores/layoutStore';

export type ResizeDirection = 'horizontal' | 'vertical';

export interface ResizeState {
  isResizing: boolean;
  slotId: PanelSlotId | null;
  direction: ResizeDirection | null;
}

export interface UseResizePanelOptions {
  onResizeStart?: (slotId: PanelSlotId, direction: ResizeDirection) => void;
  onResizeMove?: (slotId: PanelSlotId, width: number, height: number) => void;
  onResizeEnd?: (slotId: PanelSlotId) => void;
}

export function useResizePanel(options: UseResizePanelOptions = {}) {
  const { onResizeStart, onResizeMove, onResizeEnd } = options;
  
  const { slots, resizeSlot } = useLayoutStore();
  
  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false,
    slotId: null,
    direction: null,
  });
  
  const startRef = useRef<{
    x: number;
    y: number;
    width: number;
    height: number;
    slotId: PanelSlotId;
    direction: ResizeDirection;
  } | null>(null);

  const startResize = useCallback((
    e: React.MouseEvent,
    slotId: PanelSlotId,
    direction: ResizeDirection
  ) => {
    e.preventDefault();
    
    const slot = slots[slotId];
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    
    startRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: slot.width > 0 ? (slot.width / 100) * viewport.width : viewport.width,
      height: slot.height > 0 ? (slot.height / 100) * viewport.height : viewport.height,
      slotId,
      direction,
    };
    
    setResizeState({
      isResizing: true,
      slotId,
      direction,
    });
    
    onResizeStart?.(slotId, direction);
    
    // Set cursor
    document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
  }, [slots, onResizeStart]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!startRef.current) return;
    
    const { x, y, width, height, slotId, direction } = startRef.current;
    const slot = slots[slotId];
    const config = PANEL_CONFIGS[slot.panelType];
    
    const deltaX = e.clientX - x;
    const deltaY = e.clientY - y;
    
    let newWidth = width;
    let newHeight = height;
    
    if (direction === 'horizontal') {
      newWidth = width + deltaX;
      newWidth = Math.max(config.constraints.minWidth, Math.min(config.constraints.maxWidth, newWidth));
    } else {
      newHeight = height + deltaY;
      newHeight = Math.max(config.constraints.minHeight, Math.min(config.constraints.maxHeight, newHeight));
    }
    
    resizeSlot(slotId, newWidth, newHeight);
    onResizeMove?.(slotId, newWidth, newHeight);
  }, [slots, resizeSlot, onResizeMove]);

  const handleMouseUp = useCallback(() => {
    if (!startRef.current) return;
    
    const { slotId } = startRef.current;
    
    onResizeEnd?.(slotId);
    
    startRef.current = null;
    document.body.style.cursor = '';
    
    setResizeState({
      isResizing: false,
      slotId: null,
      direction: null,
    });
  }, [onResizeEnd]);

  // Attach global listeners
  const attachListeners = useCallback(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove, handleMouseUp]);

  const detachListeners = useCallback(() => {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove, handleMouseUp]);

  const onMouseDown = useCallback((
    e: React.MouseEvent,
    slotId: PanelSlotId,
    direction: ResizeDirection
  ) => {
    startResize(e, slotId, direction);
    attachListeners();
    
    const cleanup = () => {
      detachListeners();
      window.removeEventListener('mouseup', cleanup);
    };
    window.addEventListener('mouseup', cleanup);
  }, [startResize, attachListeners, detachListeners]);

  return {
    resizeState,
    onMouseDown,
    isResizing: resizeState.isResizing,
  };
}
