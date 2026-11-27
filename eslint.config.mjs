import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';

export default tseslint.config(
  { ignores: ['node_modules/', 'reports/', 'playwright-report/', 'test-results/', '.features-gen/'] },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
  },
  {
    files: ['tests/**/*.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      'playwright/no-focused-test': 'error',
      'playwright/no-wait-for-timeout': 'error',
      'playwright/expect-expect': ['error', { assertFunctionNames: ['expectBookingSchema', 'expectJson'] }],
    },
  },
  {
    // Steps do Cucumber rodam dentro dos testes gerados pelo playwright-bdd.
    files: ['tests/e2e/steps/**/*.ts'],
    rules: { 'playwright/no-standalone-expect': 'off' },
  },
  {
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: '^_', argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['**/*.mjs'],
    ...tseslint.configs.disableTypeChecked,
    languageOptions: {
      ...tseslint.configs.disableTypeChecked.languageOptions,
      globals: { console: 'readonly', process: 'readonly', fetch: 'readonly', setTimeout: 'readonly', URL: 'readonly' },
    },
  },
  {
    // Scripts do k6: rodam no runtime do k6, não no Node.
    files: ['load/k6/**/*.js'],
    ...tseslint.configs.disableTypeChecked,
    languageOptions: {
      ...tseslint.configs.disableTypeChecked.languageOptions,
      globals: { __ENV: 'readonly', __VU: 'readonly', __ITER: 'readonly' },
    },
  },
);
