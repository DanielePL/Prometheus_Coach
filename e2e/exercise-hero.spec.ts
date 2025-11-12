import { test, expect } from '@playwright/test';

test.describe('ExerciseHero Component', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to an exercise detail page with video
    // Adjust the URL to match an actual exercise ID in your database
    await page.goto('/exercise/1');
    await page.waitForLoadState('networkidle');
  });

  test('overlay and blur are always visible without hover @chromium @firefox @webkit', async ({ page, browserName }) => {
    const hero = page.locator('.aspect-video.rounded-3xl').first();
    await expect(hero).toBeVisible();

    // Check blur overlay is present
    const blurOverlay = page.locator('.backdrop-blur-sm.bg-gradient-to-t');
    await expect(blurOverlay).toBeVisible();
    
    // Verify overlay has correct opacity (always visible)
    const opacity = await blurOverlay.evaluate((el) => {
      return window.getComputedStyle(el).opacity;
    });
    expect(parseFloat(opacity)).toBeGreaterThan(0.9);

    // Take screenshot without hover to verify overlay is visible
    await expect(hero).toHaveScreenshot(`exercise-hero-no-hover-${browserName}.png`, {
      maxDiffPixels: 100,
    });
  });

  test('title text is white and visible @chromium @firefox @webkit', async ({ page }) => {
    const titleElement = page.locator('h2.text-white.font-heading');
    
    if (await titleElement.count() > 0) {
      await expect(titleElement).toBeVisible();
      
      // Verify text color is white
      const color = await titleElement.evaluate((el) => {
        return window.getComputedStyle(el).color;
      });
      // White is rgb(255, 255, 255)
      expect(color).toMatch(/rgb\(255,\s*255,\s*255\)/);
    }
  });

  test('play button is visible with white text @chromium @firefox @webkit', async ({ page }) => {
    const playButton = page.locator('button[aria-label="Play video"]');
    await expect(playButton).toBeVisible();

    // Check button text color
    const buttonText = playButton.locator('span.text-white');
    await expect(buttonText).toBeVisible();
    
    const textColor = await buttonText.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });
    expect(textColor).toMatch(/rgb\(255,\s*255,\s*255\)/);
  });

  test('video element has autoplay attributes @chromium @firefox @webkit', async ({ page }) => {
    const video = page.locator('video');
    
    if (await video.count() > 0) {
      await expect(video).toBeVisible();

      // Verify autoplay attributes
      const hasAutoplay = await video.evaluate((v: HTMLVideoElement) => v.hasAttribute('autoplay'));
      const isMuted = await video.evaluate((v: HTMLVideoElement) => v.muted);
      const isPlaysInline = await video.evaluate((v: HTMLVideoElement) => v.hasAttribute('playsinline'));
      const isLoop = await video.evaluate((v: HTMLVideoElement) => v.loop);

      expect(hasAutoplay).toBeTruthy();
      expect(isMuted).toBeTruthy();
      expect(isPlaysInline).toBeTruthy();
      expect(isLoop).toBeTruthy();

      // Check if video is actually playing (may fail due to autoplay policies)
      await page.waitForTimeout(1000);
      const isPaused = await video.evaluate((v: HTMLVideoElement) => v.paused);
      
      // Note: Autoplay might be blocked in some browsers/CI environments
      // This is informational rather than a hard requirement
      if (!isPaused) {
        console.log('✓ Video is autoplaying');
      } else {
        console.log('⚠ Video autoplay was blocked (expected in some environments)');
      }
    }
  });

  test('visual regression: hero appearance is consistent @chromium @firefox @webkit', async ({ page, browserName }) => {
    const hero = page.locator('.aspect-video.rounded-3xl').first();
    await expect(hero).toBeVisible();

    // Wait for any animations to settle
    await page.waitForTimeout(500);

    // Take full screenshot for visual regression
    await expect(hero).toHaveScreenshot(`exercise-hero-full-${browserName}.png`, {
      maxDiffPixels: 150,
    });
  });

  test('blur gradient is visible at bottom @chromium @firefox @webkit', async ({ page }) => {
    const blurOverlay = page.locator('.backdrop-blur-sm.bg-gradient-to-t');
    await expect(blurOverlay).toBeVisible();

    // Check positioning
    const box = await blurOverlay.boundingBox();
    expect(box).toBeTruthy();
    
    // Verify it's at the bottom of the hero
    const classList = await blurOverlay.evaluate((el) => el.className);
    expect(classList).toContain('bottom-0');
    expect(classList).toContain('inset-x-0');
  });
});
