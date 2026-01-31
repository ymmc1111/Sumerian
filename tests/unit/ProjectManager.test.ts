import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ProjectManager } from '../../src/main/projects/ProjectManager';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

const TEST_REGISTRY_DIR = path.join(os.tmpdir(), '.sumerian-test-' + Date.now());
const TEST_REGISTRY_PATH = path.join(TEST_REGISTRY_DIR, 'projects.json');

describe('ProjectManager', () => {
    let projectManager: ProjectManager;

    beforeEach(async () => {
        // Create test directory
        await fs.mkdir(TEST_REGISTRY_DIR, { recursive: true });
        
        // Mock the registry path
        projectManager = new ProjectManager();
        (projectManager as any).REGISTRY_FILE = TEST_REGISTRY_PATH;
    });

    afterEach(async () => {
        // Clean up test directory
        try {
            await fs.rm(TEST_REGISTRY_DIR, { recursive: true, force: true });
        } catch (error) {
            // Ignore cleanup errors
        }
    });

    describe('loadRegistry', () => {
        it('should create empty registry if file does not exist', async () => {
            const registry = await projectManager.loadRegistry();
            
            expect(registry).toEqual({
                version: 1,
                projects: []
            });
        });

        it('should load existing registry from file', async () => {
            const mockRegistry = {
                version: 1,
                projects: [
                    {
                        path: '/test/project',
                        name: 'project',
                        lastOpened: Date.now()
                    }
                ]
            };

            await fs.writeFile(TEST_REGISTRY_PATH, JSON.stringify(mockRegistry));
            const registry = await projectManager.loadRegistry();

            expect(registry.version).toBe(1);
            expect(registry.projects).toHaveLength(1);
            expect(registry.projects[0].path).toBe('/test/project');
        });

        it('should reset registry if format is invalid', async () => {
            await fs.writeFile(TEST_REGISTRY_PATH, JSON.stringify({ invalid: 'data' }));
            const registry = await projectManager.loadRegistry();

            expect(registry).toEqual({
                version: 1,
                projects: []
            });
        });

        it('should handle corrupted JSON gracefully', async () => {
            await fs.writeFile(TEST_REGISTRY_PATH, 'invalid json {');
            const registry = await projectManager.loadRegistry();

            expect(registry).toEqual({
                version: 1,
                projects: []
            });
        });
    });

    describe('addProject', () => {
        it('should add new project to registry', async () => {
            const projectPath = '/test/new-project';
            const entry = await projectManager.addProject(projectPath);

            expect(entry.path).toBe(projectPath);
            expect(entry.name).toBe('new-project');
            expect(entry.lastOpened).toBeGreaterThan(0);
        });

        it('should update existing project timestamp', async () => {
            const projectPath = '/test/existing-project';
            
            const firstEntry = await projectManager.addProject(projectPath);
            await new Promise(resolve => setTimeout(resolve, 10));
            const secondEntry = await projectManager.addProject(projectPath);

            expect(secondEntry.lastOpened).toBeGreaterThan(firstEntry.lastOpened);
        });

        it('should move updated project to front of list', async () => {
            await projectManager.addProject('/test/project-1');
            await projectManager.addProject('/test/project-2');
            await projectManager.addProject('/test/project-1'); // Re-add first project

            const projects = await projectManager.getRecentProjects();
            expect(projects[0].path).toBe('/test/project-1');
        });

        it('should limit registry to max projects', async () => {
            // Add 12 projects (max is 10)
            for (let i = 1; i <= 12; i++) {
                await projectManager.addProject(`/test/project-${i}`);
            }

            const projects = await projectManager.getRecentProjects();
            expect(projects.length).toBe(10);
            expect(projects[0].path).toBe('/test/project-12');
        });

        it('should merge config overrides for existing projects', async () => {
            const projectPath = '/test/project';
            
            await projectManager.addProject(projectPath, { braveMode: true });
            await projectManager.addProject(projectPath, { model: 'claude-opus' });

            const project = await projectManager.getProjectByPath(projectPath);
            expect(project?.configOverrides?.braveMode).toBe(true);
            expect(project?.configOverrides?.model).toBe('claude-opus');
        });

        it('should normalize project paths', async () => {
            const entry = await projectManager.addProject('/test/../test/project');
            expect(entry.path).toBe('/test/project');
        });
    });

    describe('removeProject', () => {
        it('should remove project from registry', async () => {
            const projectPath = '/test/project-to-remove';
            await projectManager.addProject(projectPath);

            const removed = await projectManager.removeProject(projectPath);
            expect(removed).toBe(true);

            const project = await projectManager.getProjectByPath(projectPath);
            expect(project).toBeNull();
        });

        it('should return false if project does not exist', async () => {
            const removed = await projectManager.removeProject('/test/nonexistent');
            expect(removed).toBe(false);
        });

        it('should normalize path when removing', async () => {
            await projectManager.addProject('/test/project');
            const removed = await projectManager.removeProject('/test/../test/project');
            expect(removed).toBe(true);
        });
    });

    describe('getRecentProjects', () => {
        it('should return projects sorted by last opened', async () => {
            const now = Date.now();
            
            await projectManager.addProject('/test/old-project');
            await new Promise(resolve => setTimeout(resolve, 10));
            await projectManager.addProject('/test/new-project');

            const projects = await projectManager.getRecentProjects();
            expect(projects[0].path).toBe('/test/new-project');
            expect(projects[1].path).toBe('/test/old-project');
        });

        it('should respect limit parameter', async () => {
            for (let i = 1; i <= 5; i++) {
                await projectManager.addProject(`/test/project-${i}`);
            }

            const projects = await projectManager.getRecentProjects(3);
            expect(projects.length).toBe(3);
        });

        it('should return empty array if no projects', async () => {
            const projects = await projectManager.getRecentProjects();
            expect(projects).toEqual([]);
        });
    });

    describe('getProjectByPath', () => {
        it('should return project if exists', async () => {
            const projectPath = '/test/find-me';
            await projectManager.addProject(projectPath);

            const project = await projectManager.getProjectByPath(projectPath);
            expect(project).not.toBeNull();
            expect(project?.path).toBe(projectPath);
        });

        it('should return null if project does not exist', async () => {
            const project = await projectManager.getProjectByPath('/test/nonexistent');
            expect(project).toBeNull();
        });

        it('should normalize path when searching', async () => {
            await projectManager.addProject('/test/project');
            const project = await projectManager.getProjectByPath('/test/../test/project');
            expect(project).not.toBeNull();
        });
    });

    describe('updateProjectSession', () => {
        it('should update session ID for project', async () => {
            const projectPath = '/test/project';
            await projectManager.addProject(projectPath);

            await projectManager.updateProjectSession(projectPath, 'session-123');

            const project = await projectManager.getProjectByPath(projectPath);
            expect(project?.lastSessionId).toBe('session-123');
        });

        it('should not throw if project does not exist', async () => {
            await expect(
                projectManager.updateProjectSession('/test/nonexistent', 'session-123')
            ).resolves.not.toThrow();
        });
    });

    describe('updateProjectConfig', () => {
        it('should update config overrides for project', async () => {
            const projectPath = '/test/project';
            await projectManager.addProject(projectPath);

            await projectManager.updateProjectConfig(projectPath, {
                braveMode: true,
                model: 'claude-sonnet'
            });

            const project = await projectManager.getProjectByPath(projectPath);
            expect(project?.configOverrides?.braveMode).toBe(true);
            expect(project?.configOverrides?.model).toBe('claude-sonnet');
        });

        it('should merge with existing config overrides', async () => {
            const projectPath = '/test/project';
            await projectManager.addProject(projectPath, { braveMode: true });

            await projectManager.updateProjectConfig(projectPath, {
                model: 'claude-opus'
            });

            const project = await projectManager.getProjectByPath(projectPath);
            expect(project?.configOverrides?.braveMode).toBe(true);
            expect(project?.configOverrides?.model).toBe('claude-opus');
        });
    });

    describe('loadProjectConfig', () => {
        it('should return null if config file does not exist', async () => {
            const config = await projectManager.loadProjectConfig('/test/no-config');
            expect(config).toBeNull();
        });

        it('should load valid project config', async () => {
            const projectPath = path.join(TEST_REGISTRY_DIR, 'test-project');
            const configDir = path.join(projectPath, '.sumerian');
            const configPath = path.join(configDir, 'config.json');

            await fs.mkdir(configDir, { recursive: true });
            await fs.writeFile(configPath, JSON.stringify({
                version: 1,
                braveMode: true,
                model: 'claude-opus'
            }));

            const config = await projectManager.loadProjectConfig(projectPath);
            expect(config).not.toBeNull();
            expect(config?.braveMode).toBe(true);
            expect(config?.model).toBe('claude-opus');
        });

        it('should return null for invalid version', async () => {
            const projectPath = path.join(TEST_REGISTRY_DIR, 'test-project');
            const configDir = path.join(projectPath, '.sumerian');
            const configPath = path.join(configDir, 'config.json');

            await fs.mkdir(configDir, { recursive: true });
            await fs.writeFile(configPath, JSON.stringify({
                version: 999,
                braveMode: true
            }));

            const config = await projectManager.loadProjectConfig(projectPath);
            expect(config).toBeNull();
        });

        it('should handle corrupted config gracefully', async () => {
            const projectPath = path.join(TEST_REGISTRY_DIR, 'test-project');
            const configDir = path.join(projectPath, '.sumerian');
            const configPath = path.join(configDir, 'config.json');

            await fs.mkdir(configDir, { recursive: true });
            await fs.writeFile(configPath, 'invalid json {');

            const config = await projectManager.loadProjectConfig(projectPath);
            expect(config).toBeNull();
        });
    });

    describe('saveProjectConfig', () => {
        it('should save project config to file', async () => {
            const projectPath = path.join(TEST_REGISTRY_DIR, 'test-project');
            const config = {
                version: 1 as const,
                braveMode: true,
                model: 'claude-opus'
            };

            await projectManager.saveProjectConfig(projectPath, config);

            const configPath = path.join(projectPath, '.sumerian', 'config.json');
            const savedContent = await fs.readFile(configPath, 'utf-8');
            const savedConfig = JSON.parse(savedContent);

            expect(savedConfig.version).toBe(1);
            expect(savedConfig.braveMode).toBe(true);
            expect(savedConfig.model).toBe('claude-opus');
        });

        it('should create .sumerian directory if it does not exist', async () => {
            const projectPath = path.join(TEST_REGISTRY_DIR, 'new-project');
            const config = { version: 1 as const };

            await projectManager.saveProjectConfig(projectPath, config);

            const configDir = path.join(projectPath, '.sumerian');
            const exists = await fs.access(configDir).then(() => true).catch(() => false);
            expect(exists).toBe(true);
        });
    });

    describe('clearRegistry', () => {
        it('should remove all projects from registry', async () => {
            await projectManager.addProject('/test/project-1');
            await projectManager.addProject('/test/project-2');

            await projectManager.clearRegistry();

            const projects = await projectManager.getRecentProjects();
            expect(projects).toEqual([]);
        });
    });
});
