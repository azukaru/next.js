import { webpack } from 'next/dist/compiled/webpack/webpack'
import loaderUtils from 'next/dist/compiled/loader-utils'

export type ClientComponentLoaderOptions = {
  isServer: boolean
}

const ReactClientComponentLoader: webpack.loader.Loader = function (source) {
  const { isServer }: ClientComponentLoaderOptions =
    loaderUtils.getOptions(this) || {}

  if (isServer !== true) {
    return source
  }

  return `
    const {createModuleReference} = require('next/dist/build/webpack/plugins/react-server-dom-webpack-plugin/server')
    module.exports = createModuleReference("${this.resourcePath}")
    `
}
export default ReactClientComponentLoader
