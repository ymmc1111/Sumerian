import * as fs from 'fs/promises';
import { existsSync, lstatSync } from 'fs';
import * as path from 'path';
import chokidar from 'chokidar';
import { FileEntry, FileEvent, IFileService } from './types';

import { SnapshotManager } from './SnapshotManager';
import { UndoManager } from './UndoManager';
import { AuditLogger } from '../logging/AuditLogger';
import { SandboxValidator } from './SandboxValidator';

export class FileService implements IFileService {
    private sandboxValidator: SandboxValidator | null = null;
    private snapshotManager: SnapshotManager | null = null;
    private undoManager: UndoManager = new UndoManager();
    private auditLogger: AuditLogger = new AuditLogger();

    public setProjectRoot(projectRoot: string) {
        this.sandboxValidator = new SandboxValidator(projectRoot);
        this.snapshotManager = new SnapshotManager(projectRoot);
    }

    async read(filePath: string): Promise<string> {
        if (this.sandboxValidator) {
            const validation = this.sandboxValidator.validateAccess(filePath);
            if (!validation.allowed) {
                await this.auditLogger.log({
                    action: 'file:read',
                    actor: 'agent',
                    target: filePath,
                    braveMode: false,
                    reversible: false,
                    result: 'blocked',
                    details: validation.reason
                });
                throw new Error(validation.reason);
            }
        }

        try {
            return await fs.readFile(filePath, 'utf-8');
        } catch (error) {
            console.error(`Error reading file ${filePath}:`, error);
            throw error;
        }
    }

    async write(filePath: string, content: string, isAgent: boolean = false): Promise<void> {
        if (this.sandboxValidator) {
            const validation = this.sandboxValidator.validateAccess(filePath);
            if (!validation.allowed) {
                await this.auditLogger.log({
                    action: 'file:write',
                    actor: isAgent ? 'agent' : 'user',
                    target: filePath,
                    braveMode: false,
                    reversible: false,
                    result: 'blocked',
                    details: validation.reason
                });
                throw new Error(validation.reason);
            }
        }

        try {
            // Ensure directory exists
            const dir = path.dirname(filePath);
            await fs.mkdir(dir, { recursive: true });

            let snapshotPath: string | undefined;
            if (isAgent && this.snapshotManager && existsSync(filePath)) {
                snapshotPath = await this.snapshotManager.createSnapshot(filePath) || undefined;
                if (snapshotPath) {
                    this.undoManager.push({
                        type: 'file_edit',
                        path: filePath,
                        snapshotPath,
                        timestamp: Date.now()
                    });
                }
            }

            await fs.writeFile(filePath, content, 'utf-8');

            await this.auditLogger.log({
                action: 'file:write',
                actor: isAgent ? 'agent' : 'user',
                target: filePath,
                braveMode: false,
                reversible: !!snapshotPath,
                snapshotPath,
                result: 'success'
            });
        } catch (error: any) {
            await this.auditLogger.log({
                action: 'file:write',
                actor: isAgent ? 'agent' : 'user',
                target: filePath,
                braveMode: false,
                reversible: false,
                result: 'error',
                details: error.message
            });
            console.error(`Error writing file ${filePath}:`, error);
            throw error;
        }
    }

    async saveImage(filePath: string, base64Data: string): Promise<string> {
        try {
            const dir = path.dirname(filePath);
            await fs.mkdir(dir, { recursive: true });

            const buffer = Buffer.from(base64Data, 'base64');
            await fs.writeFile(filePath, buffer);

            return filePath;
        } catch (error) {
            console.error(`Error saving image to ${filePath}:`, error);
            throw error;
        }
    }

    async list(dirPath: string): Promise<FileEntry[]> {
        // ... (list implementation remains similar but could also use sandbox check)
        return this._list(dirPath);
    }

    private async _list(dirPath: string): Promise<FileEntry[]> {
        try {
            if (!existsSync(dirPath)) {
                return [];
            }

            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            const result: FileEntry[] = [];

            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                const isDirectory = entry.isDirectory();

                if (entry.name.startsWith('.') && entry.name !== '.sumerian' && entry.name !== '.env') {
                    continue;
                }

                result.push({
                    name: entry.name,
                    path: fullPath,
                    isDirectory,
                    extension: isDirectory ? undefined : path.extname(entry.name),
                    size: isDirectory ? undefined : lstatSync(fullPath).size
                });
            }

            return result.sort((a, b) => {
                if (a.isDirectory === b.isDirectory) {
                    return a.name.localeCompare(b.name);
                }
                return a.isDirectory ? -1 : 1;
            });
        } catch (error) {
            console.error(`Error listing directory ${dirPath}:`, error);
            throw error;
        }
    }

    async delete(filePath: string, isAgent: boolean = false): Promise<void> {
        if (this.sandboxValidator) {
            const validation = this.sandboxValidator.validateAccess(filePath);
            if (!validation.allowed) {
                throw new Error(validation.reason);
            }
        }

        try {
            const stats = await fs.stat(filePath);

            // Snapshot before delete if agent
            let snapshotPath: string | undefined;
            if (isAgent && this.snapshotManager && !stats.isDirectory()) {
                snapshotPath = await this.snapshotManager.createSnapshot(filePath) || undefined;
            }

            if (stats.isDirectory()) {
                await fs.rm(filePath, { recursive: true, force: true });
            } else {
                await fs.unlink(filePath);
            }

            await this.auditLogger.log({
                action: 'file:delete',
                actor: isAgent ? 'agent' : 'user',
                target: filePath,
                braveMode: false,
                reversible: !!snapshotPath,
                snapshotPath,
                result: 'success'
            });
        } catch (error: any) {
            await this.auditLogger.log({
                action: 'file:delete',
                actor: isAgent ? 'agent' : 'user',
                target: filePath,
                braveMode: false,
                reversible: false,
                result: 'error',
                details: error.message
            });
            throw error;
        }
    }

    async undo(): Promise<boolean> {
        return await this.undoManager.undo();
    }

    async createCheckpoint(label: string, files: string[]): Promise<string> {
        if (!this.snapshotManager) {
            throw new Error('Project not initialized');
        }
        return await this.snapshotManager.createCheckpoint(label, files);
    }

    async listCheckpoints(): Promise<any[]> {
        if (!this.snapshotManager) {
            return [];
        }
        return await this.snapshotManager.listCheckpoints();
    }

    async rollbackToCheckpoint(checkpointId: string): Promise<void> {
        if (!this.snapshotManager) {
            throw new Error('Project not initialized');
        }
        await this.snapshotManager.rollbackToCheckpoint(checkpointId);
    }

    async deleteCheckpoint(checkpointId: string): Promise<void> {
        if (!this.snapshotManager) {
            throw new Error('Project not initialized');
        }
        await this.snapshotManager.deleteCheckpoint(checkpointId);
    }

    watch(dirPath: string, callback: (event: FileEvent) => void): () => void {
        const watcher = chokidar.watch(dirPath, {
            ignored: [
                '**/node_modules/**',
                '**/.git/**',
                '**/.sumerian/snapshots/**',
                '**/dist/**',
                '**/build/**',
                '**/out/**',
                '**/.next/**',
                '**/.nuxt/**',
                '**/coverage/**',
                '**/.cache/**',
                '**/tmp/**',
                '**/temp/**',
                '**/*.log'
            ],
            persistent: true,
            ignoreInitial: true,
            depth: 10,
            usePolling: false,
            awaitWriteFinish: {
                stabilityThreshold: 200,
                pollInterval: 100
            }
        });

        watcher.on('add', (filePath) => callback({ path: filePath, type: 'create' }));
        watcher.on('change', (filePath) => callback({ path: filePath, type: 'modify' }));
        watcher.on('unlink', (filePath) => callback({ path: filePath, type: 'delete' }));
        watcher.on('addDir', (filePath) => callback({ path: filePath, type: 'create' }));
        watcher.on('unlinkDir', (filePath) => callback({ path: filePath, type: 'delete' }));

        watcher.on('error', (error: Error) => {
            console.error('File watcher error:', error.message);
            // Don't crash on EMFILE - just log and continue with reduced watching
        });

        return () => {
            watcher.close();
        };
    }
}

