module.exports = {
  extends: ['react-app', 'plugin:prettier/recommended'],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', ignoreRestSiblings: true },
    ],
  },
}
