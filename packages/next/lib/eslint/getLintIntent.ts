import { promises as fs } from 'fs'
import path from 'path'
import { fileExists } from '../file-exists'
import { Linter } from 'eslint';
// import { recursiveReadDir } from '../recursive-readdir'

export enum ESlintIntent {
  'CONFIGURED_OK',
  'ABSENT_LINT_PLUGIN',
  'NOT_CONFIGURED'
};

export async function getESLintIntent(
  baseDir: string
): Promise<{
    configFile?: string,
    intent: ESlintIntent
  }> {
  const lintConfigPaths = [
    path.join(baseDir, '.eslintrc.json'),
    path.join(baseDir, '.eslintrc')
  ]

  /**
   * The integration turns on if we find a lint config in the user's
   * project.
   */
  const lintConfigFiles = (
    await Promise.all(
      lintConfigPaths.map(
        async lintConfigPath => {return await fileExists(lintConfigPath) ? lintConfigPath: false}
      )
    )
  ).filter(Boolean);
  const configFile = lintConfigFiles.length > 0 ? lintConfigFiles[0] : undefined;
  if (configFile) {
    const fileContent = await fs.readFile(configFile, { encoding: 'utf8' });
    const fileConfig: Linter.Config = JSON.parse(fileContent);
    const extendsConfig = fileConfig?.extends;
    if (typeof extendsConfig === 'string') {
      if (extendsConfig === '@next/next/recommended') {
        return {
          configFile,
          intent: ESlintIntent.CONFIGURED_OK
        }
      }
    } else if (Array.isArray(extendsConfig)) {
      if (extendsConfig.includes('@next/next/recommended')) {
        return {
          configFile,
          intent: ESlintIntent.CONFIGURED_OK
        }
      }
    }
    return {
      configFile,
      intent: ESlintIntent.ABSENT_LINT_PLUGIN
    }
  }

  return {
    intent: ESlintIntent.NOT_CONFIGURED
  }
}
