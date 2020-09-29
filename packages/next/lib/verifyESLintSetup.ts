import chalk from 'next/dist/compiled/chalk'
import path from 'path'
import * as Log from '../build/output/log'

import { ESlintIntent, getESLintIntent } from './eslint/getLintIntent'
import { FatalESLintError } from './eslint/FatalESLintError'
import {
  hasNecessaryDependencies,
  NecessaryDependencies,
} from './eslint/hasNecessaryDependencies'
import { runLintCheck, TypeCheckResult } from './eslint/runESLint'
// import { TypeScriptCompileError } from './typescript/TypeScriptCompileError'
// import { writeAppTypeDeclarations } from './typescript/writeAppTypeDeclarations'
// import { writeConfigurationDefaults } from './typescript/writeConfigurationDefaults'

export async function verifyESLintSetup(
  dir: string,
  pagesDir: string
): Promise<any> {
  // const tsConfigPath = path.join(dir, 'tsconfig.json')

  try {
    // Check if the project uses TypeScript:
    const { configFile, intent } = await getESLintIntent(dir)
    if (intent === ESlintIntent.NOT_CONFIGURED) {
      Log.warn('ESLint is not found configured.');
    } else if (intent === ESlintIntent.ABSENT_LINT_PLUGIN) {
      Log.error('ESLint is configured without @next/eslint-plugin-next. Refer to `URL` for more info.')
    }
    // const firstTimeSetup = intent.firstTimeSetup

    // Ensure TypeScript and necessary `@types/*` are installed:
    const deps: NecessaryDependencies = await hasNecessaryDependencies(dir)
    // Load ESLint after we're sure it exists:
    const eslint = (await import(
      deps.resolvedESLint
    )) as typeof import('eslint')

    return await runLintCheck(eslint, dir, configFile)

    return true
  } catch (err) {
    // These are special errors that should not show a stack trace:
    // if (err instanceof TypeScriptCompileError) {
    //   console.error(chalk.red('Failed to compile.\n'))
    //   console.error(err.message)
    //   process.exit(1)
    // } else if (err instanceof FatalTypeScriptError) {
    //   console.error(err.message)
    //   process.exit(1)
    // }
    throw err
  }
}
