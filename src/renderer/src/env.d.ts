/// <reference types="vite/client" />

import type { Api } from '../../preload'

declare global {
  interface Window {
    api: Api
  }
}

// CSS module declarations
declare module '*.module.css' {
  const classes: Record<string, string>
  export default classes
}
