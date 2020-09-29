import chalk from 'next/dist/compiled/chalk'
import path from 'path'
import { fileExists } from '../file-exists'
import { getOxfordCommaList } from '../oxford-comma-list'
import { resolveRequest } from '../resolve-request'
import { FatalESLintError } from './FatalESLintError'

const requiredPackages = [
  { file: 'eslint', pkg: 'eslint' },
  { file: '@next/eslint-plugin-next', pkg: '@next/eslint-plugin-next' },
]

export type NecessaryDependencies = {
  resolvedESLint: string
}

export async function hasNecessaryDependencies(
  baseDir: string
): Promise<NecessaryDependencies> {
  let resolutions = new Map<string, string>()

  const missingPackages = requiredPackages.filter((p) => {
    try {
      resolutions.set(p.pkg, resolveRequest(p.file, path.join(baseDir, '/')))
      return false
    } catch (_) {
      return true
    }
  })

  if (missingPackages.length < 1) {
    return { resolvedESLint: resolutions.get('eslint')! }
  }

  const packagesHuman = getOxfordCommaList(missingPackages.map((p) => p.pkg))
  const packagesCli = missingPackages.map((p) => p.pkg).join(' ')

  const yarnLockFile = path.join(baseDir, 'yarn.lock')
  const isYarn = await fileExists(yarnLockFile).catch(() => false)

  throw new FatalESLintError(
    chalk.bold.red(
      `It looks like you're trying to use ESLint but do not have the required package(s) installed.`
    ) +
      '\n\n' +
      chalk.bold(`Please install ${chalk.bold(packagesHuman)} by running:`) +
      '\n\n' +
      `\t${chalk.bold.cyan(
        (isYarn ? 'yarn add --dev' : 'npm install --save-dev') +
          ' ' +
          packagesCli
      )}` +
      '\n\n' +
      chalk.bold(
        'If you are not trying to use ESLint, please remove the ' +
          chalk.cyan('eslint config') + '.'
      ) +
      '\n'
  )
}
