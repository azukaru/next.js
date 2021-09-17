import { ServerResponse } from 'http'
import RuntimeExecutor, { RuntimeCommandType, RuntimeState } from './runtime'

export type StreamWriter = (
  exec: RuntimeExecutor,
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
    let state: RuntimeState = {
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
            case RuntimeCommandType.INIT:
              state = args[1]
              break
            case RuntimeCommandType.WRITE:
              state.full = res.write(args[1])
              break
            case RuntimeCommandType.FLUSH:
              if (typeof (res as any).flush === 'function') {
                ;(res as any).flush()
              }
              break
            case RuntimeCommandType.BUFFER:
              const method = args[1] ? 'cork' : 'uncork'
              res[method]()
              break
            case RuntimeCommandType.CLOSE:
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
