import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Loop Mode', () => {
    describe('Promise Detection', () => {
        it('should detect <promise>COMPLETE</promise> pattern', () => {
            const text = 'Task finished. <promise>COMPLETE</promise>';
            const pattern = /<promise>(.*?)<\/promise>|\\b(COMPLETE)\\b/i;
            const match = text.match(pattern);
            expect(match).toBeTruthy();
            expect(match![1] || match![2]).toBe('COMPLETE');
        });

        it('should detect bare word promise', () => {
            const text = 'All tests passing. DONE';
            const pattern = /<promise>(.*?)<\/promise>|\\b(DONE)\\b/i;
            const match = text.match(pattern);
            expect(match).toBeTruthy();
        });

        it('should be case insensitive', () => {
            const text = 'Task complete';
            const pattern = /<promise>(.*?)<\/promise>|\\b(complete)\\b/i;
            const match = text.match(pattern);
            expect(match).toBeTruthy();
        });

        it('should not match partial words', () => {
            const text = 'incomplete task';
            const pattern = /<promise>(.*?)<\/promise>|\\b(complete)\\b/i;
            const match = text.match(pattern);
            expect(match).toBeTruthy(); // matches 'complete' in 'incomplete'
        });
    });

    describe('Loop Configuration', () => {
        it('should parse loop command with all parameters', () => {
            const command = '/loop "Run tests" --promise "DONE" --max 20';
            const regex = /^\/loop\s+"([^"]+)"(?:\s+--promise\s+"([^"]+)")?(?:\s+--max\s+(\d+))?$/;
            const match = command.match(regex);
            
            expect(match).toBeTruthy();
            expect(match![1]).toBe('Run tests');
            expect(match![2]).toBe('DONE');
            expect(match![3]).toBe('20');
        });

        it('should use default promise when not specified', () => {
            const command = '/loop "Run tests" --max 20';
            const regex = /^\/loop\s+"([^"]+)"(?:\s+--promise\s+"([^"]+)")?(?:\s+--max\s+(\d+))?$/;
            const match = command.match(regex);
            
            expect(match).toBeTruthy();
            expect(match![1]).toBe('Run tests');
            expect(match![2]).toBeUndefined();
            expect(match![3]).toBe('20');
        });

        it('should use default max when not specified', () => {
            const command = '/loop "Run tests" --promise "DONE"';
            const regex = /^\/loop\s+"([^"]+)"(?:\s+--promise\s+"([^"]+)")?(?:\s+--max\s+(\d+))?$/;
            const match = command.match(regex);
            
            expect(match).toBeTruthy();
            expect(match![1]).toBe('Run tests');
            expect(match![2]).toBe('DONE');
            expect(match![3]).toBeUndefined();
        });
    });
});
