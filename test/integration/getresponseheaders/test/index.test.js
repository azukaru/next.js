/* eslint-env jest */

import fs from 'fs-extra'
import { nextBuild } from 'next-test-utils'
import { join } from 'path'
import { SSG_GRH_MISSING_ERROR } from 'next/dist/lib/constants'

jest.setTimeout(1000 * 60 * 2)
const appDir = join(__dirname, '..')
const nextConfig = join(appDir, 'next.config.js')

const runTests = () => {
  it('should show error during build', async () => {
    const { stderr, code } = await nextBuild(appDir, [], { stderr: true })
    expect(code).toBe(1)
    expect(stderr).toContain(SSG_GRH_MISSING_ERROR)
  })
}

describe('getResponseHeaders', () => {
  describe('serverless mode', () => {
    beforeAll(async () => {
      await fs.remove(join(appDir, '.next'))
      await fs.writeFile(
        nextConfig,
        `module.exports = { target: 'experimental-serverless-trace' }`,
        'utf8'
      )
    })

    runTests()
  })

  describe('production mode', () => {
    beforeAll(async () => {
      await fs.remove(nextConfig)
      await fs.remove(join(appDir, '.next'))
    })

    runTests()
  })
})
