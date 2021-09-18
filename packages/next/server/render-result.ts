import { ServerResponse } from 'http'
import * as ReactRuntime from './react-runtime'

export type StreamWriter = (
  execute: ReactRuntime.Executor,
  next: (err?: Error) => void
) => void

export default class RenderResult {
  _result: string | StreamWriter

  constructor(response: string | StreamWriter) {
    this._result = response
  }

  toUnchunkedString(): string {
    if (typeof this._result !== 'string') {
      throw new Error(
        'invariant: dynamic responses cannot be unchunked. This is a bug in Next.js'
      )
    }
    return this._result
  }

  pipe(res: ServerResponse): Promise<void> {
    if (typeof this._result === 'string') {
      throw new Error(
        'invariant: static responses cannot be piped. This is a bug in Next.js'
      )
    }
    const response = this._result
    let state: ReactRuntime.State = {
      full: false,
      update: () => {},
    }
    const drainHandler = () => {
      state.full = false
      state.update()
    }
    res.on('drain', drainHandler)
    return new Promise((resolve, reject) => {
      response(
        (...args) => {
          switch (args[0]) {
            case ReactRuntime.INIT:
              state = args[1]
              break
            case ReactRuntime.WRITE:
              const prevFull = state.full
              state.full = res.write(args[1])
              if (state.full !== prevFull) {
                state.update()
              }
              break
            case ReactRuntime.FLUSH:
              if (typeof (res as any).flush === 'function') {
                ;(res as any).flush()
              }
              break
            case ReactRuntime.BUFFER:
              const method = args[1] ? 'cork' : 'uncork'
              res[method]()
              break
            case ReactRuntime.CLOSE:
              const err = args[1]
              if (err) {
                res.destroy(err)
              } else {
                res.end()
              }
              break
          }
        },
        (err) => {
          res.removeListener('drain', drainHandler)
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        }
      )
    })
  }

  isDynamic(): boolean {
    return typeof this._result !== 'string'
  }

  static fromStatic(value: string): RenderResult {
    return new RenderResult(value)
  }

  static empty = RenderResult.fromStatic('')
}
