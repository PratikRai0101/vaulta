const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
module.exports = defineConfig([
  expoConfig,
  { ignores: ['android/**', 'ios/**', 'builds/**', 'dist/**'] },
  {
    files: ['src/**/*.{ts,tsx}', 'index.ts'],
    languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: __dirname } },
    rules: { '@typescript-eslint/no-floating-promises': 'error' },
  },
]);
