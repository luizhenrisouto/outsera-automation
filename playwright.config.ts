import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const isCI = !!process.env.CI;

// Gera os specs do Playwright a partir das features em Gherkin (npx bddgen).
const e2eTestDir = defineBddConfig({
  features: 'tests/e2e/features/*.feature',
  steps: ['tests/e2e/steps/*.ts', 'src/e2e/fixtures.ts'],
  outputDir: '.features-gen/e2e',
  language: 'pt',
});

export default defineConfig({
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  fullyParallel: true,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/html', open: 'never' }],
    ['junit', { outputFile: 'reports/junit/results.xml' }],
    ['json', { outputFile: 'reports/json/results.json' }],
  ],
  outputDir: 'reports/artifacts',
  projects: [
    {
      name: 'api',
      testDir: './tests/api',
      use: {
        baseURL: process.env.API_BASE_URL ?? 'https://restful-booker.herokuapp.com',
        extraHTTPHeaders: { Accept: 'application/json' },
      },
    },
    {
      name: 'e2e',
      testDir: e2eTestDir,
      timeout: 60_000,
      use: {
        ...devices['Desktop Chrome'],
        actionTimeout: 15_000,
        navigationTimeout: 30_000,
        screenshot: 'on', // print de todo cenário, inclusive das falhas esperadas (bugs)
        video: 'retain-on-failure',
        trace: 'retain-on-failure',
      },
    },
  ],
});
