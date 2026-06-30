export default [
  {
    ignores: [
      'node_modules/',
      'frontend/src/dist',
      'frontend/src/vue3',
      'frontend/src/libs',
    ],

    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },

    rules: {
      'no-var': 'error',
      eqeqeq: 2,
      'no-console': 2,
      'no-debugger': 2,
      'no-prototype-builtins': 'off',
      'no-useless-escape': 'off',
    },
  },
];
