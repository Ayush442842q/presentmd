export type Theme = 'github-light' | 'github-dark' | 'minimal' | 'conference'
export type ViewMode = 'document' | 'slides'

export interface Slide {
  index: number
  raw: string
  html: string
  notes: string
  title: string
}

export interface FileState {
  path: string | null
  content: string
  isDirty: boolean
}

export interface FrontMatter {
  title?: string
  author?: string
  theme?: Theme
  mode?: ViewMode
}

export interface AppState {
  file: FileState
  viewMode: ViewMode
  theme: Theme
  slides: Slide[]
  currentSlideIndex: number
  isPresenting: boolean
  sidebarOpen: boolean

  setContent: (content: string) => void
  setFile: (path: string | null, content: string) => void
  setDirty: (dirty: boolean) => void
  setViewMode: (mode: ViewMode) => void
  setTheme: (theme: Theme) => void
  setSlides: (slides: Slide[]) => void
  setCurrentSlide: (index: number) => void
  setPresenting: (presenting: boolean) => void
  toggleSidebar: () => void
  nextSlide: () => void
  prevSlide: () => void
}
