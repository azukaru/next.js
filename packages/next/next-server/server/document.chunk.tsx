// @ts-ignore
import React from 'react'
import chunk from './chunk'

function Query() {
  return {}
}

function Render({ Head, Main }: { Head: any; Main: any }) {
  return (
    <html lang="en">
      <Head />
      <body>
        <Main />
      </body>
    </html>
  )
}

export default chunk(Query, Render)
