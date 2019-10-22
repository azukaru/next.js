const path = require('path')
module.exports = {
  onDemandEntries: {
    // Make sure entries are not getting disposed.
    maxInactiveAge: 1000 * 60 * 60
  },
  experimental: {
    modern: true,
    granularChunks: true
  },
  webpack (config) {
    config.optimization.moduleIds = 'named'
    config.module.rules.push({
      test: /pages[\\/]hmr[\\/]about/,
      loader: path.join(__dirname, 'warning-loader.js')
    })
    return config
  }
}
