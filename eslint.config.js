import eslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': eslint,
    },
    rules: {
      // Gradually reduce `any` usage
      '@typescript-eslint/no-explicit-any': 'warn',

      // Catch unused variables (allow underscore-prefixed)
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // Prefer const over let when variable is never reassigned
      'prefer-const': 'error',

      // No fallthrough in switch statements
      'no-fallthrough': 'error',

      // Disallow duplicate imports
      'no-duplicate-imports': 'error',
    },
  },
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'anymap_ts/static/**',
      'docs/**',
      'examples/**',
      '*.config.*',
    ],
  },
];
