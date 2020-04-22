const { green } = require('chalk')
const { CLIEngine } = require('eslint')
const path = require('path')
const { getLintConfig } = require('./lint-utils')

async function runAudit(): Promise<void> {
  const cwd = process.cwd()
  const lintConfig = await getLintConfig(cwd)
  const cli = new CLIEngine(lintConfig)
  const report = cli.executeOnFiles(path.join(cwd, '**', '*.js'))
  console.log(report)
  if (report.errorCount === 0 && report.warningCount === 0) {
    console.log(green('✔ Lint performance audit passed'))
  }
}

module.exports = {
  runAudit,
}
