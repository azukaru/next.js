const path = require('path')
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true'
})

module.exports = withBundleAnalyzer({
  onDemandEntries: {
    // Make sure entries are not getting disposed.
    maxInactiveAge: 1000 * 60 * 60
  },
  webpack (config) {
    // Useful for debugging what modules are included:
    // config.optimization.moduleIds = 'named';
    // config.plugins = config.plugins.filter(p => p.constructor.name !== 'HashedModuleIdsPlugin');

    config.module.rules.push({
      test: /pages[\\/]hmr[\\/]about/,
      loader: path.join(__dirname, 'warning-loader.js')
    })

    return config
  }
})
