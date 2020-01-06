import { loader } from 'webpack'
import { join } from 'path'
import { parse } from 'querystring'
import {
  BUILD_MANIFEST,
  REACT_LOADABLE_MANIFEST,
} from '../../../next-server/lib/constants'
import { isDynamicRoute } from '../../../next-server/lib/router/utils'
import { API_ROUTE } from '../../../lib/constants'

export type ServerlessLoaderQuery = {
  page: string
  distDir: string
  absolutePagePath: string
  absoluteAppPath: string
  absoluteDocumentPath: string
  absoluteErrorPath: string
  buildId: string
  assetPrefix: string
  ampBindInitData: boolean | string
  generateEtags: string
  canonicalBase: string
}

const nextServerlessLoader: loader.Loader = function() {
  const {
    distDir,
    absolutePagePath,
    page,
    buildId,
    canonicalBase,
    assetPrefix,
    ampBindInitData,
    absoluteAppPath,
    absoluteDocumentPath,
    absoluteErrorPath,
    generateEtags,
  }: ServerlessLoaderQuery =
    typeof this.query === 'string' ? parse(this.query.substr(1)) : this.query
  const buildManifest = join(distDir, BUILD_MANIFEST).replace(/\\/g, '/')
  const reactLoadableManifest = join(distDir, REACT_LOADABLE_MANIFEST).replace(
    /\\/g,
    '/'
  )
  const escapedBuildId = buildId.replace(/[|\\{}()[\]^$+*?.-]/g, '\\$&')

  if (page.match(API_ROUTE)) {
    return `
    ${
      isDynamicRoute(page)
        ? `
      import { getRouteMatcher } from 'next/dist/next-server/lib/router/utils/route-matcher';
      import { getRouteRegex } from 'next/dist/next-server/lib/router/utils/route-regex';
      `
        : ``
    }
      import { parse } from 'url'
      import { apiResolver } from 'next/dist/next-server/server/api-utils'
      import initServer from 'next-plugin-loader?middleware=on-init-server!'
      import onError from 'next-plugin-loader?middleware=on-error-server!'

      export default async (req, res) => {
        try {
          await initServer()
          const params = ${
            isDynamicRoute(page)
              ? `getRouteMatcher(getRouteRegex('${page}'))(parse(req.url).pathname)`
              : `{}`
          }
          const resolver = require('${absolutePagePath}')
          apiResolver(req, res, params, resolver, onError)
        } catch (err) {
          console.error(err)
          await onError(err)
          res.statusCode = 500
          res.end('Internal Server Error')
        }
      }
    `
  } else {
    return `
    import React from 'react'
    import ReactDOMServer from 'react-dom/server'
    import {stream, Context as StreamContext, Head} from 'next/dist/next-server/server/stream'
    import {getPageFiles} from 'next/dist/next-server/server/get-page-files'
    
    import {parse} from 'url'
    import {parse as parseQs} from 'querystring'
    import initServer from 'next-plugin-loader?middleware=on-init-server!'
    import onError from 'next-plugin-loader?middleware=on-error-server!'
    ${
      isDynamicRoute(page)
        ? `import {getRouteMatcher, getRouteRegex} from 'next/dist/next-server/lib/router/utils';`
        : ''
    }
    import buildManifest from '${buildManifest}';
    import reactLoadableManifest from '${reactLoadableManifest}';
    import Document from '${absoluteDocumentPath}';
    import Error from '${absoluteErrorPath}';
    import App from '${absoluteAppPath}';
    import * as ComponentInfo from '${absolutePagePath}';
    const Component = ComponentInfo.default
    export default Component
    export const unstable_getStaticProps = ComponentInfo['unstable_getStaticProp' + 's']

    ${
      isDynamicRoute(page)
        ? "export const unstable_getStaticPaths = ComponentInfo['unstable_getStaticPath' + 's']"
        : 'export const unstable_getStaticPaths = undefined'
    }
    export const config = ComponentInfo['confi' + 'g'] || {}
    export const _app = App

    function chunkFromPage(page, Component) {
      const files = getPageFiles(buildManifest, page)

      return () => {
        return {
          files
        }
      }
    }

    const AppChunk = chunkFromPage("/_app", App)
    const ComponentChunk = chunkFromPage("${page}", Component)

    function Page({ callbacks }) {
      // "${page}", { assetPrefix: "${assetPrefix}", buildManifest, App, Component, Document }

      callbacks.lang("en")
      callbacks.head([
        React.createElement("meta", { charSet: "utf-8" }),
        // React.createElement("script", { async: true, src: "${assetPrefix}/_next/static/runtime/main.js" })
      ])
      callbacks.body([])

      // const files = [
      //   ...new Set([
      //     ...getPageFiles(buildManifest, "${page}"),
      //     ...getPageFiles(buildManifest, "/_app"),
      //   ]),
      // ]

      return React.createElement(AppChunk, {})
    }
 
    export async function render (req, res) {
      try {
        await initServer()
        stream(req, res, Page)
      } catch(err) {
        await onError(err)
        console.error(err)
        res.statusCode = 500
        res.end('Internal Server Error')
      }
    }
  `
  }
}

export default nextServerlessLoader
