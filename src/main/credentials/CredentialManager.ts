import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { ClaudeCredentials, SessionStatus, ICredentialManager } from './types';

export class CredentialManager implements ICredentialManager {
    private credentialPath: string;

    constructor() {
        if (process.platform === 'win32') {
            this.credentialPath = path.join(process.env.APPDATA || '', 'Claude', '.credentials.json');
        } else {
            this.credentialPath = path.join(os.homedir(), '.claude', '.credentials.json');
        }
    }

    async getSessionStatus(): Promise<SessionStatus> {
        try {
            const credentials = await this.readCredentials();
            if (!credentials) {
                return { authenticated: false, error: 'No credentials found' };
            }

            const now = Date.now();
            if (credentials.expiresAt < now) {
                return {
                    authenticated: false,
                    expiresAt: credentials.expiresAt,
                    error: 'Session expired'
                };
            }

            return {
                authenticated: true,
                expiresAt: credentials.expiresAt
            };
        } catch (error) {
            console.error('Error getting session status:', error);
            return { authenticated: false, error: 'Failed to read credentials' };
        }
    }

    async validateSession(): Promise<boolean> {
        const status = await this.getSessionStatus();
        return status.authenticated;
    }

    async getCredentials(): Promise<ClaudeCredentials | null> {
        return this.readCredentials();
    }

    private async readCredentials(): Promise<ClaudeCredentials | null> {
        try {
            const content = await fs.readFile(this.credentialPath, 'utf-8');
            return JSON.parse(content) as ClaudeCredentials;
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                return null;
            }
            throw error;
        }
    }
}
