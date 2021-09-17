import React from 'react'
import { useCachedPromise } from '../components/promise-cache'

function Content() {
  useCachedPromise(
    'styled-content',
    () => new Promise((resolve) => setTimeout(resolve, 2000)),
    true
  )
  return (
    <>
      <style jsx>{`
        .blue {
          color: blue;
        }
      `}</style>
      <span className="blue">World!</span>
    </>
  )
}

export default function StyledJsx() {
  return (
    <>
      <style jsx>{`
        .red {
          color: red;
        }
      `}</style>
      <span className="red">Hello, </span>
      <React.Suspense fallback="...">
        <Content />
      </React.Suspense>
    </>
  )
}

// Disable offline build
export function getServerSideProps() {
  return { props: {} }
}
