import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: ['node_modules/**', 'dist/**', 'release/**', 'test-results/**', 'playwright-report/**']
  },
  {
    files: ['**/*.{js,cjs,mjs,ts,tsx}'],
    rules: {
      'max-lines': ['error', { max: 180, skipBlankLines: false, skipComments: false }],
      'max-len': ['error', { code: 120, comments: 120, tabWidth: 2 }]
    }
  },
  {
    files: ['electron/**/*.cjs', 'scripts/**/*.cjs', 'tests/**/*.cjs', '*.cjs'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'commonjs', globals: globals.node },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': 'off',
      'preserve-caught-error': 'off'
    }
  },
  {
    files: ['tests/e2e/**/*.cjs'],
    languageOptions: { globals: globals.browser }
  },
  {
    files: ['scripts/design/showcase-runtime.cjs'],
    languageOptions: { globals: globals.browser }
  },
  {
    files: ['src/**/*.{ts,tsx}', 'vite.config.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.node }
    },
    rules: { ...js.configs.recommended.rules, 'no-unused-vars': 'off', 'no-undef': 'off' }
  },
  {
    files: ['*.mjs'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: globals.node },
    rules: { ...js.configs.recommended.rules, 'no-unused-vars': 'off' }
  }
];
