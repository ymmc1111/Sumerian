import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAppStore } from '../../src/renderer/stores/useAppStore';

// Mock window.sumerian
const mockCLISend = vi.fn().mockResolvedValue(undefined);
const mockSessionSave = vi.fn().mockResolvedValue(undefined);
const mockSessionList = vi.fn().mockResolvedValue([]);
const mockStateSet = vi.fn();

(global as any).window = {
    sumerian: {
        cli: {
            send: mockCLISend,
            setBraveMode: vi.fn(),
            setModel: vi.fn(),
            updateActiveFileContext: vi.fn(),
            startLoop: vi.fn(),
            cancelLoop: vi.fn(),
            listModels: vi.fn().mockResolvedValue([]),
            refreshModels: vi.fn(),
            onModelsUpdated: vi.fn(),
            onAssistantMessage: vi.fn(),
            onToolAction: vi.fn(),
            onAgentStatus: vi.fn(),
            onOutput: vi.fn(),
            onStatusChange: vi.fn(),
            onLoopIteration: vi.fn(),
            onLoopComplete: vi.fn(),
        },
        session: {
            save: mockSessionSave,
            load: vi.fn(),
            list: mockSessionList,
        },
        state: {
            set: mockStateSet,
            broadcast: vi.fn(),
            getAll: vi.fn().mockResolvedValue({}),
            onUpdate: vi.fn(),
        },
        files: {
            read: vi.fn().mockResolvedValue('content'),
            onChanged: vi.fn(),
        },
        lore: {
            list: vi.fn().mockResolvedValue([]),
        },
        project: {
            open: vi.fn(),
            getRecent: vi.fn().mockResolvedValue([]),
        }
    },
    location: { search: '' },
    crypto: {
        randomUUID: () => 'uuid-' + Math.random(),
    }
} as any;

describe('AgentSlice', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset agent state
        useAppStore.setState({
            agent: {
                status: 'disconnected',
                sessionId: 'test-session-id',
                model: 'auto',
                messages: [],
                braveMode: false,
                loreFiles: [],
                activeFileContext: null,
                autoContextEnabled: true,
                streamStatus: 'idle',
                currentToolName: null,
                toolActions: [],
                healingLoopActive: false,
                healingIteration: 0,
                maxHealingIterations: 5,
                lastHealingError: null,
                pinnedFiles: [],
                lastTerminalError: null,
                usage: null,
                mode: 'code',
                availableModels: [],
                loopActive: false,
                loopConfig: null,
                loopIteration: 0,
                autopilotMode: false,
            }
        });
    });

    it('should send a message and add to history', async () => {
        const content = 'Hello agent';
        await useAppStore.getState().sendMessage(content);

        const state = useAppStore.getState().agent;
        expect(state.messages.length).toBe(1);
        expect(state.messages[0].content).toBe(content);
        expect(state.messages[0].role).toBe('user');
        expect(mockCLISend).toHaveBeenCalled();
        expect(mockSessionSave).toHaveBeenCalled();
    });

    it('should update last agent message (streaming)', () => {
        useAppStore.getState().updateLastAgentMessage('Hello');
        useAppStore.getState().updateLastAgentMessage(' there');

        const state = useAppStore.getState().agent;
        expect(state.messages.length).toBe(1);
        expect(state.messages[0].role).toBe('agent');
        expect(state.messages[0].content).toBe('Hello there');
    });

    it('should set brave mode', async () => {
        await useAppStore.getState().setBraveMode(true);
        expect(useAppStore.getState().agent.braveMode).toBe(true);
        expect(window.sumerian.cli.setBraveMode).toHaveBeenCalledWith(true);
    });

    it('should change agent mode', () => {
        useAppStore.getState().setMode('chat');
        expect(useAppStore.getState().agent.mode).toBe('chat');
        // Mode change adds a system message
        expect(useAppStore.getState().agent.messages.length).toBe(1);
    });

    it('should start a loop', async () => {
        await useAppStore.getState().startLoop('task', 'done', 10);
        const state = useAppStore.getState().agent;
        expect(state.loopActive).toBe(true);
        expect(state.loopConfig?.prompt).toBe('task');
        expect(window.sumerian.cli.startLoop).toHaveBeenCalledWith('task', 'done', 10);
    });
});
