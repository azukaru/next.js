import React, { Component, useContext } from 'react'
import flush from 'styled-jsx/server'
import {
  HEAD_RENDER_TARGET,
  MAIN_RENDER_TARGET,
  SCRIPT_RENDER_TARGET,
} from '../next-server/lib/constants'
import { DocumentContext as DocumentComponentContext } from '../next-server/lib/document-context'
import {
  DocumentContext,
  DocumentInitialProps,
  DocumentProps,
  HeadProps,
  OriginProps,
  ScriptProps,
} from '../next-server/lib/utils'

export { DocumentContext, DocumentInitialProps, DocumentProps, OriginProps }
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
  const { docComponentsRendered } = useContext(DocumentComponentContext)
  docComponentsRendered.Main = true
  return <>{MAIN_RENDER_TARGET}</>
}

export function Head(props: HeadProps) {
  const { docComponentsRendered } = useContext(DocumentComponentContext)
  docComponentsRendered.Head = props
  return <>{HEAD_RENDER_TARGET}</>
}

export function NextScript(props: ScriptProps) {
  const { docComponentsRendered } = useContext(DocumentComponentContext)
  docComponentsRendered.NextScript = props
  return <>{SCRIPT_RENDER_TARGET}</>
}
