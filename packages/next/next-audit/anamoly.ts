export interface Anomaly {
  Description: string
  Source?: string
  Type: 'LINT_EXCEPTION' | 'WEBPACK_EXCEPTION' | 'LIGHTHOUSE_EXCEPTION'
}
