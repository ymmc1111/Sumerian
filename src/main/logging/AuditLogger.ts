import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export interface AuditEntry {
    timestamp: string;
    action: string;
    actor: 'user' | 'agent';
    target: string;
    braveMode: boolean;
    reversible: boolean;
    snapshotPath?: string;
    result: 'success' | 'blocked' | 'error';
    details?: string;
}

export class AuditLogger {
    private logPath: string;

    constructor() {
        this.logPath = path.join(os.homedir(), '.sumerian', 'audit.log');
    }

    public async log(entry: Omit<AuditEntry, 'timestamp'>): Promise<void> {
        const fullEntry: AuditEntry = {
            ...entry,
            timestamp: new Date().toISOString()
        };

        try {
            await fs.mkdir(path.dirname(this.logPath), { recursive: true });
            await fs.appendFile(this.logPath, JSON.stringify(fullEntry) + '\n');
        } catch (error) {
            console.error('Failed to write audit log:', error);
        }
    }
}
