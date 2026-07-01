/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEBANK_ACCESS_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
