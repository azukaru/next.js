export interface IConformanceAnamoly {
  message: string
  stack_trace?: string
}

export interface IConformanceTestResult {
  result: 'SUCCESS' | 'FAILED'
  warnings?: Array<IConformanceAnamoly>
  errors?: Array<IConformanceAnamoly>
}

export interface IParsedModuleDetails {
  request: string
}

export interface IGetAstNodeResult {
  hook: string
  nodeName?: string
  inspectNode: (
    node: any,
    details: IParsedModuleDetails
  ) => IConformanceTestResult
}

export interface IWebpackConformanctTest {
  buildStared?: (options: any) => IConformanceTestResult
  getAstNode?: () => IGetAstNodeResult[]
  buildCompleted?: (assets: any) => IConformanceTestResult
}
