module.exports = {
  extends: [
    'plugin:prettier/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-type-checked',
    'plugin:@typescript-eslint/stylistic-type-checked',
    'plugin:unicorn/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  settings: {
    react: {
      version: 'detect',
    },
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    tsconfigRootDir: __dirname,
    project: './tsconfig.json',
  },
  rules: {
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-argument': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/no-empty-function': 0,
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', ignoreRestSiblings: true },
    ],

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
  },
}
