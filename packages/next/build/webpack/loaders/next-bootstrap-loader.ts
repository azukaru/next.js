import { loader } from 'webpack'
import loaderUtils from 'loader-utils'

const nextBootstrapLoader: loader.Loader = function() {
  const { bootstrap, collections, promise }: any = loaderUtils.getOptions(this)

  return `
    import bootstrap from '${bootstrap}'

    () => import('${promise}');

    const init = Promise => bootstrap(
        Promise,
        import('${collections}'),
        import('web-streams-polyfill/ponyfill'),
        import('react'),
        import('react-dom'),
        import('react-flight-dom-webpack'),
    )

    if (!window.Promise) {
        window.__NEXT_PROMISE_CB = () => init(window.Promise)
    } else {
        init(window.Promise)
    }
    `
}

export default nextBootstrapLoader
