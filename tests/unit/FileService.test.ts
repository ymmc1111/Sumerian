import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FileService } from '../../src/main/files/FileService';
import * as fs from 'fs/promises';
import { existsSync } from 'fs';

vi.mock('fs/promises');
vi.mock('fs', () => ({
    existsSync: vi.fn(),
    lstatSync: vi.fn(() => ({ size: 100 })),
}));
vi.mock('chokidar', () => ({
    default: {
        watch: vi.fn(() => ({
            on: vi.fn().mockReturnThis(),
            close: vi.fn(),
        })),
    },
}));

describe('FileService', () => {
    let fileService: FileService;
    const projectRoot = '/mock/project';

    beforeEach(() => {
        vi.clearAllMocks();
        fileService = new FileService();
        fileService.setProjectRoot(projectRoot);
    });

    it('should read file content successfully', async () => {
        const filePath = '/mock/project/test.txt';
        (fs.readFile as any).mockResolvedValue('hello world');
        (existsSync as any).mockReturnValue(true);

        const content = await fileService.read(filePath);
        expect(content).toBe('hello world');
        expect(fs.readFile).toHaveBeenCalledWith(filePath, 'utf-8');
    });

    it('should throw error if reading file outside sandbox', async () => {
        const filePath = '/other/path/test.txt';
        await expect(fileService.read(filePath)).rejects.toThrow(/Access denied/);
    });

    it('should write file content successfully', async () => {
        const filePath = '/mock/project/test.txt';
        const content = 'new content';
        (fs.mkdir as any).mockResolvedValue(undefined);
        (fs.writeFile as any).mockResolvedValue(undefined);

        await fileService.write(filePath, content);
        expect(fs.writeFile).toHaveBeenCalledWith(filePath, content, 'utf-8');
    });

    it('should list directory contents', async () => {
        const dirPath = '/mock/project';
        const mockEntries = [
            { name: 'file1.ts', isDirectory: () => false },
            { name: 'dir1', isDirectory: () => true },
        ];
        (existsSync as any).mockReturnValue(true);
        (fs.readdir as any).mockResolvedValue(mockEntries);

        const result = await fileService.list(dirPath);
        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('dir1'); // Directory sorted first
        expect(result[1].name).toBe('file1.ts');
    });
});
