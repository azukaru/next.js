export enum RuntimeCommandType {
  INIT = 0,
  WRITE = 1,
  BUFFER = 2,
  FLUSH = 3,
  CLOSE = 4,
  SCHEDULE = 5,
}

export type RuntimeState = {
  full: boolean
  update: () => void
}

type RuntimeCommand =
  | [type: RuntimeCommandType.INIT, state: RuntimeState]
  | [type: RuntimeCommandType.WRITE, chunk: Uint8Array]
  | [type: RuntimeCommandType.BUFFER, buffer: boolean]
  | [type: RuntimeCommandType.FLUSH]
  | [type: RuntimeCommandType.CLOSE, error?: Error]
  | [type: RuntimeCommandType.SCHEDULE, callback: () => void]

type RuntimeExecutor = (...args: RuntimeCommand) => void
export default RuntimeExecutor
