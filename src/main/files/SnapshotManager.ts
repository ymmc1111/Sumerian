import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export interface Snapshot {
    id: string;
    timestamp: number;
    originalPath: string;
    snapshotPath: string;
}

export class SnapshotManager {
    private snapshotRoot: string;
    private maxSnapshots = 50;

    constructor(projectRoot: string) {
        this.snapshotRoot = path.join(projectRoot, '.sumerian', 'snapshots');
    }

    public async createSnapshot(filePath: string): Promise<string | null> {
        try {
            await fs.mkdir(this.snapshotRoot, { recursive: true });

            const timestamp = Date.now();
            const snapshotDir = path.join(this.snapshotRoot, timestamp.toString());
            await fs.mkdir(snapshotDir, { recursive: true });

            const fileName = path.basename(filePath);
            const snapshotPath = path.join(snapshotDir, fileName);

            // Read original and write to snapshot
            const content = await fs.readFile(filePath);
            await fs.writeFile(snapshotPath, content);

            // Cleanup old snapshots
            await this.cleanup();

            return snapshotPath;
        } catch (error) {
            console.error('Failed to create snapshot:', error);
            return null;
        }
    }

    private async cleanup(): Promise<void> {
        try {
            const dirs = await fs.readdir(this.snapshotRoot);
            if (dirs.length <= this.maxSnapshots) return;

            // Sort by timestamp (dir name)
            const sortedDirs = dirs.sort((a, b) => parseInt(a) - parseInt(b));
            const toDelete = sortedDirs.slice(0, sortedDirs.length - this.maxSnapshots);

            for (const dir of toDelete) {
                await fs.rm(path.join(this.snapshotRoot, dir), { recursive: true, force: true });
            }
        } catch (error) {
            console.error('Snapshot cleanup failed:', error);
        }
    }
}
