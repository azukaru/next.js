import React, { Suspense } from 'react'
import dynamic from 'next/dynamic'

const Resolves = dynamic(() => import('../components/component'))
const NeverResolves = dynamic(() =>
  typeof window === 'undefined'
    ? import('../components/component')
    : new Promise(() => {})
)

export default () => (
  <div>
    <div id="resolves">
      <Suspense fallback={null}>
        Resolves: <Resolves />
      </Suspense>
    </div>
    <div id="never-resolves">
      <Suspense fallback={null}>
        Never Resolves: <NeverResolves />
      </Suspense>
    </div>
    {typeof window === 'undefined' ? null : <div id="hydrated" />}
  </div>
)
