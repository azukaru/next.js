const fs = require('fs')
const path = require('path')
const { yellow } = require('chalk')
const { promisify } = require('util')
const exist = promisify(fs.exists)

const DEFAULT_CONFIG = {
  env: {
    browser: true,
    es6: true,
  },
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['next-performance'],
  rules: {
    'next-performance/no-external-sync-script': 1,
    'next-performance/no-css-tag': 1,
  },
}

export async function getLintConfig(dir: string) {
  const lintFileExist = await exist(path.join(dir, '.eslintrc'))
  if (!lintFileExist) {
    console.log(yellow('No Lint RC file found, using default config.'))
    return DEFAULT_CONFIG
  }
  // todo implement this;
  return null
}
