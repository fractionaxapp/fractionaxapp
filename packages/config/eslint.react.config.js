// Shared ESLint flat config for React / Next.js projects. Extends the base config.
// Uses @eslint-react (the modern, eslint-10-compatible rewrite of eslint-plugin-react)
// plus the official eslint-plugin-react-hooks for the core hooks rules.
import eslintReact from '@eslint-react/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import base from './eslint.config.js';

export default [
  ...base,
  {
    files: ['**/*.{jsx,tsx}'],
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  // @eslint-react component/JSX rules (TypeScript variant — no type info required).
  {
    files: ['**/*.{jsx,tsx}'],
    ...eslintReact.configs['recommended-typescript'],
  },
  // Official React Hooks rules (rules-of-hooks, exhaustive-deps, ...). Its
  // recommended config still ships eslintrc-style `plugins: ['react-hooks']`,
  // so register the plugin explicitly and take only the rules.
  {
    files: ['**/*.{jsx,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs['recommended-latest'].rules,
  },
];
