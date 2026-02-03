import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAppStore } from '../../src/renderer/stores/useAppStore';

// Mock window.sumerian
const mockSpawnAgent = vi.fn().mockResolvedValue('agent-123');
const mockTerminateAgent = vi.fn().mockResolvedValue(undefined);

(global as any).window = {
    sumerian: {
        cli: {
            spawnAgent: mockSpawnAgent,
            terminateAgent: mockTerminateAgent,
        },
        files: {
            undo: vi.fn().mockResolvedValue(true),
        }
    },
    location: { search: '' }
} as any;

describe('WorkforceSlice', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset workforce state
        useAppStore.setState({
            workforce: {
                activeAgents: new Map(),
                taskQueue: [],
                pendingProposal: null,
                queuedTasks: [],
                queueActive: false,
            },
            project: { rootPath: '/root', fileTree: [], recentProjects: [], expandedPaths: [] }
        });
    });

    it('should spawn a new agent', async () => {
        const persona = { id: 'p1', model: 'm1', systemPrompt: 's1', allowedTools: [], disallowedTools: [] };
        const task = 'do something';

        const agentId = await useAppStore.getState().spawnAgent(persona, task);

        expect(agentId).toBe('agent-123');
        expect(mockSpawnAgent).toHaveBeenCalledWith(persona, task, undefined);

        const agents = useAppStore.getState().getAllAgents();
        expect(agents.length).toBe(1);
        expect(agents[0].id).toBe('agent-123');
        expect(agents[0].task).toBe(task);
    });

    it('should terminate an agent', async () => {
        const persona = { id: 'p1', model: 'm1', systemPrompt: 's1', allowedTools: [], disallowedTools: [] };
        const agentId = await useAppStore.getState().spawnAgent(persona, 'task');

        await useAppStore.getState().terminateAgent(agentId);

        expect(mockTerminateAgent).toHaveBeenCalledWith(agentId);
        expect(useAppStore.getState().getAgent(agentId)).toBeNull();
    });

    it('should propose and approve delegation', async () => {
        const proposal = {
            id: 'prop-1',
            persona: { id: 'p2', model: 'm2', systemPrompt: 's2', allowedTools: [], disallowedTools: [] },
            model: 'm2',
            task: 'subtask',
            files: []
        };

        useAppStore.getState().proposeDelegation(proposal);
        expect(useAppStore.getState().workforce.pendingProposal).toBe(proposal);

        await useAppStore.getState().approveDelegation();
        expect(mockSpawnAgent).toHaveBeenCalled();
        expect(useAppStore.getState().workforce.pendingProposal).toBeNull();
    });

    it('should queue and process tasks', async () => {
        const task: any = { id: 't1', type: 'message', content: 'hello', status: 'pending' };
        useAppStore.getState().addTaskToQueue(task);

        expect(useAppStore.getState().workforce.queuedTasks.length).toBe(1);

        // Mock sendMessage to avoid actual CLI call in this test if needed, 
        // but it's already mocked via window.sumerian.cli.send in AgentSlice tests.
        // Here we just test the queue flow.

        const spyProcess = vi.spyOn(useAppStore.getState(), 'sendMessage').mockResolvedValue(undefined);

        await useAppStore.getState().processNextTask();

        expect(spyProcess).toHaveBeenCalledWith('hello');
        expect(useAppStore.getState().workforce.queuedTasks[0].status).toBe('complete');
    });
});
