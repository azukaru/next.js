import { webpack } from 'next/dist/compiled/webpack/webpack'
import loaderUtils from 'next/dist/compiled/loader-utils'

export type ServerComponentLoaderOptions = {
  isServer?: boolean
}

const ReactServerComponentLoader: webpack.loader.Loader = function (source) {
  const { isServer }: ServerComponentLoaderOptions =
    loaderUtils.getOptions(this) || {}

  if (isServer !== true) {
    throw new Error(
      "Can't include Server Components in a Client Bundle. Make sure to only import `.server` files from other `.server` files."
    )
  }
  return source
}
export default ReactServerComponentLoader
