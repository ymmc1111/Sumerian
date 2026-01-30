export const COMMAND_BLOCKLIST: RegExp[] = [
    /rm\s+(-rf?|--recursive)\s+[\/~]/,
    /sudo\s+rm/,
    /mkfs/,
    /dd\s+if=/,
    />\s*\/dev\//,
    /chmod\s+777/,
    /curl.*\|\s*(ba)?sh/
];

export const SENSITIVE_PATHS: string[] = [
    '.ssh',
    '.aws',
    '.env',
    '.credentials',
    '/etc/',
    '/var/',
    '/usr/bin/'
];
