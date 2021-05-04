import React from 'react'

export const InitialRenderContext = React.createContext<boolean>(false)

if (process.env.NODE_ENV !== 'production') {
  InitialRenderContext.displayName = 'InitialRenderContext'
}
