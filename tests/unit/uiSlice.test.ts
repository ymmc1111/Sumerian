import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAppStore } from '../../src/renderer/stores/useAppStore';

// Mock window.sumerian
const mockBroadcast = vi.fn();
(global as any).window = {
    sumerian: {
        state: {
            broadcast: mockBroadcast,
        },
    },
    location: {
        search: '',
    },
} as any;

describe('UiSlice', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset store state manually if possible or just rely on default set in createUiSlice
        // Since it's a persistent store, we might need to be careful.
        // For simplicity in this environment, let's just test the actions.
    });

    it('should have initial UI state', () => {
        const { ui } = useAppStore.getState();
        expect(ui.sidebarWidth).toBe(260);
        expect(ui.isTerminalVisible).toBe(true);
        expect(ui.activePanel).toBe('editor');
    });

    it('should update sidebar width', () => {
        useAppStore.getState().setSidebarWidth(300);
        expect(useAppStore.getState().ui.sidebarWidth).toBe(300);
    });

    it('should toggle terminal visibility', () => {
        const initialState = useAppStore.getState().ui.isTerminalVisible;
        useAppStore.getState().toggleTerminal();
        expect(useAppStore.getState().ui.isTerminalVisible).toBe(!initialState);
    });

    it('should create a new terminal', () => {
        const initialCount = useAppStore.getState().ui.terminals.length;
        useAppStore.getState().createTerminal('new-term');
        const state = useAppStore.getState();
        expect(state.ui.terminals.length).toBe(initialCount + 1);
        expect(state.ui.terminals[state.ui.terminals.length - 1].name).toBe('new-term');
        expect(mockBroadcast).toHaveBeenCalledWith('terminal:create', expect.objectContaining({ name: 'new-term' }));
    });

    it('should close a terminal', () => {
        useAppStore.getState().createTerminal('to-close');
        const stateAfterCreate = useAppStore.getState();
        const termId = stateAfterCreate.ui.activeTerminalId!;

        useAppStore.getState().closeTerminal(termId);
        const stateAfterClose = useAppStore.getState();
        expect(stateAfterClose.ui.terminals.find(t => t.id === termId)).toBeUndefined();
        expect(mockBroadcast).toHaveBeenCalledWith('terminal:close', { id: termId });
    });

    it('should set side bar active tab', () => {
        useAppStore.getState().setSidebarActiveTab('workforce');
        expect(useAppStore.getState().ui.sidebarActiveTab).toBe('workforce');
        expect(mockBroadcast).toHaveBeenCalledWith('sidebar:tab', { tab: 'workforce' });
    });
});
