/**
 * ESLint flat config.
 *
 * Формат eslint.config.js (flat config) вместо .eslintrc.cjs: в ESLint 9 eslintrc объявлен
 * устаревшим (печатает предупреждение при каждом запуске), а в ESLint 10 удалён полностью.
 * Проект закреплён на ESLint 9, потому что eslint-plugin-react@7.37 ещё не поддерживает ESLint 10;
 * flat config делает будущий переход на ESLint 10 простой сменой версии.
 *
 * Порядок блоков важен: eslint-config-prettier идёт последним и отключает все
 * стилистические правила, которые конфликтуют с Prettier.
 */
import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettierConfig from 'eslint-config-prettier/flat';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['dist', 'coverage']),

  {
    name: 'app/javascript',
    files: ['**/*.{js,mjs,cjs}'],
    extends: [js.configs.recommended],
    languageOptions: {
      globals: globals.node,
    },
  },

  {
    name: 'app/typescript',
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      eqeqeq: ['error', 'always'],
      // console.log запрещён везде; диагностика — только через src/utils/devLog.ts (DEV-only).
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },

  {
    name: 'app/react',
    files: ['src/**/*.{ts,tsx}'],
    extends: [
      react.configs.flat.recommended,
      react.configs.flat['jsx-runtime'],
      reactHooks.configs.flat.recommended,
      jsxA11y.flatConfigs.strict,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      // Пропсы проверяет TypeScript — рантайм-проверки prop-types не нужны.
      'react/prop-types': 'off',
      'react/button-has-type': 'error',
      'react/jsx-no-useless-fragment': 'error',
      'react/self-closing-comp': 'error',
      'react-hooks/exhaustive-deps': 'error',
    },
  },

  {
    name: 'app/dev-logger',
    files: ['src/utils/devLog.ts'],
    rules: {
      'no-console': 'off',
    },
  },

  prettierConfig,
]);
