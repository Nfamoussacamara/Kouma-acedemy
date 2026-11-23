import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // Scripts de test manuels (non-framework) : fetch natif Node.js 18+
    files: ['tests/**/*.js'],
    languageOptions: {
      globals: {
        fetch: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'off',
    },
  },
];
