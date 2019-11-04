import {
  IWebpackConformanctTest,
  IConformanceTestResult,
} from '../../TestInterface'
import { JSDOM } from 'jsdom'
import { CONFORMANCE_ERROR_PREFIX } from '../../contants'

export const ErrorMessage: string = `${CONFORMANCE_ERROR_PREFIX}: Found an inline script tag without async/defer attributes`
export const ErrorDescription = `This can block the HTML parser for longer than expected affecting First contentful paint and Time to interactivity.`

export class InlineScriptsConformanceTest implements IWebpackConformanctTest {
  public buildCompleted(assets: any): IConformanceTestResult {
    for (const assetKey in assets) {
      if (assetKey.match(/\.html$/)) {
        const value = assets[assetKey]
        try {
          const dom = new JSDOM(value.source())
          const scripts: NodeListOf<
            Element
          > = dom.window.document.querySelectorAll('script:not([src])')
          if (
            Array.prototype.some.call(
              scripts,
              (script: Element) =>
                !script.hasAttribute('async') && !script.hasAttribute('defer')
            )
          ) {
            return {
              result: 'FAILED',
              errors: [
                {
                  message: `${ErrorMessage} in ${assetKey}.\n${ErrorDescription}`,
                },
              ],
            } as IConformanceTestResult
          }
        } catch (e) {
          // If its invalid DOM, we have no plan of action.
          return {
            result: 'SUCCESS',
          } as IConformanceTestResult
        }
      }
    }
    return { result: 'SUCCESS' } as IConformanceTestResult
  }
}
