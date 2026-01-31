import * as fs from 'fs/promises';
import * as path from 'path';

export class MemoryManager {
    private memoryPath: string;
    private projectRoot: string;

    constructor(projectRoot: string) {
        this.projectRoot = projectRoot;
        this.memoryPath = path.join(projectRoot, '.sumerian', 'memory.md');
    }

    public async read(): Promise<string> {
        try {
            return await fs.readFile(this.memoryPath, 'utf-8');
        } catch (error) {
            if ((error as any).code === 'ENOENT') {
                return '# Agent Memory\n\n*No memories yet. The agent can write important context here that persists across sessions.*';
            }
            throw error;
        }
    }

    public async write(content: string): Promise<void> {
        try {
            await fs.mkdir(path.dirname(this.memoryPath), { recursive: true });
            await fs.writeFile(this.memoryPath, content, 'utf-8');
        } catch (error) {
            console.error('Failed to write memory:', error);
            throw error;
        }
    }

    public async append(entry: string): Promise<void> {
        try {
            const current = await this.read();
            const timestamp = new Date().toISOString();
            const newEntry = `\n## ${timestamp}\n${entry}\n`;
            await this.write(current + newEntry);
        } catch (error) {
            console.error('Failed to append to memory:', error);
            throw error;
        }
    }

    public async clear(): Promise<void> {
        try {
            const initialContent = '# Agent Memory\n\n*Memory cleared.*\n';
            await this.write(initialContent);
        } catch (error) {
            console.error('Failed to clear memory:', error);
            throw error;
        }
    }

    public getMemoryPath(): string {
        return this.memoryPath;
    }
}
