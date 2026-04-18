import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveFile: (filePath: string, content: string) =>
    ipcRenderer.invoke('dialog:saveFile', filePath, content),
  saveFileAs: (content: string) => ipcRenderer.invoke('dialog:saveFileAs', content),
  exportHtml: (html: string, title: string) =>
    ipcRenderer.invoke('dialog:exportHtml', html, title),
  getWelcome: () => ipcRenderer.invoke('file:getWelcome'),
  storeGet: (key: string) => ipcRenderer.invoke('store:get', key),
  storeSet: (key: string, value: unknown) => ipcRenderer.invoke('store:set', key, value),
  getRecentFiles: () => ipcRenderer.invoke('store:getRecentFiles'),

  // Presenter
  presenterOpen: () => ipcRenderer.invoke('presenter:open'),
  presenterClose: () => ipcRenderer.invoke('presenter:close'),
  presenterSyncSlide: (slideIndex: number) =>
    ipcRenderer.send('presenter:syncSlide', slideIndex),
  presenterSyncContent: (data: unknown) =>
    ipcRenderer.send('presenter:syncContent', data),

  // Listeners
  onMenuAction: (callback: (action: string) => void) => {
    const actions = ['new', 'open', 'save', 'saveAs', 'export', 'present',
                     'viewDocument', 'viewSlides']
    const listeners: Array<() => void> = []
    actions.forEach(action => {
      const listener = () => callback(action)
      ipcRenderer.on(`menu:${action}`, listener)
      listeners.push(() => ipcRenderer.removeListener(`menu:${action}`, listener))
    })
    return () => listeners.forEach(remove => remove())
  },
  onPresenterSlideChanged: (callback: (index: number) => void) => {
    const listener = (_: unknown, index: number) => callback(index)
    ipcRenderer.on('presenter:slideChanged', listener)
    return () => ipcRenderer.removeListener('presenter:slideChanged', listener)
  },
  onPresenterContentChanged: (callback: (data: unknown) => void) => {
    const listener = (_: unknown, data: unknown) => callback(data)
    ipcRenderer.on('presenter:contentChanged', listener)
    return () => ipcRenderer.removeListener('presenter:contentChanged', listener)
  },
  onPresenterClosed: (callback: () => void) => {
    ipcRenderer.on('presenter:closed', callback)
    return () => ipcRenderer.removeListener('presenter:closed', callback)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.api = api
}
