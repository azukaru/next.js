import {
  IWebpackConformanctTest,
  IConformanceTestResult,
  IGetAstNodeResult,
  IParsedModuleDetails,
} from '../../TestInterface'
import { CONFORMANCE_ERROR_PREFIX } from '../../contants'

export const ErrorMessage: string = `${CONFORMANCE_ERROR_PREFIX}: An inline script was found in a react module.`
export const ErrorDescription = ``

export class ReactInlineScriptsConformanceTest
  implements IWebpackConformanctTest {
  public getAstNode(): IGetAstNodeResult[] {
    return [
      {
        hook: 'callAnyMember',
        nodeName: 'imported var',
        inspectNode: (
          expression: any,
          { request }: IParsedModuleDetails
        ): IConformanceTestResult => {
          expression.arguments = expression.arguments || []
          if (
            expression.callee.object.name === 'React' &&
            expression.callee.property.name === 'createElement' &&
            expression.arguments[0].value === 'script'
          ) {
            const props: string[] = expression.arguments[1].properties.map(
              (prop: any) => prop.key.name
            )
            if (props.includes('defer') || props.includes('async')) {
              // TODO(prateekbh@): Add a check for type=!javascript
              return { result: 'SUCCESS' }
            }
            const cwd = process.cwd()
            const fileName = request.substr(
              request.lastIndexOf(cwd) + cwd.length
            )
            return {
              result: 'FAILED',
              errors: [
                {
                  message: `${ErrorMessage} in ${fileName}`,
                },
              ],
            }
          }
          return { result: 'SUCCESS' }
        },
      },
    ]
  }
}
