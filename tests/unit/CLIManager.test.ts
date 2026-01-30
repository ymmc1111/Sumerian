import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CLIManager } from '../../src/main/cli/CLIManager';
import * as pty from 'node-pty';
import { ConnectionStatus } from '../../src/main/cli/types';

vi.mock('node-pty', () => ({
    spawn: vi.fn(() => ({
        onData: vi.fn(),
        onExit: vi.fn(),
        write: vi.fn(),
        kill: vi.fn(),
    })),
}));

describe('CLIManager', () => {
    let cliManager: CLIManager;
    const projectRoot = '/mock/project';
    const mockEvents = {
        onOutput: vi.fn(),
        onExit: vi.fn(),
        onStatusChange: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        cliManager = new CLIManager(projectRoot, mockEvents);
    });

    it('should initialize with DISCONNECTED status', () => {
        expect(cliManager.getStatus()).toBe(ConnectionStatus.DISCONNECTED);
    });

    it('should spawn a PTY process', () => {
        cliManager.spawn();
        expect(pty.spawn).toHaveBeenCalled();
        expect(cliManager.getStatus()).toBe(ConnectionStatus.CONNECTED);
    });

    it('should call onOutput when data is received', () => {
        const mockPty = {
            onData: vi.fn((cb) => cb('hello')),
            onExit: vi.fn(),
            write: vi.fn(),
            kill: vi.fn(),
        };
        (pty.spawn as any).mockReturnValue(mockPty);

        cliManager.spawn();
        expect(mockEvents.onOutput).toHaveBeenCalledWith(expect.objectContaining({
            content: 'hello'
        }));
    });

    it('should kill the process on kill()', () => {
        const mockPty = {
            onData: vi.fn(),
            onExit: vi.fn(),
            write: vi.fn(),
            kill: vi.fn(),
        };
        (pty.spawn as any).mockReturnValue(mockPty);

        cliManager.spawn();
        cliManager.kill();
        expect(mockPty.kill).toHaveBeenCalled();
        expect(cliManager.getStatus()).toBe(ConnectionStatus.DISCONNECTED);
    });

    it('should get relative paths correctly', () => {
        const absPath = '/mock/project/src/index.ts';
        expect(cliManager.getRelativePath(absPath)).toBe('src/index.ts');
    });
});
