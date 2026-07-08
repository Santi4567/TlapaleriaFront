// src/vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // Añade aquí más variables de entorno conforme crezca el proyecto (ej. VITE_TIMEOUT)
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

