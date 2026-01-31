import { _electron as electron } from '@playwright/test';
import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';

const REGISTRY_PATH = path.join(os.homedir(), '.sumerian', 'projects.json');

test.describe('Project Management', () => {
    test.beforeEach(async () => {
        // Clean up registry before each test
        try {
            await fs.unlink(REGISTRY_PATH);
        } catch (error) {
            // Ignore if file doesn't exist
        }
    });

    test('App launches and shows welcome screen', async () => {
        const electronApp = await electron.launch({
            args: [path.join(__dirname, '../../.vite/build/main.js')],
        });

        const window = await electronApp.firstWindow();
        expect(await window.title()).toBe('Sumerian');

        const welcomeTitle = window.locator('h1', { hasText: 'Sumerian' });
        await expect(welcomeTitle).toBeVisible();

        const openFolderBtn = window.locator('button', { hasText: 'Open Folder' });
        await expect(openFolderBtn).toBeVisible();

        await electronApp.close();
    });

    test('Project switcher opens with Cmd+O', async () => {
        const electronApp = await electron.launch({
            args: [path.join(__dirname, '../../.vite/build/main.js')],
        });

        const window = await electronApp.firstWindow();

        // Wait for app to be ready
        await window.waitForLoadState('domcontentloaded');

        // Press Cmd+O to open project switcher
        await window.keyboard.press('Meta+O');

        // Check if project switcher modal is visible
        const switcherTitle = window.locator('h2', { hasText: 'Switch Project' });
        await expect(switcherTitle).toBeVisible({ timeout: 5000 });

        // Check for search input
        const searchInput = window.locator('input[placeholder*="Search projects"]');
        await expect(searchInput).toBeVisible();

        // Check for Browse button
        const browseBtn = window.locator('button', { hasText: 'Browse' });
        await expect(browseBtn).toBeVisible();

        await electronApp.close();
    });

    test('Project switcher closes with Escape key', async () => {
        const electronApp = await electron.launch({
            args: [path.join(__dirname, '../../.vite/build/main.js')],
        });

        const window = await electronApp.firstWindow();
        await window.waitForLoadState('domcontentloaded');

        // Open project switcher
        await window.keyboard.press('Meta+O');
        const switcherTitle = window.locator('h2', { hasText: 'Switch Project' });
        await expect(switcherTitle).toBeVisible();

        // Close with Escape
        await window.keyboard.press('Escape');
        await expect(switcherTitle).not.toBeVisible({ timeout: 2000 });

        await electronApp.close();
    });

    test('Search filters projects correctly', async () => {
        // Create mock registry with multiple projects
        const mockRegistry = {
            version: 1,
            projects: [
                {
                    path: '/Users/test/project-alpha',
                    name: 'project-alpha',
                    lastOpened: Date.now() - 1000
                },
                {
                    path: '/Users/test/project-beta',
                    name: 'project-beta',
                    lastOpened: Date.now() - 2000
                },
                {
                    path: '/Users/test/workspace-gamma',
                    name: 'workspace-gamma',
                    lastOpened: Date.now() - 3000
                }
            ]
        };

        await fs.mkdir(path.dirname(REGISTRY_PATH), { recursive: true });
        await fs.writeFile(REGISTRY_PATH, JSON.stringify(mockRegistry, null, 2));

        const electronApp = await electron.launch({
            args: [path.join(__dirname, '../../.vite/build/main.js')],
        });

        const window = await electronApp.firstWindow();
        await window.waitForLoadState('domcontentloaded');

        // Open project switcher
        await window.keyboard.press('Meta+O');
        
        const searchInput = window.locator('input[placeholder*="Search projects"]');
        await expect(searchInput).toBeVisible();

        // Search for "alpha"
        await searchInput.fill('alpha');
        await window.waitForTimeout(300);

        // Should show only project-alpha
        const alphaProject = window.locator('text=project-alpha');
        await expect(alphaProject).toBeVisible();

        const betaProject = window.locator('text=project-beta');
        await expect(betaProject).not.toBeVisible();

        await electronApp.close();
    });

    test('Keyboard navigation works in project list', async () => {
        const mockRegistry = {
            version: 1,
            projects: [
                {
                    path: '/Users/test/project-1',
                    name: 'project-1',
                    lastOpened: Date.now() - 1000
                },
                {
                    path: '/Users/test/project-2',
                    name: 'project-2',
                    lastOpened: Date.now() - 2000
                }
            ]
        };

        await fs.mkdir(path.dirname(REGISTRY_PATH), { recursive: true });
        await fs.writeFile(REGISTRY_PATH, JSON.stringify(mockRegistry, null, 2));

        const electronApp = await electron.launch({
            args: [path.join(__dirname, '../../.vite/build/main.js')],
        });

        const window = await electronApp.firstWindow();
        await window.waitForLoadState('domcontentloaded');

        // Open project switcher
        await window.keyboard.press('Meta+O');
        await window.waitForTimeout(500);

        // First item should be selected by default
        const firstProject = window.locator('button').filter({ hasText: 'project-1' }).first();
        await expect(firstProject).toHaveClass(/bg-nexus-accent\/10/);

        // Press ArrowDown to select second item
        await window.keyboard.press('ArrowDown');
        await window.waitForTimeout(200);

        const secondProject = window.locator('button').filter({ hasText: 'project-2' }).first();
        await expect(secondProject).toHaveClass(/bg-nexus-accent\/10/);

        // Press ArrowUp to go back to first item
        await window.keyboard.press('ArrowUp');
        await window.waitForTimeout(200);
        await expect(firstProject).toHaveClass(/bg-nexus-accent\/10/);

        await electronApp.close();
    });

    test('Recent projects are sorted by last opened', async () => {
        const now = Date.now();
        const mockRegistry = {
            version: 1,
            projects: [
                {
                    path: '/Users/test/old-project',
                    name: 'old-project',
                    lastOpened: now - 86400000 // 1 day ago
                },
                {
                    path: '/Users/test/recent-project',
                    name: 'recent-project',
                    lastOpened: now - 3600000 // 1 hour ago
                },
                {
                    path: '/Users/test/newest-project',
                    name: 'newest-project',
                    lastOpened: now - 60000 // 1 minute ago
                }
            ]
        };

        await fs.mkdir(path.dirname(REGISTRY_PATH), { recursive: true });
        await fs.writeFile(REGISTRY_PATH, JSON.stringify(mockRegistry, null, 2));

        const electronApp = await electron.launch({
            args: [path.join(__dirname, '../../.vite/build/main.js')],
        });

        const window = await electronApp.firstWindow();
        await window.waitForLoadState('domcontentloaded');

        // Open project switcher
        await window.keyboard.press('Meta+O');
        await window.waitForTimeout(500);

        // Get all project buttons
        const projectButtons = window.locator('button').filter({ hasText: /project/ });
        const count = await projectButtons.count();
        expect(count).toBeGreaterThan(0);

        // First project should be the newest
        const firstProjectText = await projectButtons.first().textContent();
        expect(firstProjectText).toContain('newest-project');

        await electronApp.close();
    });

    test('Project removal works correctly', async () => {
        const mockRegistry = {
            version: 1,
            projects: [
                {
                    path: '/Users/test/project-to-remove',
                    name: 'project-to-remove',
                    lastOpened: Date.now()
                }
            ]
        };

        await fs.mkdir(path.dirname(REGISTRY_PATH), { recursive: true });
        await fs.writeFile(REGISTRY_PATH, JSON.stringify(mockRegistry, null, 2));

        const electronApp = await electron.launch({
            args: [path.join(__dirname, '../../.vite/build/main.js')],
        });

        const window = await electronApp.firstWindow();
        await window.waitForLoadState('domcontentloaded');

        // Open project switcher
        await window.keyboard.press('Meta+O');
        await window.waitForTimeout(500);

        // Find and click the remove button (X icon)
        const removeButton = window.locator('button[title="Remove from recent"]').first();
        await expect(removeButton).toBeVisible();
        await removeButton.click();

        // Wait for removal to complete
        await window.waitForTimeout(500);

        // Project should no longer be visible
        const projectText = window.locator('text=project-to-remove');
        await expect(projectText).not.toBeVisible();

        // Should show empty state
        const emptyMessage = window.locator('text=No recent projects');
        await expect(emptyMessage).toBeVisible();

        await electronApp.close();
    });

    test('Last opened timestamp displays correctly', async () => {
        const now = Date.now();
        const mockRegistry = {
            version: 1,
            projects: [
                {
                    path: '/Users/test/recent-project',
                    name: 'recent-project',
                    lastOpened: now - 120000 // 2 minutes ago
                }
            ]
        };

        await fs.mkdir(path.dirname(REGISTRY_PATH), { recursive: true });
        await fs.writeFile(REGISTRY_PATH, JSON.stringify(mockRegistry, null, 2));

        const electronApp = await electron.launch({
            args: [path.join(__dirname, '../../.vite/build/main.js')],
        });

        const window = await electronApp.firstWindow();
        await window.waitForLoadState('domcontentloaded');

        // Open project switcher
        await window.keyboard.press('Meta+O');
        await window.waitForTimeout(500);

        // Check for timestamp display
        const timestamp = window.locator('text=/\\d+m ago/');
        await expect(timestamp).toBeVisible();

        await electronApp.close();
    });
});
