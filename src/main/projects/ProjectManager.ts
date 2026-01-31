import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync } from 'fs';
import { app } from 'electron';
import { ProjectEntry, ProjectRegistry, ProjectConfig, ProjectConfigOverrides } from './types';

const REGISTRY_FILE = path.join(app.getPath('home'), '.sumerian', 'projects.json');
const MAX_RECENT_PROJECTS = 10;

export class ProjectManager {
    private registry: ProjectRegistry = { version: 1, projects: [] };
    private loaded: boolean = false;

    async loadRegistry(): Promise<ProjectRegistry> {
        if (this.loaded) {
            return this.registry;
        }

        try {
            if (!existsSync(REGISTRY_FILE)) {
                this.registry = { version: 1, projects: [] };
                this.loaded = true;
                return this.registry;
            }

            const content = await fs.readFile(REGISTRY_FILE, 'utf-8');
            const data = JSON.parse(content);
            
            // Validate and migrate if needed
            if (data.version === 1 && Array.isArray(data.projects)) {
                this.registry = data;
            } else {
                console.warn('[ProjectManager] Invalid registry format, resetting');
                this.registry = { version: 1, projects: [] };
            }

            this.loaded = true;
            return this.registry;
        } catch (error) {
            console.error('[ProjectManager] Failed to load registry:', error);
            this.registry = { version: 1, projects: [] };
            this.loaded = true;
            return this.registry;
        }
    }

    async saveRegistry(): Promise<void> {
        try {
            const dir = path.dirname(REGISTRY_FILE);
            if (!existsSync(dir)) {
                await fs.mkdir(dir, { recursive: true });
            }

            await fs.writeFile(REGISTRY_FILE, JSON.stringify(this.registry, null, 2));
            console.log('[ProjectManager] Registry saved');
        } catch (error) {
            console.error('[ProjectManager] Failed to save registry:', error);
            throw error;
        }
    }

    async addProject(projectPath: string, configOverrides?: ProjectConfigOverrides): Promise<ProjectEntry> {
        await this.loadRegistry();

        const normalizedPath = path.resolve(projectPath);
        const name = path.basename(normalizedPath);
        const now = Date.now();

        // Check if project already exists
        const existingIndex = this.registry.projects.findIndex(p => p.path === normalizedPath);

        if (existingIndex !== -1) {
            // Update existing entry
            this.registry.projects[existingIndex].lastOpened = now;
            if (configOverrides) {
                this.registry.projects[existingIndex].configOverrides = {
                    ...this.registry.projects[existingIndex].configOverrides,
                    ...configOverrides
                };
            }

            // Move to front of list
            const [entry] = this.registry.projects.splice(existingIndex, 1);
            this.registry.projects.unshift(entry);

            await this.saveRegistry();
            return entry;
        }

        // Create new entry
        const entry: ProjectEntry = {
            path: normalizedPath,
            name,
            lastOpened: now,
            configOverrides
        };

        // Add to front and trim to max
        this.registry.projects.unshift(entry);
        if (this.registry.projects.length > MAX_RECENT_PROJECTS) {
            this.registry.projects = this.registry.projects.slice(0, MAX_RECENT_PROJECTS);
        }

        await this.saveRegistry();
        console.log('[ProjectManager] Added project:', normalizedPath);
        return entry;
    }

    async removeProject(projectPath: string): Promise<boolean> {
        await this.loadRegistry();

        const normalizedPath = path.resolve(projectPath);
        const initialLength = this.registry.projects.length;

        this.registry.projects = this.registry.projects.filter(p => p.path !== normalizedPath);

        if (this.registry.projects.length < initialLength) {
            await this.saveRegistry();
            console.log('[ProjectManager] Removed project:', normalizedPath);
            return true;
        }

        return false;
    }

    async getRecentProjects(limit: number = MAX_RECENT_PROJECTS): Promise<ProjectEntry[]> {
        await this.loadRegistry();

        // Sort by lastOpened descending and limit
        return this.registry.projects
            .slice()
            .sort((a, b) => b.lastOpened - a.lastOpened)
            .slice(0, limit);
    }

    async getProjectByPath(projectPath: string): Promise<ProjectEntry | null> {
        await this.loadRegistry();

        const normalizedPath = path.resolve(projectPath);
        return this.registry.projects.find(p => p.path === normalizedPath) || null;
    }

    async updateProjectSession(projectPath: string, sessionId: string): Promise<void> {
        await this.loadRegistry();

        const normalizedPath = path.resolve(projectPath);
        const project = this.registry.projects.find(p => p.path === normalizedPath);

        if (project) {
            project.lastSessionId = sessionId;
            await this.saveRegistry();
            console.log('[ProjectManager] Updated session for project:', normalizedPath, sessionId);
        }
    }

    async updateProjectConfig(projectPath: string, configOverrides: ProjectConfigOverrides): Promise<void> {
        await this.loadRegistry();

        const normalizedPath = path.resolve(projectPath);
        const project = this.registry.projects.find(p => p.path === normalizedPath);

        if (project) {
            project.configOverrides = {
                ...project.configOverrides,
                ...configOverrides
            };
            await this.saveRegistry();
            console.log('[ProjectManager] Updated config for project:', normalizedPath);
        }
    }

    async loadProjectConfig(projectPath: string): Promise<ProjectConfig | null> {
        const configPath = path.join(projectPath, '.sumerian', 'config.json');

        try {
            if (!existsSync(configPath)) {
                return null;
            }

            const content = await fs.readFile(configPath, 'utf-8');
            const config = JSON.parse(content);

            if (config.version === 1) {
                return config;
            }

            console.warn('[ProjectManager] Invalid project config version');
            return null;
        } catch (error) {
            console.error('[ProjectManager] Failed to load project config:', error);
            return null;
        }
    }

    async saveProjectConfig(projectPath: string, config: ProjectConfig): Promise<void> {
        const configDir = path.join(projectPath, '.sumerian');
        const configPath = path.join(configDir, 'config.json');

        try {
            if (!existsSync(configDir)) {
                await fs.mkdir(configDir, { recursive: true });
            }

            await fs.writeFile(configPath, JSON.stringify(config, null, 2));
            console.log('[ProjectManager] Saved project config:', configPath);
        } catch (error) {
            console.error('[ProjectManager] Failed to save project config:', error);
            throw error;
        }
    }

    async clearRegistry(): Promise<void> {
        this.registry = { version: 1, projects: [] };
        await this.saveRegistry();
        console.log('[ProjectManager] Registry cleared');
    }
}

// Singleton instance
export const projectManager = new ProjectManager();
