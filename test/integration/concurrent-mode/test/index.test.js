/* eslint-env jest */

import { join } from 'path'
import { renderViaHTTP, findPort, launchApp, killApp } from 'next-test-utils'
import webdriver from 'next-webdriver'
import ReactDOM from 'react-dom'

const context = {}
jest.setTimeout(1000 * 60 * 5)

const maybeDescribe =
  typeof ReactDOM.unstable_createRoot === 'function' ? describe : xdescribe

maybeDescribe('Concurrent Mode', () => {
  beforeAll(async () => {
    context.appPort = await findPort()
    context.server = await launchApp(join(__dirname, '../'), context.appPort)

    // pre-build page at the start
    await renderViaHTTP(context.appPort, '/dynamic')
  })
  afterAll(() => killApp(context.server))

  it('should suspend on the client', async () => {
    const browser = await webdriver(context.appPort, '/dynamic')
    await browser.waitForElementByCss('#hydrated')

    const resolveText = await browser.elementById('resolves').text()
    const neverResolveText = await browser.elementById('never-resolves').text()
    await browser.close()

    expect(resolveText).toBe('Resolves: Client')
    expect(neverResolveText).toBe('Never Resolves: Server')
  })
})
