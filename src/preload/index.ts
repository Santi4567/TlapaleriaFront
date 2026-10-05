import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge, ipcRenderer } from 'electron'

// Custom APIs for renderer
const api = {}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}

contextBridge.exposeInMainWorld('secureStorage', {
  save: (token: string) => ipcRenderer.invoke('secure-token:save', token),
  get: (): Promise<string | null> => ipcRenderer.invoke('secure-token:get'),
  remove: () => ipcRenderer.invoke('secure-token:delete')
})

contextBridge.exposeInMainWorld('windowControls', {
  minimize: () => ipcRenderer.send('win:minimize'),
  toggleMaximize: () => ipcRenderer.send('win:toggle-maximize'),
  close: () => ipcRenderer.send('win:close'),
  isMaximized: (): Promise<boolean> => ipcRenderer.invoke('win:is-maximized'),
  onMaximizeChange: (cb: (maximized: boolean) => void) => {
    const handler = (_e: unknown, value: boolean): void => cb(value)
    ipcRenderer.on('win:maximize-changed', handler)
    return () => ipcRenderer.removeListener('win:maximize-changed', handler)
  }
})
