declare global {
  interface Window {
    __NEXT_PROMISE_CB?: () => void
  }
}

if (!window.Promise) {
  window.Promise = Promise
}

if (window.__NEXT_PROMISE_CB) {
  window.__NEXT_PROMISE_CB()
  delete window.__NEXT_PROMISE_CB
}

export {}
