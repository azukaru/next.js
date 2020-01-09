/// <reference types="react-dom/experimental" />

declare global {
  interface Window {
    next: NextObject | any[]
  }
}

type NextObject = {
  push: (...items: any[]) => void
  version: string
}

export default function bootstrap(
  Promise: PromiseConstructor,
  CollectionPolyfills: Promise<void>,
  ReadableStream: Promise<typeof window.ReadableStream>,
  React: Promise<typeof import('react')>,
  ReactDOM: Promise<typeof import('react-dom')>,
  ReactDOMFlight: Promise<any>
) {
  const queue =
    Object.prototype.toString.call(window.next) === '[object Array]'
      ? (window.next as any[]).slice()
      : []
  let push = () => {
    Array.prototype.push.apply(queue, arguments as any)
  }
  window.next = {
    push,
    version: process.env.__NEXT_VERSION,
  } as NextObject

  Promise.all([
    React,
    ReactDOM,
    window.Map && window.Set ? null : CollectionPolyfills,
  ]).then(r => {
    const React = r[0]
    const ReactDOM = r[1]
    const Root = React.lazy(() =>
      Promise.all([
        window.ReadableStream ? window.ReadableStream : ReadableStream,
        ReactDOMFlight,
      ]).then(r => {
        const ReadableStream = r[0]
        const ReactDOMFlight = r[1]
        const result = ReactDOMFlight.readFromReadableStream(
          new ReadableStream({
            start(controller: any) {
              push = function() {
                for (const chunk in arguments) {
                  controller.enqueue(chunk)
                }
              }
              for (const chunk in queue) {
                controller.enqueue(chunk)
              }
            },
          })
        )
        const Root = () => {
          return result.model
        }
        return { default: Root }
      })
    )

    ReactDOM.createRoot(document.getElementById('__next')!, {}).render(
      <React.Suspense fallback={null}>
        <Root />
      </React.Suspense>
    )
  })
}
