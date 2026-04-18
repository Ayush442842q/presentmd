import { create } from 'zustand'
import type { AppState, Theme, ViewMode, Slide, FileState } from '../types'

export const useStore = create<AppState>((set, get) => ({
  file: { path: null, content: '', isDirty: false },
  viewMode: 'document',
  theme: 'github-light',
  slides: [],
  currentSlideIndex: 0,
  isPresenting: false,
  sidebarOpen: true,

  setContent: (content) =>
    set(state => ({ file: { ...state.file, content, isDirty: true } })),

  setFile: (path, content) =>
    set({ file: { path, content, isDirty: false } }),

  setDirty: (isDirty) =>
    set(state => ({ file: { ...state.file, isDirty } })),

  setViewMode: (viewMode) => set({ viewMode }),

  setTheme: (theme) => set({ theme }),

  setSlides: (slides) => set({ slides }),

  setCurrentSlide: (currentSlideIndex) => set({ currentSlideIndex }),

  setPresenting: (isPresenting) => set({ isPresenting }),

  toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),

  nextSlide: () => {
    const { currentSlideIndex, slides } = get()
    if (currentSlideIndex < slides.length - 1) {
      set({ currentSlideIndex: currentSlideIndex + 1 })
    }
  },

  prevSlide: () => {
    const { currentSlideIndex } = get()
    if (currentSlideIndex > 0) {
      set({ currentSlideIndex: currentSlideIndex - 1 })
    }
  }
}))
