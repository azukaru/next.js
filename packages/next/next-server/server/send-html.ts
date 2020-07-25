import { IncomingMessage, ServerResponse } from 'http'
import { sendPayload } from './send-payload'

export function sendHTML(
  req: IncomingMessage,
  res: ServerResponse,
  html: string,
  opts: { generateEtags: boolean; poweredByHeader: boolean }
) {
  return sendPayload(req, res, html, 'html', opts)
}
