export interface ClaudeCredentials {
    sessionToken: string;
    expiresAt: number;
    refreshToken?: string;
}

export interface SessionStatus {
    authenticated: boolean;
    expiresAt?: number;
    error?: string;
}

export interface ICredentialManager {
    getSessionStatus(): Promise<SessionStatus>;
    validateSession(): Promise<boolean>;
}
