const path = require('path')
module.exports = {
  onDemandEntries: {
    // Make sure entries are not getting disposed.
    maxInactiveAge: 1000 * 60 * 60
  },
  experimental: {
    publicDirectory: true
  },
  webpack (config) {
    config.module.rules.push({
      test: /pages[\\/]hmr[\\/]about/,
      loader: path.join(__dirname, 'warning-loader.js')
    })

    // config.optimization.minimize = false;
    return config
  }
  // conformance: {
  //   minificationTest: {
  //     disabled: false
  //   }
  // }
}
