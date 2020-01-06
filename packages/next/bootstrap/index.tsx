import React from 'react'
import ReactDOM from 'react-dom'

type Payload = import('../client/next-bootstrap').Payload
type Instance = import('../client/next-bootstrap').Instance

declare global {
  interface Window {
    next: Payload[] | unknown
  }
}

// @ts-ignore
if (!window.Promise) {
  // @ts-ignore
  window.Promise = Promise
}

const domEl =
  process.env.__NEXT_REACT_MODE === 'legacy'
    ? document.createElement('div')
    : document.getElementById('__next')

const opts = { hydrate: true }
const reactRoot =
  process.env.__NEXT_REACT_MODE === 'concurrent'
    ? // @ts-ignore
      ReactDOM.createRoot(domEl!, opts)
    : // @ts-ignore
      ReactDOM.createBlockingRoot(domEl!, opts)

const queue: Payload[] = Array.isArray(window.next) ? window.next : []
let handlePush = (payload: Payload) => {
  queue.push(payload)
}

const NextClient = React.lazy(() => import('../client/next-bootstrap'))

reactRoot.render(
  <React.Suspense fallback={null}>
    <NextClient
      ref={(ref: Instance) => {
        handlePush = payload => ref.process(payload)
        queue.forEach(handlePush)
        queue.length = 0
      }}
    />
  </React.Suspense>,
  () => {}
)

window.next = {
  version: process.env.__NEXT_VERSION,
  push: (payload: Payload) => handlePush(payload),
}
