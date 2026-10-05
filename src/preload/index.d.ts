import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: unknown

    secureStorage: {
      save: (token: string) => Promise<void>
      get: () => Promise<string | null>
      remove: () => Promise<void>
    }
    windowControls: {
      minimize: () => void
      toggleMaximize: () => void
      close: () => void
      isMaximized: () => Promise<boolean>
      onMaximizeChange: (cb: (maximized: boolean) => void) => () => void
    }
  }
  
}
