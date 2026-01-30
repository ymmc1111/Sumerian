import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SnapshotManager } from '../../src/main/files/SnapshotManager';
import * as fs from 'fs/promises';
import * as path from 'path';

vi.mock('fs/promises');

describe('SnapshotManager', () => {
    let snapshotManager: SnapshotManager;
    const projectRoot = '/mock/project';

    beforeEach(() => {
        vi.clearAllMocks();
        snapshotManager = new SnapshotManager(projectRoot);
    });

    it('should create a snapshot successfully', async () => {
        const filePath = '/mock/project/src/index.ts';
        const mockContent = Buffer.from('console.log("hello")');

        (fs.mkdir as any).mockResolvedValue(undefined);
        (fs.readFile as any).mockResolvedValue(mockContent);
        (fs.writeFile as any).mockResolvedValue(undefined);
        (fs.readdir as any).mockResolvedValue([]);

        const result = await snapshotManager.createSnapshot(filePath);

        expect(result).toContain('.sumerian/snapshots');
        expect(fs.mkdir).toHaveBeenCalled();
        expect(fs.readFile).toHaveBeenCalledWith(filePath);
        expect(fs.writeFile).toHaveBeenCalled();
    });

    it('should cleanup old snapshots', async () => {
        const filePath = '/mock/project/src/index.ts';
        // Mock 60 existing snapshots (max is 50)
        const mockDirs = Array.from({ length: 60 }, (_, i) => (1000 + i).toString());

        (fs.mkdir as any).mockResolvedValue(undefined);
        (fs.readFile as any).mockResolvedValue(Buffer.from('test'));
        (fs.writeFile as any).mockResolvedValue(undefined);
        (fs.readdir as any).mockResolvedValue(mockDirs);
        (fs.rm as any).mockResolvedValue(undefined);

        await snapshotManager.createSnapshot(filePath);

        // Should delete 60 + 1 (new one) - 50 = 11 older ones? 
        // Wait, cleanup is called after the new one is created. 
        // dirs will have 60 initial + the new one is not listed yet in readdir mock.
        // So 60 dirs, 10 should be deleted.
        expect(fs.rm).toHaveBeenCalledTimes(10);
    });
});
