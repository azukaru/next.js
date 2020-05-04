import { IncomingMessage, ServerResponse } from 'http'
import { ParsedUrlQuery } from 'querystring'
import { format as formatUrl, parse as parseUrl } from 'url'
import { Params } from './router'
import { loadComponents, LoadComponentsReturnType } from './load-components'
import { normalizePagePath } from './normalize-page-path'
import nanoid from 'next/dist/compiled/nanoid/index.js'
import { tryGetPreviewData } from './api-utils'
import { RenderOpts, RenderOptsPartial, renderToHTML } from './render'
import { sendPayload } from './send-payload'
import { getFallback, getSprCache, setSprCache } from './spr-cache'
import { withCoalescedInvoke } from '../../lib/coalesced-function'
import { isDynamicRoute } from '../lib/router/utils'
import { isResSent } from '../lib/utils'

export type NextRequestParams = {
  req: IncomingMessage
  res: ServerResponse
  renderOpts: RenderOptsPartial
}
export type NextRequestHandler = (
  params: NextRequestParams
) => Promise<string | null>

type FindComponentsResult = {
  components: LoadComponentsReturnType
  query: ParsedUrlQuery
}

export async function findRequestHandler({
  buildId,
  distDir,
  params,
  pathname,
  query,
  serverless,
}: {
  buildId: string
  distDir: string
  params: Params | null
  pathname: string
  query: ParsedUrlQuery
  serverless: boolean
}): Promise<NextRequestHandler | null> {
  const paths = [
    // try serving a static AMP version first
    query.amp ? normalizePagePath(pathname) + '.amp' : null,
    pathname,
  ].filter(Boolean)
  for (const pagePath of paths) {
    try {
      const components = await loadComponents(
        distDir,
        buildId,
        pagePath!,
        serverless
      )
      const result = {
        components,
        query: {
          ...(components.getStaticProps
            ? { _nextDataReq: query._nextDataReq, amp: query.amp }
            : query),
          ...(params || {}),
        },
      }
      return async ({ renderOpts, req, res }) =>
        await renderToHTMLWithComponents(req, res, pathname, result, renderOpts)
    } catch (err) {
      if (err.code !== 'ENOENT') throw err
    }
  }
  return null
}

export function prepareServerlessUrl(
  req: IncomingMessage,
  query: ParsedUrlQuery
) {
  const curUrl = parseUrl(req.url!, true)
  req.url = formatUrl({
    ...curUrl,
    search: undefined,
    query: {
      ...curUrl.query,
      ...query,
    },
  })
}

export class NoFallbackError extends Error {}

async function renderToHTMLWithComponents(
  req: IncomingMessage,
  res: ServerResponse,
  pathname: string,
  { components, query }: FindComponentsResult,
  opts: RenderOptsPartial
): Promise<string | null> {
  // we need to ensure the status code if /404 is visited directly
  if (pathname === '/404') {
    res.statusCode = 404
  }

  // handle static page
  if (typeof components.Component === 'string') {
    return components.Component
  }

  // check request state
  const isLikeServerless =
    typeof components.Component === 'object' &&
    typeof (components.Component as any).renderReqToHTML === 'function'
  const isSSG = !!components.getStaticProps
  const isServerProps = !!components.getServerSideProps
  const hasStaticPaths = !!components.getStaticPaths

  if (isSSG && query.amp) {
    pathname += `.amp`
  }

  if (!query.amp) {
    delete query.amp
  }

  // Toggle whether or not this is a Data request
  const isDataReq = !!query._nextDataReq
  delete query._nextDataReq

  let previewData: string | false | object | undefined
  let isPreviewMode = false

  if (isServerProps || isSSG) {
    previewData = tryGetPreviewData(req, res, opts.previewProps)
    isPreviewMode = previewData !== false
  }

  // non-spr requests should render like normal
  if (!isSSG) {
    // handle serverless
    if (isLikeServerless) {
      if (isDataReq) {
        const renderResult = await (components.Component as any).renderReqToHTML(
          req,
          res,
          'passthrough'
        )

        sendPayload(
          res,
          JSON.stringify(renderResult?.renderOpts?.pageData),
          'json',
          !opts.dev
            ? {
                private: isPreviewMode,
                stateful: true, // non-SSG data request
              }
            : undefined
        )
        return null
      }
      prepareServerlessUrl(req, query)
      return (components.Component as any).renderReqToHTML(req, res)
    }

    if (isDataReq && isServerProps) {
      const props = await renderToHTML(req, res, pathname, query, {
        ...components,
        ...opts,
        isDataReq,
      })
      sendPayload(
        res,
        JSON.stringify(props),
        'json',
        !opts.dev
          ? {
              private: isPreviewMode,
              stateful: true, // GSSP data request
            }
          : undefined
      )
      return null
    }

    const html = await renderToHTML(req, res, pathname, query, {
      ...components,
      ...opts,
    })

    if (html && isServerProps) {
      sendPayload(res, html, 'html', {
        private: isPreviewMode,
        stateful: true, // GSSP request
      })
      return null
    }

    return html
  }

  // Compute the iSSG cache key
  let urlPathname = `${parseUrl(req.url || '').pathname!}${
    query.amp ? '.amp' : ''
  }`

  // remove /_next/data prefix from urlPathname so it matches
  // for direct page visit and /_next/data visit
  if (isDataReq && urlPathname.includes(opts.buildId)) {
    urlPathname = (urlPathname.split(opts.buildId).pop() || '/')
      .replace(/\.json$/, '')
      .replace(/\/index$/, '/')
  }

  const ssgCacheKey = isPreviewMode
    ? `__` + nanoid() // Preview mode uses a throw away key to not coalesce preview invokes
    : urlPathname

  // Complete the response with cached data if its present
  const cachedData = isPreviewMode
    ? // Preview data bypasses the cache
      undefined
    : await getSprCache(ssgCacheKey)
  if (cachedData) {
    const data = isDataReq
      ? JSON.stringify(cachedData.pageData)
      : cachedData.html

    sendPayload(
      res,
      data,
      isDataReq ? 'json' : 'html',
      !opts.dev
        ? {
            private: isPreviewMode,
            stateful: false, // GSP response
            revalidate:
              cachedData.curRevalidate !== undefined
                ? cachedData.curRevalidate
                : /* default to minimum revalidate (this should be an invariant) */ 1,
          }
        : undefined
    )

    // Stop the request chain here if the data we sent was up-to-date
    if (!cachedData.isStale) {
      return null
    }
  }

  // If we're here, that means data is missing or it's stale.

  const doRender = withCoalescedInvoke(async function(): Promise<{
    html: string | null
    pageData: any
    sprRevalidate: number | false
  }> {
    let pageData: any
    let html: string | null
    let sprRevalidate: number | false

    let renderResult
    // handle serverless
    if (isLikeServerless) {
      renderResult = await (components.Component as any).renderReqToHTML(
        req,
        res,
        'passthrough'
      )

      html = renderResult.html
      pageData = renderResult.renderOpts.pageData
      sprRevalidate = renderResult.renderOpts.revalidate
    } else {
      const renderOpts: RenderOpts = {
        ...components,
        ...opts,
      }
      renderResult = await renderToHTML(req, res, pathname, query, renderOpts)

      html = renderResult
      // TODO: change this to a different passing mechanism
      pageData = (renderOpts as any).pageData
      sprRevalidate = (renderOpts as any).revalidate
    }

    return { html, pageData, sprRevalidate }
  })

  const isProduction = !opts.dev
  const isDynamicPathname = isDynamicRoute(pathname)
  const didRespond = isResSent(res)

  const { staticPaths, hasStaticFallback } = hasStaticPaths
    ? await opts.getStaticPathsHelper(pathname)
    : { staticPaths: undefined, hasStaticFallback: false }

  // const isForcedBlocking =
  //   req.headers['X-Prerender-Bypass-Mode'] !== 'Blocking'

  // When we did not respond from cache, we need to choose to block on
  // rendering or return a skeleton.
  //
  // * Data requests always block.
  //
  // * Preview mode toggles all pages to be resolved in a blocking manner.
  //
  // * Non-dynamic pages should block (though this is an impossible
  //   case in production).
  //
  // * Dynamic pages should return their skeleton if not defined in
  //   getStaticPaths, then finish the data request on the client-side.
  //
  if (
    !didRespond &&
    !isDataReq &&
    !isPreviewMode &&
    isDynamicPathname &&
    // Development should trigger fallback when the path is not in
    // `getStaticPaths`
    (isProduction || !staticPaths || !staticPaths.includes(urlPathname))
  ) {
    if (
      // In development, fall through to render to handle missing
      // getStaticPaths.
      (isProduction || staticPaths) &&
      // When fallback isn't present, abort this render so we 404
      !hasStaticFallback
    ) {
      throw new NoFallbackError()
    }

    let html: string

    // Production already emitted the fallback as static HTML.
    if (isProduction) {
      html = await getFallback(pathname)
    }
    // We need to generate the fallback on-demand for development.
    else {
      query.__nextFallback = 'true'
      if (isLikeServerless) {
        prepareServerlessUrl(req, query)
        const renderResult = await (components.Component as any).renderReqToHTML(
          req,
          res,
          'passthrough'
        )
        html = renderResult.html
      } else {
        html = (await renderToHTML(req, res, pathname, query, {
          ...components,
          ...opts,
        })) as string
      }
    }

    sendPayload(res, html, 'html')
  }

  const {
    isOrigin,
    value: { html, pageData, sprRevalidate },
  } = await doRender(ssgCacheKey, [])
  if (!isResSent(res)) {
    sendPayload(
      res,
      isDataReq ? JSON.stringify(pageData) : html,
      isDataReq ? 'json' : 'html',
      !opts.dev
        ? {
            private: isPreviewMode,
            stateful: false, // GSP response
            revalidate: sprRevalidate,
          }
        : undefined
    )
  }

  // Update the SPR cache if the head request
  if (isOrigin) {
    // Preview mode should not be stored in cache
    if (!isPreviewMode) {
      await setSprCache(ssgCacheKey, { html: html!, pageData }, sprRevalidate)
    }
  }

  return null
}
