import { describe, it, expect, beforeEach } from 'vitest';
import { useLayoutStore, PANEL_CONFIGS } from '../../src/renderer/stores/layoutStore';

describe('layoutStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useLayoutStore.getState().resetLayout();
  });

  describe('initial state', () => {
    it('should have standard mode by default', () => {
      const { mode } = useLayoutStore.getState();
      expect(mode).toBe('standard');
    });

    it('should have all four slots defined', () => {
      const { slots } = useLayoutStore.getState();
      expect(slots.A).toBeDefined();
      expect(slots.B).toBeDefined();
      expect(slots.C).toBeDefined();
      expect(slots.D).toBeDefined();
    });

    it('should have correct default panel assignments', () => {
      const { slots } = useLayoutStore.getState();
      expect(slots.A.panelType).toBe('sidebar');
      expect(slots.B.panelType).toBe('editor');
      expect(slots.C.panelType).toBe('agent');
      expect(slots.D.panelType).toBe('terminal');
    });

    it('should have no stacks initially', () => {
      const { stacks } = useLayoutStore.getState();
      expect(stacks).toHaveLength(0);
    });

    it('should not be dragging initially', () => {
      const { isDragging, draggedPanel } = useLayoutStore.getState();
      expect(isDragging).toBe(false);
      expect(draggedPanel).toBeNull();
    });
  });

  describe('layout mode switching', () => {
    it('should switch to hyper-focus mode', () => {
      useLayoutStore.getState().setLayoutMode('hyper-focus');
      const { mode, slots } = useLayoutStore.getState();
      
      expect(mode).toBe('hyper-focus');
      expect(slots.A.isCollapsed).toBe(true);
      expect(slots.C.isCollapsed).toBe(true);
      expect(slots.D.isCollapsed).toBe(true);
    });

    it('should switch to agent-first mode', () => {
      useLayoutStore.getState().setLayoutMode('agent-first');
      const { mode, slots } = useLayoutStore.getState();
      
      expect(mode).toBe('agent-first');
      expect(slots.B.isCollapsed).toBe(false);
      expect(slots.C.isCollapsed).toBe(false);
    });

    it('should cycle through modes correctly', () => {
      const store = useLayoutStore.getState();
      
      expect(store.mode).toBe('standard');
      
      store.cycleLayoutMode();
      expect(useLayoutStore.getState().mode).toBe('hyper-focus');
      
      useLayoutStore.getState().cycleLayoutMode();
      expect(useLayoutStore.getState().mode).toBe('agent-first');
      
      useLayoutStore.getState().cycleLayoutMode();
      expect(useLayoutStore.getState().mode).toBe('standard');
    });

    it('should restore standard mode correctly', () => {
      useLayoutStore.getState().setLayoutMode('hyper-focus');
      useLayoutStore.getState().setLayoutMode('standard');
      
      const { slots } = useLayoutStore.getState();
      expect(slots.A.isCollapsed).toBe(false);
      expect(slots.C.isCollapsed).toBe(false);
      expect(slots.D.isCollapsed).toBe(false);
    });
  });

  describe('panel manipulation', () => {
    it('should move panel to new slot', () => {
      useLayoutStore.getState().movePanel('sidebar', 'C');
      const { slots } = useLayoutStore.getState();
      
      expect(slots.C.panelType).toBe('sidebar');
      expect(slots.A.panelType).toBe('agent');
    });

    it('should resize slot within constraints', () => {
      useLayoutStore.getState().resizeSlot('A', 300, 100);
      const { slots } = useLayoutStore.getState();
      
      expect(slots.A.width).toBe(300);
    });

    it('should enforce minimum width constraint', () => {
      const minWidth = PANEL_CONFIGS.sidebar.constraints.minWidth;
      useLayoutStore.getState().resizeSlot('A', 50, 100);
      const { slots } = useLayoutStore.getState();
      
      expect(slots.A.width).toBe(minWidth);
    });

    it('should enforce maximum width constraint', () => {
      const maxWidth = PANEL_CONFIGS.sidebar.constraints.maxWidth;
      useLayoutStore.getState().resizeSlot('A', 1000, 100);
      const { slots } = useLayoutStore.getState();
      
      expect(slots.A.width).toBe(maxWidth);
    });

    it('should collapse slot', () => {
      useLayoutStore.getState().collapseSlot('A');
      const { slots } = useLayoutStore.getState();
      
      expect(slots.A.isCollapsed).toBe(true);
    });

    it('should not collapse non-collapsible panel', () => {
      useLayoutStore.getState().collapseSlot('B'); // Editor can't collapse
      const { slots } = useLayoutStore.getState();
      
      expect(slots.B.isCollapsed).toBe(false);
    });

    it('should expand collapsed slot', () => {
      useLayoutStore.getState().collapseSlot('A');
      useLayoutStore.getState().expandSlot('A');
      const { slots } = useLayoutStore.getState();
      
      expect(slots.A.isCollapsed).toBe(false);
    });

    it('should toggle slot collapse', () => {
      useLayoutStore.getState().toggleSlotCollapse('A');
      expect(useLayoutStore.getState().slots.A.isCollapsed).toBe(true);
      
      useLayoutStore.getState().toggleSlotCollapse('A');
      expect(useLayoutStore.getState().slots.A.isCollapsed).toBe(false);
    });
  });

  describe('drag state', () => {
    it('should set dragging state', () => {
      useLayoutStore.getState().setDragging(true, 'sidebar');
      const { isDragging, draggedPanel } = useLayoutStore.getState();
      
      expect(isDragging).toBe(true);
      expect(draggedPanel).toBe('sidebar');
    });

    it('should clear dragging state', () => {
      useLayoutStore.getState().setDragging(true, 'sidebar');
      useLayoutStore.getState().setDragging(false, null);
      const { isDragging, draggedPanel } = useLayoutStore.getState();
      
      expect(isDragging).toBe(false);
      expect(draggedPanel).toBeNull();
    });
  });

  describe('panel stacking', () => {
    it('should stack panel onto another', () => {
      useLayoutStore.getState().stackPanel('terminal', 'C');
      const { stacks } = useLayoutStore.getState();
      
      expect(stacks).toHaveLength(1);
      expect(stacks[0].slotId).toBe('C');
      expect(stacks[0].panels).toContain('agent');
      expect(stacks[0].panels).toContain('terminal');
    });

    it('should set active index when stacking', () => {
      useLayoutStore.getState().stackPanel('terminal', 'C');
      const { stacks } = useLayoutStore.getState();
      
      expect(stacks[0].activeIndex).toBe(1);
    });

    it('should unstack panel', () => {
      useLayoutStore.getState().stackPanel('terminal', 'C');
      useLayoutStore.getState().unstackPanel('terminal');
      const { stacks } = useLayoutStore.getState();
      
      expect(stacks).toHaveLength(0);
    });

    it('should set active stack panel', () => {
      useLayoutStore.getState().stackPanel('terminal', 'C');
      useLayoutStore.getState().setActiveStackPanel('C', 0);
      const { stacks } = useLayoutStore.getState();
      
      expect(stacks[0].activeIndex).toBe(0);
    });
  });

  describe('reset', () => {
    it('should reset to default state', () => {
      // Make some changes
      useLayoutStore.getState().setLayoutMode('hyper-focus');
      useLayoutStore.getState().stackPanel('terminal', 'C');
      useLayoutStore.getState().setDragging(true, 'sidebar');
      
      // Reset
      useLayoutStore.getState().resetLayout();
      
      const state = useLayoutStore.getState();
      expect(state.mode).toBe('standard');
      expect(state.stacks).toHaveLength(0);
      expect(state.isDragging).toBe(false);
      expect(state.slots.A.panelType).toBe('sidebar');
    });
  });
});

describe('PANEL_CONFIGS', () => {
  it('should have configs for all panel types', () => {
    expect(PANEL_CONFIGS.sidebar).toBeDefined();
    expect(PANEL_CONFIGS.editor).toBeDefined();
    expect(PANEL_CONFIGS.agent).toBeDefined();
    expect(PANEL_CONFIGS.terminal).toBeDefined();
  });

  it('should have valid constraints', () => {
    for (const config of Object.values(PANEL_CONFIGS)) {
      expect(config.constraints.minWidth).toBeGreaterThanOrEqual(0);
      expect(config.constraints.maxWidth).toBeGreaterThan(config.constraints.minWidth);
      expect(config.constraints.minHeight).toBeGreaterThanOrEqual(0);
    }
  });

  it('should mark editor as non-collapsible', () => {
    expect(PANEL_CONFIGS.editor.canCollapse).toBe(false);
  });

  it('should mark sidebar as non-stackable', () => {
    expect(PANEL_CONFIGS.sidebar.canStack).toBe(false);
  });
});
