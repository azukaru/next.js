import loaderUtils from 'next/dist/compiled/loader-utils'

export type ClientPagesLoaderOptions = {
  absolutePagePath: string
  page: string
}

// this parameter: https://www.typescriptlang.org/docs/handbook/functions.html#this-parameters
function nextClientPagesLoader(this: any) {
  const pagesLoaderSpan = this.currentTraceSpan.traceChild(
    'next-client-pages-loader'
  )

  return pagesLoaderSpan.traceFn(() => {
    const { absolutePagePath, page } = loaderUtils.getOptions(
      this
    ) as ClientPagesLoaderOptions

    pagesLoaderSpan.setAttribute('absolutePagePath', absolutePagePath)

    const stringifiedPagePath = loaderUtils.stringifyRequest(
      this,
      absolutePagePath
    )
    const stringifiedPage = JSON.stringify(page)
    const isApp = page === '/_app'

    return `
    (window.__NEXT_P = window.__NEXT_P || []).push([
      ${stringifiedPage},
      function () {
        const mod = require(${stringifiedPagePath});
        if (${isApp}) {
          const fn = mod.reportWebVitals
          if (fn) {
            const callbacks = require('next/dist/client/vitals').webVitalsCallbacks
            callbacks.add(fn)
            if (module.hot) {
              module.hot.dispose(function () {
                callbacks.delete(fn)
              })
            }
          }
        }
        return mod;
      }
    ]);
    if(module.hot) {
      module.hot.dispose(function () {
        window.__NEXT_P.push([${stringifiedPage}])
      });
    }
  `
  })
}

export default nextClientPagesLoader
