import { saveAs } from "file-saver"
import * as opentype from "opentype.js"
import { type Font, parse } from "opentype.js"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import type { MergeOptions } from "../types/font"

export const useFontMerger = () => {
  const [koreanFont, setKoreanFont] = useState<Font | null>(null)
  const [englishFont, setEnglishFont] = useState<Font | null>(null)
  const [koreanFontFile, setKoreanFontFile] = useState<File | null>(null)
  const [englishFontFile, setEnglishFontFile] = useState<File | null>(null)
  const [koreanFontName, setKoreanFontName] = useState("")
  const [englishFontName, setEnglishFontName] = useState("")
  const [koreanFontUrl, setKoreanFontUrl] = useState<string>("")
  const [englishFontUrl, setEnglishFontUrl] = useState<string>("")
  const [koreanPreviewFamily, setKoreanPreviewFamily] = useState<string>("")
  const [englishPreviewFamily, setEnglishPreviewFamily] = useState<string>("")
  const [mergedFont, setMergedFont] = useState<Font | null>(null)
  const [fontUrl, setFontUrl] = useState<string>("")
  const [previewFontFamily, setPreviewFontFamily] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)

  // 폰트 URL이 변경될 때마다 CSS font-face 규칙을 동적으로 추가
  useEffect(() => {
    if (fontUrl && mergedFont) {
      const fontFamilyName = `PreviewFont_${Date.now()}`
      setPreviewFontFamily(fontFamilyName)

      const style = document.createElement("style")
      style.textContent = `
        @font-face {
          font-family: '${fontFamilyName}';
          src: url('${fontUrl}') format('truetype');
        }
      `
      document.head.appendChild(style)

      // 이전 스타일 태그 정리
      return () => {
        if (document.head.contains(style)) {
          document.head.removeChild(style)
        }
      }
    }
  }, [fontUrl, mergedFont])

  // 한글 폰트 미리보기 URL 생성
  useEffect(() => {
    if (koreanFontUrl) {
      const fontFamilyName = `KoreanPreviewFont_${Date.now()}`
      setKoreanPreviewFamily(fontFamilyName)

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
  }, [koreanFontUrl])

  // 영문 폰트 미리보기 URL 생성
  useEffect(() => {
    if (englishFontUrl) {
      const fontFamilyName = `EnglishPreviewFont_${Date.now()}`
      setEnglishPreviewFamily(fontFamilyName)

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
  }, [englishFontUrl])

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleKoreanFontUpload = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const font = parse(arrayBuffer)
      setKoreanFont(font)
      setKoreanFontFile(file)
      setKoreanFontName(file.name)

      // 미리보기를 위한 URL 생성
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
      const font = parse(arrayBuffer)
      setEnglishFont(font)
      setEnglishFontFile(file)
      setEnglishFontName(file.name)

      // 미리보기를 위한 URL 생성
      const blob = new Blob([arrayBuffer], { type: "font/truetype" })
      const url = URL.createObjectURL(blob)
      setEnglishFontUrl(url)

      toast.success("영문 폰트가 성공적으로 로드되었습니다.")
    } catch {
      throw new Error("영문 폰트 읽기 오류")
    }
  }

  // 유니코드 범위에서 문자 추출 - useFontSubset 패턴 적용
  const extractGlyphsFromRange = useCallback(
    (sourceFont: Font, start: number, end: number, rangeDescription = "") => {
      const glyphs = []
      let addedCount = 0

      for (let i = start; i <= end; i++) {
        const char = String.fromCharCode(i)
        const glyph = sourceFont.charToGlyph(char)

        if (glyph && glyph.index !== 0) {
          glyphs.push(glyph)
          addedCount++
        }
      }

      console.log(`${rangeDescription}: ${addedCount} glyphs extracted`)
      return glyphs
    },
    []
  )

  const mergeFonts = async (options: MergeOptions, fontName: string) => {
    if (!koreanFont || !englishFont) {
      throw new Error("두 폰트 모두 업로드해주세요.")
    }

    setIsProcessing(true)
    setProgress(0)

    try {
      console.log("Starting font merge process...")

      // 모든 글리프를 담을 배열 초기화 (.notdef 글리프부터 시작)
      const glyphs = [koreanFont.glyphs.get(0) || englishFont.glyphs.get(0)]
      let currentStep = 0
      const totalSteps = Object.values(options).filter(Boolean).length

      // 한글 문자 추가
      if (options.koreanHangul) {
        glyphs.push(...extractGlyphsFromRange(koreanFont, 0xac00, 0xd7af, "Korean Hangul"))
        currentStep++
        setProgress((currentStep / totalSteps) * 100)
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      if (options.koreanSymbols) {
        glyphs.push(...extractGlyphsFromRange(koreanFont, 0x3130, 0x318f, "Korean Symbols"))
        glyphs.push(...extractGlyphsFromRange(koreanFont, 0xa960, 0xa97f, "Korean Extended"))
        currentStep++
        setProgress((currentStep / totalSteps) * 100)
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      if (options.koreanNumbers) {
        glyphs.push(...extractGlyphsFromRange(koreanFont, 0x1100, 0x11ff, "Korean Jamo"))
        currentStep++
        setProgress((currentStep / totalSteps) * 100)
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      // 영문 문자 추가
      if (options.englishLetters) {
        glyphs.push(...extractGlyphsFromRange(englishFont, 0x0041, 0x005a, "English Uppercase"))
        glyphs.push(...extractGlyphsFromRange(englishFont, 0x0061, 0x007a, "English Lowercase"))
        currentStep++
        setProgress((currentStep / totalSteps) * 100)
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      if (options.englishNumbers) {
        glyphs.push(...extractGlyphsFromRange(englishFont, 0x0030, 0x0039, "English Numbers"))
        currentStep++
        setProgress((currentStep / totalSteps) * 100)
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      if (options.englishSymbols) {
        glyphs.push(...extractGlyphsFromRange(englishFont, 0x0020, 0x002f, "English Symbols 1"))
        glyphs.push(...extractGlyphsFromRange(englishFont, 0x003a, 0x0040, "English Symbols 2"))
        glyphs.push(...extractGlyphsFromRange(englishFont, 0x005b, 0x0060, "English Symbols 3"))
        glyphs.push(...extractGlyphsFromRange(englishFont, 0x007b, 0x007e, "English Symbols 4"))
        currentStep++
        setProgress((currentStep / totalSteps) * 100)
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      if (options.englishSpecial) {
        glyphs.push(...extractGlyphsFromRange(englishFont, 0x00a0, 0x00ff, "English Special 1"))
        glyphs.push(...extractGlyphsFromRange(englishFont, 0x2000, 0x206f, "English Special 2"))
        currentStep++
        setProgress((currentStep / totalSteps) * 100)
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      if (options.englishLigatures) {
        glyphs.push(...extractGlyphsFromRange(englishFont, 0xfb00, 0xfb4f, "Standard Ligatures"))
        currentStep++
        setProgress((currentStep / totalSteps) * 100)
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      if (options.englishIcons) {
        glyphs.push(...extractGlyphsFromRange(englishFont, 0xe5fa, 0xe6ac, "Icons 1"))
        glyphs.push(...extractGlyphsFromRange(englishFont, 0xe700, 0xe7c5, "Icons 2"))
        glyphs.push(...extractGlyphsFromRange(englishFont, 0xf000, 0xf2e0, "Icons 3"))
        currentStep++
        setProgress((currentStep / totalSteps) * 100)
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      setProgress(100)

      // 새로운 폰트 생성 - useFontSubset 패턴 적용
      const mergedFont = new opentype.Font({
        familyName: fontName,
        styleName: "Regular",
        unitsPerEm: englishFont.unitsPerEm || 1000,
        ascender: englishFont.ascender || 800,
        descender: englishFont.descender || -200,
        glyphs: glyphs,
      })

      setMergedFont(mergedFont)

      // 미리보기를 위해 폰트 URL 생성
      const fontBuffer = mergedFont.toArrayBuffer()
      const blob = new Blob([fontBuffer], { type: "font/truetype" })
      const url = URL.createObjectURL(blob)
      setFontUrl(url)

      const finalSizeKB = (fontBuffer.byteLength / 1024).toFixed(1)
      toast.success(`폰트 합치기가 완료되었습니다! (${finalSizeKB}KB, ${glyphs.length}개 글리프)`)

      console.log(`Created merged font with ${glyphs.length} glyphs`)
    } catch (error) {
      setProgress(0)
      throw new Error(
        `폰트 합치기 실패: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadFont = async (fileName: string) => {
    if (!mergedFont) {
      throw new Error("먼저 폰트를 합쳐주세요.")
    }

    try {
      // useFontSubset 스타일의 단순한 다운로드 로직
      const fontBuffer = mergedFont.toArrayBuffer()
      const blob = new Blob([fontBuffer], { type: "font/truetype" })
      const safeFontName = fileName.replace(/[^a-zA-Z0-9-]/g, "") || "HangeulCodingFont"

      saveAs(blob, `${safeFontName}.ttf`)

      const sizeKB = (fontBuffer.byteLength / 1024).toFixed(1)
      toast.success(`폰트 다운로드가 완료되었습니다! (${safeFontName}.ttf, ${sizeKB}KB)`)
    } catch (error) {
      throw new Error(`다운로드 실패: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const resetFonts = () => {
    setKoreanFont(null)
    setEnglishFont(null)
    setKoreanFontFile(null)
    setEnglishFontFile(null)
    setKoreanFontName("")
    setEnglishFontName("")
    setMergedFont(null)
    setPreviewFontFamily("")
    setKoreanPreviewFamily("")
    setEnglishPreviewFamily("")
    setProgress(0)

    // URL 정리
    if (fontUrl) {
      URL.revokeObjectURL(fontUrl)
      setFontUrl("")
    }
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
    koreanFont,
    englishFont,
    koreanFontInfo:
      koreanFont && koreanFontFile
        ? {
            font: koreanFont,
            file: koreanFontFile,
            name: koreanPreviewFamily || koreanFontName,
            size: formatFileSize(koreanFontFile.size),
          }
        : null,
    englishFontInfo:
      englishFont && englishFontFile
        ? {
            font: englishFont,
            file: englishFontFile,
            name: englishPreviewFamily || englishFontName,
            size: formatFileSize(englishFontFile.size),
          }
        : null,
    koreanFontName,
    englishFontName,
    mergedFont,
    previewFontFamily,
    isProcessing,
    progress,
    handleKoreanFontUpload,
    handleEnglishFontUpload,
    mergeFonts,
    downloadFont,
    resetFonts,
  }
}
