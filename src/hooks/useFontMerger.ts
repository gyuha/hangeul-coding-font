import { saveAs } from "file-saver"
import * as opentype from "opentype.js"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import type { MergeOptions } from "../types/font"

export const useFontMerger = () => {
  // Font objects
  const [koreanFont, setKoreanFont] = useState<opentype.Font | null>(null)
  const [englishFont, setEnglishFont] = useState<opentype.Font | null>(null)

  // Font files and names
  const [koreanFontFile, setKoreanFontFile] = useState<File | null>(null)
  const [englishFontFile, setEnglishFontFile] = useState<File | null>(null)
  const [koreanFontName, setKoreanFontName] = useState("")
  const [englishFontName, setEnglishFontName] = useState("")

  // URLs for individual font preview only
  const [koreanFontUrl, setKoreanFontUrl] = useState<string>("")
  const [englishFontUrl, setEnglishFontUrl] = useState<string>("")

  const [koreanPreviewFontFamily, setKoreanPreviewFontFamily] = useState<string>("")
  const [englishPreviewFontFamily, setEnglishPreviewFontFamily] = useState<string>("")

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)

  // Korean font preview effect
  useEffect(() => {
    if (koreanFontUrl && koreanFont) {
      const fontFamilyName = `KoreanFont_${Date.now()}`
      setKoreanPreviewFontFamily(fontFamilyName)

      const style = document.createElement("style")
      style.textContent = `
        @font-face {
          font-family: '${fontFamilyName}';
          src: url('${koreanFontUrl}') format('truetype');
        }
      `
      document.head.appendChild(style)

      return () => {
        if (document.head.contains(style)) {
          document.head.removeChild(style)
        }
      }
    }
  }, [koreanFontUrl, koreanFont])

  // English font preview effect
  useEffect(() => {
    if (englishFontUrl && englishFont) {
      const fontFamilyName = `EnglishFont_${Date.now()}`
      setEnglishPreviewFontFamily(fontFamilyName)

      const style = document.createElement("style")
      style.textContent = `
        @font-face {
          font-family: '${fontFamilyName}';
          src: url('${englishFontUrl}') format('truetype');
        }
      `
      document.head.appendChild(style)

      return () => {
        if (document.head.contains(style)) {
          document.head.removeChild(style)
        }
      }
    }
  }, [englishFontUrl, englishFont])

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleKoreanFontUpload = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const font = opentype.parse(arrayBuffer)
      setKoreanFont(font)
      setKoreanFontFile(file)
      setKoreanFontName(file.name)

      const blob = new Blob([arrayBuffer], { type: "font/truetype" })
      const url = URL.createObjectURL(blob)
      setKoreanFontUrl(url)

      toast.success("한글 폰트가 성공적으로 로드되었습니다.")
    } catch {
      throw new Error("한글 폰트 읽기 오류")
    }
  }

  const handleEnglishFontUpload = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const font = opentype.parse(arrayBuffer)
      setEnglishFont(font)
      setEnglishFontFile(file)
      setEnglishFontName(file.name)

      const blob = new Blob([arrayBuffer], { type: "font/truetype" })
      const url = URL.createObjectURL(blob)
      setEnglishFontUrl(url)

      toast.success("영문 폰트가 성공적으로 로드되었습니다.")
    } catch {
      throw new Error("영문 폰트 읽기 오류")
    }
  }

  // Get specific glyphs from English font for ligatures and icons
  const getAllEnglishGlyphs = (
    font: opentype.Font,
    includeLigatures: boolean,
    includeIcons: boolean
  ): opentype.Glyph[] => {
    const glyphs: opentype.Glyph[] = []

    // If including ligatures, add ALL glyphs from the font
    // This ensures ligature components are included even if they don't have obvious names
    if (includeLigatures) {
      console.log("🔗 Including all glyphs for ligature support")
      for (let i = 1; i < font.glyphs.length; i++) {
        // Skip .notdef at index 0
        const glyph = font.glyphs.get(i)
        if (glyph) {
          glyphs.push(glyph)
        }
      }
      return glyphs
    }

    // Otherwise, include specific ranges for icons only
    if (includeIcons) {
      for (let i = 1; i < font.glyphs.length; i++) {
        const glyph = font.glyphs.get(i)
        if (glyph && glyph.unicode !== undefined) {
          const charCode = glyph.unicode

          // NerdFont icon ranges
          if (
            (charCode >= 0xe000 && charCode <= 0xf8ff) || // Private Use Area
            (charCode >= 0xf0000 && charCode <= 0xffffd) || // Supplementary Private Use Area-A
            (charCode >= 0x100000 && charCode <= 0x10fffd) || // Supplementary Private Use Area-B
            (charCode >= 0x2190 && charCode <= 0x21ff) || // Arrows
            (charCode >= 0x2600 && charCode <= 0x26ff) || // Miscellaneous Symbols
            (charCode >= 0x2700 && charCode <= 0x27bf) || // Dingbats
            (charCode >= 0x1f300 && charCode <= 0x1f6ff) // Miscellaneous Symbols and Pictographs
          ) {
            glyphs.push(glyph)
          }
        }
      }
    }

    return glyphs
  }

  // Character selection helper - now handles ligatures and icons properly
  const getGlyphsFromOptions = (options: MergeOptions): opentype.Glyph[] => {
    const glyphs: opentype.Glyph[] = []
    const processedChars = new Set<string>()

    // Handle Korean characters
    if (options.koreanHangul && koreanFont) {
      const koreanRanges = [
        [0x1100, 0x11ff], // 한글 자모
        [0x3130, 0x318f], // 한글 호환 자모
        [0xac00, 0xd7af], // 한글 음절
      ]

      for (const [start, end] of koreanRanges) {
        for (let i = start; i <= end; i++) {
          const char = String.fromCharCode(i)
          const glyph = koreanFont.charToGlyph(char)
          if (glyph && glyph.index !== 0 && !processedChars.has(char)) {
            glyphs.push(glyph)
            processedChars.add(char)
          }
        }
      }
    }

    // Handle English characters
    if (englishFont) {
      // Basic English characters
      if (options.englishLetters) {
        const letterRanges = [
          [0x0041, 0x005a], // A-Z
          [0x0061, 0x007a], // a-z
          [0x00c0, 0x00ff], // Latin-1 Supplement
          [0x0100, 0x017f], // Latin Extended-A
        ]

        for (const [start, end] of letterRanges) {
          for (let i = start; i <= end; i++) {
            const char = String.fromCharCode(i)
            const glyph = englishFont.charToGlyph(char)
            if (glyph && glyph.index !== 0 && !processedChars.has(char)) {
              glyphs.push(glyph)
              processedChars.add(char)
            }
          }
        }
      }

      // Numbers
      if (options.englishNumbers) {
        for (let i = 0x0030; i <= 0x0039; i++) {
          const char = String.fromCharCode(i)
          const glyph = englishFont.charToGlyph(char)
          if (glyph && glyph.index !== 0 && !processedChars.has(char)) {
            glyphs.push(glyph)
            processedChars.add(char)
          }
        }
      }

      // Symbols
      if (options.englishSymbols) {
        const symbolRanges = [
          [0x0020, 0x002f], // ASCII symbols
          [0x003a, 0x0040],
          [0x005b, 0x0060],
          [0x007b, 0x007e],
          [0x2000, 0x206f], // General punctuation
        ]

        for (const [start, end] of symbolRanges) {
          for (let i = start; i <= end; i++) {
            const char = String.fromCharCode(i)
            const glyph = englishFont.charToGlyph(char)
            if (glyph && glyph.index !== 0 && !processedChars.has(char)) {
              glyphs.push(glyph)
              processedChars.add(char)
            }
          }
        }
      }

      // Add all ligature and icon glyphs
      if (options.englishLigatures || options.englishIcons) {
        const specialGlyphs = getAllEnglishGlyphs(
          englishFont,
          options.englishLigatures,
          options.englishIcons
        )
        for (const glyph of specialGlyphs) {
          // Avoid duplicates by checking glyph index
          if (!glyphs.some((g) => g.index === glyph.index)) {
            glyphs.push(glyph)
          }
        }
      }
    }

    return glyphs
  }

  // Direct merge and download function - no preview
  const mergeAndDownloadFont = async (options: MergeOptions, fontName: string) => {
    if (!koreanFont || !englishFont) {
      throw new Error("두 폰트 모두 업로드해주세요.")
    }

    setIsProcessing(true)
    setProgress(0)

    try {
      // Get all glyphs to include (including ligatures and icons)
      const allGlyphs = getGlyphsFromOptions(options)
      console.log(`Processing ${allGlyphs.length} glyphs`)

      // Start with .notdef glyph
      const glyphs = [englishFont.glyphs.get(0)]

      setProgress(25)

      // Add all collected glyphs
      allGlyphs.forEach((glyph, index) => {
        if (glyph && glyph.index !== 0) {
          // Avoid duplicates by checking if glyph with same index already exists
          if (!glyphs.some((g) => g.index === glyph.index)) {
            glyphs.push(glyph)
          }
        }

        // Update progress
        if (index % 100 === 0) {
          setProgress(25 + (index / allGlyphs.length) * 50)
        }
      })

      setProgress(75)

      // Create merged font
      const safeFontName = fontName.replace(/[^a-zA-Z0-9-]/g, "") || "HangeulCodingFont"

      const mergedFont = new opentype.Font({
        familyName: safeFontName,
        styleName: englishFont.names?.fontSubfamily?.en || "Regular",
        unitsPerEm: englishFont.unitsPerEm,
        ascender: englishFont.ascender,
        descender: englishFont.descender,
        glyphs: glyphs,
      })

      // Note: Advanced typography tables (GSUB, GPOS, GDEF) are not copied
      // due to OpenType.js limitations with complex ligature formats.
      // The merged font will contain all glyphs but may not have advanced
      // ligature substitution rules. This is a known limitation of opentype.js.
      if (options.englishLigatures || options.englishIcons) {
        console.log(
          "ℹ️ Ligature and icon glyphs included, but advanced substitution rules may not be preserved"
        )
        console.log("ℹ️ This is due to OpenType.js limitations with complex GSUB table formats")
      }

      setProgress(90)

      // Direct download
      const fontBuffer = mergedFont.toArrayBuffer()
      const blob = new Blob([fontBuffer], { type: "font/truetype" })
      saveAs(blob, `${safeFontName}.ttf`)

      setProgress(100)

      const finalSizeKB = (fontBuffer.byteLength / 1024).toFixed(1)
      toast.success(
        `폰트 다운로드가 완료되었습니다! (${safeFontName}.ttf, ${finalSizeKB}KB, ${glyphs.length}개 글리프)`
      )
    } catch (error) {
      setProgress(0)
      throw new Error(
        `폰트 합치기 실패: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    } finally {
      setIsProcessing(false)
    }
  }

  const resetFonts = () => {
    setKoreanFont(null)
    setEnglishFont(null)
    setKoreanFontFile(null)
    setEnglishFontFile(null)
    setKoreanFontName("")
    setEnglishFontName("")
    setKoreanPreviewFontFamily("")
    setEnglishPreviewFontFamily("")
    setProgress(0)

    // Clean up URLs
    if (koreanFontUrl) {
      URL.revokeObjectURL(koreanFontUrl)
      setKoreanFontUrl("")
    }
    if (englishFontUrl) {
      URL.revokeObjectURL(englishFontUrl)
      setEnglishFontUrl("")
    }
  }

  return {
    // Font objects
    koreanFont,
    englishFont,

    // Font info objects
    koreanFontInfo:
      koreanFont && koreanFontFile
        ? {
            font: koreanFont,
            file: koreanFontFile,
            name: koreanPreviewFontFamily || koreanFontName,
            size: formatFileSize(koreanFontFile.size),
          }
        : null,
    englishFontInfo:
      englishFont && englishFontFile
        ? {
            font: englishFont,
            file: englishFontFile,
            name: englishPreviewFontFamily || englishFontName,
            size: formatFileSize(englishFontFile.size),
          }
        : null,

    // Font names and preview families (individual fonts only)
    koreanFontName,
    englishFontName,

    // Processing state
    isProcessing,
    progress,

    // Functions
    handleKoreanFontUpload,
    handleEnglishFontUpload,
    mergeAndDownloadFont, // Renamed from mergeFonts
    resetFonts,
  }
}
