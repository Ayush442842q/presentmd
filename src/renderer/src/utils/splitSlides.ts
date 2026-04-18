import type { Slide } from '../types'
import {
  renderMarkdown,
  extractNotes,
  stripNotes,
  extractFirstHeading,
  parseFrontMatter
} from './parseMarkdown'

/**
 * Splits markdown content into slides.
 * Separator: `===` on its own line.
 * Front-matter (--- block at top) is stripped before splitting.
 */
export function splitIntoSlides(content: string): Slide[] {
  const { body } = parseFrontMatter(content)

  // Split on === separator (own line, optional whitespace)
  const sections = body.split(/^===\s*$/m)

  return sections
    .map((section, index) => {
      const trimmed = section.trim()
      if (!trimmed) return null

      const rawHtml = renderMarkdown(trimmed)
      const notes = extractNotes(rawHtml)
      const html = stripNotes(rawHtml)
      const title = extractFirstHeading(html) || `Slide ${index + 1}`

      return {
        index,
        raw: trimmed,
        html,
        notes,
        title
      }
    })
    .filter((s): s is Slide => s !== null)
}

/**
 * Generates a standalone HTML export of the slide deck.
 */
export function generateHtmlExport(slides: Slide[], title: string, theme: string): string {
  const slidesHtml = slides
    .map(
      (slide, i) => `
    <section class="slide" id="slide-${i}" style="display:${i === 0 ? 'flex' : 'none'}">
      <div class="slide-content markdown-body">
        ${slide.html}
      </div>
    </section>`
    )
    .join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    ${getExportCss(theme)}
  </style>
</head>
<body class="theme-${theme}">
  <div class="presentation">
    ${slidesHtml}
  </div>
  <nav class="controls">
    <button id="prev" onclick="prevSlide()">&#8592;</button>
    <span id="counter">1 / ${slides.length}</span>
    <button id="next" onclick="nextSlide()">&#8594;</button>
    <button onclick="toggleFullscreen()">⛶</button>
  </nav>
  <script>
    let current = 0;
    const total = ${slides.length};

    function showSlide(n) {
      document.querySelectorAll('.slide').forEach((s, i) => {
        s.style.display = i === n ? 'flex' : 'none';
      });
      document.getElementById('counter').textContent = (n + 1) + ' / ' + total;
      current = n;
    }

    function nextSlide() { if (current < total - 1) showSlide(current + 1); }
    function prevSlide() { if (current > 0) showSlide(current - 1); }
    function toggleFullscreen() {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen();
      else document.exitFullscreen();
    }

    document.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') nextSlide();
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') prevSlide();
      if (e.key === 'f' || e.key === 'F') toggleFullscreen();
    });
  </script>
</body>
</html>`
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function getExportCss(theme: string): string {
  const isDark = theme === 'github-dark' || theme === 'conference'
  const bg = isDark ? '#0d1117' : '#ffffff'
  const text = isDark ? '#e6edf3' : '#1f2328'
  const accent = theme === 'conference' ? '#7c3aed' : '#0969da'
  const codeBg = isDark ? '#161b22' : '#f6f8fa'

  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
           background: ${bg}; color: ${text}; height: 100vh; overflow: hidden; }
    .presentation { width: 100vw; height: calc(100vh - 56px); }
    .slide { width: 100%; height: 100%; display: flex; align-items: center;
             justify-content: center; padding: 60px; }
    .slide-content { max-width: 900px; width: 100%; }
    .markdown-body h1 { font-size: 2.4em; font-weight: 700; margin-bottom: 0.5em;
                        color: ${text}; }
    .markdown-body h2 { font-size: 1.8em; font-weight: 600; margin-bottom: 0.5em;
                        color: ${text}; }
    .markdown-body h3 { font-size: 1.4em; font-weight: 600; margin-bottom: 0.4em; }
    .markdown-body p { font-size: 1.15em; line-height: 1.7; margin-bottom: 1em; }
    .markdown-body ul, .markdown-body ol { font-size: 1.1em; padding-left: 1.5em;
                                            margin-bottom: 1em; line-height: 1.8; }
    .markdown-body li { margin-bottom: 0.3em; }
    .markdown-body code { background: ${codeBg}; padding: 0.15em 0.4em;
                           border-radius: 4px; font-size: 0.9em; font-family: monospace; }
    .markdown-body pre { background: ${codeBg}; padding: 1em; border-radius: 8px;
                          overflow: auto; margin: 1em 0; }
    .markdown-body pre code { background: none; padding: 0; }
    .markdown-body table { border-collapse: collapse; width: 100%; margin: 1em 0; }
    .markdown-body th, .markdown-body td { border: 1px solid ${isDark ? '#30363d' : '#d0d7de'};
                                            padding: 8px 12px; }
    .markdown-body th { background: ${codeBg}; font-weight: 600; }
    .markdown-body a { color: ${accent}; text-decoration: none; }
    .markdown-body strong { font-weight: 700; }
    .markdown-body blockquote { border-left: 4px solid ${accent}; padding-left: 1em;
                                 color: ${isDark ? '#8b949e' : '#57606a'}; margin: 1em 0; }
    .controls { height: 56px; display: flex; align-items: center; justify-content: center;
                gap: 16px; background: ${isDark ? '#161b22' : '#f6f8fa'};
                border-top: 1px solid ${isDark ? '#30363d' : '#d0d7de'}; }
    .controls button { background: ${accent}; color: white; border: none;
                        padding: 8px 20px; border-radius: 6px; cursor: pointer;
                        font-size: 16px; }
    .controls button:hover { opacity: 0.85; }
    #counter { font-size: 14px; color: ${isDark ? '#8b949e' : '#57606a'}; min-width: 80px;
               text-align: center; }
  `
}
