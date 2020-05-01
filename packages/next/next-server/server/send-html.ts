import { IncomingMessage, ServerResponse } from 'http'
import generateETag from 'next/dist/compiled/etag'
import fresh from 'next/dist/compiled/fresh'
import { isResSent } from '../lib/utils'
import { NextServerResponse } from './response'

export async function sendHTML(
  req: IncomingMessage,
  res: ServerResponse,
  serverResponse: NextServerResponse,
  {
    generateEtags,
    poweredByHeader,
  }: { generateEtags: boolean; poweredByHeader: boolean }
): Promise<void> {
  if (isResSent(res)) return
  const html = (await serverResponse.text())!
  const etag = generateEtags ? generateETag(html) : undefined

  if (poweredByHeader) {
    res.setHeader('X-Powered-By', 'Next.js')
  }

  if (fresh(req.headers, { etag })) {
    res.statusCode = 304
    res.end()
    return
  }

  if (etag) {
    res.setHeader('ETag', etag)
  }

  if (!res.getHeader('Content-Type')) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
  }
  res.setHeader('Content-Length', Buffer.byteLength(html))
  res.end(req.method === 'HEAD' ? null : html)
}
