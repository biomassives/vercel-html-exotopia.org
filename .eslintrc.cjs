/* eslint-env node */

// Deliberately lenient first-pass config. This repo has never had a working
// lint setup, so turning on a strict/type-checked ruleset here would surface
// hundreds of pre-existing issues across files nobody touched today and turn
// `npm run lint` into something people route around instead of run. The goal
// of this config is just "the command works and catches real mistakes in
// code we're actively writing" — tightening it further is a separate,
// deliberate decision for later, not a side effect of adding the file.
module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-essential',
    '@vue/eslint-config-typescript',
  ],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
  },
  rules: {
    '@typescript-eslint/no-explicit-any':          'off',
    // This codebase already prefixes intentionally-unused params/vars with
    // `_` (e.g. `_total`, `_entry`, `_clusterPos`) — respect that existing
    // convention instead of warning on every instance of it.
    '@typescript-eslint/no-unused-vars':           ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    '@typescript-eslint/no-empty-function':        'off',
    '@typescript-eslint/ban-ts-comment':           'off',
    'no-unused-vars':                              'off', // superseded by the TS-aware rule above
    'vue/multi-word-component-names':              'off',
    'vue/no-v-html':                               'off',
    'no-empty':                                    'warn',
    'no-console':                                  'off',
  },
  ignorePatterns: ['dist/', '.quasar/', 'node_modules/', 'public/', '*.config.js'],
}
