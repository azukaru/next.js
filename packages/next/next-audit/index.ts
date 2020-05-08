// const { runAudit: runLintAudit } = require('./lint-audit')
// const { runAudit: runWebpackAudit } = require('./webpack-audit')
const { runAudit: runLHAudit } = require('./lighthouse-audit')

export async function audit(dir: string, conf = null): Promise<void> {
  // const lintResults = await runLintAudit()
  // const webpackResults = await runWebpackAudit(dir)
  // console.log({ lintResults })
  // console.log({ webpackResults })
  const lhResults = await runLHAudit(dir)
  console.log({ lhResults })
}
