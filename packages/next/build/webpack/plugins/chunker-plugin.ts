import { Compiler } from 'webpack'

export default class ChunkerPlugin {
  apply(compiler: Compiler) {
    compiler.hooks.thisCompilation.tap('ChunkerPlugin', compilation => {
      compilation.hooks.optimizeChunks.tap(
        'ChunkerPlugin',
        (chunks, groups) => {
          // debugger;
          // throw new Error(chunks.map(c => `CHUNK: ${c.name}\nFILES: ${c.files.join(', ')}`).join('\n\n'))
        }
      )
    })
  }
}
