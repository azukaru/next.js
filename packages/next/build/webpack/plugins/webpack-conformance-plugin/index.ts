import { Compiler, compilation } from 'webpack'
import {
  IConformanceTestResult,
  IWebpackConformanctTest,
  IConformanceAnamoly,
  IGetAstNodeResult,
} from './TestInterface'

export { IWebpackConformanctTest } from './TestInterface'
export {
  MinificationConformanceTest,
} from './tests/minification-conformance/index'
export {
  InlineScriptsConformanceTest,
} from './tests/inline-scripts-conformance'
export {
  ReactInlineScriptsConformanceTest,
} from './tests/react-inline-scripts-conformance'

export interface IWebpackConformancePluginOptions {
  tests: IWebpackConformanctTest[]
}

export default class WebpackConformancePlugin {
  private tests: IWebpackConformanctTest[]
  private errors: Array<IConformanceAnamoly>
  private warnings: Array<IConformanceAnamoly>
  private compiler: Compiler

  constructor(options: IWebpackConformancePluginOptions) {
    this.tests = []
    if (options.tests) {
      this.tests.push(...options.tests)
    }
    this.errors = []
    this.warnings = []
  }

  private gatherResults(results: Array<IConformanceTestResult>): void {
    results.forEach(result => {
      if (result.result === 'FAILED') {
        result.errors && this.errors.push(...result.errors)
        result.warnings && this.warnings.push(...result.warnings)
      }
    })
  }

  private buildStartedHandler = (
    compilation: compilation.Compilation,
    callback: () => void
  ) => {
    const buildStartedResults: IConformanceTestResult[] = this.tests.map(
      test => {
        if (test.buildStared) {
          return test.buildStared(this.compiler.options)
        }
        return {
          result: 'SUCCESS',
        } as IConformanceTestResult
      }
    )

    Promise.all(buildStartedResults).then(
      (results: Array<IConformanceTestResult>) => {
        this.gatherResults(results)
      }
    )

    callback()
  }

  private buildCompletedHandler = (
    compilation: compilation.Compilation,
    cb: () => void
  ): void => {
    const buildCompletedResults: IConformanceTestResult[] = this.tests.map(
      test => {
        if (test.buildCompleted) {
          return test.buildCompleted(compilation.assets)
        }
        return {
          result: 'SUCCESS',
        } as IConformanceTestResult
      }
    )

    this.gatherResults(buildCompletedResults)
    compilation.errors.push(...this.errors)
    compilation.warnings.push(...this.warnings)
    cb()
  }

  private parserHandler = (factory: compilation.NormalModuleFactory): void => {
    const JS_TYPES = ['auto', 'esm', 'dynamic']
    for (const type of JS_TYPES) {
      factory.hooks.parser
        .for('javascript/' + type)
        .tap(this.constructor.name, parser => {
          this.tests.forEach(test => {
            if (test.getAstNode) {
              const getAstNodeCallbacks: IGetAstNodeResult[] = test.getAstNode()
              getAstNodeCallbacks.forEach(result => {
                const hookmap = parser.hooks[result.hook]
                const tapable: any = result.nodeName
                  ? hookmap.for(result.nodeName)
                  : hookmap
                tapable.tap(this.constructor.name, (expression: any) => {
                  const { request } = parser.state.module
                  const outcome = result.inspectNode(expression, { request })
                  this.gatherResults([outcome])
                })
              })
            }
          })
        })
    }
  }

  public apply(compiler: Compiler) {
    this.compiler = compiler
    compiler.hooks.make.tapAsync(
      this.constructor.name,
      this.buildStartedHandler
    )
    compiler.hooks.emit.tapAsync(
      this.constructor.name,
      this.buildCompletedHandler
    )
    compiler.hooks.normalModuleFactory.tap(
      this.constructor.name,
      this.parserHandler
    )
  }
}
