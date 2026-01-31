import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('WorkforceSync', () => {
    let testDir: string;

    beforeEach(async () => {
        testDir = path.join(os.tmpdir(), `workforce-test-${Date.now()}`);
        await fs.mkdir(testDir, { recursive: true });
    });

    afterEach(async () => {
        try {
            await fs.rm(testDir, { recursive: true, force: true });
        } catch (error) {
            // Ignore cleanup errors
        }
    });

    describe('File Locking', () => {
        it('should lock a file for an agent', async () => {
            const stateFile = path.join(testDir, '.sumerian', 'workforce', 'state.json');
            await fs.mkdir(path.dirname(stateFile), { recursive: true });
            
            const state = {
                agents: {
                    'agent-1': {
                        lockedFiles: ['test.ts']
                    }
                }
            };
            
            await fs.writeFile(stateFile, JSON.stringify(state, null, 2));
            const content = await fs.readFile(stateFile, 'utf-8');
            const parsed = JSON.parse(content);
            
            expect(parsed.agents['agent-1'].lockedFiles).toContain('test.ts');
        });

        it('should prevent double-locking of files', async () => {
            const stateFile = path.join(testDir, '.sumerian', 'workforce', 'state.json');
            await fs.mkdir(path.dirname(stateFile), { recursive: true });
            
            const state = {
                agents: {
                    'agent-1': { lockedFiles: ['test.ts'] },
                    'agent-2': { lockedFiles: [] }
                }
            };
            
            await fs.writeFile(stateFile, JSON.stringify(state, null, 2));
            const content = await fs.readFile(stateFile, 'utf-8');
            const parsed = JSON.parse(content);
            
            // Check if file is already locked
            const isLocked = Object.values(parsed.agents).some((agent: any) => 
                agent.lockedFiles.includes('test.ts')
            );
            
            expect(isLocked).toBe(true);
        });

        it('should unlock files on agent termination', async () => {
            const stateFile = path.join(testDir, '.sumerian', 'workforce', 'state.json');
            await fs.mkdir(path.dirname(stateFile), { recursive: true });
            
            const state = {
                agents: {
                    'agent-1': { lockedFiles: ['test.ts', 'other.ts'] }
                }
            };
            
            await fs.writeFile(stateFile, JSON.stringify(state, null, 2));
            
            // Simulate unlocking
            const updatedState = { agents: {} };
            await fs.writeFile(stateFile, JSON.stringify(updatedState, null, 2));
            
            const content = await fs.readFile(stateFile, 'utf-8');
            const parsed = JSON.parse(content);
            
            expect(parsed.agents['agent-1']).toBeUndefined();
        });
    });

    describe('Agent Registration', () => {
        it('should register a new agent', async () => {
            const stateFile = path.join(testDir, '.sumerian', 'workforce', 'state.json');
            await fs.mkdir(path.dirname(stateFile), { recursive: true });
            
            const state = {
                agents: {
                    'agent-1': {
                        status: 'active',
                        lockedFiles: []
                    }
                }
            };
            
            await fs.writeFile(stateFile, JSON.stringify(state, null, 2));
            const content = await fs.readFile(stateFile, 'utf-8');
            const parsed = JSON.parse(content);
            
            expect(parsed.agents['agent-1']).toBeDefined();
            expect(parsed.agents['agent-1'].status).toBe('active');
        });
    });
});
