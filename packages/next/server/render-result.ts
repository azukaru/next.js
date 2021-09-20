import { ServerResponse } from 'http'

export interface Stream {
  write(chunk: Uint8Array): void
  buffer(shouldBuffer: boolean): void
  flush(): void
  close(error?: Error): void
  subscribe(callback: (ready: boolean) => void): () => void
}

export type StreamWriter = (stream: Stream, next: (err?: Error) => void) => void

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
    const maybeFlush =
      typeof (res as any).flush === 'function'
        ? () => (res as any).flush()
        : () => {}

    type Subscriber = (ready: boolean) => void
    const subscribers: Set<Subscriber> = new Set()
    let ready: boolean = true
    const setReady = (isReady: boolean) => {
      if (isReady !== ready) {
        ready = isReady
        subscribers.forEach((callback) => callback(ready))
      }
    }
    const drainHandler = () => {
      setReady(true)
    }
    res.on('drain', drainHandler)

    return new Promise((resolve, reject) => {
      response(
        {
          write(chunk) {
            setReady(res.write(chunk))
          },
          buffer(shouldBuffer) {
            const method = shouldBuffer ? 'cork' : 'uncork'
            res[method]()
          },
          flush() {
            maybeFlush()
          },
          close(err) {
            if (err) {
              res.destroy(err)
            } else {
              res.end()
            }
          },
          subscribe(callback) {
            subscribers.add(callback)
            callback(ready)
            return () => {
              subscribers.delete(callback)
            }
          },
        },
        (err) => {
          subscribers.clear()
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
