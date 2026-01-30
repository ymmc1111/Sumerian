// Panel slot positions (A=sidebar, B=editor, C=agent, D=terminal)
export type PanelSlotId = 'A' | 'B' | 'C' | 'D';

export type PanelType = 'sidebar' | 'editor' | 'agent' | 'terminal';

export type LayoutMode = 'standard' | 'hyper-focus' | 'agent-first';

export interface PanelConstraints {
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
}

export interface PanelSlot {
  id: PanelSlotId;
  panelType: PanelType;
  x: number;
  y: number;
  width: number;
  height: number;
  isCollapsed: boolean;
  zIndex: number;
}

export interface PanelConfig {
  type: PanelType;
  defaultSlot: PanelSlotId;
  constraints: PanelConstraints;
  canCollapse: boolean;
  canStack: boolean;
}

export interface PanelStack {
  slotId: PanelSlotId;
  panels: PanelType[];
  activeIndex: number;
}

export interface DetachedPanel {
  windowId: string;
  panelType: PanelType;
}

export interface LayoutState {
  mode: LayoutMode;
  slots: Record<PanelSlotId, PanelSlot>;
  stacks: PanelStack[];
  isDragging: boolean;
  draggedPanel: PanelType | null;
  detachedPanels: DetachedPanel[];
}
