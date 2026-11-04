/// <reference types="vite/client" />

export {}

declare global {
  interface ImportMetaEnv {
    readonly VITE_API_BASE?: string
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
}
