import { Writable } from 'stream'

export function pipeToNodeWritable(
  model: React.ReactElement,
  _destination: Writable,
  _webpackMap: any
): void {
  const { type } = model

  if (typeof type != 'function') {
    throw new Error('')
  }
}
