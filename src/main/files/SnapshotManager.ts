import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export interface Snapshot {
    id: string;
    timestamp: number;
    originalPath: string;
    snapshotPath: string;
}

export interface LabeledCheckpoint {
    id: string;
    label: string;
    timestamp: number;
    files: { path: string; content: string }[];
}

export class SnapshotManager {
    private snapshotRoot: string;
    private checkpointRoot: string;
    private maxSnapshots = 50;
    private maxCheckpoints = 20;
    private projectRoot: string;

    constructor(projectRoot: string) {
        this.projectRoot = projectRoot;
        this.snapshotRoot = path.join(projectRoot, '.sumerian', 'snapshots');
        this.checkpointRoot = path.join(projectRoot, '.sumerian', 'checkpoints');
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

    public async createCheckpoint(label: string, files: string[]): Promise<string> {
        try {
            await fs.mkdir(this.checkpointRoot, { recursive: true });

            const timestamp = Date.now();
            const checkpointId = `checkpoint-${timestamp}`;
            const checkpointDir = path.join(this.checkpointRoot, checkpointId);
            await fs.mkdir(checkpointDir, { recursive: true });

            // Save file contents
            const savedFiles: { path: string; content: string }[] = [];
            for (const filePath of files) {
                try {
                    const content = await fs.readFile(filePath, 'utf-8');
                    const relativePath = path.relative(this.projectRoot, filePath);
                    const targetPath = path.join(checkpointDir, relativePath);
                    await fs.mkdir(path.dirname(targetPath), { recursive: true });
                    await fs.writeFile(targetPath, content, 'utf-8');
                    savedFiles.push({ path: filePath, content });
                } catch (err) {
                    console.warn(`Failed to save file ${filePath} in checkpoint:`, err);
                }
            }

            // Save metadata
            const checkpoint: LabeledCheckpoint = {
                id: checkpointId,
                label,
                timestamp,
                files: savedFiles
            };

            const metaPath = path.join(checkpointDir, 'metadata.json');
            await fs.writeFile(metaPath, JSON.stringify(checkpoint, null, 2), 'utf-8');

            // Cleanup old checkpoints
            await this.cleanupCheckpoints();

            return checkpointId;
        } catch (error) {
            console.error('Failed to create checkpoint:', error);
            throw error;
        }
    }

    public async listCheckpoints(): Promise<LabeledCheckpoint[]> {
        try {
            const dirs = await fs.readdir(this.checkpointRoot);
            const checkpoints: LabeledCheckpoint[] = [];

            for (const dir of dirs) {
                const metaPath = path.join(this.checkpointRoot, dir, 'metadata.json');
                try {
                    const content = await fs.readFile(metaPath, 'utf-8');
                    const checkpoint = JSON.parse(content) as LabeledCheckpoint;
                    checkpoints.push(checkpoint);
                } catch (err) {
                    console.warn(`Failed to read checkpoint metadata for ${dir}:`, err);
                }
            }

            // Sort by timestamp descending (newest first)
            return checkpoints.sort((a, b) => b.timestamp - a.timestamp);
        } catch (error) {
            if ((error as any).code === 'ENOENT') {
                return [];
            }
            console.error('Failed to list checkpoints:', error);
            return [];
        }
    }

    public async rollbackToCheckpoint(checkpointId: string): Promise<void> {
        try {
            const checkpointDir = path.join(this.checkpointRoot, checkpointId);
            const metaPath = path.join(checkpointDir, 'metadata.json');
            
            const content = await fs.readFile(metaPath, 'utf-8');
            const checkpoint = JSON.parse(content) as LabeledCheckpoint;

            // Restore all files
            for (const fileInfo of checkpoint.files) {
                try {
                    const relativePath = path.relative(this.projectRoot, fileInfo.path);
                    const sourcePath = path.join(checkpointDir, relativePath);
                    const content = await fs.readFile(sourcePath, 'utf-8');
                    await fs.writeFile(fileInfo.path, content, 'utf-8');
                } catch (err) {
                    console.warn(`Failed to restore file ${fileInfo.path}:`, err);
                }
            }
        } catch (error) {
            console.error('Failed to rollback to checkpoint:', error);
            throw error;
        }
    }

    public async deleteCheckpoint(checkpointId: string): Promise<void> {
        try {
            const checkpointDir = path.join(this.checkpointRoot, checkpointId);
            await fs.rm(checkpointDir, { recursive: true, force: true });
        } catch (error) {
            console.error('Failed to delete checkpoint:', error);
            throw error;
        }
    }

    private async cleanupCheckpoints(): Promise<void> {
        try {
            const checkpoints = await this.listCheckpoints();
            if (checkpoints.length <= this.maxCheckpoints) return;

            // Delete oldest checkpoints
            const toDelete = checkpoints.slice(this.maxCheckpoints);
            for (const checkpoint of toDelete) {
                await this.deleteCheckpoint(checkpoint.id);
            }
        } catch (error) {
            console.error('Checkpoint cleanup failed:', error);
        }
    }
}
