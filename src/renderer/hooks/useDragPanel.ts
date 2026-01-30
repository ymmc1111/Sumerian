import { useCallback, useRef, useState } from 'react';
import { PanelSlotId, PanelType } from '../types/layout';
import { useLayoutStore } from '../stores/layoutStore';
import { calculateSnapPosition, Point, Rect, SnapTarget } from '../utils/snapRegions';

const DRAG_THRESHOLD = 5;

export interface DragState {
  isDragging: boolean;
  startPoint: Point | null;
  currentPoint: Point | null;
  snapTarget: SnapTarget | null;
  panelType: PanelType | null;
  slotId: PanelSlotId | null;
}

export interface UseDragPanelOptions {
  onDragStart?: (panelType: PanelType, slotId: PanelSlotId) => void;
  onDragMove?: (point: Point, snapTarget: SnapTarget | null) => void;
  onDragEnd?: (panelType: PanelType, targetSlot: PanelSlotId | null) => void;
}

export function useDragPanel(options: UseDragPanelOptions = {}) {
  const { onDragStart, onDragMove, onDragEnd } = options;
  
  const { slots, setDragging, movePanel, stackPanel } = useLayoutStore();
  
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startPoint: null,
    currentPoint: null,
    snapTarget: null,
    panelType: null,
    slotId: null,
  });
  
  const dragRef = useRef<{
    panelType: PanelType;
    slotId: PanelSlotId;
    startPoint: Point;
    hasMoved: boolean;
    snapTarget: SnapTarget | null;
  } | null>(null);

  const getViewport = useCallback((): Rect => {
    return {
      x: 0,
      y: 0,
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }, []);

  const handleMouseDown = useCallback((
    e: React.MouseEvent,
    panelType: PanelType,
    slotId: PanelSlotId
  ) => {
    e.preventDefault();
    
    const startPoint = { x: e.clientX, y: e.clientY };
    
    dragRef.current = {
      panelType,
      slotId,
      startPoint,
      hasMoved: false,
      snapTarget: null,
    };
    
    setDragState({
      isDragging: false,
      startPoint,
      currentPoint: startPoint,
      snapTarget: null,
      panelType,
      slotId,
    });
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragRef.current) return;
    
    const currentPoint = { x: e.clientX, y: e.clientY };
    const { startPoint, panelType, slotId, hasMoved } = dragRef.current;
    
    // Check if we've exceeded the drag threshold
    const dx = Math.abs(currentPoint.x - startPoint.x);
    const dy = Math.abs(currentPoint.y - startPoint.y);
    
    if (!hasMoved && (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD)) {
      dragRef.current.hasMoved = true;
      setDragging(true, panelType);
      onDragStart?.(panelType, slotId);
      
      // Set cursor
      document.body.style.cursor = 'grabbing';
    }
    
    if (dragRef.current.hasMoved) {
      const viewport = getViewport();
      const { position, target } = calculateSnapPosition(
        currentPoint,
        slotId,
        slots,
        viewport
      );
      
      // Store snapTarget in ref for mouseUp handler
      dragRef.current.snapTarget = target;
      
      console.log('handleMouseMove', { currentPoint, target });
      
      setDragState(prev => ({
        ...prev,
        isDragging: true,
        currentPoint: position,
        snapTarget: target,
      }));
      
      onDragMove?.(position, target);
    }
  }, [slots, setDragging, onDragStart, onDragMove, getViewport]);

  const handleMouseUp = useCallback(() => {
    if (!dragRef.current) return;
    
    const { panelType, slotId, hasMoved, snapTarget } = dragRef.current;
    
    console.log('handleMouseUp', { panelType, slotId, hasMoved, snapTarget });
    
    if (hasMoved && snapTarget) {
      // Move panel to new slot (swap positions)
      if (snapTarget.slotId !== slotId) {
        console.log('Calling movePanel', { panelType, targetSlot: snapTarget.slotId });
        movePanel(panelType, snapTarget.slotId);
      }
      
      onDragEnd?.(panelType, snapTarget.slotId);
    } else {
      onDragEnd?.(panelType, null);
    }
    
    // Reset
    dragRef.current = null;
    setDragging(false, null);
    document.body.style.cursor = '';
    
    setDragState({
      isDragging: false,
      startPoint: null,
      currentPoint: null,
      snapTarget: null,
      panelType: null,
      slotId: null,
    });
  }, [setDragging, movePanel, stackPanel, onDragEnd]);

  const handleDoubleClick = useCallback((slotId: PanelSlotId) => {
    // Reset panel to default position
    const { resetLayout } = useLayoutStore.getState();
    resetLayout();
  }, []);

  // Attach global listeners when drag starts
  const startDragListeners = useCallback(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove, handleMouseUp]);

  const stopDragListeners = useCallback(() => {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove, handleMouseUp]);

  // Combined mouse down handler that sets up listeners
  const onMouseDown = useCallback((
    e: React.MouseEvent,
    panelType: PanelType,
    slotId: PanelSlotId
  ) => {
    handleMouseDown(e, panelType, slotId);
    startDragListeners();
    
    // Cleanup on mouse up
    const cleanup = () => {
      stopDragListeners();
      window.removeEventListener('mouseup', cleanup);
    };
    window.addEventListener('mouseup', cleanup);
  }, [handleMouseDown, startDragListeners, stopDragListeners]);

  return {
    dragState,
    onMouseDown,
    onDoubleClick: handleDoubleClick,
    isDragging: dragState.isDragging,
    snapTarget: dragState.snapTarget,
  };
}

export { DRAG_THRESHOLD };
