import { shell } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export class OAuthBridge {
    private credentialPath: string;
    private watchTimer: NodeJS.Timeout | null = null;

    constructor() {
        if (process.platform === 'win32') {
            this.credentialPath = path.join(process.env.APPDATA || '', 'Claude', '.credentials.json');
        } else {
            this.credentialPath = path.join(os.homedir(), '.claude', '.credentials.json');
        }
    }

    public openLoginPage(): void {
        shell.openExternal('https://claude.ai/login'); // Or the specific CLI login URL if known
    }

    public startPolling(onSuccess: () => void, timeoutMs: number = 300000): void {
        if (this.watchTimer) return;

        const startTime = Date.now();
        const poll = () => {
            if (Date.now() - startTime > timeoutMs) {
                this.stopPolling();
                return;
            }

            if (fs.existsSync(this.credentialPath)) {
                // Check if it was recently modified
                const stats = fs.statSync(this.credentialPath);
                if (Date.now() - stats.mtimeMs < 10000) { // Modified in last 10s
                    this.stopPolling();
                    onSuccess();
                    return;
                }
            }
            this.watchTimer = setTimeout(poll, 2000);
        };

        poll();
    }

    public stopPolling(): void {
        if (this.watchTimer) {
            clearTimeout(this.watchTimer);
            this.watchTimer = null;
        }
    }
}
