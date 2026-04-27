import { app, BrowserWindow, ipcMain, dialog, Menu, shell } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { is } from '@electron-toolkit/utils'
import Store from 'electron-store'

const store = new Store()

let mainWindow: BrowserWindow | null = null
let presenterWindow: BrowserWindow | null = null

const WELCOME_CONTENT = `---
title: Welcome to PresentMD
author: You
theme: github-light
mode: slides
---

# Welcome to PresentMD 👋

The fastest way to turn **Markdown** into polished presentations.

===

## How Slides Work

Use \`===\` on its own line to separate slides.

- Write in Markdown
- Use \`===\` for slide breaks
- Press **F5** to present fullscreen

===

## Speaker Notes

Add private notes using the \`:::notes\` block — only visible in presenter mode.

:::notes
These are your private speaker notes.
The audience **cannot** see this text.
You can use *markdown* here too.
:::

===

## Code Blocks

Syntax highlighting works out of the box:

\`\`\`typescript
function greet(name: string): string {
  return \`Hello, \${name}!\`
}

console.log(greet('World'))
\`\`\`

===

## Tables & Lists

| Feature        | Status  |
|----------------|---------|
| Slide mode     | ✅ Done |
| Document view  | ✅ Done |
| Themes         | ✅ Done |
| HTML export    | ✅ Done |
| Presenter mode | ✅ Done |

===

## Themes

Switch themes anytime from the toolbar:

- 🌕 **GitHub Light** — clean and familiar
- 🌑 **GitHub Dark** — easy on the eyes
- ⬜ **Minimal** — distraction-free
- 🎤 **Conference** — high contrast for big screens

===

## Keyboard Shortcuts

| Action       | Key       |
|--------------|-----------|
| Next slide   | → Arrow   |
| Prev slide   | ← Arrow   |
| Present      | F5        |
| Exit         | Escape    |
| Save         | Ctrl+S    |
| Open         | Ctrl+O    |
| Export HTML  | Ctrl+E    |

===

# Start Writing

Open a \`.md\` file or start typing in the editor.

**Happy presenting!** 🚀
`

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    show: false,
    backgroundColor: '#ffffff',
    // macOS uses hidden for traffic lights; Windows uses default for native frame
    titleBarStyle: process.platform === 'darwin' ? 'hidden' : 'default',
    ...(process.platform === 'darwin' ? { trafficLightPosition: { x: 16, y: 16 } } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: !is.dev
    }
  })

  // Restore window bounds
  const bounds = store.get('windowBounds') as Electron.Rectangle | undefined
  if (bounds) {
    mainWindow.setBounds(bounds)
  }

  mainWindow.on('ready-to-show', () => {
    mainWindow!.show()
  })

  mainWindow.on('close', () => {
    store.set('windowBounds', mainWindow!.getBounds())
    if (presenterWindow && !presenterWindow.isDestroyed()) {
      presenterWindow.close()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']!)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  buildMenu()
}

function buildMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow?.webContents.send('menu:new')
        },
        {
          label: 'Open…',
          accelerator: 'CmdOrCtrl+O',
          click: () => mainWindow?.webContents.send('menu:open')
        },
        { type: 'separator' },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow?.webContents.send('menu:save')
        },
        {
          label: 'Save As…',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => mainWindow?.webContents.send('menu:saveAs')
        },
        { type: 'separator' },
        {
          label: 'Export as HTML…',
          accelerator: 'CmdOrCtrl+E',
          click: () => mainWindow?.webContents.send('menu:export')
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Document View',
          accelerator: 'CmdOrCtrl+1',
          click: () => mainWindow?.webContents.send('menu:viewDocument')
        },
        {
          label: 'Slide View',
          accelerator: 'CmdOrCtrl+2',
          click: () => mainWindow?.webContents.send('menu:viewSlides')
        },
        { type: 'separator' },
        {
          label: 'Present (Fullscreen)',
          accelerator: 'F5',
          click: () => mainWindow?.webContents.send('menu:present')
        },
        { type: 'separator' },
        { role: 'toggleDevTools' }
      ]
    },
    {
      label: 'Window',
      submenu: [{ role: 'minimize' }, { role: 'zoom' }]
    }
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

// IPC Handlers
ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }],
    properties: ['openFile']
  })
  if (result.canceled || result.filePaths.length === 0) return null
  const filePath = result.filePaths[0]
  try {
    const content = readFileSync(filePath, 'utf-8')
    store.set('lastOpenedFile', filePath)
    addRecentFile(filePath)
    return { path: filePath, content }
  } catch (err) {
    dialog.showErrorBox('Open Failed', `Could not read file:\n${String(err)}`)
    return null
  }
})

ipcMain.handle('dialog:saveFile', async (_event, filePath: string, content: string) => {
  try {
    writeFileSync(filePath, content, 'utf-8')
    return { success: true }
  } catch (err) {
    dialog.showErrorBox('Save Failed', `Could not save file:\n${String(err)}`)
    return { success: false }
  }
})

ipcMain.handle('dialog:saveFileAs', async (_event, content: string) => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    filters: [{ name: 'Markdown', extensions: ['md'] }],
    defaultPath: 'presentation.md'
  })
  if (result.canceled || !result.filePath) return null
  try {
    writeFileSync(result.filePath, content, 'utf-8')
    addRecentFile(result.filePath)
    store.set('lastOpenedFile', result.filePath)
    return { path: result.filePath }
  } catch {
    return null
  }
})

ipcMain.handle('dialog:exportHtml', async (_event, html: string, title: string) => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    filters: [{ name: 'HTML', extensions: ['html'] }],
    defaultPath: `${title || 'presentation'}.html`
  })
  if (result.canceled || !result.filePath) return false
  try {
    writeFileSync(result.filePath, html, 'utf-8')
    return true
  } catch {
    return false
  }
})

ipcMain.handle('file:getWelcome', () => {
  return WELCOME_CONTENT
})

ipcMain.handle('store:get', (_event, key: string) => {
  return store.get(key)
})

ipcMain.handle('store:set', (_event, key: string, value: unknown) => {
  store.set(key, value)
})

ipcMain.handle('store:getRecentFiles', () => {
  return store.get('recentFiles', []) as string[]
})

// Presenter window IPC
ipcMain.handle('presenter:open', async () => {
  if (presenterWindow && !presenterWindow.isDestroyed()) {
    presenterWindow.focus()
    return
  }
  presenterWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    show: false,
    backgroundColor: '#000000',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: !is.dev
    }
  })
  presenterWindow.on('ready-to-show', () => presenterWindow!.show())
  presenterWindow.on('closed', () => {
    presenterWindow = null
    mainWindow?.webContents.send('presenter:closed')
  })

  const url = is.dev && process.env['ELECTRON_RENDERER_URL']
    ? `${process.env['ELECTRON_RENDERER_URL']}#presenter`
    : `file://${join(__dirname, '../renderer/index.html')}#presenter`

  setTimeout(() => {
    presenterWindow!.loadURL(url)
  }, 1500)
})

ipcMain.handle('presenter:close', () => {
  if (presenterWindow && !presenterWindow.isDestroyed()) {
    presenterWindow.close()
  }
})

// Sync slide index to presenter window
ipcMain.on('presenter:syncSlide', (_event, slideIndex: number) => {
  if (presenterWindow && !presenterWindow.isDestroyed()) {
    presenterWindow.webContents.send('presenter:slideChanged', slideIndex)
  }
})

// Sync slides content to presenter window
ipcMain.on('presenter:syncContent', (_event, data: unknown) => {
  if (presenterWindow && !presenterWindow.isDestroyed()) {
    presenterWindow.webContents.send('presenter:contentChanged', data)
  }
})

function addRecentFile(filePath: string): void {
  const recent = store.get('recentFiles', []) as string[]
  const updated = [filePath, ...recent.filter(f => f !== filePath)].slice(0, 10)
  store.set('recentFiles', updated)
}


app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
