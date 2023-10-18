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
      {
        args: 'after-used',
        ignoreRestSiblings: true,
      },
    ],
  },
}
