import MarkdownIt from 'markdown-it'
import markdownItContainer from 'markdown-it-container'
import taskLists from 'markdown-it-task-lists'
import hljs from 'highlight.js'
import type { FrontMatter, Theme, ViewMode } from '../types'

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  highlight(str, lang) {
    // Mermaid: wrap in a special div for post-render processing
    if (lang === 'mermaid') {
      return `<div class="mermaid-diagram">${md.utils.escapeHtml(str)}</div>`
    }
    if (lang && hljs.getLanguage(lang)) {
      try {
        return (
          '<pre class="hljs-pre"><code class="hljs">' +
          hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
          '</code></pre>'
        )
      } catch (_) {
        // fallthrough
      }
    }
    return (
      '<pre class="hljs-pre"><code class="hljs">' +
      md.utils.escapeHtml(str) +
      '</code></pre>'
    )
  }
})

md.use(taskLists, { enabled: true })

// :::notes container — wraps speaker notes
md.use(markdownItContainer, 'notes', {
  render(tokens: MarkdownIt.Token[], idx: number) {
    if (tokens[idx].nesting === 1) {
      return '<div class="presenter-notes" data-notes="true">'
    }
    return '</div>'
  }
})

export function parseFrontMatter(content: string): {
  frontMatter: FrontMatter
  body: string
} {
  const fmRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/
  const match = content.match(fmRegex)
  if (!match) return { frontMatter: {}, body: content }

  const fmText = match[1]
  const body = content.slice(match[0].length)
  const frontMatter: FrontMatter = {}

  fmText.split('\n').forEach(line => {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) return
    const key = line.slice(0, colonIdx).trim()
    const value = line.slice(colonIdx + 1).trim().replace(/^['"]|['"]$/g, '')
    if (key === 'title') frontMatter.title = value
    if (key === 'author') frontMatter.author = value
    if (key === 'theme') frontMatter.theme = value as Theme
    if (key === 'mode') frontMatter.mode = value as ViewMode
  })

  return { frontMatter, body }
}

export function renderMarkdown(rawMarkdown: string): string {
  return md.render(rawMarkdown)
}

export function extractNotes(html: string): string {
  const notesRegex = /<div class="presenter-notes"[^>]*>([\s\S]*?)<\/div>/i
  const match = html.match(notesRegex)
  if (!match) return ''
  // strip inner html tags to get plain text
  return match[1].replace(/<[^>]+>/g, '').trim()
}

export function stripNotes(html: string): string {
  return html.replace(/<div class="presenter-notes"[\s\S]*?<\/div>/gi, '')
}

export function extractFirstHeading(html: string): string {
  const match = html.match(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/i)
  if (!match) return ''
  return match[1].replace(/<[^>]+>/g, '').trim()
}
