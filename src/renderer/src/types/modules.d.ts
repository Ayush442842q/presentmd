declare module 'markdown-it-task-lists' {
  import MarkdownIt from 'markdown-it'
  const plugin: MarkdownIt.PluginSimple
  export default plugin
}

declare module 'markdown-it-container' {
  import MarkdownIt from 'markdown-it'
  const plugin: MarkdownIt.PluginWithOptions
  export = plugin
}

interface Window {
  api: {
    openFile: () => Promise<{ path: string; content: string } | null>
    saveFile: (path: string, content: string) => Promise<{ success: boolean }>
    saveFileAs: (content: string) => Promise<{ path: string } | null>
    exportHtml: (html: string, title: string) => Promise<boolean>
    getWelcome: () => Promise<string>
    storeGet: (key: string) => Promise<unknown>
    storeSet: (key: string, value: unknown) => Promise<void>
    getRecentFiles: () => Promise<string[]>
    presenterOpen: () => Promise<void>
    presenterClose: () => Promise<void>
    presenterSyncSlide: (index: number) => void
    presenterSyncContent: (data: unknown) => void
    onMenuAction: (cb: (action: string) => void) => () => void
    onPresenterSlideChanged: (cb: (index: number) => void) => () => void
    onPresenterContentChanged: (cb: (data: unknown) => void) => () => void
    onPresenterClosed: (cb: () => void) => () => void
  }
}
