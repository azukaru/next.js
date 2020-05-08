// const makeDevtoolsLog =
//   require('lighthouse/lighthouse-core/test/network-records-to-devtools-log.js');
// const ModuleDuplication = require('lighthouse/lighthouse-core/computed/module-duplication.js');
// const DuplicatedJavascript =
//   require('lighthouse/lighthouse-core/audits/byte-efficiency/duplicated-javascript.js');
const fs = require('fs')
const path = require('path')
import { Anomaly } from '../anamoly'
import makeDevtoolsLog from './network-record-to-devtools-logs'
const glob = require('glob')
const { promisify } = require('util')
const promisifiedGlob = promisify(glob)

const LegacyJavascript = require('lighthouse/lighthouse-core/audits/legacy-javascript.js')

/**
 * @param {Array<{url: string, content: string, map: any}>} scriptDatas
 */
function createGathererData(scriptDatas: any) {
  const SourceMaps = scriptDatas.map((data: any) => {
    return {
      scriptUrl: data.url,
      map: data.map,
    }
  })
  const ScriptElements = scriptDatas.map((data: any, i: number) => {
    return {
      requestId: `1000.${i}`,
      src: data.url,
      content: data.content,
    }
  })
  const networkRecords = scriptDatas.map((data: any, i: number) => {
    return {
      requestId: `1000.${i}`,
      url: data.url,
      content: data.content,
    }
  })
  networkRecords.push({
    url: 'https://www.example.com',
    resourceType: 'Document',
  })

  const artifacts = {
    URL: { finalUrl: 'https://www.example.com' },
    devtoolsLogs: { defaultPass: makeDevtoolsLog(networkRecords) },
    SourceMaps,
    ScriptElements,
  }

  return {
    artifacts,
    networkRecords,
  }
}

export async function runAudit(dir: string): Promise<Array<Anomaly>> {
  const javascriptDir = path.join(dir, '.next', 'static')
  let sourceMaps = await promisifiedGlob(
    path.join(javascriptDir, '**/*.js.map')
  )
  let javascript: Array<string> = []
  sourceMaps = sourceMaps.filter((file: string) => {
    const jsPath = file.substring(0, file.lastIndexOf('.map'))
    return fs.existsSync(jsPath)
  })
  javascript = sourceMaps.map((file: string) => {
    const path = file.substring(0, file.lastIndexOf('.map'))
    return fs.readFileSync(path, 'utf-8')
  })
  sourceMaps = sourceMaps.map((file: string) => {
    return JSON.parse(fs.readFileSync(file, 'utf-8'))
  })
  const context = { computedCache: new Map() }
  const { artifacts } = createGathererData([
    ...sourceMaps.map((sourceMaps: string, index: number) => {
      return {
        url: `https://www.example.com/foo${index}.js`,
        content: javascript[index],
        map: sourceMaps,
      }
    }),
  ])

  // Run an audit directly.
  const legacyJavascriptResult = await LegacyJavascript.audit(
    artifacts,
    context
  )
  const anomalies: Array<Anomaly> = []
  legacyJavascriptResult.details.items.forEach((item: any) => {
    if (item.signals && item.signals.includes('Promise')) {
      anomalies.push({
        Description: 'A Promise polyfill was found in the source code',
        Type: 'LIGHTHOUSE_EXCEPTION',
      })
    }
  })
  return anomalies
}
