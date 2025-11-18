import eslint from '@eslint/js';
import vitest from '@vitest/eslint-plugin';
import { defineConfig } from 'eslint/config';
import importPlugin from 'eslint-plugin-import';
import jestDom from 'eslint-plugin-jest-dom';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import testingLibrary from 'eslint-plugin-testing-library';
import tseslint from 'typescript-eslint';

export default defineConfig(
  {
    ignores: ['dist/', 'examples/', 'website/'],
  },
  eslint.configs.recommended,
  importPlugin.flatConfigs.recommended,
  tseslint.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
  reactHooks.configs.flat.recommended,
  {
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        typescript: true,
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.d.ts', '.mjs', '.cjs'],
        },
      },
    },
    rules: {
      eqeqeq: 'error',
      curly: ['warn', 'multi-line', 'consistent'],
      'sort-imports': [
        'error',
        {
          ignoreDeclarationSort: true,
        },
      ],
      'import/no-unresolved': ['error', { commonjs: true, amd: true }],
      'import/named': 'off',
      'import/namespace': 'off',
      'import/no-named-as-default-member': 'off',
      'import/no-duplicates': 'error',
      'import/extensions': [
        'error',
        'always',
        {
          ignorePackages: true,
          pattern: {
            js: 'never',
            jsx: 'never',
            ts: 'never',
            tsx: 'never',
            cjs: 'never',
            mjs: 'never',
          },
        },
      ],
      'import/order': [
        'error',
        {
          alphabetize: { order: 'asc', caseInsensitive: true },
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'object',
          ],
          'newlines-between': 'never',
          pathGroups: [],
          pathGroupsExcludedImportTypes: ['builtin'],
        },
      ],
      'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0, maxBOF: 0 }],
      'padded-blocks': ['error', 'never'],
      semi: ['error', 'always'],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-empty-object-type': [
        'error',
        {
          allowInterfaces: 'with-single-extends',
          allowWithName: 'Mutators$|Registry$',
        },
      ],
    },
  },
  {
    files: ['tests/**/*.{ts,tsx}'],
    ...testingLibrary.configs['flat/react'],
    ...jestDom.configs['flat/recommended'],
    ...vitest.configs.recommended,
    rules: {
      'import/extensions': ['error', 'never'],
      'vitest/consistent-test-it': [
        'error',
        { fn: 'it', withinDescribe: 'it' },
      ],
    },
  },
  {
    files: ['src/types/core.ts'],
    rules: {
      // Type parameters S and A in StoreMutators interface are required for interface merging.
      // Middleware files augment this interface and use these parameters. They cannot be prefixed
      // with _ because TypeScript requires identical parameter names for interface merging.
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  {
    files: ['src/middleware/**/*.ts'],
    rules: {
      // Type parameter A in StoreMutators interface declarations is required for interface merging.
      // It cannot be prefixed with _ because TypeScript requires identical parameter names for interface merging.
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
);
