import { PassThrough, Readable, Writable } from 'stream'

export class NextWritableResponse extends Writable {
  _dest: PassThrough

  constructor() {
    super()
    this._dest = new PassThrough()
  }

  getReadable(): NextServerResponse {
    return new NextServerResponse(this._dest)
  }

  _write(
    chunk: any,
    encoding: string,
    callback: (error?: Error | null) => void
  ) {
    this._dest.push(chunk, encoding)
    callback()
  }

  set(key: string, value: string): NextWritableResponse {
    return this
  }
}

export class NextServerResponse {
  _src: Readable

  constructor(src: Readable) {
    this._src = src
  }

  static from(src: string): NextServerResponse {
    const res = new NextWritableResponse()
    res.end(src)

    return res.getReadable()
  }

  text(): Promise<string | null> {
    let chunks: Buffer[] | null = null
    return new Promise((resolve, reject) => {
      this._src.once('error', err => {
        reject(err)
      })
      this._src.once('end', () => {
        if (chunks) {
          resolve(Buffer.concat(chunks).toString('utf-8'))
        } else {
          resolve(null)
        }
      })
      this._src.on('data', chunk => {
        chunks = chunks ?? []
        chunks.push(chunk)
      })
    })
  }

  pipe(dest: Writable) {
    this._src.once('end', () => {
      dest.end()
    })
    this._src.on('data', chunk => {
      dest.write(chunk)
    })
  }
}
