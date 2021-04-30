import React from 'react'

export const StyleManagerContext: React.Context<(
  src: string
) => void> = React.createContext(null as any)

if (process.env.NODE_ENV !== 'production') {
  StyleManagerContext.displayName = 'StyleManagerContext'
}
