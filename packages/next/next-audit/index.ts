const { runAudit } = require('./lint-audit')

export async function audit(dir: string, conf = null): Promise<void> {
  await runAudit()
}
