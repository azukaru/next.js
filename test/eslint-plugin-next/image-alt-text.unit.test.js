const rule = require('@next/eslint-plugin-next/lib/rules/image-alt-text')

const RuleTester = require('eslint').RuleTester

RuleTester.setDefaultConfig({
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    ecmaFeatures: {
      modules: true,
      jsx: true,
    },
  },
})

var ruleTester = new RuleTester()
ruleTester.run('image-alt-text', rule, {
  valid: [
    `import Image from 'next/image';

      export class MyComponent {
        render() {
          return (
            <div>
              <Image
                src="/test.png"
                alt="Test picture"
                width={500}
                height={500}
              />
            </div>
          );
        }
      }`,
  ],
  invalid: [
    {
      code: `
      import Image from 'next/image';

      export class MyComponent {
        render() {
          return (
            <div>
              <Image 
                src="/test.png"
                width={500}
                height={500}
              />
            </div>
          );
        }
      }`,
      errors: [
        {
          message:
            'Image elements must have an alt prop, either with meaningful text, or an empty string for decorative images.',
          type: 'JSXOpeningElement',
        },
      ],
    },
  ],
})
