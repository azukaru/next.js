import build from '../../build'
import { Anomaly } from '../anamoly'

export async function runAudit(dir: string): Promise<Array<Anomaly>> {
  return await build(dir, {
    experimental: {
      conformance: true,
    },
    silent: true,
  })
    .then(result => {
      if (result && (result.warnings || result.errors)) {
        const results = [
          ...result.warnings
            .filter((warning: string) => warning.includes('[BUILD CONFORMANCE'))
            .map((warning: string) => ({
              Description: warning,
              Type: 'WEBPACK_EXCEPTION',
            })),
          ...result.errors
            .filter((error: string) => error.includes('[BUILD CONFORMANCE'))
            .map((error: string) => ({
              Description: error,
              Type: 'WEBPACK_EXCEPTION',
            })),
        ]
        return results
      }
      process.exit(0)
    })
    .catch(err => {
      console.error('caught')
      return []
    })
}
