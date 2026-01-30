import * as fs from 'fs/promises';
import * as path from 'path';

export interface SessionData {
    id: string;
    messages: any[];
    timestamp: number;
    usage?: {
        input: number;
        output: number;
    } | null;
}

export class SessionManager {
    private sessionsDir: string;

    constructor(projectRoot: string) {
        this.sessionsDir = path.join(projectRoot, '.sumerian', 'sessions');
    }

    private async ensureDir() {
        try {
            await fs.mkdir(this.sessionsDir, { recursive: true });
        } catch (err) {
            console.error('[SessionManager] Failed to create sessions directory:', err);
        }
    }

    public async saveSession(data: SessionData): Promise<void> {
        await this.ensureDir();
        const filePath = path.join(this.sessionsDir, `${data.id}.json`);
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');

        // Also update a "latest" symlink or simple file
        const latestPath = path.join(this.sessionsDir, 'latest.json');
        await fs.writeFile(latestPath, JSON.stringify({ lastSessionId: data.id }), 'utf8');
    }

    public async loadSession(id: string): Promise<SessionData | null> {
        const filePath = path.join(this.sessionsDir, `${id}.json`);
        try {
            const content = await fs.readFile(filePath, 'utf8');
            return JSON.parse(content);
        } catch (err) {
            console.error('[SessionManager] Failed to load session:', id, err);
            return null;
        }
    }

    public async getLatestSessionId(): Promise<string | null> {
        const latestPath = path.join(this.sessionsDir, 'latest.json');
        try {
            const content = await fs.readFile(latestPath, 'utf8');
            const data = JSON.parse(content);
            return data.lastSessionId;
        } catch {
            return null;
        }
    }

    public async listSessions(): Promise<any[]> {
        await this.ensureDir();
        try {
            const files = await fs.readdir(this.sessionsDir);
            const sessions = [];
            for (const file of files) {
                if (file.endsWith('.json') && file !== 'latest.json') {
                    const content = await fs.readFile(path.join(this.sessionsDir, file), 'utf8');
                    sessions.push(JSON.parse(content));
                }
            }
            return sessions.sort((a, b) => b.timestamp - a.timestamp);
        } catch {
            return [];
        }
    }

    public async deleteSession(id: string): Promise<void> {
        const filePath = path.join(this.sessionsDir, `${id}.json`);
        try {
            await fs.unlink(filePath);
        } catch (err) {
            console.error('[SessionManager] Failed to delete session:', id, err);
        }
    }
}
