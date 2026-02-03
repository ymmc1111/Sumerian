import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';

// Mock Electron
vi.mock('electron', () => ({
    app: {
        getPath: () => '/tmp/sumerian-test'
    }
}));

import { CLIManager } from './CLIManager';
import { CLIManagerEvents, CLIOutput, ConnectionStatus } from './types';

function cleanup() {
    if (fs.existsSync('/tmp/sumerian-test')) {
        fs.rmSync('/tmp/sumerian-test', { recursive: true, force: true });
    }
}

describe('CLIManager Reproduction', () => {
    beforeEach(() => {
        cleanup();
        fs.mkdirSync('/tmp/sumerian-test', { recursive: true });
    });

    afterEach(() => {
        cleanup();
    });

    it('should reply to the second message', async () => {
        const events: CLIManagerEvents = {
            onOutput: (output: CLIOutput) => console.log('[TEST] Output:', output.content),
            onStatusChange: (status: ConnectionStatus) => console.log('[TEST] Status:', status),
            onAssistantText: (text: string) => console.log('[TEST] Assistant:', text),
            onToolUse: (name) => console.log('[TEST] Tool Use:', name),
            onToolResult: (id) => console.log('[TEST] Tool Result:', id),
            onError: (type, msg) => console.log('[TEST] Error:', type, msg),
            onExit: (code) => console.log('[TEST] Exit:', code),
            onAgentOutput: (id, output) => console.log(`[TEST] Agent ${id}:`, output.content),
            onAgentComplete: (report) => console.log('[TEST] Agent Complete:', report.agentId),
            onLoopIteration: (i) => console.log('[TEST] Loop:', i),
            onLoopComplete: (reason) => console.log('[TEST] Loop Complete:', reason),
            onModelsUpdated: () => { },
            onResourceUpdate: () => { }
        };

        const manager = new CLIManager(process.cwd(), events);

        // Wait for connection/ready? 
        // spawn() is sync-ish but starts process
        manager.spawn(false); // Brave mode false

        console.log('--- Sending Message 1 ---');
        manager.sendMessage('Hello, are you there? Reply with "YES I AM HERE"');

        // Wait for response
        await new Promise<void>((resolve) => {
            const check = (text: string) => {
                if (text.includes('YES I AM HERE')) {
                    resolve();
                }
            };
            // Hook into events
            const originalOnAssistantText = events.onAssistantText;
            events.onAssistantText = (text, streaming, acc) => {
                if (originalOnAssistantText) originalOnAssistantText(text, streaming, acc);
                check(text);
            };
        });

        console.log('--- Message 1 Received ---');

        // Give it a moment to settle
        await new Promise(r => setTimeout(r, 2000));

        console.log('--- Sending Message 2 ---');
        let response2Received = false;

        manager.sendMessage('What is 2 + 2? Reply with "THE SUM IS 4"');

        // Wait for response 2
        try {
            await new Promise<void>((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('Timeout waiting for 2nd response')), 15000);

                const check = (text: string) => {
                    if (text.includes('THE SUM IS 4')) {
                        response2Received = true;
                        clearTimeout(timeout);
                        resolve();
                    }
                };

                // Hook into events again
                const originalOnAssistantText = events.onAssistantText;
                events.onAssistantText = (text, streaming, acc) => {
                    if (originalOnAssistantText) originalOnAssistantText(text, streaming, acc);
                    check(text);
                };
            });
        } catch (e) {
            console.error('Test failed:', e);
        }

        expect(response2Received).toBe(true);

        manager.kill();
    }, 30000); // 30s timeout
});
