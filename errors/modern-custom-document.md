# Modern Custom Document

#### Why This Error Occurred

Your custom Document component (pages/\_document) either extends from `next/document` or uses unsupported hooks or features.

#### Possible Ways to Fix It

To support upcoming features in React like Suspense and React Server Components, you should use a modern Document component. A
simple modern Document component looks something like this:

```jsx
import { useGetInitialProps, Html, Head, Main, NextScript } from 'next/document'

// Only uncomment this method if your custom Document component needs it.
// async function getInitialProps(ctx) {
//   return { /* ... */ }
// }

export default function Document() {
  // Uncomment this if you also uncommented `getInitialProps` above.
  // const initialProps = useGetInitialProps(getInitialProps)
  return (
    <Html>
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
```

Please note the following restrictions:

- You **must** use the `useGetInitialProps` hook instead of a `getInitialProps` property. The latter is not supported.

- No hooks other than `useGetInitialProps` are currently supported. You **must not** use `useState`, `useCallback`, `useEffect`, etc.

- Suspense is not currently supported. You **must** resolve any dependencies via `useGetInitialProps`

- The `ctx` in `getInitialProps` no longer supports `renderPage`. You must upgrade your CSS-in-JS library to a version that supports streaming rendering.
