import eslint from '@eslint/js'
import eslintPluginUnicorn from 'eslint-plugin-unicorn'
import importPlugin from 'eslint-plugin-import'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      'webpack.config.js',
      'dist/*',
      'esm/*',
      'example/*',
      'eslint.config.mjs',
      'esbuild.mjs',
    ],
  },
  {
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.lint.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  eslint.configs.recommended,
  importPlugin.flatConfigs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.stylisticTypeChecked,
  ...tseslint.configs.strictTypeChecked,

  eslintPluginUnicorn.configs['flat/recommended'],
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          ignoreRestSiblings: true,
          caughtErrors: 'none',
        },
      ],

      'import/no-unresolved': 'off',
      'import/named': 'off',
      'import/order': [
        'error',
        {
          named: true,
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
          },
          groups: [
            'builtin',
            ['external', 'internal'],
            ['parent', 'sibling', 'index', 'object'],
            'type',
          ],
          pathGroups: [
            {
              group: 'builtin',
              pattern: 'react',
              position: 'before',
            },
            {
              group: 'external',
              pattern: '@mui/icons-material',
              position: 'after',
            },
          ],

          pathGroupsExcludedImportTypes: ['react'],
        },
      ],
      'no-console': [
        'warn',
        {
          allow: ['error', 'warn'],
        },
      ],
      'no-underscore-dangle': 'off',
      curly: 'error',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      semi: ['error', 'never'],
      'unicorn/no-new-array': 'off',
      'unicorn/no-empty-file': 'off',
      'unicorn/prefer-type-error': 'off',
      'unicorn/prefer-modern-math-apis': 'off',
      'unicorn/prefer-node-protocol': 'off',
      'unicorn/no-unreadable-array-destructuring': 'off',
      'unicorn/no-abusive-eslint-disable': 'off',
      'unicorn/no-array-callback-reference': 'off',
      'unicorn/number-literal-case': 'off',
      'unicorn/prefer-add-event-listener': 'off',
      'unicorn/prefer-top-level-await': 'off',
      'unicorn/consistent-function-scoping': 'off',
      'unicorn/no-await-expression-member': 'off',
      'unicorn/no-lonely-if': 'off',
      'unicorn/consistent-destructuring': 'off',
      'unicorn/prefer-module': 'off',
      'unicorn/prefer-optional-catch-binding': 'off',
      'unicorn/no-useless-undefined': 'off',
      'unicorn/no-null': 'off',
      'unicorn/no-nested-ternary': 'off',
      'unicorn/filename-case': 'off',
      'unicorn/catch-error-name': 'off',
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/prefer-code-point': 'off',
      'unicorn/numeric-separators-style': 'off',
      'unicorn/no-array-for-each': 'off',
      'unicorn/prefer-spread': 'off',
      'unicorn/explicit-length-check': 'off',
      'unicorn/prefer-regexp-test': 'off',
      'unicorn/relative-url-style': 'off',
      'unicorn/prefer-math-trunc': 'off',
      'unicorn/prefer-query-selector': 'off',
      'unicorn/no-negated-condition': 'off',
      'unicorn/switch-case-braces': 'off',
      'unicorn/prefer-switch': 'off',
      'unicorn/better-regex': 'off',
      'unicorn/no-for-loop': 'off',
      'unicorn/escape-case': 'off',
      'unicorn/prefer-number-properties': 'off',
      'unicorn/no-process-exit': 'off',
      'unicorn/prefer-at': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/restrict-plus-operands': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      'no-empty': 'off',
    },
  },
)
