import React from 'react'
import { DocumentInitialProps, DocumentProps } from './utils'

export const DocumentContext = React.createContext<
  (DocumentInitialProps & DocumentProps) | null
>(null)

if (process.env.NODE_ENV !== 'production') {
  DocumentContext.displayName = 'DocumentContext'
}
