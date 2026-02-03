import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  DetachedPanel,
  LayoutMode,
  LayoutState,
  PanelConfig,
  PanelSlot,
  PanelSlotId,
  PanelStack,
  PanelType,
} from '../types/layout';
import { useAppStore } from './useAppStore';

// Default panel configurations
export const PANEL_CONFIGS: Record<PanelType, PanelConfig> = {
  sidebar: {
    type: 'sidebar',
    defaultSlot: 'A',
    constraints: { minWidth: 200, maxWidth: 400, minHeight: 0, maxHeight: Infinity },
    canCollapse: true,
    canStack: false,
  },
  editor: {
    type: 'editor',
    defaultSlot: 'B',
    constraints: { minWidth: 300, maxWidth: Infinity, minHeight: 200, maxHeight: Infinity },
    canCollapse: false,
    canStack: true,
  },
  agent: {
    type: 'agent',
    defaultSlot: 'C',
    constraints: { minWidth: 320, maxWidth: Infinity, minHeight: 200, maxHeight: Infinity },
    canCollapse: true,
    canStack: true,
  },
  terminal: {
    type: 'terminal',
    defaultSlot: 'D',
    constraints: { minWidth: 0, maxWidth: Infinity, minHeight: 100, maxHeight: Infinity },
    canCollapse: true,
    canStack: true,
  },
};

// Default slot configurations for standard layout
const createDefaultSlots = (): Record<PanelSlotId, PanelSlot> => ({
  A: { id: 'A', panelType: 'sidebar', x: 0, y: 0, width: 260, height: 100, isCollapsed: false, zIndex: 1 },
  B: { id: 'B', panelType: 'editor', x: 260, y: 0, width: 0, height: 70, isCollapsed: false, zIndex: 1 },
  C: { id: 'C', panelType: 'agent', x: 0, y: 0, width: 420, height: 100, isCollapsed: false, zIndex: 1 },
  D: { id: 'D', panelType: 'terminal', x: 260, y: 70, width: 0, height: 300, isCollapsed: false, zIndex: 1 },
});

interface LayoutActions {
  // Mode switching
  setLayoutMode: (mode: LayoutMode) => void;
  cycleLayoutMode: () => void;

  // Panel manipulation
  movePanel: (panelType: PanelType, targetSlot: PanelSlotId) => void;
  resizeSlot: (slotId: PanelSlotId, width: number, height: number) => void;
  collapseSlot: (slotId: PanelSlotId) => void;
  expandSlot: (slotId: PanelSlotId) => void;
  toggleSlotCollapse: (slotId: PanelSlotId) => void;

  // Drag state
  setDragging: (isDragging: boolean, panelType?: PanelType | null) => void;

  // Stacking
  stackPanel: (panelType: PanelType, targetSlot: PanelSlotId) => void;
  unstackPanel: (panelType: PanelType) => void;
  setActiveStackPanel: (slotId: PanelSlotId, index: number) => void;

  // Detached panels (multi-monitor)
  detachPanel: (panelType: PanelType) => Promise<string | null>;
  reattachPanel: (windowId: string) => Promise<boolean>;
  addDetachedPanel: (windowId: string, panelType: PanelType) => void;
  removeDetachedPanel: (windowId: string) => void;

  // Reset
  resetLayout: () => void;
}

export type LayoutStore = LayoutState & LayoutActions;

const LAYOUT_MODE_ORDER: LayoutMode[] = ['standard', 'hyper-focus', 'agent-first'];

// Check and fix swapped panels on load
const validateAndFixSlots = (slots: Record<PanelSlotId, PanelSlot>): Record<PanelSlotId, PanelSlot> => {
  let fixed = { ...slots };
  let needsFix = false;

  // Ensure correct default positions: A=sidebar, B=editor, C=agent, D=terminal
  if (slots.B?.panelType === 'agent' && slots.C?.panelType === 'editor') {
    // Panels are swapped, fix them
    console.log('[LayoutStore] Fixing swapped editor/agent panels');
    fixed = {
      ...fixed,
      B: { ...fixed.B, panelType: 'editor' },
      C: { ...fixed.C, panelType: 'agent' },
    };
    needsFix = true;
  }

  // Ensure agent panel has minimum width of 420 for header content
  if (fixed.C?.width < 420) {
    console.log('[LayoutStore] Fixing agent panel width');
    fixed = {
      ...fixed,
      C: { ...fixed.C, width: 420 },
    };
    needsFix = true;
  }

  return needsFix ? fixed : slots;
};

export const useLayoutStore = create<LayoutStore>()(
  persist(
    (set, get) => ({
      // Initial state
      mode: 'standard' as LayoutMode,
      slots: createDefaultSlots(),
      stacks: [] as PanelStack[],
      isDragging: false,
      draggedPanel: null as PanelType | null,
      detachedPanels: [] as DetachedPanel[],

      // Mode switching
      setLayoutMode: (mode) => {
        set({ mode });
        // Apply mode-specific layout adjustments
        const slots = { ...get().slots };
        
        switch (mode) {
          case 'hyper-focus':
            // Collapse A, C, D to 4px edges
            slots.A = { ...slots.A, isCollapsed: true, width: 4 };
            slots.C = { ...slots.C, isCollapsed: true, width: 4 };
            slots.D = { ...slots.D, isCollapsed: true, height: 4 };
            break;
          case 'agent-first':
            // B and C split 45%/45%
            slots.B = { ...slots.B, width: 45, isCollapsed: false };
            slots.C = { ...slots.C, width: 45, isCollapsed: false };
            break;
          case 'standard':
          default:
            // Restore defaults
            slots.A = { ...slots.A, isCollapsed: false, width: 260 };
            slots.B = { ...slots.B, isCollapsed: false };
            slots.C = { ...slots.C, isCollapsed: false, width: 420 };
            slots.D = { ...slots.D, isCollapsed: false, height: 30 };
            break;
        }
        
        set({ slots });
      },

      cycleLayoutMode: () => {
        const currentIndex = LAYOUT_MODE_ORDER.indexOf(get().mode);
        const nextIndex = (currentIndex + 1) % LAYOUT_MODE_ORDER.length;
        get().setLayoutMode(LAYOUT_MODE_ORDER[nextIndex]);
      },

      // Panel manipulation
      movePanel: (panelType, targetSlot) => {
        const slots = { ...get().slots };
        const sourceSlot = Object.values(slots).find(s => s.panelType === panelType);
        
        console.log('movePanel called', { panelType, targetSlot, sourceSlot: sourceSlot?.id });
        
        if (!sourceSlot) {
          console.log('movePanel: sourceSlot not found');
          return;
        }
        
        // Swap panels between slots
        const targetSlotData = slots[targetSlot];
        const sourcePanelType = sourceSlot.panelType;
        const targetPanelType = targetSlotData.panelType;
        
        console.log('movePanel: swapping', { 
          from: sourceSlot.id, 
          to: targetSlot, 
          sourcePanelType, 
          targetPanelType 
        });
        
        slots[sourceSlot.id] = { ...sourceSlot, panelType: targetPanelType };
        slots[targetSlot] = { ...targetSlotData, panelType: sourcePanelType };
        
        console.log('movePanel: new slots', slots);
        
        set({ slots });
      },

      resizeSlot: (slotId, width, height) => {
        const slots = { ...get().slots };
        const slot = slots[slotId];
        const config = PANEL_CONFIGS[slot.panelType];
        
        // Apply constraints
        const constrainedWidth = Math.max(
          config.constraints.minWidth,
          Math.min(config.constraints.maxWidth, width)
        );
        const constrainedHeight = Math.max(
          config.constraints.minHeight,
          Math.min(config.constraints.maxHeight, height)
        );
        
        slots[slotId] = { ...slot, width: constrainedWidth, height: constrainedHeight };
        set({ slots });
      },

      collapseSlot: (slotId) => {
        const slots = { ...get().slots };
        const slot = slots[slotId];
        const config = PANEL_CONFIGS[slot.panelType];
        
        if (!config.canCollapse) return;
        
        slots[slotId] = { ...slot, isCollapsed: true };
        set({ slots });
      },

      expandSlot: (slotId) => {
        const slots = { ...get().slots };
        slots[slotId] = { ...slots[slotId], isCollapsed: false };
        set({ slots });
      },

      toggleSlotCollapse: (slotId) => {
        const slot = get().slots[slotId];
        if (slot.isCollapsed) {
          get().expandSlot(slotId);
        } else {
          get().collapseSlot(slotId);
        }
      },

      // Drag state
      setDragging: (isDragging, panelType = null) => {
        set({ isDragging, draggedPanel: panelType });
      },

      // Stacking
      stackPanel: (panelType, targetSlot) => {
        const stacks = [...get().stacks];
        const existingStack = stacks.find(s => s.slotId === targetSlot);
        
        if (existingStack) {
          existingStack.panels.push(panelType);
          existingStack.activeIndex = existingStack.panels.length - 1;
        } else {
          const targetSlotData = get().slots[targetSlot];
          stacks.push({
            slotId: targetSlot,
            panels: [targetSlotData.panelType, panelType],
            activeIndex: 1,
          });
        }
        
        set({ stacks });
      },

      unstackPanel: (panelType) => {
        const stacks = get().stacks
          .map(stack => ({
            ...stack,
            panels: stack.panels.filter(p => p !== panelType),
          }))
          .filter(stack => stack.panels.length > 1);
        
        set({ stacks });
      },

      setActiveStackPanel: (slotId, index) => {
        const stacks = get().stacks.map(stack =>
          stack.slotId === slotId ? { ...stack, activeIndex: index } : stack
        );
        set({ stacks });
      },

      // Detached panels (multi-monitor)
      detachPanel: async (panelType) => {
        try {
          // Sync all relevant state BEFORE creating the detached window
          // This ensures the new window loads with current state, not defaults
          const appState = useAppStore.getState();
          
          // Sync project state
          await window.sumerian.state.set('project', {
            rootPath: appState.project.rootPath,
            fileTree: appState.project.fileTree,
          });
          
          // Sync editor state
          await window.sumerian.state.set('editor', {
            activeFileId: appState.editor.activeFileId,
            openFiles: appState.editor.openFiles,
            groups: appState.editor.groups,
            activeGroupId: appState.editor.activeGroupId,
          });
          
          // Sync agent state
          await window.sumerian.state.set('agent', {
            messages: appState.agent.messages,
            status: appState.agent.status,
            braveMode: appState.agent.braveMode,
            mode: appState.agent.mode,
            model: appState.agent.model,
            sessionId: appState.agent.sessionId,
            usage: appState.agent.usage,
            pinnedFiles: appState.agent.pinnedFiles,
            toolActions: appState.agent.toolActions,
            loreFiles: appState.agent.loreFiles,
            availableModels: appState.agent.availableModels,
          });
          
          // Sync UI/terminal state
          await window.sumerian.state.set('ui', {
            terminals: appState.ui.terminals,
            activeTerminalId: appState.ui.activeTerminalId,
          });

          const windowId = await window.sumerian.window.detachPanel(panelType);
          if (windowId) {
            set({
              detachedPanels: [...get().detachedPanels, { windowId, panelType }],
            });
            return windowId;
          }
          return null;
        } catch (error) {
          console.error('Failed to detach panel:', error);
          return null;
        }
      },

      reattachPanel: async (windowId) => {
        try {
          const success = await window.sumerian.window.reattachPanel(windowId);
          if (success) {
            set({
              detachedPanels: get().detachedPanels.filter(p => p.windowId !== windowId),
            });
          }
          return success;
        } catch (error) {
          console.error('Failed to reattach panel:', error);
          return false;
        }
      },

      addDetachedPanel: (windowId, panelType) => {
        set({
          detachedPanels: [...get().detachedPanels, { windowId, panelType }],
        });
      },

      removeDetachedPanel: (windowId) => {
        set({
          detachedPanels: get().detachedPanels.filter(p => p.windowId !== windowId),
        });
      },

      // Reset
      resetLayout: () => {
        set({
          mode: 'standard',
          slots: createDefaultSlots(),
          stacks: [],
          isDragging: false,
          draggedPanel: null,
          detachedPanels: [],
        });
      },
    }),
    {
      name: 'sumerian-layout-storage',
      storage: {
        getItem: (name) => {
          if (typeof localStorage === 'undefined') return null;
          const str = localStorage.getItem(name);
          return str ? JSON.parse(str) : null;
        },
        setItem: (name, value) => {
          if (typeof localStorage === 'undefined') return;
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          if (typeof localStorage === 'undefined') return;
          localStorage.removeItem(name);
        },
      },
      partialize: (state) => ({
        mode: state.mode,
        slots: state.slots,
        stacks: state.stacks,
      } as LayoutStore),
      onRehydrateStorage: () => (state) => {
        if (state?.slots) {
          const fixedSlots = validateAndFixSlots(state.slots);
          if (fixedSlots !== state.slots) {
            state.slots = fixedSlots;
          }
        }
      },
    }
  )
);
