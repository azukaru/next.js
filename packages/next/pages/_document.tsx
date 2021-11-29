import React, { Component, ReactElement, ReactNode, useContext } from 'react'
import { OPTIMIZED_FONT_PROVIDERS } from '../shared/lib/constants'
import {
  DocumentContext,
  DocumentInitialProps,
  DocumentProps,
  HtmlContext,
  HtmlProps,
} from '../shared/lib/utils'
import { BuildManifest, getPageFiles } from '../server/get-page-files'
import { cleanAmpPath } from '../server/utils'
import { htmlEscapeJsonString } from '../server/htmlescape'
import Script, { ScriptProps } from '../client/script'
import isError from '../lib/is-error'

export { DocumentContext, DocumentInitialProps, DocumentProps }

export type OriginProps = {
  nonce?: string
  crossOrigin?: string
}

type DocumentFiles = {
  sharedFiles: readonly string[]
  pageFiles: readonly string[]
  allFiles: readonly string[]
}

function getDocumentFiles(
  buildManifest: BuildManifest,
  pathname: string,
  inAmpMode: boolean
): DocumentFiles {
  const sharedFiles: readonly string[] = getPageFiles(buildManifest, '/_app')
  const pageFiles: readonly string[] = inAmpMode
    ? []
    : getPageFiles(buildManifest, pathname)

  return {
    sharedFiles,
    pageFiles,
    allFiles: [...new Set([...sharedFiles, ...pageFiles])],
  }
}

function getPolyfillScripts(context: HtmlProps, props: OriginProps) {
  // polyfills.js has to be rendered as nomodule without async
  // It also has to be the first script to load
  const {
    assetPrefix,
    buildManifest,
    devOnlyCacheBusterQueryString,
    disableOptimizedLoading,
  } = context

  return buildManifest.polyfillFiles
    .filter(
      (polyfill) => polyfill.endsWith('.js') && !polyfill.endsWith('.module.js')
    )
    .map((polyfill) => (
      <script
        key={polyfill}
        defer={!disableOptimizedLoading}
        nonce={props.nonce}
        crossOrigin={props.crossOrigin || process.env.__NEXT_CROSS_ORIGIN}
        noModule={true}
        src={`${assetPrefix}/_next/${polyfill}${devOnlyCacheBusterQueryString}`}
      />
    ))
}

function getPreNextScripts(context: HtmlProps, props: OriginProps) {
  const { scriptLoader, disableOptimizedLoading } = context

  return (scriptLoader.beforeInteractive || []).map(
    (file: ScriptProps, index: number) => {
      const { strategy, ...scriptProps } = file
      return (
        <script
          {...scriptProps}
          key={scriptProps.src || index}
          defer={!disableOptimizedLoading}
          nonce={props.nonce}
          data-nscript="beforeInteractive"
          crossOrigin={props.crossOrigin || process.env.__NEXT_CROSS_ORIGIN}
        />
      )
    }
  )
}

function getDynamicChunks(
  context: HtmlProps,
  props: OriginProps,
  files: DocumentFiles
) {
  const {
    dynamicImports,
    assetPrefix,
    isDevelopment,
    devOnlyCacheBusterQueryString,
    disableOptimizedLoading,
  } = context

  return dynamicImports.map((file) => {
    if (!file.endsWith('.js') || files.allFiles.includes(file)) return null

    return (
      <script
        async={!isDevelopment && disableOptimizedLoading}
        defer={!disableOptimizedLoading}
        key={file}
        src={`${assetPrefix}/_next/${encodeURI(
          file
        )}${devOnlyCacheBusterQueryString}`}
        nonce={props.nonce}
        crossOrigin={props.crossOrigin || process.env.__NEXT_CROSS_ORIGIN}
      />
    )
  })
}

function getScripts(
  context: HtmlProps,
  props: OriginProps,
  files: DocumentFiles
) {
  const {
    assetPrefix,
    buildManifest,
    isDevelopment,
    devOnlyCacheBusterQueryString,
    disableOptimizedLoading,
  } = context

  const normalScripts = files.allFiles.filter((file) => file.endsWith('.js'))
  const lowPriorityScripts = buildManifest.lowPriorityFiles?.filter((file) =>
    file.endsWith('.js')
  )

  return [...normalScripts, ...lowPriorityScripts].map((file) => {
    return (
      <script
        key={file}
        src={`${assetPrefix}/_next/${encodeURI(
          file
        )}${devOnlyCacheBusterQueryString}`}
        nonce={props.nonce}
        async={!isDevelopment && disableOptimizedLoading}
        defer={!disableOptimizedLoading}
        crossOrigin={props.crossOrigin || process.env.__NEXT_CROSS_ORIGIN}
      />
    )
  })
}

function makeStylesheetInert(node: ReactNode): ReactNode[] {
  return React.Children.map(node, (c: any) => {
    if (
      c.type === 'link' &&
      c.props['href'] &&
      OPTIMIZED_FONT_PROVIDERS.some(({ url }) =>
        c.props['href'].startsWith(url)
      )
    ) {
      const newProps = { ...(c.props || {}) }
      newProps['data-href'] = newProps['href']
      newProps['href'] = undefined
      return React.cloneElement(c, newProps)
    } else if (
      c.props &&
      c.props['children'] &&
      Object.getOwnPropertyDescriptor(c.props, 'children')?.writable
    ) {
      c.props['children'] = makeStylesheetInert(c.props['children'])
    }
    return c
  })
}

function getPreloadDynamicChunks(context: HtmlProps, props: OriginProps) {
  const { dynamicImports, assetPrefix, devOnlyCacheBusterQueryString } = context

  return (
    dynamicImports
      .map((file) => {
        if (!file.endsWith('.js')) {
          return null
        }

        return (
          <link
            rel="preload"
            key={file}
            href={`${assetPrefix}/_next/${encodeURI(
              file
            )}${devOnlyCacheBusterQueryString}`}
            as="script"
            nonce={props.nonce}
            crossOrigin={props.crossOrigin || process.env.__NEXT_CROSS_ORIGIN}
          />
        )
      })
      // Filter out nulled scripts
      .filter(Boolean)
  )
}

function getPreloadMainLinks(
  context: HtmlProps,
  props: OriginProps,
  files: DocumentFiles
): JSX.Element[] | null {
  const { assetPrefix, devOnlyCacheBusterQueryString, scriptLoader } = context
  const preloadFiles = files.allFiles.filter((file: string) => {
    return file.endsWith('.js')
  })

  return [
    ...(scriptLoader.beforeInteractive || []).map((file) => (
      <link
        key={file.src}
        nonce={props.nonce}
        rel="preload"
        href={file.src}
        as="script"
        crossOrigin={props.crossOrigin || process.env.__NEXT_CROSS_ORIGIN}
      />
    )),
    ...preloadFiles.map((file: string) => (
      <link
        key={file}
        nonce={props.nonce}
        rel="preload"
        href={`${assetPrefix}/_next/${encodeURI(
          file
        )}${devOnlyCacheBusterQueryString}`}
        as="script"
        crossOrigin={props.crossOrigin || process.env.__NEXT_CROSS_ORIGIN}
      />
    )),
  ]
}

function getCssLinks(
  context: HtmlProps,
  props: OriginProps,
  files: DocumentFiles
): JSX.Element[] | null {
  const { assetPrefix, devOnlyCacheBusterQueryString, dynamicImports } = context
  const cssFiles = files.allFiles.filter((f) => f.endsWith('.css'))
  const sharedFiles: Set<string> = new Set(files.sharedFiles)

  // Unmanaged files are CSS files that will be handled directly by the
  // webpack runtime (`mini-css-extract-plugin`).
  let unmangedFiles: Set<string> = new Set([])
  let dynamicCssFiles = Array.from(
    new Set(dynamicImports.filter((file) => file.endsWith('.css')))
  )
  if (dynamicCssFiles.length) {
    const existing = new Set(cssFiles)
    dynamicCssFiles = dynamicCssFiles.filter(
      (f) => !(existing.has(f) || sharedFiles.has(f))
    )
    unmangedFiles = new Set(dynamicCssFiles)
    cssFiles.push(...dynamicCssFiles)
  }

  let cssLinkElements: JSX.Element[] = []
  cssFiles.forEach((file) => {
    const isSharedFile = sharedFiles.has(file)

    if (!process.env.__NEXT_OPTIMIZE_CSS) {
      cssLinkElements.push(
        <link
          key={`${file}-preload`}
          nonce={props.nonce}
          rel="preload"
          href={`${assetPrefix}/_next/${encodeURI(
            file
          )}${devOnlyCacheBusterQueryString}`}
          as="style"
          crossOrigin={props.crossOrigin || process.env.__NEXT_CROSS_ORIGIN}
        />
      )
    }

    const isUnmanagedFile = unmangedFiles.has(file)
    cssLinkElements.push(
      <link
        key={file}
        nonce={props.nonce}
        rel="stylesheet"
        href={`${assetPrefix}/_next/${encodeURI(
          file
        )}${devOnlyCacheBusterQueryString}`}
        crossOrigin={props.crossOrigin || process.env.__NEXT_CROSS_ORIGIN}
        data-n-g={isUnmanagedFile ? undefined : isSharedFile ? '' : undefined}
        data-n-p={isUnmanagedFile ? undefined : isSharedFile ? undefined : ''}
      />
    )
  })

  if (
    process.env.NODE_ENV !== 'development' &&
    process.env.__NEXT_OPTIMIZE_FONTS
  ) {
    cssLinkElements = makeStylesheetInert(cssLinkElements) as ReactElement[]
  }

  return cssLinkElements.length === 0 ? null : cssLinkElements
}

function mutateDocumentScriptLoaderItems(
  context: HtmlProps,
  children: React.ReactNode
): ReactNode[] {
  const { scriptLoader } = context
  const scriptLoaderItems: ScriptProps[] = []
  const filteredChildren: ReactNode[] = []

  React.Children.forEach(children, (child: any) => {
    if (child.type === Script) {
      if (child.props.strategy === 'beforeInteractive') {
        scriptLoader.beforeInteractive = (
          scriptLoader.beforeInteractive || []
        ).concat([
          {
            ...child.props,
          },
        ])
        return
      } else if (
        ['lazyOnload', 'afterInteractive'].includes(child.props.strategy)
      ) {
        scriptLoaderItems.push(child.props)
        return
      }
    }

    filteredChildren.push(child)
  })

  context.__NEXT_DATA__.scriptLoader = scriptLoaderItems
  return filteredChildren
}

function getInlineScriptSource(context: Readonly<HtmlProps>): string {
  const { __NEXT_DATA__ } = context
  try {
    const data = JSON.stringify(__NEXT_DATA__)

    if (process.env.NODE_ENV === 'development') {
      const bytes = Buffer.from(data).byteLength
      const prettyBytes = require('../lib/pretty-bytes').default
      if (bytes > 128 * 1000) {
        console.warn(
          `Warning: data for page "${__NEXT_DATA__.page}" is ${prettyBytes(
            bytes
          )}, this amount of data can reduce performance.\nSee more info here: https://nextjs.org/docs/messages/large-page-data`
        )
      }
    }

    return htmlEscapeJsonString(data)
  } catch (err) {
    if (isError(err) && err.message.indexOf('circular structure')) {
      throw new Error(
        `Circular structure in "getInitialProps" result of page "${__NEXT_DATA__.page}". https://nextjs.org/docs/messages/circular-structure`
      )
    }
    throw err
  }
}

/**
 * `Document` component handles the initial `document` markup and renders only on the server side.
 * Commonly used for implementing server side rendering for `css-in-js` libraries.
 */
export default class Document<P = {}> extends Component<DocumentProps & P> {
  /**
   * `getInitialProps` hook returns the context object with the addition of `renderPage`.
   * `renderPage` callback executes `React` rendering logic synchronously to support server-rendering wrappers
   */
  static getInitialProps(ctx: DocumentContext): Promise<DocumentInitialProps> {
    return ctx.defaultGetInitialProps(ctx)
  }

  render() {
    return (
      <Html>
        <Head />
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export function Html(
  props: React.DetailedHTMLProps<
    React.HtmlHTMLAttributes<HTMLHtmlElement>,
    HTMLHtmlElement
  >
) {
  const { inAmpMode, docComponentsRendered, locale } = useContext(HtmlContext)

  docComponentsRendered.Html = true

  return (
    <html
      {...props}
      lang={props.lang || locale || undefined}
      amp={inAmpMode ? '' : undefined}
      data-ampdevmode={
        inAmpMode && process.env.NODE_ENV !== 'production' ? '' : undefined
      }
    />
  )
}

function AmpStyles({
  styles,
}: {
  styles?: React.ReactElement[] | React.ReactFragment
}) {
  if (!styles) return null

  // try to parse styles from fragment for backwards compat
  const curStyles: React.ReactElement[] = Array.isArray(styles)
    ? (styles as React.ReactElement[])
    : []
  if (
    // @ts-ignore Property 'props' does not exist on type ReactElement
    styles.props &&
    // @ts-ignore Property 'props' does not exist on type ReactElement
    Array.isArray(styles.props.children)
  ) {
    const hasStyles = (el: React.ReactElement) =>
      el?.props?.dangerouslySetInnerHTML?.__html
    // @ts-ignore Property 'props' does not exist on type ReactElement
    styles.props.children.forEach((child: React.ReactElement) => {
      if (Array.isArray(child)) {
        child.forEach((el) => hasStyles(el) && curStyles.push(el))
      } else if (hasStyles(child)) {
        curStyles.push(child)
      }
    })
  }

  /* Add custom styles before AMP styles to prevent accidental overrides */
  return (
    <style
      amp-custom=""
      dangerouslySetInnerHTML={{
        __html: curStyles
          .map((style) => style.props.dangerouslySetInnerHTML.__html)
          .join('')
          .replace(/\/\*# sourceMappingURL=.*\*\//g, '')
          .replace(/\/\*@ sourceURL=.*?\*\//g, ''),
      }}
    />
  )
}

export function Head(
  props: OriginProps &
    React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLHeadElement>,
      HTMLHeadElement
    >
) {
  const context = useContext(HtmlContext)
  const {
    styles,
    ampPath,
    inAmpMode,
    hybridAmp,
    canonicalBase,
    __NEXT_DATA__,
    dangerousAsPath,
    headTags,
    unstable_runtimeJS,
    unstable_JsPreload,
    disableOptimizedLoading,
    useMaybeDeferContent,
  } = context

  const disableRuntimeJS = unstable_runtimeJS === false
  const disableJsPreload =
    unstable_JsPreload === false || !disableOptimizedLoading

  context.docComponentsRendered.Head = true

  let { head } = context
  let cssPreloads: Array<JSX.Element> = []
  let otherHeadElements: Array<JSX.Element> = []
  if (head) {
    head.forEach((c) => {
      if (
        c &&
        c.type === 'link' &&
        c.props['rel'] === 'preload' &&
        c.props['as'] === 'style'
      ) {
        cssPreloads.push(c)
      } else {
        c && otherHeadElements.push(c)
      }
    })
    head = cssPreloads.concat(otherHeadElements)
  }
  let children = React.Children.toArray(props.children).filter(Boolean)
  // show a warning if Head contains <title> (only in development)
  if (process.env.NODE_ENV !== 'production') {
    children = React.Children.map(children, (child: any) => {
      const isReactHelmet = child?.props?.['data-react-helmet']
      if (!isReactHelmet) {
        if (child?.type === 'title') {
          console.warn(
            "Warning: <title> should not be used in _document.js's <Head>. https://nextjs.org/docs/messages/no-document-title"
          )
        } else if (
          child?.type === 'meta' &&
          child?.props?.name === 'viewport'
        ) {
          console.warn(
            "Warning: viewport meta tags should not be used in _document.js's <Head>. https://nextjs.org/docs/messages/no-document-viewport-meta"
          )
        }
      }
      return child
    })
    if (props.crossOrigin)
      console.warn(
        'Warning: `Head` attribute `crossOrigin` is deprecated. https://nextjs.org/docs/messages/doc-crossorigin-deprecated'
      )
  }

  if (
    process.env.NODE_ENV !== 'development' &&
    process.env.__NEXT_OPTIMIZE_FONTS &&
    !inAmpMode
  ) {
    children = makeStylesheetInert(children)
  }

  children = mutateDocumentScriptLoaderItems(context, children)

  let hasAmphtmlRel = false
  let hasCanonicalRel = false

  // show warning and remove conflicting amp head tags
  head = React.Children.map(head || [], (child) => {
    if (!child) return child
    const { type, props } = child
    if (inAmpMode) {
      let badProp: string = ''

      if (type === 'meta' && props.name === 'viewport') {
        badProp = 'name="viewport"'
      } else if (type === 'link' && props.rel === 'canonical') {
        hasCanonicalRel = true
      } else if (type === 'script') {
        // only block if
        // 1. it has a src and isn't pointing to ampproject's CDN
        // 2. it is using dangerouslySetInnerHTML without a type or
        // a type of text/javascript
        if (
          (props.src && props.src.indexOf('ampproject') < -1) ||
          (props.dangerouslySetInnerHTML &&
            (!props.type || props.type === 'text/javascript'))
        ) {
          badProp = '<script'
          Object.keys(props).forEach((prop) => {
            badProp += ` ${prop}="${props[prop]}"`
          })
          badProp += '/>'
        }
      }

      if (badProp) {
        console.warn(
          `Found conflicting amp tag "${child.type}" with conflicting prop ${badProp} in ${__NEXT_DATA__.page}. https://nextjs.org/docs/messages/conflicting-amp-tag`
        )
        return null
      }
    } else {
      // non-amp mode
      if (type === 'link' && props.rel === 'amphtml') {
        hasAmphtmlRel = true
      }
    }
    return child
  })

  const files: DocumentFiles = getDocumentFiles(
    context.buildManifest,
    context.__NEXT_DATA__.page,
    inAmpMode
  )

  // Must use nested component to allow use of a custom hook
  const DeferrableHead = () => {
    const getDynamicHeadContent = () => {
      return (
        <>
          {head}
          <meta
            name="next-head-count"
            content={React.Children.count(head || []).toString()}
          />
        </>
      )
    }

    const getDynamicScriptPreloads = () => {
      return (
        <>
          {!disableRuntimeJS &&
            !disableJsPreload &&
            getPreloadDynamicChunks(context, props)}
          {!disableRuntimeJS &&
            !disableJsPreload &&
            getPreloadMainLinks(context, props, files)}
        </>
      )
    }

    const getDynamicScriptContent = () => {
      return (
        <>
          {!disableOptimizedLoading &&
            !disableRuntimeJS &&
            getPreNextScripts(context, props)}
          {!disableOptimizedLoading &&
            !disableRuntimeJS &&
            getDynamicChunks(context, props, files)}
          {!disableOptimizedLoading &&
            !disableRuntimeJS &&
            getScripts(context, props, files)}
        </>
      )
    }

    const [isDeferred] = useMaybeDeferContent('HEAD', () => {
      return (
        <>
          {getDynamicHeadContent()}
          {getDynamicScriptPreloads()}
          {getDynamicScriptContent()}
        </>
      )
    })

    return (
      <head {...props}>
        {!process.env.__NEXT_CONCURRENT_FEATURES && context.isDevelopment && (
          <>
            <style
              data-next-hide-fouc
              data-ampdevmode={inAmpMode ? 'true' : undefined}
              dangerouslySetInnerHTML={{
                __html: `body{display:none}`,
              }}
            />
            <noscript
              data-next-hide-fouc
              data-ampdevmode={inAmpMode ? 'true' : undefined}
            >
              <style
                dangerouslySetInnerHTML={{
                  __html: `body{display:block}`,
                }}
              />
            </noscript>
          </>
        )}
        {children}
        {process.env.__NEXT_OPTIMIZE_FONTS && (
          <meta name="next-font-preconnect" />
        )}

        {!isDeferred && getDynamicHeadContent()}

        {inAmpMode && (
          <>
            <meta
              name="viewport"
              content="width=device-width,minimum-scale=1,initial-scale=1"
            />
            {!hasCanonicalRel && (
              <link
                rel="canonical"
                href={canonicalBase + cleanAmpPath(dangerousAsPath)}
              />
            )}
            {/* https://www.ampproject.org/docs/fundamentals/optimize_amp#optimize-the-amp-runtime-loading */}
            <link
              rel="preload"
              as="script"
              href="https://cdn.ampproject.org/v0.js"
            />
            <AmpStyles styles={styles} />
            <style
              amp-boilerplate=""
              dangerouslySetInnerHTML={{
                __html: `body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}`,
              }}
            />
            <noscript>
              <style
                amp-boilerplate=""
                dangerouslySetInnerHTML={{
                  __html: `body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}`,
                }}
              />
            </noscript>
            <script async src="https://cdn.ampproject.org/v0.js" />
          </>
        )}
        {!inAmpMode && (
          <>
            {!hasAmphtmlRel && hybridAmp && (
              <link
                rel="amphtml"
                href={canonicalBase + getAmpPath(ampPath, dangerousAsPath)}
              />
            )}
            {!process.env.__NEXT_OPTIMIZE_CSS &&
              getCssLinks(context, props, files)}
            {!process.env.__NEXT_OPTIMIZE_CSS && (
              <noscript data-n-css={props.nonce ?? ''} />
            )}
            {process.env.__NEXT_OPTIMIZE_IMAGES && (
              <meta name="next-image-preload" />
            )}

            {!isDeferred && getDynamicScriptPreloads()}

            {!disableOptimizedLoading &&
              !disableRuntimeJS &&
              getPolyfillScripts(context, props)}

            {!isDeferred && getDynamicScriptContent()}

            {process.env.__NEXT_OPTIMIZE_CSS &&
              getCssLinks(context, props, files)}
            {process.env.__NEXT_OPTIMIZE_CSS && (
              <noscript data-n-css={props.nonce ?? ''} />
            )}
            {context.isDevelopment && (
              // this element is used to mount development styles so the
              // ordering matches production
              // (by default, style-loader injects at the bottom of <head />)
              <noscript id="__next_css__DO_NOT_USE__" />
            )}
            {styles || null}
          </>
        )}
        {React.createElement(React.Fragment, {}, ...(headTags || []))}
      </head>
    )
  }

  return <DeferrableHead />
}

export function Main({
  children,
}: {
  children?: (content: JSX.Element) => JSX.Element
}) {
  const { docComponentsRendered, useMainContent } = useContext(HtmlContext)
  const content = useMainContent(children)
  docComponentsRendered.Main = true
  return content
}

export function NextScript(props: OriginProps) {
  const context = useContext(HtmlContext)
  const {
    assetPrefix,
    inAmpMode,
    buildManifest,
    unstable_runtimeJS,
    docComponentsRendered,
    devOnlyCacheBusterQueryString,
    disableOptimizedLoading,
    useMaybeDeferContent,
  } = context
  const disableRuntimeJS = unstable_runtimeJS === false

  docComponentsRendered.NextScript = true

  // Must nest component to use custom hook
  const DeferrableNextScript = () => {
    const [, content] = useMaybeDeferContent('NEXT_SCRIPT', () => {
      if (inAmpMode) {
        const ampDevFiles = [
          ...buildManifest.devFiles,
          ...buildManifest.polyfillFiles,
          ...buildManifest.ampDevFiles,
        ]

        return (
          <>
            {disableRuntimeJS ? null : (
              <script
                id="__NEXT_DATA__"
                type="application/json"
                nonce={props.nonce}
                crossOrigin={
                  props.crossOrigin || process.env.__NEXT_CROSS_ORIGIN
                }
                dangerouslySetInnerHTML={{
                  __html: getInlineScriptSource(context),
                }}
                data-ampdevmode
              />
            )}
            {ampDevFiles.map((file) => (
              <script
                key={file}
                src={`${assetPrefix}/_next/${file}${devOnlyCacheBusterQueryString}`}
                nonce={props.nonce}
                crossOrigin={
                  props.crossOrigin || process.env.__NEXT_CROSS_ORIGIN
                }
                data-ampdevmode
              />
            ))}
          </>
        )
      }

      if (process.env.NODE_ENV !== 'production') {
        if (props.crossOrigin)
          console.warn(
            'Warning: `NextScript` attribute `crossOrigin` is deprecated. https://nextjs.org/docs/messages/doc-crossorigin-deprecated'
          )
      }

      const files: DocumentFiles = getDocumentFiles(
        context.buildManifest,
        context.__NEXT_DATA__.page,
        inAmpMode
      )

      return (
        <>
          {!disableRuntimeJS && buildManifest.devFiles
            ? buildManifest.devFiles.map((file: string) => (
                <script
                  key={file}
                  src={`${assetPrefix}/_next/${encodeURI(
                    file
                  )}${devOnlyCacheBusterQueryString}`}
                  nonce={props.nonce}
                  crossOrigin={
                    props.crossOrigin || process.env.__NEXT_CROSS_ORIGIN
                  }
                />
              ))
            : null}
          {disableRuntimeJS ? null : (
            <script
              id="__NEXT_DATA__"
              type="application/json"
              nonce={props.nonce}
              crossOrigin={props.crossOrigin || process.env.__NEXT_CROSS_ORIGIN}
              dangerouslySetInnerHTML={{
                __html: getInlineScriptSource(context),
              }}
            />
          )}
          {disableOptimizedLoading &&
            !disableRuntimeJS &&
            getPolyfillScripts(context, props)}
          {disableOptimizedLoading &&
            !disableRuntimeJS &&
            getPreNextScripts(context, props)}
          {disableOptimizedLoading &&
            !disableRuntimeJS &&
            getDynamicChunks(context, props, files)}
          {disableOptimizedLoading &&
            !disableRuntimeJS &&
            getScripts(context, props, files)}
        </>
      )
    })
    if (inAmpMode && process.env.NODE_ENV === 'production') {
      return null
    }
    return content
  }

  return <DeferrableNextScript />
}

function getAmpPath(ampPath: string, asPath: string): string {
  return ampPath || `${asPath}${asPath.includes('?') ? '&' : '?'}amp=1`
}
