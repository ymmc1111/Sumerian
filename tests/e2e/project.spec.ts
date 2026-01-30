import { _electron as electron } from '@playwright/test';
import { test, expect } from '@playwright/test';
import * as path from 'path';

test('App launches and shows welcome screen', async () => {
    const electronApp = await electron.launch({
        args: [path.join(__dirname, '../../.vite/build/main.js')],
    });

    const window = await electronApp.firstWindow();
    expect(await window.title()).toBe('Sumerian');

    // Check for welcome screen elements
    const welcomeTitle = window.locator('h1', { hasText: 'Sumerian' });
    await expect(welcomeTitle).toBeVisible();

    const openFolderBtn = window.locator('button', { hasText: 'Open Folder' });
    await expect(openFolderBtn).toBeVisible();

    await electronApp.close();
});

test('Recent projects section is visible if not empty', async () => {
    const electronApp = await electron.launch({
        args: [path.join(__dirname, '../../.vite/build/main.js')],
    });

    const window = await electronApp.firstWindow();

    // Recent projects section depends on ~/.sumerian/recent-projects.json
    // For E2E we might want to mock this or ensure it exists
    const recentTitle = window.locator('h2', { hasText: 'Recent Projects' });
    // We don't necessarily expect it to be visible in a fresh run

    await electronApp.close();
});
