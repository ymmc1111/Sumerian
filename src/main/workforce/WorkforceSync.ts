import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync } from 'fs';

interface WorkforceState {
    agents: Record<string, {
        lockedFiles: string[];
        status: string;
        startTime: number;
    }>;
    lastUpdated: number;
}

export class WorkforceSync {
    private stateFilePath: string;
    private projectRoot: string;

    constructor(projectRoot: string) {
        this.projectRoot = projectRoot;
        this.stateFilePath = path.join(projectRoot, '.sumerian', 'workforce', 'state.json');
    }

    private async ensureStateDir(): Promise<void> {
        const dir = path.dirname(this.stateFilePath);
        if (!existsSync(dir)) {
            await fs.mkdir(dir, { recursive: true });
        }
    }

    private async readState(): Promise<WorkforceState> {
        try {
            if (!existsSync(this.stateFilePath)) {
                return { agents: {}, lastUpdated: Date.now() };
            }
            const content = await fs.readFile(this.stateFilePath, 'utf-8');
            return JSON.parse(content);
        } catch (error) {
            console.error('[WorkforceSync] Failed to read state:', error);
            return { agents: {}, lastUpdated: Date.now() };
        }
    }

    private async writeState(state: WorkforceState): Promise<void> {
        try {
            await this.ensureStateDir();
            state.lastUpdated = Date.now();
            await fs.writeFile(this.stateFilePath, JSON.stringify(state, null, 2));
        } catch (error) {
            console.error('[WorkforceSync] Failed to write state:', error);
        }
    }

    public async lockFile(agentId: string, filePath: string): Promise<boolean> {
        const state = await this.readState();

        // Check if file already locked by another agent
        for (const [id, agent] of Object.entries(state.agents)) {
            if (id !== agentId && agent.lockedFiles.includes(filePath)) {
                console.log(`[WorkforceSync] File ${filePath} already locked by agent ${id}`);
                return false;
            }
        }

        // Lock file for this agent
        if (!state.agents[agentId]) {
            state.agents[agentId] = {
                lockedFiles: [],
                status: 'active',
                startTime: Date.now()
            };
        }

        if (!state.agents[agentId].lockedFiles.includes(filePath)) {
            state.agents[agentId].lockedFiles.push(filePath);
            await this.writeState(state);
            console.log(`[WorkforceSync] Agent ${agentId} locked file: ${filePath}`);
        }

        return true;
    }

    public async unlockFile(agentId: string, filePath: string): Promise<void> {
        const state = await this.readState();
        if (state.agents[agentId]) {
            state.agents[agentId].lockedFiles = state.agents[agentId].lockedFiles.filter(f => f !== filePath);
            await this.writeState(state);
            console.log(`[WorkforceSync] Agent ${agentId} unlocked file: ${filePath}`);
        }
    }

    public async unlockAllFiles(agentId: string): Promise<void> {
        const state = await this.readState();
        if (state.agents[agentId]) {
            console.log(`[WorkforceSync] Agent ${agentId} unlocking ${state.agents[agentId].lockedFiles.length} files`);
            state.agents[agentId].lockedFiles = [];
            await this.writeState(state);
        }
    }

    public async getLockedFiles(): Promise<Map<string, string>> {
        const state = await this.readState();
        const locked = new Map<string, string>();
        
        for (const [agentId, agent] of Object.entries(state.agents)) {
            for (const file of agent.lockedFiles) {
                locked.set(file, agentId);
            }
        }
        
        return locked;
    }

    public async isFileLocked(filePath: string): Promise<{ locked: boolean; agentId?: string }> {
        const state = await this.readState();
        
        for (const [agentId, agent] of Object.entries(state.agents)) {
            if (agent.lockedFiles.includes(filePath)) {
                return { locked: true, agentId };
            }
        }
        
        return { locked: false };
    }

    public async registerAgent(agentId: string): Promise<void> {
        const state = await this.readState();
        state.agents[agentId] = {
            lockedFiles: [],
            status: 'active',
            startTime: Date.now()
        };
        await this.writeState(state);
        console.log(`[WorkforceSync] Registered agent: ${agentId}`);
    }

    public async unregisterAgent(agentId: string): Promise<void> {
        const state = await this.readState();
        if (state.agents[agentId]) {
            console.log(`[WorkforceSync] Unregistering agent ${agentId}, unlocking ${state.agents[agentId].lockedFiles.length} files`);
            delete state.agents[agentId];
            await this.writeState(state);
        }
    }

    public async updateAgentStatus(agentId: string, status: string): Promise<void> {
        const state = await this.readState();
        if (state.agents[agentId]) {
            state.agents[agentId].status = status;
            await this.writeState(state);
        }
    }

    public async cleanup(): Promise<void> {
        try {
            if (existsSync(this.stateFilePath)) {
                await fs.unlink(this.stateFilePath);
                console.log('[WorkforceSync] Cleaned up state file');
            }
        } catch (error) {
            console.error('[WorkforceSync] Failed to cleanup:', error);
        }
    }
}
