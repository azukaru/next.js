/* eslint-disable import/no-extraneous-dependencies */

module.exports = function () {
  return {
    BasicEvaluatedExpression: require('webpack5/lib/javascript/BasicEvaluatedExpression'),
    ModuleFilenameHelpers: require('webpack5/lib/ModuleFilenameHelpers'),
    NodeTargetPlugin: require('webpack5/lib/node/NodeTargetPlugin'),
    StringXor: require('webpack5/lib/util/StringXor'),
    AsyncDependenciesBlock: require('webpack5/lib/AsyncDependenciesBlock'),
    ModuleDependency: require('webpack5/lib/dependencies/ModuleDependency'),
    NullDependency: require('webpack5/lib/dependencies/NullDependency'),
    Template: require('webpack5/lib/Template'),
    sources: require('webpack5').sources,
    webpack: require('webpack5'),
  }
}
