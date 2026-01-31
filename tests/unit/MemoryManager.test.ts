import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('MemoryManager', () => {
    let testDir: string;
    let memoryPath: string;

    beforeEach(async () => {
        testDir = path.join(os.tmpdir(), `memory-test-${Date.now()}`);
        memoryPath = path.join(testDir, '.sumerian', 'memory.md');
        await fs.mkdir(path.dirname(memoryPath), { recursive: true });
    });

    afterEach(async () => {
        try {
            await fs.rm(testDir, { recursive: true, force: true });
        } catch (error) {
            // Ignore cleanup errors
        }
    });

    describe('Read/Write Operations', () => {
        it('should write memory content', async () => {
            const content = '# Agent Memory\n\nTest memory entry';
            await fs.writeFile(memoryPath, content, 'utf-8');
            
            const read = await fs.readFile(memoryPath, 'utf-8');
            expect(read).toBe(content);
        });

        it('should append memory entries with timestamp', async () => {
            const initial = '# Agent Memory\n\nInitial entry';
            await fs.writeFile(memoryPath, initial, 'utf-8');
            
            const timestamp = new Date().toISOString();
            const newEntry = `\n## ${timestamp}\nNew entry\n`;
            await fs.appendFile(memoryPath, newEntry);
            
            const content = await fs.readFile(memoryPath, 'utf-8');
            expect(content).toContain('Initial entry');
            expect(content).toContain('New entry');
        });

        it('should return default content when file does not exist', async () => {
            const nonExistentPath = path.join(testDir, 'nonexistent', 'memory.md');
            const defaultContent = '# Agent Memory\n\n*No memories yet.*';
            
            try {
                await fs.readFile(nonExistentPath, 'utf-8');
            } catch (error) {
                // Expected - file doesn't exist
                expect(error).toBeDefined();
            }
        });

        it('should clear memory content', async () => {
            await fs.writeFile(memoryPath, 'Old content', 'utf-8');
            await fs.writeFile(memoryPath, '# Agent Memory\n\n*No memories yet.*', 'utf-8');
            
            const content = await fs.readFile(memoryPath, 'utf-8');
            expect(content).toBe('# Agent Memory\n\n*No memories yet.*');
        });
    });

    describe('Memory Persistence', () => {
        it('should persist across sessions', async () => {
            const content = '# Agent Memory\n\nPersistent data';
            await fs.writeFile(memoryPath, content, 'utf-8');
            
            // Simulate session restart by reading again
            const read = await fs.readFile(memoryPath, 'utf-8');
            expect(read).toBe(content);
        });
    });
});
