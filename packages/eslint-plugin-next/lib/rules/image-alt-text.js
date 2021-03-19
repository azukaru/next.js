const NodeAttributes = require('../utils/nodeAttributes.js')

module.exports = {
  create: function (context) {
    let imageImported = null
    return {
      ImportDeclaration(node) {
        if (node.source.value === 'next/image') {
          imageImported = node.specifiers[0].local.name
        }
      },
      JSXOpeningElement(node) {
        if (!imageImported || node.name.name !== imageImported) {
          return
        }

        const attributes = new NodeAttributes(node)

        if (!attributes.has('alt')) {
          context.report({
            node,
            message:
              'Image elements must have an alt prop, either with meaningful text, or an empty string for decorative images.',
          })
        }
      },
    }
  },
}
