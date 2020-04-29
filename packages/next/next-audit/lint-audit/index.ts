import { Anomaly } from '../anamoly'

const { CLIEngine } = require('eslint')
const path = require('path')
const { getLintConfig } = require('./lint-utils')

async function runAudit(): Promise<Array<Anomaly>> {
  const cwd = process.cwd()
  const lintConfig = await getLintConfig(cwd)
  const cli = new CLIEngine(lintConfig)
  const anomalies: Array<Anomaly> = []
  const report = cli.executeOnFiles(path.join(cwd, '**', '*.js'))
  if (report.errorCount === 0 && report.warningCount === 0) {
    return []
  }
  report.results.forEach((result: any) => {
    result.messages.forEach((msg: any) => {
      anomalies.push({
        Description: msg.message,
        Source: `${result.filePath}:${msg.line},${msg.column}`,
        Type: 'LINT_EXCEPTION',
      })
    })
  })
  return anomalies
}

module.exports = {
  runAudit,
}
