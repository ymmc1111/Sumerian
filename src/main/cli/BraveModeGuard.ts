import { COMMAND_BLOCKLIST, SENSITIVE_PATHS } from './blocklist';

export interface GuardResult {
    allowed: boolean;
    reason?: string;
}

export class BraveModeGuard {
    public static validateCommand(command: string): GuardResult {
        // Check against command blocklist
        for (const pattern of COMMAND_BLOCKLIST) {
            if (pattern.test(command)) {
                return {
                    allowed: false,
                    reason: `Command matches blocklist pattern: ${pattern.toString()}`
                };
            }
        }

        // Check for sensitive paths in command arguments
        for (const path of SENSITIVE_PATHS) {
            if (command.includes(path)) {
                return {
                    allowed: false,
                    reason: `Command accesses sensitive path: ${path}`
                };
            }
        }

        return { allowed: true };
    }

    public static validatePath(filePath: string): GuardResult {
        for (const sensitivePath of SENSITIVE_PATHS) {
            if (filePath.includes(sensitivePath)) {
                return {
                    allowed: false,
                    reason: `Access to sensitive path blocked: ${sensitivePath}`
                };
            }
        }
        return { allowed: true };
    }
}
