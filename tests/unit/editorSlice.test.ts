import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAppStore } from '../../src/renderer/stores/useAppStore';

// Mock window.sumerian
const mockReadFile = vi.fn().mockResolvedValue('file content');
const mockWriteFile = vi.fn().mockResolvedValue(undefined);
const mockStateSet = vi.fn();
const mockBroadcast = vi.fn();

(global as any).window = {
    sumerian: {
        files: {
            read: mockReadFile,
            write: mockWriteFile,
        },
        state: {
            set: mockStateSet,
            broadcast: mockBroadcast,
        },
        cli: {
            updateActiveFileContext: vi.fn(),
        }
    },
    location: { search: '' }
} as any;

describe('EditorSlice', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset editor state
        useAppStore.setState({
            editor: {
                openFiles: [],
                activeFileId: null,
                groups: [{ id: 'default', openFiles: [], activeFileId: null }],
                activeGroupId: 'default',
                layout: 'single',
            }
        });
    });

    it('should open a new file', async () => {
        const path = '/test/file.ts';
        await useAppStore.getState().openFile(path);

        const state = useAppStore.getState().editor;
        expect(state.openFiles.length).toBe(1);
        expect(state.openFiles[0].path).toBe(path);
        expect(state.activeFileId).toBe(path);
        expect(mockReadFile).toHaveBeenCalledWith(path);
        expect(mockStateSet).toHaveBeenCalledWith('editor', expect.any(Object));
    });

    it('should not open the same file twice', async () => {
        const path = '/test/file.ts';
        await useAppStore.getState().openFile(path);
        await useAppStore.getState().openFile(path);

        const state = useAppStore.getState().editor;
        expect(state.openFiles.length).toBe(1);
    });

    it('should close an open file', async () => {
        const path = '/test/file.ts';
        await useAppStore.getState().openFile(path);
        useAppStore.getState().closeFile(path);

        const state = useAppStore.getState().editor;
        expect(state.openFiles.length).toBe(0);
        expect(state.activeFileId).toBeNull();
        expect(mockBroadcast).toHaveBeenCalledWith('editor:close', { id: path });
    });

    it('should update file content and mark as dirty', async () => {
        const path = '/test/file.ts';
        await useAppStore.getState().openFile(path);
        useAppStore.getState().setFileContent(path, 'new content');

        const file = useAppStore.getState().editor.openFiles[0];
        expect(file.content).toBe('new content');
        expect(file.isDirty).toBe(true);
    });

    it('should save a dirty file', async () => {
        const path = '/test/file.ts';
        await useAppStore.getState().openFile(path);
        useAppStore.getState().setFileContent(path, 'new content');
        await useAppStore.getState().saveFile(path);

        const file = useAppStore.getState().editor.openFiles[0];
        expect(file.isDirty).toBe(false);
        expect(mockWriteFile).toHaveBeenCalledWith(path, 'new content');
        expect(mockBroadcast).toHaveBeenCalledWith('editor:save', { id: path });
    });
});
