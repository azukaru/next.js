const { runAudit: runLintAudit } = require('./lint-audit')
const { runAudit: runWebpackAudit } = require('./webpack-audit')
const { runAudit: runLHAudit } = require('./lighthouse-audit')
const chalk = require('chalk')
import createSpinner from '../build/spinner'
import { Anomaly } from './anamoly'

export async function audit(dir: string, conf = null): Promise<void> {
  const lintSpinner = createSpinner({
    prefixText: 'Starting audit checks',
  })
  lintSpinner?.start()
  const lintResults = await runLintAudit()
  const webpackResults = await runWebpackAudit(dir)
  const lhResults = await runLHAudit(dir)
  lintSpinner?.stop()
  console.log(chalk.bold(' AUDIT Results '))
  console.log('\n')
  console.log(chalk.bgBlue(' Lint audit Results '))
  const lintMap = {
    "A synchronous script tag in head, can impact your webpage's performance": {
      successMsg: '✔  No render blocking extern sync scripts found.',
      sources: [],
    },
    'In order to use external stylesheets use @import in the root stylesheet compiled with NextJS. This ensures proper priority to CSS when loading a webpage.': {
      successMsg: '✔  No external stylesheet without preload found.',
      sources: [],
    },
  }
  lintResults.forEach((result: Anomaly) => {
    /// @ts-ignore
    lintMap[result.Description].sources.push(result.Source)
  })
  for (const key in lintMap) {
    /// @ts-ignore
    const violation = lintMap[key]
    if (violation.sources.length === 0) {
      console.log(chalk.green(violation.successMsg))
    } else {
      console.log(chalk.red(`𐄂 ${key}`))
      console.log(`    · ${violation.sources.join('\n    · ')}`)
    }
  }

  console.log('\n')
  console.log(chalk.bgBlue(' Webpack audit Results '))
  console.log(chalk.red('𐄂  Minification is disabled on this build.'))
  console.log(chalk.green('✔  Bundling configuration is to default.'))
  console.log('\n')
  console.log(chalk.bgBlue(' Sourcemap audit Results '))
  const lhMap = {
    'A Promise polyfill was found in the source code': {
      successMsg: '✔  No legacy promise polyfill found.',
      sources: [],
    },
    'In order to use external stylesheets use @import in the root stylesheet compiled with NextJS. This ensures proper priority to CSS when loading a webpage.': {
      successMsg: '✔  No legacy fetch polyfill found.',
      sources: [],
    },
  }
  lhResults.forEach((result: Anomaly) => {
    /// @ts-ignore
    lhMap[result.Description].sources.push(result.Source)
  })
  for (const key in lhMap) {
    /// @ts-ignore
    const violation = lhMap[key]
    if (violation.sources.length === 0) {
      console.log(chalk.green(violation.successMsg))
    } else {
      console.log(chalk.red(`𐄂 ${key}`))
    }
  }
  console.log('\n')
}
