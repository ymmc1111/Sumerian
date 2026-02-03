import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAppStore } from '../../src/renderer/stores/useAppStore';

// Mock window.sumerian
const mockProjectOpen = vi.fn().mockResolvedValue(undefined);
const mockProjectGet = vi.fn().mockResolvedValue({ lastSessionId: 'test-session' });
const mockListFiles = vi.fn().mockResolvedValue([{ name: 'file1.ts', path: '/root/file1.ts', isDirectory: false }]);
const mockWatchFiles = vi.fn();
const mockStateSet = vi.fn();
const mockSessionLoad = vi.fn().mockResolvedValue({ id: 'test-session', messages: [] });
const mockSessionGetLatestId = vi.fn().mockResolvedValue('latest-session');

(global as any).window = {
    sumerian: {
        project: {
            open: mockProjectOpen,
            get: mockProjectGet,
            select: vi.fn(),
            getRecent: vi.fn().mockResolvedValue(['/recent/path']),
            updateSession: vi.fn(),
        },
        files: {
            list: mockListFiles,
            watch: mockWatchFiles,
            read: vi.fn(),
        },
        state: {
            set: mockStateSet,
            broadcast: vi.fn(),
        },
        session: {
            load: mockSessionLoad,
            getLatestId: mockSessionGetLatestId,
            save: vi.fn(),
        },
        cli: {
            listModels: vi.fn().mockResolvedValue([]),
            refreshModels: vi.fn(),
        },
        lore: {
            list: vi.fn().mockResolvedValue([]),
        }
    },
    location: { search: '' }
} as any;

describe('ProjectSlice', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should set root path and initialize project', async () => {
        const path = '/test/project';
        await useAppStore.getState().setRootPath(path);

        expect(useAppStore.getState().project.rootPath).toBe(path);
        expect(mockProjectOpen).toHaveBeenCalledWith(path);
        expect(mockWatchFiles).toHaveBeenCalledWith(path);
        expect(mockListFiles).toHaveBeenCalledWith(path);
        // Should attempt to restore session
        expect(mockSessionLoad).toHaveBeenCalledWith('test-session');
    });

    it('should refresh file tree', async () => {
        // Set root path first
        useAppStore.setState({ project: { rootPath: '/root', fileTree: [], recentProjects: [], expandedPaths: [] } });

        await useAppStore.getState().refreshFileTree();

        expect(mockListFiles).toHaveBeenCalledWith('/root');
        expect(useAppStore.getState().project.fileTree.length).toBe(1);
        expect(useAppStore.getState().project.fileTree[0].name).toBe('file1.ts');
        expect(mockStateSet).toHaveBeenCalledWith('project', expect.objectContaining({ rootPath: '/root' }));
    });
});
