#!/usr/bin/env node
import { existsSync } from 'fs'
import arg from 'next/dist/compiled/arg/index.js'
import { resolve } from 'path'

import { cliCommand } from '../bin/next'
import { audit } from '../next-audit/'
import { printAndExit } from '../server/lib/utils'

const nextAudit: cliCommand = argv => {
  const args = arg(
    {
      // Types
      '--help': Boolean,
      // Aliases
      '-h': '--help',
    },
    { argv }
  )

  if (args['--help']) {
    printAndExit(
      `
      Description
        Executes audit checks on the code.

      Usage
        $ next audit <dir>

      <dir> represents the directory of the Next.js application.
      If no directory is provided, the current directory will be used.
    `,
      0
    )
  }

  const dir = resolve(args._[0] || '.')

  // Check if the provided directory exists
  if (!existsSync(dir)) {
    printAndExit(`> No such directory exists as the project root: ${dir}`)
  }

  audit(dir)
    .then(() => process.exit(0))
    .catch(err => {
      console.error('')
      console.error('> Build error occurred')
      printAndExit(err)
    })
}

export { nextAudit }
