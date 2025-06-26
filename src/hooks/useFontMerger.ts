import { saveAs } from "file-saver"
import * as opentype from "opentype.js"
import { useEffect, useState } from "react"
import { toast } from "sonner"

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

  // Extract Korean glyphs only - simplified like useFontSubset
  const getKoreanGlyphs = (): opentype.Glyph[] => {
    if (!koreanFont) return []

    const glyphs: opentype.Glyph[] = []
    
    console.log("📝 Extracting Korean glyphs from Korean font...")

    // Korean ranges - fixed, no options needed
    const koreanRanges = [
      [0x1100, 0x11ff], // 한글 자모
      [0x3130, 0x318f], // 한글 호환 자모  
      [0xac00, 0xd7af], // 한글 음절
      [0xa960, 0xa97f], // 한글 확장-A
    ]

    let addedCount = 0
    for (const [start, end] of koreanRanges) {
      for (let i = start; i <= end; i++) {
        const char = String.fromCharCode(i)
        const glyph = koreanFont.charToGlyph(char)
        if (glyph && glyph.index !== 0) {
          glyphs.push(glyph)
          addedCount++
        }
      }
    }

    console.log(`✅ Extracted ${addedCount} Korean glyphs`)
    return glyphs
  }

  // Simple merge and download function - English font + Korean glyphs only
  const mergeAndDownloadFont = async (fontName: string) => {
    if (!koreanFont || !englishFont) {
      throw new Error("두 폰트 모두 업로드해주세요.")
    }

    setIsProcessing(true)
    setProgress(0)

    try {
      console.log("🚀 Starting font merge process...")

      // Get Korean glyphs only
      const koreanGlyphs = getKoreanGlyphs()
      console.log(`📊 Processing ${koreanGlyphs.length} Korean glyphs`)

      // Start with .notdef glyph + all English glyphs
      const glyphs = [englishFont.glyphs.get(0)] // .notdef glyph

      setProgress(25)

      // Add ALL English glyphs
      for (let i = 1; i < englishFont.glyphs.length; i++) {
        const glyph = englishFont.glyphs.get(i)
        if (glyph) {
          glyphs.push(glyph)
        }
      }

      console.log(`✅ Added ${englishFont.glyphs.length - 1} English glyphs`)
      setProgress(50)

      // Add Korean glyphs
      koreanGlyphs.forEach((glyph) => {
        if (glyph) {
          glyphs.push(glyph)
        }
      })

      console.log(`✅ Added ${koreanGlyphs.length} Korean glyphs`)
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
