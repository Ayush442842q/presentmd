# PresentMD

A desktop Markdown-to-Presentation app. Write `.md` files, see them rendered like GitHub, and present them as slides.

---

## Requirements

- [Node.js](https://nodejs.org/) v18 or higher
- npm v9 or higher
- Windows / macOS / Linux

---

## Setup & Run

```bash
# 1. Install dependencies
npm install

# 2. Run in development mode
npm run dev
```

The app will open automatically.

---

## Build (Windows portable)

```bash
npm run dist:win
```

Output will be in `dist/win-unpacked/`. Run `PresentMD.exe` directly — no installer needed.

---

## How to Use

### Writing Slides

Use `===` on its own line to separate slides:

```markdown
---
title: My Talk
author: Jane
theme: github-dark
mode: slides
---

# First Slide

Content here

===

# Second Slide

More content

===

# Third Slide

- Bullet one
- Bullet two
```

### Front Matter

Add a YAML block at the top of your file to set defaults:

| Key      | Values                                          |
|----------|-------------------------------------------------|
| `title`  | Your presentation title                         |
| `author` | Your name                                       |
| `theme`  | `github-light`, `github-dark`, `minimal`, `conference` |
| `mode`   | `slides` or `document`                          |

### Speaker Notes

Add private notes visible only in presenter mode:

```markdown
# My Slide

Visible content here.

:::notes
Only you see this. The audience cannot.
Supports **markdown** too.
:::
```

### Presenter Mode

Press **F5** or click **▶ Present** to enter fullscreen presenter mode.

| Key           | Action              |
|---------------|---------------------|
| `→` / Space   | Next slide          |
| `←`           | Previous slide      |
| `B`           | Black / blank screen|
| `Esc`         | Exit presenter mode |
| `Home`        | First slide         |
| `End`         | Last slide          |

The presenter controls appear when you hover near the bottom. Speaker notes appear below the slide if the current slide has `:::notes`.

---

## Keyboard Shortcuts

| Action           | Shortcut        |
|------------------|-----------------|
| New file         | `Ctrl+N`        |
| Open file        | `Ctrl+O`        |
| Save             | `Ctrl+S`        |
| Save As          | `Ctrl+Shift+S`  |
| Export HTML      | `Ctrl+E`        |
| Present          | `F5`            |
| Document view    | `Ctrl+1`        |
| Slide view       | `Ctrl+2`        |

---

## Themes

| Theme           | Best for                        |
|-----------------|---------------------------------|
| GitHub Light    | Everyday editing, documentation |
| GitHub Dark     | Night mode, comfortable reading |
| Minimal         | Distraction-free writing        |
| Conference      | Big screens, dark rooms         |

Switch themes from the dropdown in the top-right toolbar, or set via front matter.

---

## HTML Export

`Ctrl+E` exports a standalone `.html` file with:
- All slides embedded
- Arrow key navigation
- Fullscreen button
- Matching theme styling
- Zero external dependencies — works offline

Share the file by email, USB, or any file host.

---

## Separator Rules

| Syntax    | What it does                          |
|-----------|---------------------------------------|
| `===`     | Slide break                           |
| `---`     | Horizontal rule (standard Markdown)   |
| `---` at top of file (YAML block) | Front matter |

---

## Project Structure

```
src/
  main/           Electron main process (file I/O, menus, IPC)
  preload/        Context bridge — typed API exposed to renderer
  renderer/src/
    App.tsx            Root component, keyboard handling, file ops
    store/useStore.ts  Zustand state management
    utils/
      parseMarkdown.ts  markdown-it parser + notes extraction
      splitSlides.ts    === splitter + HTML export generator
    components/
      Toolbar.tsx        Top toolbar
      Sidebar.tsx        Slide list panel
      Editor.tsx         CodeMirror 6 editor
      Preview.tsx        Document + Slide preview
      PresenterMode.tsx  Fullscreen presenter overlay
    styles/app.css     All themes + layout + markdown styles
```

---

## Phase 2 Roadmap

- [ ] Dual-window presenter (audience screen + notes screen via IPC)
- [ ] PDF export via `webContents.printToPDF()`
- [ ] Local file version history (snapshots in app data)
- [ ] Custom CSS theme import
- [ ] Incremental bullet reveal (`{.next}` syntax)
- [ ] Command palette (`Ctrl+Shift+P`)
- [ ] Project folder support (assets, config, multiple files)
- [ ] AI slide generation

---

## Tech Stack

| Layer      | Tech                           |
|------------|--------------------------------|
| Shell      | Electron 31                    |
| Build      | electron-vite + Vite 5         |
| Frontend   | React 18 + TypeScript          |
| Editor     | CodeMirror 6                   |
| Markdown   | markdown-it + highlight.js     |
| State      | Zustand                        |
| Styling    | Tailwind CSS + CSS Variables   |
| Safety     | DOMPurify                      |
| Storage    | electron-store                 |
