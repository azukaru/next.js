export const INIT = 0
export const WRITE = 1
export const BUFFER = 2
export const FLUSH = 3
export const CLOSE = 4
export const SCHEDULE = 5

export type State = {
  full: boolean
  update: () => void
}

type Command =
  | [type: typeof INIT, state: State]
  | [type: typeof WRITE, chunk: Uint8Array]
  | [type: typeof BUFFER, buffer: boolean]
  | [type: typeof FLUSH]
  | [type: typeof CLOSE, error?: Error]
  | [type: typeof SCHEDULE, callback: () => void]

export type Executor = (...args: Command) => void
