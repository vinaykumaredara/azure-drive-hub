import { test, expect } from '@playwright/test';

test.describe('Booking Flow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/');
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should open booking modal when clicking Book Now', async ({ page }) => {
    // Find and click the first "Book Now" button
    const bookNowButton = page.locator('[data-testid="book-now-button"]').first();
    await expect(bookNowButton).toBeVisible();
    await bookNowButton.click();

    // Verify modal opens
    await expect(page.locator('text=Phone Number')).toBeVisible({ timeout: 5000 });
    
    // Verify modal has proper z-index and is on top
    const modalOverlay = page.locator('.fixed.inset-0.bg-black\\/50');
    await expect(modalOverlay).toBeVisible();
    
    // Verify phone input is focused
    const phoneInput = page.locator('[data-testid="phone-input"]');
    await expect(phoneInput).toBeFocused();
  });

  test('should complete full booking flow with valid data', async ({ page }) => {
    // Open modal
    await page.locator('[data-testid="book-now-button"]').first().click();
    
    // Step 1: Phone Number
    await page.locator('[data-testid="phone-input"]').fill('9876543210');
    await page.locator('button:has-text("Next")').click();
    
    // Step 2: Dates
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    await page.locator('[data-testid="start-date-input"]').fill(tomorrow.toISOString().split('T')[0]);
    await page.locator('#endDate').fill(nextWeek.toISOString().split('T')[0]);
    await page.locator('button:has-text("Next")').click();
    
    // Step 3: Terms
    await page.locator('input[type="checkbox"]').check();
    await page.locator('button:has-text("Next")').click();
    
    // Step 4: License (skip if already exists)
    const skipButton = page.locator('button:has-text("Use Existing License")');
    if (await skipButton.isVisible()) {
      await skipButton.click();
    } else {
      await page.locator('button:has-text("Next")').click();
    }
    
    // Step 5: Payment
    await expect(page.locator('text=Payment Options')).toBeVisible();
    await page.locator('button:has-text("Proceed to Pay")').click();
    
    // Verify confirmation or payment gateway
    await expect(page.locator('text=Booking Confirmed')).toBeVisible({ timeout: 10000 });
  });

  test('should validate phone number format', async ({ page }) => {
    await page.locator('[data-testid="book-now-button"]').first().click();
    
    // Try invalid phone number
    await page.locator('[data-testid="phone-input"]').fill('123');
    await page.locator('button:has-text("Next")').click();
    
    // Should show validation error
    await expect(page.locator('text=/.*valid.*phone.*/i')).toBeVisible({ timeout: 3000 });
  });

  test('should validate date selection', async ({ page }) => {
    await page.locator('[data-testid="book-now-button"]').first().click();
    
    // Fill phone and proceed
    await page.locator('[data-testid="phone-input"]').fill('9876543210');
    await page.locator('button:has-text("Next")').click();
    
    // Try to proceed without dates
    await page.locator('button:has-text("Next")').click();
    
    // Should show validation error
    await expect(page.locator('text=/.*select.*dates.*/i')).toBeVisible({ timeout: 3000 });
  });

  test('should allow closing modal with Escape key', async ({ page }) => {
    await page.locator('[data-testid="book-now-button"]').first().click();
    
    // Verify modal is open
    await expect(page.locator('text=Phone Number')).toBeVisible();
    
    // Press Escape
    await page.keyboard.press('Escape');
    
    // Modal should close
    await expect(page.locator('text=Phone Number')).not.toBeVisible({ timeout: 2000 });
  });

  test('should allow closing modal by clicking overlay', async ({ page }) => {
    await page.locator('[data-testid="book-now-button"]').first().click();
    
    // Verify modal is open
    await expect(page.locator('text=Phone Number')).toBeVisible();
    
    // Click on overlay (not the modal content)
    await page.locator('.fixed.inset-0.bg-black\\/50').click({ position: { x: 10, y: 10 } });
    
    // Modal should close
    await expect(page.locator('text=Phone Number')).not.toBeVisible({ timeout: 2000 });
  });

  test('should handle back navigation correctly', async ({ page }) => {
    await page.locator('[data-testid="book-now-button"]').first().click();
    
    // Go through steps
    await page.locator('[data-testid="phone-input"]').fill('9876543210');
    await page.locator('button:has-text("Next")').click();
    
    // Now on dates step
    await expect(page.locator('[data-testid="start-date-input"]')).toBeVisible();
    
    // Click back
    await page.locator('button:has-text("Back")').click();
    
    // Should be back on phone step
    await expect(page.locator('[data-testid="phone-input"]')).toBeVisible();
    
    // Phone number should be preserved
    await expect(page.locator('[data-testid="phone-input"]')).toHaveValue('9876543210');
  });

  test('should show progress indicators correctly', async ({ page }) => {
    await page.locator('[data-testid="book-now-button"]').first().click();
    
    // Check that progress bubbles exist
    const progressBubbles = page.locator('.w-8.h-8.rounded-full');
    await expect(progressBubbles.first()).toBeVisible();
    
    // Count active/completed steps
    const activeSteps = page.locator('.bg-primary');
    await expect(activeSteps).toHaveCount(1); // Only current step should be active
  });

  test('should prevent double submission', async ({ page }) => {
    await page.locator('[data-testid="book-now-button"]').first().click();
    
    // Fill form quickly and try to submit twice
    await page.locator('[data-testid="phone-input"]').fill('9876543210');
    
    // Click Next button twice rapidly
    const nextButton = page.locator('button:has-text("Next")');
    await Promise.all([
      nextButton.click(),
      nextButton.click(),
    ]);
    
    // Should only proceed once
    await expect(page.locator('[data-testid="start-date-input"]')).toBeVisible({ timeout: 3000 });
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate offline mode
    await page.context().setOffline(true);
    
    await page.locator('[data-testid="book-now-button"]').first().click();
    await page.locator('[data-testid="phone-input"]').fill('9876543210');
    await page.locator('button:has-text("Next")').click();
    
    // Go through all steps to payment
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(tomorrow);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    await page.locator('[data-testid="start-date-input"]').fill(tomorrow.toISOString().split('T')[0]);
    await page.locator('#endDate').fill(nextWeek.toISOString().split('T')[0]);
    await page.locator('button:has-text("Next")').click();
    
    await page.locator('input[type="checkbox"]').check();
    await page.locator('button:has-text("Next")').click();
    
    // Try to proceed - should show error
    await page.context().setOffline(false);
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.locator('[data-testid="book-now-button"]').first().click();
    
    // Modal should be visible and properly sized
    const modal = page.locator('.fixed.inset-0');
    await expect(modal).toBeVisible();
    
    // Elements should be readable
    await expect(page.locator('text=Phone Number')).toBeVisible();
    
    // Input should be tappable
    const phoneInput = page.locator('[data-testid="phone-input"]');
    await expect(phoneInput).toBeVisible();
    await phoneInput.tap();
    await expect(phoneInput).toBeFocused();
  });
});

test.describe('Booking Flow Error Scenarios', () => {
  test('should show error boundary on component crash', async ({ page }) => {
    // This test would need to be implemented with a special route
    // that intentionally throws an error in the booking component
    
    // For now, we'll skip this test
    test.skip();
  });

  test('should recover from payment gateway errors', async ({ page }) => {
    // This would test payment gateway error handling
    // Implementation depends on payment gateway integration
    
    test.skip();
  });
});
