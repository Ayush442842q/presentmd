import { describe, it, expect } from 'vitest'
import { parseFrontMatter, extractNotes, extractFirstHeading } from '../parseMarkdown'

describe('parseFrontMatter', () => {
  it('parses title and theme', () => {
    const { frontMatter } = parseFrontMatter('---\ntitle: My Talk\ntheme: github-dark\n---\n# Hello')
    expect(frontMatter.title).toBe('My Talk')
    expect(frontMatter.theme).toBe('github-dark')
  })
  it('returns empty frontMatter when no block present', () => {
    const { frontMatter, body } = parseFrontMatter('# Hello')
    expect(frontMatter).toEqual({})
    expect(body).toBe('# Hello')
  })
})
