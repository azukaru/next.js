import React from 'react'
import ReactDOMServer from 'react-dom/server'
// @ts-ignore
import ReactFlightDOMServer from 'react-flight-dom-webpack/server'
// @ts-ignore
import ReactFlightDOM from 'react-flight-dom-webpack'
import { IncomingMessage, ServerResponse } from 'http'
import { ParsedUrlQuery } from 'querystring'
import { RouterContext } from '../lib/router-context'
import { getPageFiles } from './get-page-files'

import loadPage from './page.chunk'
import loadDocument from './document.chunk'
import { requirePage } from './require'

import { PassThrough } from 'stream'
import { parse } from 'url'

import { NextRouter } from '../lib/router/router'
import mitt, { MittEmitter } from '../lib/mitt'

// @ts-ignore
import StyleSheetRegistry from 'styled-jsx/dist/stylesheet-registry'
import { flushToHTML } from 'styled-jsx/server'
import { render } from 'react-dom'

class ServerRouter implements NextRouter {
  route: string
  pathname: string
  query: ParsedUrlQuery
  asPath: string
  events: any
  // TODO: Remove in the next major version, as this would mean the user is adding event listeners in server-side `render` method
  static events: MittEmitter = mitt()

  constructor(pathname: string, query: ParsedUrlQuery, as: string) {
    this.route = pathname.replace(/\/$/, '') || '/'
    this.pathname = pathname
    this.query = query
    this.asPath = as
  }
  push(): any {
    noRouter()
  }
  replace(): any {
    noRouter()
  }
  reload() {
    noRouter()
  }
  back() {
    noRouter()
  }
  prefetch(): any {
    noRouter()
  }
  beforePopState() {
    noRouter()
  }
}

function noRouter() {
  const message =
    'No router instance found. you should only use "next/router" inside the client side of your app. https://err.sh/zeit/next.js/no-router-instance'
  throw new Error(message)
}

export const Context = React.createContext(null)

export function Head({ files }: { files: any }) {
  const stream = React.useContext(Context)

  // @ts-ignore
  // files.forEach(file => stream.write(ReactDOMServer.renderToStaticMarkup(<script src={file} />)))

  return files
}

async function serial(
  output: NodeJS.WritableStream,
  streams: Array<string | NodeJS.ReadableStream>
) {
  for (const stream of streams) {
    if (typeof stream === 'string') {
      output.write(stream)
    } else {
      stream.pipe(output, { end: false })
      await new Promise(resolve => {
        stream.once('end', resolve)
      })
    }
  }
  output.end()
}

export async function stream(
  req: IncomingMessage,
  res: ServerResponse,
  page: any
) {
  // @ts-ignore
  // const asPath: string = req.url
  // const router = new ServerRouter(pathname, {}, asPath)

  // const { buildManifest, App, Component } = ctx

  // const oldAdd = StyleSheetRegistry.prototype.add
  // StyleSheetRegistry.prototype.add = function(props: any) {
  //     oldAdd.call(this, props)
  //     res.write(flushToHTML())
  // }

  // const devFiles = buildManifest.devFiles
  // const files = [
  //   ...new Set([
  //     ...getPageFiles(buildManifest, pathname),
  //     ...getPageFiles(buildManifest, '/_app'),
  //   ]),
  // ]
  // const polyfillFiles = getPageFiles(buildManifest, '/_polyfills')

  res.statusCode = 200
  const flightStream = new PassThrough({
    transform(chunk, enc, cb) {
      this.push(
        ReactDOMServer.renderToStaticMarkup(
          <script
            dangerouslySetInnerHTML={{
              __html: `(window.next=window.next||[]).push(${chunk
                .toString()
                .trim()})`,
            }}
          />
        )
      )
      cb()
    },
  })

  const model = {} as any
  const callbacks = {
    lang: createOnceResolvable(model, 'lang'),
    head: createOnceResolvable(model, 'head'),
    body: createOnceResolvable(model, 'body'),
  }

  toStream([
    () => `<!DOCTYPE html>`,
    () => `<html lang="${model.lang}">`,
    () => `<head>`,
    () => ReactDOMServer.renderToStaticNodeStream(model.head),
    () => `</head>`,
    () => `<body>`,
    () => flightStream,
    () => `</body>`,
    () => `</html>`,
  ]).pipe(res)

  const Page = page
  ReactFlightDOMServer.pipeToNodeWritable(
    <Page callbacks={callbacks} />,
    flightStream
  )
}

type State =
  | { status: 'PENDING'; promise: Promise<any> }
  | { status: 'FINISHED'; value: any }

type Resolver = (() => void) | null

function createOnceResolvable(obj: any, key: string) {
  let resolver: Resolver = null
  let state: State = {
    status: 'PENDING',
    promise: new Promise(resolve => {
      resolver = resolve
    }),
  }

  Object.defineProperty(obj, key, {
    get: () => {
      if (state.status === 'PENDING') {
        throw state.promise
      } else {
        return state.value
      }
    },
  })

  return (value: any) => {
    if (state.status === 'PENDING') {
      state = { status: 'FINISHED', value }
      resolver!()
    }
  }
}

function toStream(val: any): NodeJS.ReadableStream {
  if (typeof val === 'object' && val && typeof val.pipe === 'function') {
    return val
  } else {
    const stream = new PassThrough()

    if (Array.isArray(val)) {
      const next = (idx: number) => {
        if (idx >= val.length) {
          stream.end()
        } else {
          const child = toStream(val[idx])
          child.pipe(stream, { end: false })
          child.once('end', () => next(idx + 1))
        }
      }
      next(0)
    } else if (typeof val === 'string') {
      stream.end(val)
    } else if (typeof val === 'function') {
      ;(async () => {
        while (true) {
          try {
            const res = toStream(val())
            res.pipe(stream)
            break
          } catch (ex) {
            if (typeof ex === 'object' && ex && typeof ex.then === 'function') {
              await ex
              continue
            }
            throw ex
          }
        }
      })()
    }
    return stream
  }
}

export async function renderToNodeWritable(
  req: IncomingMessage,
  res: ServerResponse,
  pathname: string,
  query: ParsedUrlQuery,
  renderOpts: any, // RenderOpts
  ctx: any
) {
  res.statusCode = 200

  // const document = loadDocument()
  // const elem = document.render({
  //     Head: () => <head />,
  //     Main: () => null,
  // })

  // // @ts-ignore
  // const [prefix, suffix] = ReactDOMServer.renderToStaticMarkup(React.cloneElement(elem, {}, <next-placeholder />)).split('<next-placeholder></next-placeholder>')
  // const flightStream = new PassThrough({
  //     transform(chunk, enc, cb) {
  //         this.push(`<script>(window.next=window.next||[]).push(${chunk.toString().trim()})</script>`)
  //         cb()
  //     }
  // })

  // flightStream.pipe(res, { end: false })
  // flightStream.once('end', () => {
  //     res.write(`</body>${suffix}`)
  //     res.end()
  // })

  // res.write(`<!DOCTYPE html>${prefix}<body>`)
  // ReactFlightDOMServer.pipeToNodeWritable({}, flightStream)

  // const page = requirePage(pathname, ctx.distDir, true)
  // console.warn(page)
}
