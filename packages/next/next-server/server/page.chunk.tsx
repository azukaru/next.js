// @ts-ignore
import React from 'react'
import chunk from './chunk'
import { Context as StreamContext } from './stream'

function Query() {
  const text = React.useContext(StreamContext)
  return { text }
}

function Render(props: any, data: any) {
  throw new Error("Didn't expect to render on the server.")
}

export default chunk(Query, Render)
