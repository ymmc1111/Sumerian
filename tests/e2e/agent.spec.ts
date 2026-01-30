import { _electron as electron } from '@playwright/test';
import { test, expect } from '@playwright/test';
import * as path from 'path';

test('Agent panel interactions', async () => {
    const electronApp = await electron.launch({
        args: [path.join(__dirname, '../../.vite/build/main.js')],
    });

    const window = await electronApp.firstWindow();

    // Verify agent panel is not visible on welcome screen if layout is different
    // Our App.tsx currently renders WelcomeScreen OR the IDE layout.
    // So on Welcome screen, AgentPanel is NOT rendered.

    const agentPanel = window.locator('div', { hasText: 'Claude CLI Backend' });
    await expect(agentPanel).not.toBeVisible();

    await electronApp.close();
});
