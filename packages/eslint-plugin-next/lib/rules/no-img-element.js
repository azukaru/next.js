module.exports = {
  meta: {
    docs: {
      description: 'Prohibit usage of HTML <img> element',
      category: 'HTML',
      recommended: true,
    },
    fixable: null,
    schema: ['pagesDirectory'],
  },

  create: function (context) {
    return {
      JSXOpeningElement(node) {
        if (node.name.name !== 'img') {
          return
        }

        if (node.attributes.length === 0) {
          return
        }

        context.report({
          node,
          message: `Use Image from 'next/image' instead of the <img> element for better performance.`,
        })
      },
    }
  },
}
