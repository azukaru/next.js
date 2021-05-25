import React, { Component, useContext } from 'react'
import flush from 'styled-jsx/server'
import { AMP_RENDER_TARGET } from '../next-server/lib/constants'
import { DocumentContext as DocumentComponentContext } from '../next-server/lib/document-context'
import {
  DocumentContext,
  DocumentInitialProps,
  DocumentProps,
  OriginProps,
} from '../next-server/lib/utils'
import { Head, NextScript } from '../next-server/server/document-utils'

export { DocumentContext, DocumentInitialProps, DocumentProps, OriginProps }
export { Head, NextScript }

/**
 * `Document` component handles the initial `document` markup and renders only on the server side.
 * Commonly used for implementing server side rendering for `css-in-js` libraries.
 */
export default class Document<P = {}> extends Component<DocumentProps & P> {
  /**
   * `getInitialProps` hook returns the context object with the addition of `renderPage`.
   * `renderPage` callback executes `React` rendering logic synchronously to support server-rendering wrappers
   */
  static async getInitialProps(
    ctx: DocumentContext
  ): Promise<DocumentInitialProps> {
    const enhanceApp = (App: any) => {
      return (props: any) => <App {...props} />
    }

    const { html, head } = await ctx.renderPage({ enhanceApp })
    const styles = [...flush()]
    return { html, head, styles }
  }

  static renderDocument<Y>(
    DocumentComponent: new () => Document<Y>,
    props: DocumentProps & Y
  ): React.ReactElement {
    return (
      <DocumentComponentContext.Provider value={props}>
        <DocumentComponent {...props} />
      </DocumentComponentContext.Provider>
    )
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
  const { inAmpMode, docComponentsRendered, locale } = useContext(
    DocumentComponentContext
  )

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

export function Main() {
  const { inAmpMode, html, docComponentsRendered } = useContext(
    DocumentComponentContext
  )

  docComponentsRendered.Main = true

  if (inAmpMode) return <>{AMP_RENDER_TARGET}</>
  return <div id="__next" dangerouslySetInnerHTML={{ __html: html }} />
}
