import React, { Suspense } from 'react'
import dynamic from 'next/dynamic'

const Resolves = dynamic(() => branchOnClient(async () => {}))
const NeverResolves = dynamic(() => branchOnClient(() => new Promise(() => {})))

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
    {typeof window === 'undefined' ? null : <div id="client-ready" />}
  </div>
)

function branchOnClient(fn) {
  return Promise.all([
    import('../components/component'),
    typeof window === 'undefined' ? Promise.resolve() : fn(),
  ]).then((results) => results[0])
}
