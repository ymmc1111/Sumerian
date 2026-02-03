import { StateCreator } from 'zustand';
import { AppState, WorkforceState, AgentInstance, Task, DelegationProposal, QueuedTask } from './types';

export interface WorkforceActions {
    spawnAgent: (persona: AgentInstance['persona'], task: string, workingDir?: string) => Promise<string>;
    terminateAgent: (agentId: string) => Promise<void>;
    getAgent: (agentId: string) => AgentInstance | null;
    getAllAgents: () => AgentInstance[];
    updateAgentResources: (agentId: string, cpu: number, memory: number) => void;
    queueTask: (task: Task) => void;
    dequeueTask: (taskId: string) => void;
    proposeDelegation: (proposal: DelegationProposal) => void;
    approveDelegation: () => Promise<void>;
    rejectDelegation: () => void;
    revertAgent: (agentId: string) => Promise<boolean>;
    addTaskToQueue: (task: QueuedTask) => void;
    removeTaskFromQueue: (taskId: string) => void;
    reorderTasks: (fromIndex: number, toIndex: number) => void;
    processNextTask: () => Promise<void>;
    setQueueActive: (active: boolean) => void;
    updateTaskStatus: (taskId: string, status: QueuedTask['status']) => void;
}

export interface WorkforceSlice {
    workforce: WorkforceState;
}

export const createWorkforceSlice: StateCreator<AppState, [], [], WorkforceSlice & WorkforceActions> = (set, get) => ({
    workforce: {
        activeAgents: new Map<string, AgentInstance>(),
        taskQueue: [] as Task[],
        pendingProposal: null,
        queuedTasks: [],
        queueActive: false,
    },

    spawnAgent: async (persona, task, workingDir) => {
        try {
            const agentId = await window.sumerian.cli.spawnAgent(persona, task, workingDir);
            const agentInstance: AgentInstance = {
                id: agentId,
                persona,
                status: 'active',
                task,
                startTime: Date.now(),
                lockedFiles: [],
                messageHistory: []
            };
            set((state) => {
                const newActiveAgents = new Map(state.workforce.activeAgents);
                newActiveAgents.set(agentId, agentInstance);
                return { workforce: { ...state.workforce, activeAgents: newActiveAgents } };
            });
            return agentId;
        } catch (error) {
            console.error('Failed to spawn agent:', error);
            throw error;
        }
    },

    terminateAgent: async (agentId) => {
        try {
            await window.sumerian.cli.terminateAgent(agentId);
            set((state) => {
                const newActiveAgents = new Map(state.workforce.activeAgents);
                newActiveAgents.delete(agentId);
                return { workforce: { ...state.workforce, activeAgents: newActiveAgents } };
            });
        } catch (error) {
            console.error('Failed to terminate agent:', error);
            throw error;
        }
    },

    getAgent: (agentId) => get().workforce.activeAgents.get(agentId) || null,
    getAllAgents: () => Array.from(get().workforce.activeAgents.values()),

    updateAgentResources: (agentId, cpu, memory) => {
        set((state) => {
            const agent = state.workforce.activeAgents.get(agentId);
            if (!agent) return state;
            const maxHistoryLength = 30;
            const cpuHistory = [...(agent.resources?.cpuHistory || []), cpu].slice(-maxHistoryLength);
            const memoryHistory = [...(agent.resources?.memoryHistory || []), memory].slice(-maxHistoryLength);
            const updatedAgent: AgentInstance = {
                ...agent,
                resources: { cpuHistory, memoryHistory, lastUpdate: Date.now() }
            };
            const newActiveAgents = new Map(state.workforce.activeAgents);
            newActiveAgents.set(agentId, updatedAgent);
            return { workforce: { ...state.workforce, activeAgents: newActiveAgents } };
        });
    },

    queueTask: (task) => set((state) => ({ workforce: { ...state.workforce, taskQueue: [...state.workforce.taskQueue, task] } })),
    dequeueTask: (taskId) => set((state) => ({ workforce: { ...state.workforce, taskQueue: state.workforce.taskQueue.filter(t => t.id !== taskId) } })),
    proposeDelegation: (proposal) => set((state) => ({ workforce: { ...state.workforce, pendingProposal: proposal } })),

    approveDelegation: async () => {
        const { pendingProposal } = get().workforce;
        if (!pendingProposal) return;
        try {
            await get().spawnAgent(pendingProposal.persona, pendingProposal.task, get().project.rootPath || undefined);
            set((state) => ({ workforce: { ...state.workforce, pendingProposal: null } }));
        } catch (error) {
            console.error('Failed to approve delegation:', error);
        }
    },

    rejectDelegation: () => set((state) => ({ workforce: { ...state.workforce, pendingProposal: null } })),

    revertAgent: async (agentId: string) => {
        const agent = get().workforce.activeAgents.get(agentId);
        if (!agent || !agent.completionReport) return false;
        try {
            const filesModified = agent.completionReport.filesModified;
            let allSuccess = true;
            for (const filePath of filesModified) {
                // Ignore the file path in this loop to avoid unused variable warning if necessary, 
                // but window.sumerian.files.undo() doesn't seem to take a path.
                const success = await window.sumerian.files.undo();
                if (!success) allSuccess = false;
            }
            if (allSuccess) await get().refreshFileTree();
            return allSuccess;
        } catch (error) {
            console.error('Failed to revert agent changes:', error);
            return false;
        }
    },

    addTaskToQueue: (task) => set((state) => ({ workforce: { ...state.workforce, queuedTasks: [...state.workforce.queuedTasks, task] } })),
    removeTaskFromQueue: (taskId) => set((state) => ({ workforce: { ...state.workforce, queuedTasks: state.workforce.queuedTasks.filter(t => t.id !== taskId) } })),
    reorderTasks: (fromIndex, toIndex) => {
        set((state) => {
            const tasks = [...state.workforce.queuedTasks];
            const [removed] = tasks.splice(fromIndex, 1);
            tasks.splice(toIndex, 0, removed);
            return { workforce: { ...state.workforce, queuedTasks: tasks } };
        });
    },

    processNextTask: async () => {
        const { queuedTasks } = get().workforce;
        const nextTask = queuedTasks.find(t => t.status === 'pending');
        if (!nextTask) {
            get().setQueueActive(false);
            return;
        }
        get().updateTaskStatus(nextTask.id, 'active');
        try {
            if (nextTask.type === 'message') await get().sendMessage(nextTask.content);
            else if (nextTask.type === 'loop') await get().startLoop(nextTask.config.prompt, nextTask.config.promise, nextTask.config.maxIterations);
            else if (nextTask.type === 'spawn') await get().spawnAgent(nextTask.config.persona, nextTask.config.task, nextTask.config.workingDir);
            get().updateTaskStatus(nextTask.id, 'complete');
            if (get().workforce.queueActive) setTimeout(() => get().processNextTask(), 2000);
        } catch (error) {
            get().updateTaskStatus(nextTask.id, 'error');
            get().setQueueActive(false);
        }
    },

    setQueueActive: (active) => {
        set((state) => ({ workforce: { ...state.workforce, queueActive: active } }));
        if (active) get().processNextTask();
    },

    updateTaskStatus: (taskId, status) => {
        set((state) => ({ workforce: { ...state.workforce, queuedTasks: state.workforce.queuedTasks.map(t => t.id === taskId ? { ...t, status } : t) } }));
    },
});
