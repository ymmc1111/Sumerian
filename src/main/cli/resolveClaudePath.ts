import { execSync } from 'child_process';
import { existsSync } from 'fs';
import * as path from 'path';
import * as os from 'os';

let cachedClaudePath: string | null = null;

export function resolveClaudePathSync(): string {
    if (cachedClaudePath) return cachedClaudePath;

    const commonPaths = [
        '/usr/local/bin/claude',
        '/opt/homebrew/bin/claude',
        path.join(os.homedir(), '.local/bin/claude'),
        path.join(os.homedir(), '.claude/bin/claude'),
        path.join(os.homedir(), '.npm-global/bin/claude'),
    ];

    // Try to get from interactive shell (inherits user's full PATH)
    try {
        const shell = process.env.SHELL || '/bin/zsh';
        const shellPath = execSync(`${shell} -ilc "which claude"`, {
            encoding: 'utf8',
            timeout: 3000,
            stdio: ['pipe', 'pipe', 'pipe'],
        }).trim();

        if (shellPath && existsSync(shellPath)) {
            cachedClaudePath = shellPath;
            console.log(`[CLIManager] Resolved claude path from shell: ${shellPath}`);
            return shellPath;
        }
    } catch {
        // Shell resolution failed, try common paths
    }

    // Fallback to common installation paths
    for (const p of commonPaths) {
        if (existsSync(p)) {
            cachedClaudePath = p;
            console.log(`[CLIManager] Resolved claude path from common location: ${p}`);
            return p;
        }
    }

    throw new Error(
        'Claude CLI not found. Please ensure it is installed and accessible.\n' +
        'Try running: npm install -g @anthropic-ai/claude-cli'
    );
}

export function getClaudePath(): string | null {
    return cachedClaudePath;
}
