/* eslint-disable import/no-extraneous-dependencies */

module.exports = function () {
  return {
    BasicEvaluatedExpression: require('webpack/lib/BasicEvaluatedExpression'),
    NodeTargetPlugin: require('webpack/lib/node/NodeTargetPlugin'),
    ModuleFilenameHelpers: require('webpack/lib/ModuleFilenameHelpers'),
    GraphHelpers: require('webpack/lib/GraphHelpers'),
    AsyncDependenciesBlock: require('webpack/lib/AsyncDependenciesBlock'),
    ModuleDependency: require('webpack/lib/dependencies/ModuleDependency'),
    NullDependency: require('webpack/lib/dependencies/NullDependency'),
    Template: require('webpack/lib/Template'),
    sources: require('webpack-sources'),
    webpack: require('webpack'),
  }
}
