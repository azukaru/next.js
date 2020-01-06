import React, { useImperativeHandle, useMemo } from 'react'
// @ts-ignore
import ReactFlightDOMClient from 'react-flight-dom-webpack'

export type Payload = {}
export type Instance = {
  process(payload: Payload): void
}

export default React.forwardRef(function NextClient(props, ref) {
  const [controller, result] = useMemo(() => {
    let controller = null
    const result = ReactFlightDOMClient.readFromReadableStream(
      new ReadableStream({
        start(nextController) {
          controller = nextController
        },
      })
    )
    if (!controller) {
      throw new Error()
    }
    return [controller as ReadableStreamDefaultController<any>, result]
  }, [])

  useImperativeHandle(ref, () => ({
    process: (payload: Payload) => {
      controller.enqueue(payload)
    },
  }))

  return result.model
})
