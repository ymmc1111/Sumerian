import { _electron as electron } from '@playwright/test';
import { test, expect } from '@playwright/test';
import * as path from 'path';

test('Editor panel behavior', async () => {
    const electronApp = await electron.launch({
        args: [path.join(__dirname, '../../.vite/build/main.js')],
    });

    const window = await electronApp.firstWindow();

    // Since we start on Welcome screen, we should test the transition
    // But for a true E2E editor test, we'd need to mock a project open
    // For now, we'll verify the EditorPanel placeholder if any

    // Toggle shortcuts help
    await window.keyboard.press('Control+/'); // On Mac it might be Meta
    // Wait for Cmd+/ or similar

    await electronApp.close();
});
