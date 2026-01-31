import { CLIManager } from '../cli/CLIManager';
import { CLIManagerEvents } from '../cli/types';
import { SessionManager } from '../sessions/SessionManager';

interface CLISession {
    cliManager: CLIManager;
    sessionManager: SessionManager;
    projectPath: string;
    lastAccessed: number;
}

export class CLISessionManager {
    private sessions: Map<string, CLISession> = new Map();
    private activeProjectPath: string | null = null;
    private maxIdleSessions: number = 3;

    constructor() {
        console.log('[CLISessionManager] Initialized');
    }

    public getOrCreateSession(projectPath: string, events: CLIManagerEvents): CLISession {
        const normalizedPath = this.normalizePath(projectPath);
        
        let session = this.sessions.get(normalizedPath);
        
        if (session) {
            console.log('[CLISessionManager] Reusing existing session for:', normalizedPath);
            session.lastAccessed = Date.now();
            return session;
        }

        console.log('[CLISessionManager] Creating new session for:', normalizedPath);
        
        const cliManager = new CLIManager(normalizedPath, events);
        const sessionManager = new SessionManager(normalizedPath);
        
        session = {
            cliManager,
            sessionManager,
            projectPath: normalizedPath,
            lastAccessed: Date.now()
        };
        
        this.sessions.set(normalizedPath, session);
        
        // Cleanup old idle sessions if we exceed the limit
        this.cleanupIdleSessions();
        
        return session;
    }

    public switchSession(projectPath: string): CLISession | null {
        const normalizedPath = this.normalizePath(projectPath);
        const session = this.sessions.get(normalizedPath);
        
        if (session) {
            console.log('[CLISessionManager] Switching to session:', normalizedPath);
            this.activeProjectPath = normalizedPath;
            session.lastAccessed = Date.now();
            return session;
        }
        
        console.warn('[CLISessionManager] Session not found for:', normalizedPath);
        return null;
    }

    public getActiveSession(): CLISession | null {
        if (!this.activeProjectPath) {
            return null;
        }
        return this.sessions.get(this.activeProjectPath) || null;
    }

    public getSession(projectPath: string): CLISession | null {
        const normalizedPath = this.normalizePath(projectPath);
        return this.sessions.get(normalizedPath) || null;
    }

    public terminateSession(projectPath: string): boolean {
        const normalizedPath = this.normalizePath(projectPath);
        const session = this.sessions.get(normalizedPath);
        
        if (session) {
            console.log('[CLISessionManager] Terminating session:', normalizedPath);
            
            // Kill the CLI manager
            session.cliManager.kill();
            
            // Remove from sessions map
            this.sessions.delete(normalizedPath);
            
            // Clear active project if it was this one
            if (this.activeProjectPath === normalizedPath) {
                this.activeProjectPath = null;
            }
            
            return true;
        }
        
        return false;
    }

    public terminateAll(): void {
        console.log('[CLISessionManager] Terminating all sessions');
        
        for (const [projectPath, session] of this.sessions.entries()) {
            console.log('[CLISessionManager] Terminating session:', projectPath);
            session.cliManager.kill();
        }
        
        this.sessions.clear();
        this.activeProjectPath = null;
    }

    public getActiveSessions(): string[] {
        return Array.from(this.sessions.keys());
    }

    public getSessionCount(): number {
        return this.sessions.size;
    }

    private cleanupIdleSessions(): void {
        if (this.sessions.size <= this.maxIdleSessions) {
            return;
        }

        console.log('[CLISessionManager] Cleaning up idle sessions, current count:', this.sessions.size);
        
        // Sort sessions by last accessed time
        const sortedSessions = Array.from(this.sessions.entries())
            .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
        
        // Keep the most recently accessed sessions, terminate the rest
        const sessionsToTerminate = sortedSessions.slice(0, sortedSessions.length - this.maxIdleSessions);
        
        for (const [projectPath, session] of sessionsToTerminate) {
            // Don't terminate the active session
            if (projectPath !== this.activeProjectPath) {
                console.log('[CLISessionManager] Terminating idle session:', projectPath);
                session.cliManager.kill();
                this.sessions.delete(projectPath);
            }
        }
    }

    private normalizePath(projectPath: string): string {
        // Normalize path to handle different path separators and trailing slashes
        return projectPath.replace(/\\/g, '/').replace(/\/$/, '');
    }

    public setMaxIdleSessions(max: number): void {
        this.maxIdleSessions = Math.max(1, max);
        console.log('[CLISessionManager] Max idle sessions set to:', this.maxIdleSessions);
    }
}

// Singleton instance
export const cliSessionManager = new CLISessionManager();
