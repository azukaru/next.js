import React, { useEffect, useContext } from 'react'
import { ScriptHTMLAttributes } from 'react'
import { HeadManagerContext } from '../next-server/lib/head-manager-context'

const ScriptCache = new Set()

const DOMAttributeNames: Record<string, string> = {
  acceptCharset: 'accept-charset',
  className: 'class',
  htmlFor: 'for',
  httpEquiv: 'http-equiv',
}

interface Props extends ScriptHTMLAttributes<HTMLScriptElement> {
  priority?: string
  key?: string
  onLoad?: () => void
  onError?: () => void
  children?: any
  preload?: boolean
}

const onErrorHandler: Function = (
  cacheKey: string,
  onError: Function
) => () => {
  if (cacheKey) {
    ScriptCache.delete(cacheKey)
  }

  if (onError) {
    onError()
  }
}

const loadScript = (props: Props) => {
  const {
    src = '',
    onLoad = () => {},
    dangerouslySetInnerHTML,
    children = '',
    key,
    onError,
  } = props

  if (ScriptCache.has(key || src)) {
    return
  }

  const el = document.createElement('script')
  const cacheKey = key || src

  if (cacheKey) {
    ScriptCache.add(cacheKey)
  }

  if (dangerouslySetInnerHTML) {
    el.innerHTML = dangerouslySetInnerHTML.__html || ''
  } else if (children) {
    el.textContent = typeof children === 'string' ? children : children.join('')
  } else if (src) {
    el.src = src
  }

  el.onload = onLoad
  el.onerror = onErrorHandler(cacheKey, onError)

  for (const [k, value] of Object.entries(props)) {
    if (value === undefined) {
      continue
    }

    const attr = DOMAttributeNames[k] || k.toLowerCase()
    el.setAttribute(attr, value)
  }

  document.body.appendChild(el)
}

export default function Script(props: Props) {
  const {
    src = '',
    onLoad = () => {},
    dangerouslySetInnerHTML,
    children = '',
    priority = 'default',
    key,
    onError,
    preload = true,
    ...restProps
  } = props

  // Context is available only during SSR
  const { updateScripts, scripts } = useContext(HeadManagerContext)

  useEffect(() => {
    if (priority === 'default') {
      loadScript(props)
    } else if (priority === 'lazy') {
      window.addEventListener('load', () => {
        if ('requestIdleCallback' in window) {
          ;(window as any).requestIdleCallback(() => loadScript(props), {
            timeout: 3000,
          })
        } else {
          setTimeout(() => loadScript(props), 0)
        }
      })
    }
  }, [priority, props])

  if (priority === 'renderBlocking') {
    const syncProps: Props = { ...restProps }

    for (const [k, value] of Object.entries({
      src,
      onLoad,
      onError,
      dangerouslySetInnerHTML,
      children,
    })) {
      if (!value) {
        continue
      }
      if (k === 'children') {
        syncProps.dangerouslySetInnerHTML = {
          __html: typeof value === 'string' ? value : value.join(''),
        }
      } else {
        ;(syncProps as any)[k] = value
      }
    }

    return <script {...syncProps} />
  } else if (priority === 'default') {
    if (updateScripts && preload) {
      scripts.default = (scripts.default || []).concat([src])
      updateScripts(scripts)
    }
  } else if (priority === 'beforeHydrate') {
    if (updateScripts) {
      scripts.beforeHydrate = (scripts.beforeHydrate || []).concat([src])
      updateScripts(scripts)
    }
  }

  return null
}
