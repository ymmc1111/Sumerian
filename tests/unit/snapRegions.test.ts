import { describe, it, expect } from 'vitest';
import {
  findViewportSnapTargets,
  findPanelSnapTargets,
  findClosestSnapTarget,
  calculateSnapPosition,
  SNAP_THRESHOLD,
  Point,
  Rect,
} from '../../src/renderer/utils/snapRegions';
import { PanelSlot, PanelSlotId } from '../../src/renderer/types/layout';

describe('snapRegions', () => {
  const viewport: Rect = { x: 0, y: 0, width: 1920, height: 1080 };

  const mockSlots: Record<PanelSlotId, PanelSlot> = {
    A: { id: 'A', panelType: 'sidebar', x: 0, y: 0, width: 13.5, height: 100, isCollapsed: false, zIndex: 1 },
    B: { id: 'B', panelType: 'editor', x: 13.5, y: 0, width: 66.5, height: 70, isCollapsed: false, zIndex: 1 },
    C: { id: 'C', panelType: 'agent', x: 80, y: 0, width: 20, height: 100, isCollapsed: false, zIndex: 1 },
    D: { id: 'D', panelType: 'terminal', x: 13.5, y: 70, width: 66.5, height: 30, isCollapsed: false, zIndex: 1 },
  };

  describe('SNAP_THRESHOLD', () => {
    it('should be 40px', () => {
      expect(SNAP_THRESHOLD).toBe(40);
    });
  });

  describe('findViewportSnapTargets', () => {
    it('should detect left edge snap', () => {
      const point: Point = { x: 20, y: 500 };
      const targets = findViewportSnapTargets(point, viewport);
      
      const leftTarget = targets.find(t => t.edge === 'left');
      expect(leftTarget).toBeDefined();
      expect(leftTarget?.slotId).toBe('A');
      expect(leftTarget?.distance).toBe(20);
    });

    it('should detect right edge snap', () => {
      const point: Point = { x: 1900, y: 500 };
      const targets = findViewportSnapTargets(point, viewport);
      
      const rightTarget = targets.find(t => t.edge === 'right');
      expect(rightTarget).toBeDefined();
      expect(rightTarget?.slotId).toBe('C');
    });

    it('should detect top edge snap', () => {
      const point: Point = { x: 500, y: 30 };
      const targets = findViewportSnapTargets(point, viewport);
      
      const topTarget = targets.find(t => t.edge === 'top');
      expect(topTarget).toBeDefined();
      expect(topTarget?.slotId).toBe('B');
    });

    it('should detect bottom edge snap', () => {
      const point: Point = { x: 500, y: 1060 };
      const targets = findViewportSnapTargets(point, viewport);
      
      const bottomTarget = targets.find(t => t.edge === 'bottom');
      expect(bottomTarget).toBeDefined();
      expect(bottomTarget?.slotId).toBe('D');
    });

    it('should return empty array when not near any edge', () => {
      const point: Point = { x: 500, y: 500 };
      const targets = findViewportSnapTargets(point, viewport);
      
      expect(targets).toHaveLength(0);
    });

    it('should detect multiple edges when in corner', () => {
      const point: Point = { x: 20, y: 30 };
      const targets = findViewportSnapTargets(point, viewport);
      
      expect(targets.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('findPanelSnapTargets', () => {
    it('should find snap targets from other panels', () => {
      const point: Point = { x: 260, y: 400 }; // Near sidebar right edge
      const targets = findPanelSnapTargets(point, 'B', mockSlots, viewport);
      
      expect(targets.length).toBeGreaterThan(0);
    });

    it('should not include dragged panel in targets', () => {
      const point: Point = { x: 100, y: 400 };
      const targets = findPanelSnapTargets(point, 'A', mockSlots, viewport);
      
      const selfTarget = targets.find(t => t.slotId === 'A');
      expect(selfTarget).toBeUndefined();
    });

    it('should skip collapsed panels', () => {
      const collapsedSlots = {
        ...mockSlots,
        C: { ...mockSlots.C, isCollapsed: true },
      };
      
      const point: Point = { x: 1536, y: 400 }; // Near agent panel
      const targets = findPanelSnapTargets(point, 'B', collapsedSlots, viewport);
      
      const agentTarget = targets.find(t => t.slotId === 'C');
      expect(agentTarget).toBeUndefined();
    });

    it('should detect center for stacking', () => {
      // Point near center of agent panel
      const agentCenterX = (mockSlots.C.x / 100) * viewport.width + ((mockSlots.C.width / 100) * viewport.width) / 2;
      const agentCenterY = viewport.height / 2;
      
      const point: Point = { x: agentCenterX, y: agentCenterY };
      const targets = findPanelSnapTargets(point, 'B', mockSlots, viewport);
      
      const centerTarget = targets.find(t => t.edge === 'center' && t.slotId === 'C');
      expect(centerTarget).toBeDefined();
    });
  });

  describe('findClosestSnapTarget', () => {
    it('should return closest target', () => {
      const point: Point = { x: 10, y: 500 };
      const target = findClosestSnapTarget(point, 'B', mockSlots, viewport);
      
      expect(target).not.toBeNull();
      expect(target?.distance).toBeLessThanOrEqual(SNAP_THRESHOLD);
    });

    it('should return null when no targets in range', () => {
      const point: Point = { x: 500, y: 500 };
      const target = findClosestSnapTarget(point, 'B', mockSlots, viewport);
      
      expect(target).toBeNull();
    });

    it('should prefer closer targets', () => {
      // Point equidistant from two edges but closer to left
      const point: Point = { x: 15, y: 500 };
      const target = findClosestSnapTarget(point, 'B', mockSlots, viewport);
      
      expect(target?.edge).toBe('left');
    });
  });

  describe('calculateSnapPosition', () => {
    it('should return snap point when target found', () => {
      const point: Point = { x: 20, y: 500 };
      const result = calculateSnapPosition(point, 'B', mockSlots, viewport);
      
      expect(result.target).not.toBeNull();
      expect(result.position.x).toBe(0); // Snapped to left edge
    });

    it('should return original point when no target', () => {
      const point: Point = { x: 500, y: 500 };
      const result = calculateSnapPosition(point, 'B', mockSlots, viewport);
      
      expect(result.target).toBeNull();
      expect(result.position).toEqual(point);
    });
  });
});
