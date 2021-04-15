import { AppType } from '../../next-server/lib/utils'
import React from 'react'

interface Resource<T> {
  read(): T
}

export type PageResource<P> = {
  Component: React.ComponentType<P>
  props: P
}

export type AppProps = {
  page: Resource<PageResource<unknown>>
}

export default function App(_props: AppProps) {
  // There is no default App in Concurrent Mode. You must always
  // implement your own.
  throw new Error('You must define your own /_app')
}

export function __nextPolyfillApp(LegacyApp: AppType) {
  if (!process.env.__NEXT_REACT_ROOT) {
    const { useRouter } = require('next/router')
    function ConcurrentApp({ page }: AppProps) {
      const { Component, props } = page.read()
      const router = useRouter()
      return (
        <LegacyApp Component={Component} pageProps={props} router={router} />
      )
    }
    return ConcurrentApp
  } else {
    throw new Error('Not supported in Concurrent Mode')
  }
}
