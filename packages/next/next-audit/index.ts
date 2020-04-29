const { runAudit: runLintAudit } = require('./lint-audit')
const { runAudit: runWebpackAudit } = require('./webpack-audit')

export async function audit(dir: string, conf = null): Promise<void> {
  const lintResults = await runLintAudit()
  const webpackResults = await runWebpackAudit(dir)
  console.log({ lintResults })
  console.log({ webpackResults })
}
