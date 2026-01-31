import { test, expect } from '@playwright/test';

test.describe('Workforce Management', () => {
    test.beforeEach(async ({ page }) => {
        // Assuming app is running on localhost:3000
        await page.goto('http://localhost:3000');
        // Wait for app to load
        await page.waitForSelector('[data-testid="app-loaded"]', { timeout: 10000 });
    });

    test('should display workforce tab in sidebar', async ({ page }) => {
        const workforceTab = page.locator('[data-testid="workforce-tab"]');
        await expect(workforceTab).toBeVisible();
    });

    test('should show empty state when no agents active', async ({ page }) => {
        await page.click('[data-testid="workforce-tab"]');
        const emptyState = page.locator('[data-testid="workforce-empty-state"]');
        await expect(emptyState).toBeVisible();
    });

    test('should spawn agent with /spawn command', async ({ page }) => {
        const chatInput = page.locator('[data-testid="chat-input"]');
        await chatInput.fill('/spawn builder "Create test file"');
        await chatInput.press('Enter');
        
        // Wait for agent card to appear
        const agentCard = page.locator('[data-testid="agent-card"]');
        await expect(agentCard).toBeVisible({ timeout: 5000 });
    });

    test('should display agent status in workforce panel', async ({ page }) => {
        await page.click('[data-testid="workforce-tab"]');
        
        // Spawn an agent
        const chatInput = page.locator('[data-testid="chat-input"]');
        await chatInput.fill('/spawn builder "Test task"');
        await chatInput.press('Enter');
        
        // Check agent appears in workforce panel
        const agentCard = page.locator('[data-testid="agent-card"]').first();
        await expect(agentCard).toBeVisible({ timeout: 5000 });
        
        // Verify agent details
        await expect(agentCard.locator('[data-testid="agent-persona"]')).toContainText('builder');
        await expect(agentCard.locator('[data-testid="agent-task"]')).toContainText('Test task');
    });

    test('should terminate agent with kill button', async ({ page }) => {
        await page.click('[data-testid="workforce-tab"]');
        
        // Spawn an agent
        const chatInput = page.locator('[data-testid="chat-input"]');
        await chatInput.fill('/spawn builder "Test task"');
        await chatInput.press('Enter');
        
        // Wait for agent card
        const agentCard = page.locator('[data-testid="agent-card"]').first();
        await expect(agentCard).toBeVisible({ timeout: 5000 });
        
        // Click kill button
        await agentCard.locator('[data-testid="kill-agent-btn"]').click();
        
        // Agent should be removed
        await expect(agentCard).not.toBeVisible({ timeout: 3000 });
    });

    test('should halt all agents with halt all button', async ({ page }) => {
        await page.click('[data-testid="workforce-tab"]');
        
        // Spawn multiple agents
        const chatInput = page.locator('[data-testid="chat-input"]');
        await chatInput.fill('/spawn builder "Task 1"');
        await chatInput.press('Enter');
        await page.waitForTimeout(500);
        await chatInput.fill('/spawn tester "Task 2"');
        await chatInput.press('Enter');
        
        // Wait for agents to appear
        await expect(page.locator('[data-testid="agent-card"]')).toHaveCount(2, { timeout: 5000 });
        
        // Click halt all
        await page.click('[data-testid="halt-all-btn"]');
        
        // Confirm dialog
        page.on('dialog', dialog => dialog.accept());
        
        // All agents should be removed
        await expect(page.locator('[data-testid="agent-card"]')).toHaveCount(0, { timeout: 3000 });
    });
});
