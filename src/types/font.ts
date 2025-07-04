import type { Font } from "opentype.js"

export interface FontInfo {
  file: File
  font: Font
  name: string
  size: string
}

export interface MergeOptions {
  koreanHangul: boolean
  koreanSymbols: boolean
  koreanNumbers: boolean
  englishLetters: boolean
  englishNumbers: boolean
  englishSymbols: boolean
  englishSpecial: boolean
  englishLigatures: boolean
  englishIcons: boolean
}

export interface FontState {
  koreanFont: FontInfo | null
  englishFont: FontInfo | null
  mergedFont: Font | { toArrayBuffer: () => ArrayBuffer } | null
  isLoading: boolean
  progress: number
  error: string | null
  success: string | null
}
