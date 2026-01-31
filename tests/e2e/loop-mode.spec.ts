import { test, expect } from '@playwright/test';

test.describe('Loop Mode', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000');
        await page.waitForSelector('[data-testid="app-loaded"]', { timeout: 10000 });
    });

    test('should start loop with /loop command', async ({ page }) => {
        const chatInput = page.locator('[data-testid="chat-input"]');
        await chatInput.fill('/loop "Run tests" --promise "DONE" --max 5');
        await chatInput.press('Enter');
        
        // Loop indicator should appear
        const loopIndicator = page.locator('[data-testid="loop-indicator"]');
        await expect(loopIndicator).toBeVisible({ timeout: 3000 });
    });

    test('should display iteration count', async ({ page }) => {
        const chatInput = page.locator('[data-testid="chat-input"]');
        await chatInput.fill('/loop "Test loop" --promise "COMPLETE" --max 3');
        await chatInput.press('Enter');
        
        const loopIndicator = page.locator('[data-testid="loop-indicator"]');
        await expect(loopIndicator).toBeVisible({ timeout: 3000 });
        
        // Check iteration display
        const iterationText = loopIndicator.locator('[data-testid="loop-iteration"]');
        await expect(iterationText).toContainText('1/3');
    });

    test('should cancel loop with cancel button', async ({ page }) => {
        const chatInput = page.locator('[data-testid="chat-input"]');
        await chatInput.fill('/loop "Long task" --promise "DONE" --max 20');
        await chatInput.press('Enter');
        
        const loopIndicator = page.locator('[data-testid="loop-indicator"]');
        await expect(loopIndicator).toBeVisible({ timeout: 3000 });
        
        // Click cancel button
        await loopIndicator.locator('[data-testid="cancel-loop-btn"]').click();
        
        // Loop indicator should disappear
        await expect(loopIndicator).not.toBeVisible({ timeout: 2000 });
    });

    test('should complete loop on promise detection', async ({ page }) => {
        const chatInput = page.locator('[data-testid="chat-input"]');
        await chatInput.fill('/loop "Quick task" --promise "SUCCESS" --max 10');
        await chatInput.press('Enter');
        
        const loopIndicator = page.locator('[data-testid="loop-indicator"]');
        await expect(loopIndicator).toBeVisible({ timeout: 3000 });
        
        // Wait for loop to complete (assuming agent outputs SUCCESS)
        await expect(loopIndicator).not.toBeVisible({ timeout: 30000 });
    });

    test('should stop at max iterations', async ({ page }) => {
        const chatInput = page.locator('[data-testid="chat-input"]');
        await chatInput.fill('/loop "Never completes" --promise "IMPOSSIBLE" --max 2');
        await chatInput.press('Enter');
        
        const loopIndicator = page.locator('[data-testid="loop-indicator"]');
        await expect(loopIndicator).toBeVisible({ timeout: 3000 });
        
        // Wait for max iterations to be reached
        await expect(loopIndicator).not.toBeVisible({ timeout: 15000 });
    });
});
