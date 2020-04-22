const fs = require('fs')
const path = require('path')
const { yellow } = require('chalk')
const { promisify } = require('util')
const exist = promisify(fs.exists)

const DEFAULT_CONFIG = {
  extends: ['plugin:next-performance/recommended'],
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
