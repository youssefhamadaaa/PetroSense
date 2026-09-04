/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the Django API — used from Part 4 onward. */
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
