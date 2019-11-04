import {
  IWebpackConformanctTest,
  IConformanceTestResult,
} from '../../TestInterface'
import { CONFORMANCE_ERROR_PREFIX } from '../../contants'

export class MinificationConformanceTest implements IWebpackConformanctTest {
  public buildStared(options: any): IConformanceTestResult {
    // TODO(prateekbh@): Implement warning for using Terser maybe?

    if (
      options.optimization &&
      (options.optimization.minimize !== true ||
        (options.optimization.minimizer &&
          options.optimization.minimizer.length === 0))
    ) {
      return {
        result: 'FAILED',
        errors: [
          {
            message: `${CONFORMANCE_ERROR_PREFIX}: Minification is disabled for this build.\nDisabling minification can result in serious performance degradation.`,
          },
        ],
      }
    } else {
      return {
        result: 'SUCCESS',
      }
    }
  }
}
