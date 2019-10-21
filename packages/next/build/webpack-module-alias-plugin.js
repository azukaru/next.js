const ParserHelpers = require('webpack/lib/ParserHelpers')

const JS_TYPES = ['auto', 'esm', 'dynamic']

const NAME = 'UnpolyfillPlugin'

module.exports = class UnpolyfillPlugin {
  mappings = {
    // stdlib
    'object-assign': 'Object.assign',
    'object-is': 'Object.is',
    '@babel/runtime-corejs2/core-js/object/assign': 'Object.assign',
    '@babel/runtime-corejs2/helpers/extends': 'Object.assign',
    'core-js/library/fn/object/assign': 'Object.assign',
    'core-js/library/modules/es6.object.assign': 'Object.assign',
    '@babel/runtime-corejs2/core-js/object/get-own-property-descriptor':
      'Object.getOwnPropertyDescriptor',
    'core-js/library/fn/object/get-own-property-descriptor':
      'Object.getOwnPropertyDescriptor',
    'core-js/library/modules/es6.object.get-own-property-descriptor':
      'Object.getOwnPropertyDescriptor',
    '@babel/runtime-corejs2/helpers/setPrototypeOf': 'Object.setPropertyOf',
    '@babel/runtime-corejs2/core-js/object/set-prototype-of':
      'Object.setPropertyOf',
    'core-js/library/fn/object/object/set-prototype-of': 'Object.setPropertyOf',
    'core-js/object/set-prototype-of': 'Object.setPropertyOf',
    '@babel/runtime-corejs2/core-js/object/keys': 'Object.keys',
    '@babel/runtime-corejs2/core-js/map': 'Map',
    'core-js/library/modules/es6.map': 'Map',
    'core-js/library/fn/map': 'Map',
    '@babel/runtime-corejs2/core-js/set': 'Set',
    'core-js/library/modules/es6.set': 'Set',
    'core-js/library/fn/set': 'Set',
    '@babel/runtime-corejs2/core-js/array/from.js': 'Array.from',
    'core-js/library/modules/es6.array.from.js': 'Array.from',
    'core-js/library/fn/array/from.js': 'Array.from',
    '@babel/runtime-corejs2/core-js/array/is-array.js': 'Array.isArray',
    'core-js/library/modules/es6.array.is-array.js': 'Array.isArray',
    'core-js/library/fn/array/is-array.js': 'Array.isArray',
    '@babel/runtime-corejs2/core-js/json/stringify': 'JSON.stringify',
    '@babel/runtime-corejs2/core-js/date/now': 'Date.now',

    // Fetch
    'whatwg-fetch': 'fetch',
    'isomorphic-fetch': 'fetch',
    'isomorphic-unfetch': 'fetch',
    'unfetch/polyfill': 'fetch',
    unfetch: 'fetch',

    // Promise
    'es6-promise': 'Promise',
    'promise-polyfill': 'Promise',
    lie: 'Promise'
  }

  apply (compiler) {
    const hook = (parser, statement, source) => {
      if (this.mappings.hasOwnProperty(source)) {
        const mapped = this.mappings[source]
        return ParserHelpers.toConstantDependency(parser, mapped)(statement)
      }
    }

    compiler.hooks.normalModuleFactory.tap(NAME, factory => {
      for (const type of JS_TYPES) {
        factory.hooks.parser.for('javascript/' + type).tap(NAME, parser => {
          parser.hooks.import.tap(NAME, (statement, source) => {
            return hook(parser, statement, source)
          })
          parser.hooks.call.for('require').tap(NAME, expr => {
            const statement = expr
            const source = parser.evaluateExpression(expr.arguments[0]).string
            return hook(parser, statement, source)
          })
        })
      }
    })
  }
}
