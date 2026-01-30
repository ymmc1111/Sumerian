import { PanelSlot, PanelSlotId } from '../types/layout';

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SnapTarget {
  slotId: PanelSlotId;
  edge: 'left' | 'right' | 'top' | 'bottom' | 'center';
  distance: number;
  snapPoint: Point;
}

const SNAP_THRESHOLD = 40;

// Calculate distance between two points
function distance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

// Get edges of a rectangle
function getEdges(rect: Rect): { left: number; right: number; top: number; bottom: number; centerX: number; centerY: number } {
  return {
    left: rect.x,
    right: rect.x + rect.width,
    top: rect.y,
    bottom: rect.y + rect.height,
    centerX: rect.x + rect.width / 2,
    centerY: rect.y + rect.height / 2,
  };
}

// Check if point is within snap threshold of an edge
function isWithinThreshold(value: number, target: number, threshold = SNAP_THRESHOLD): boolean {
  return Math.abs(value - target) <= threshold;
}

// Find snap targets for viewport edges
export function findViewportSnapTargets(
  dragPoint: Point,
  viewport: Rect
): SnapTarget[] {
  const targets: SnapTarget[] = [];
  const edges = getEdges(viewport);

  // Left edge
  if (isWithinThreshold(dragPoint.x, edges.left)) {
    targets.push({
      slotId: 'A',
      edge: 'left',
      distance: Math.abs(dragPoint.x - edges.left),
      snapPoint: { x: edges.left, y: dragPoint.y },
    });
  }

  // Right edge
  if (isWithinThreshold(dragPoint.x, edges.right)) {
    targets.push({
      slotId: 'C',
      edge: 'right',
      distance: Math.abs(dragPoint.x - edges.right),
      snapPoint: { x: edges.right, y: dragPoint.y },
    });
  }

  // Top edge
  if (isWithinThreshold(dragPoint.y, edges.top)) {
    targets.push({
      slotId: 'B',
      edge: 'top',
      distance: Math.abs(dragPoint.y - edges.top),
      snapPoint: { x: dragPoint.x, y: edges.top },
    });
  }

  // Bottom edge
  if (isWithinThreshold(dragPoint.y, edges.bottom)) {
    targets.push({
      slotId: 'D',
      edge: 'bottom',
      distance: Math.abs(dragPoint.y - edges.bottom),
      snapPoint: { x: dragPoint.x, y: edges.bottom },
    });
  }

  return targets;
}

// Find snap targets for panel-to-panel snapping
export function findPanelSnapTargets(
  dragPoint: Point,
  draggedSlotId: PanelSlotId,
  slots: Record<PanelSlotId, PanelSlot>,
  viewport: Rect
): SnapTarget[] {
  const targets: SnapTarget[] = [];

  for (const [slotId, slot] of Object.entries(slots) as [PanelSlotId, PanelSlot][]) {
    if (slotId === draggedSlotId || slot.isCollapsed) continue;

    // Slot dimensions are stored as pixels, not percentages
    // Calculate approximate positions based on slot layout
    let slotRect: Rect;
    
    switch (slotId) {
      case 'A': // Sidebar - left
        slotRect = {
          x: 0,
          y: 0,
          width: slot.width || 260,
          height: viewport.height,
        };
        break;
      case 'B': // Editor - center
        slotRect = {
          x: slots.A.width || 260,
          y: 0,
          width: viewport.width - (slots.A.width || 260) - (slots.C.width || 380),
          height: viewport.height - (slots.D.height || 200),
        };
        break;
      case 'C': // Agent - right
        slotRect = {
          x: viewport.width - (slot.width || 380),
          y: 0,
          width: slot.width || 380,
          height: viewport.height - (slots.D.height || 200),
        };
        break;
      case 'D': // Terminal - bottom
        slotRect = {
          x: slots.A.width || 260,
          y: viewport.height - (slot.height || 200),
          width: viewport.width - (slots.A.width || 260),
          height: slot.height || 200,
        };
        break;
      default:
        continue;
    }

    const edges = getEdges(slotRect);

    // Check each edge
    if (isWithinThreshold(dragPoint.x, edges.left)) {
      targets.push({
        slotId,
        edge: 'left',
        distance: Math.abs(dragPoint.x - edges.left),
        snapPoint: { x: edges.left, y: dragPoint.y },
      });
    }

    if (isWithinThreshold(dragPoint.x, edges.right)) {
      targets.push({
        slotId,
        edge: 'right',
        distance: Math.abs(dragPoint.x - edges.right),
        snapPoint: { x: edges.right, y: dragPoint.y },
      });
    }

    if (isWithinThreshold(dragPoint.y, edges.top)) {
      targets.push({
        slotId,
        edge: 'top',
        distance: Math.abs(dragPoint.y - edges.top),
        snapPoint: { x: dragPoint.x, y: edges.top },
      });
    }

    if (isWithinThreshold(dragPoint.y, edges.bottom)) {
      targets.push({
        slotId,
        edge: 'bottom',
        distance: Math.abs(dragPoint.y - edges.bottom),
        snapPoint: { x: dragPoint.x, y: edges.bottom },
      });
    }

    // Center detection for stacking
    const centerDist = distance(dragPoint, { x: edges.centerX, y: edges.centerY });
    if (centerDist <= SNAP_THRESHOLD * 2) {
      targets.push({
        slotId,
        edge: 'center',
        distance: centerDist,
        snapPoint: { x: edges.centerX, y: edges.centerY },
      });
    }
  }

  return targets;
}

// Find the closest snap target from all available targets
export function findClosestSnapTarget(
  dragPoint: Point,
  draggedSlotId: PanelSlotId,
  slots: Record<PanelSlotId, PanelSlot>,
  viewport: Rect
): SnapTarget | null {
  const viewportTargets = findViewportSnapTargets(dragPoint, viewport);
  const panelTargets = findPanelSnapTargets(dragPoint, draggedSlotId, slots, viewport);
  
  const allTargets = [...viewportTargets, ...panelTargets];
  
  if (allTargets.length === 0) return null;
  
  // Sort by distance and return closest
  allTargets.sort((a, b) => a.distance - b.distance);
  return allTargets[0];
}

// Calculate snap position for a panel being dragged
export function calculateSnapPosition(
  dragPoint: Point,
  draggedSlotId: PanelSlotId,
  slots: Record<PanelSlotId, PanelSlot>,
  viewport: Rect
): { position: Point; target: SnapTarget | null } {
  // Simple approach: determine which slot the cursor is over based on screen regions
  const titleBarHeight = 40;
  const sidebarWidth = slots.A.isCollapsed ? 4 : (slots.A.width || 260);
  const agentWidth = slots.C.isCollapsed ? 4 : (slots.C.width || 380);
  const terminalHeight = slots.D.isCollapsed ? 4 : 200;
  
  const x = dragPoint.x;
  const y = dragPoint.y;
  
  let targetSlotId: PanelSlotId | null = null;
  
  // Check which region the cursor is in
  if (x < sidebarWidth && y > titleBarHeight) {
    targetSlotId = 'A'; // Sidebar region
  } else if (x > viewport.width - agentWidth && y > titleBarHeight && y < viewport.height - terminalHeight) {
    targetSlotId = 'C'; // Agent region
  } else if (y > viewport.height - terminalHeight && x > sidebarWidth) {
    targetSlotId = 'D'; // Terminal region
  } else if (x >= sidebarWidth && x <= viewport.width - agentWidth && y > titleBarHeight && y < viewport.height - terminalHeight) {
    targetSlotId = 'B'; // Editor region
  }
  
  // Don't snap to the slot we're dragging from
  if (targetSlotId && targetSlotId !== draggedSlotId) {
    return {
      position: dragPoint,
      target: {
        slotId: targetSlotId,
        edge: 'center',
        distance: 0,
        snapPoint: dragPoint,
      },
    };
  }
  
  return { position: dragPoint, target: null };
}

export { SNAP_THRESHOLD };
