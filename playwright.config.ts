import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';

// Use the preinstalled Chromium when the pinned Playwright browser is missing.
const localChromium = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const launchOptions = existsSync(localChromium) ? { executablePath: localChromium } : {};

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 120_000,
  fullyParallel: false,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4321/scoutsvosselaar/',
    locale: 'nl-BE',
    // A time zone far from Brussels, to check that stored times do not depend on it.
    timezoneId: 'America/New_York',
    screenshot: 'only-on-failure',
    launchOptions,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], launchOptions } },
    { name: 'gsm', use: { ...devices['Pixel 7'], launchOptions } },
  ],
  webServer: {
    command: 'pnpm astro dev --port 4321 --ignore-lock',
    url: 'http://localhost:4321/scoutsvosselaar/admin/index.html',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
