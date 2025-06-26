import { saveAs } from "file-saver"
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
      toast.success("영문 폰트가 성공적으로 로드되었습니다.")
    } catch {
      throw new Error("영문 폰트 읽기 오류")
    }
  }

  const addGlyphsToMap = useCallback(
    (
      glyphMap: Map<number, unknown>,
      sourceFont: Font,
      start: number,
      end: number,
      rangeDescription = ""
    ) => {
      let addedCount = 0
      let scannedCount = 0

      for (let i = start; i <= end; i++) {
        scannedCount++
        try {
          const char = String.fromCharCode(i)
          const glyphIndex = sourceFont.charToGlyphIndex(char)

          // 실제 글리프가 존재하고 중복되지 않은 경우만 추가
          if (glyphIndex > 0 && !glyphMap.has(i)) {
            const originalGlyph = sourceFont.glyphs.get(glyphIndex)
            // 글리프가 실제로 존재하고 유효한 경우만 추가
            if (originalGlyph?.path?.commands && originalGlyph.path.commands.length > 0) {
              try {
                // OpenType.js Glyph 생성자를 사용한 올바른 글리프 객체 생성
                const Glyph = (
                  window as unknown as { opentype: { Glyph: new (options: unknown) => unknown } }
                ).opentype.Glyph

                const clonedGlyph = new Glyph({
                  name:
                    originalGlyph.name && originalGlyph.name !== ".notdef"
                      ? originalGlyph.name
                      : `glyph${glyphIndex}`,
                  unicode: i,
                  advanceWidth: originalGlyph.advanceWidth || 1000,
                  leftSideBearing: originalGlyph.leftSideBearing || 0,
                  path: originalGlyph.path,
                  index: glyphIndex,
                }) as unknown

                glyphMap.set(i, clonedGlyph)
                addedCount++
              } catch (glyphError) {
                console.warn(`글리프 생성 실패 (U+${i.toString(16)}):`, glyphError)
              }
            }
          }
        } catch {
          // 오류는 무시 (성능 향상)
        }
      }

      const efficiency = scannedCount > 0 ? ((addedCount / scannedCount) * 100).toFixed(1) : "0"
      console.log(
        `${rangeDescription}: ${addedCount}/${scannedCount} glyphs added (${efficiency}% efficiency)`
      )
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

      // 실제 단계 수 계산
      let stepCount = 0
      if (options.koreanHangul) stepCount++
      if (options.koreanSymbols) stepCount += 2
      if (options.koreanNumbers) stepCount++
      if (options.englishLetters) stepCount += 2
      if (options.englishNumbers) stepCount++
      if (options.englishSymbols) stepCount += 4
      if (options.englishSpecial) stepCount += 2
      if (options.englishLigatures) stepCount++
      if (options.englishIcons) stepCount += 3

      if (stepCount === 0) stepCount = 1

      let currentStep = 0
      const targetGlyphs = new Map()

      // .notdef glyph 추가
      const notdefGlyph = koreanFont.glyphs.get(0) || englishFont.glyphs.get(0)
      if (notdefGlyph) {
        const clonedNotdef = Object.assign(
          Object.create(Object.getPrototypeOf(notdefGlyph)),
          notdefGlyph
        )
        if (!clonedNotdef.name || clonedNotdef.name === "") {
          clonedNotdef.name = ".notdef"
        }
        targetGlyphs.set(0, clonedNotdef)
      }

      // 한글 문자 추가
      if (options.koreanHangul) {
        addGlyphsToMap(targetGlyphs, koreanFont, 0xac00, 0xd7af, "Korean Hangul")
        currentStep++
        setProgress((currentStep / stepCount) * 100)
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      if (options.koreanSymbols) {
        addGlyphsToMap(targetGlyphs, koreanFont, 0x3130, 0x318f, "Korean Symbols")
        currentStep++
        setProgress((currentStep / stepCount) * 100)
        await new Promise((resolve) => setTimeout(resolve, 100))
        addGlyphsToMap(targetGlyphs, koreanFont, 0xa960, 0xa97f, "Korean Extended")
        currentStep++
        setProgress((currentStep / stepCount) * 100)
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      if (options.koreanNumbers) {
        addGlyphsToMap(targetGlyphs, koreanFont, 0x1100, 0x11ff, "Korean Jamo")
        currentStep++
        setProgress((currentStep / stepCount) * 100)
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      // 영문 문자 추가
      if (options.englishLetters) {
        addGlyphsToMap(targetGlyphs, englishFont, 0x0041, 0x005a, "English Uppercase")
        currentStep++
        setProgress((currentStep / stepCount) * 100)
        await new Promise((resolve) => setTimeout(resolve, 100))
        addGlyphsToMap(targetGlyphs, englishFont, 0x0061, 0x007a, "English Lowercase")
        currentStep++
        setProgress((currentStep / stepCount) * 100)
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      if (options.englishNumbers) {
        addGlyphsToMap(targetGlyphs, englishFont, 0x0030, 0x0039, "English Numbers")
        currentStep++
        setProgress((currentStep / stepCount) * 100)
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      if (options.englishSymbols) {
        addGlyphsToMap(targetGlyphs, englishFont, 0x0020, 0x002f, "English Symbols 1")
        currentStep++
        setProgress((currentStep / stepCount) * 100)
        await new Promise((resolve) => setTimeout(resolve, 100))
        addGlyphsToMap(targetGlyphs, englishFont, 0x003a, 0x0040, "English Symbols 2")
        currentStep++
        setProgress((currentStep / stepCount) * 100)
        await new Promise((resolve) => setTimeout(resolve, 100))
        addGlyphsToMap(targetGlyphs, englishFont, 0x005b, 0x0060, "English Symbols 3")
        currentStep++
        setProgress((currentStep / stepCount) * 100)
        await new Promise((resolve) => setTimeout(resolve, 100))
        addGlyphsToMap(targetGlyphs, englishFont, 0x007b, 0x007e, "English Symbols 4")
        currentStep++
        setProgress((currentStep / stepCount) * 100)
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      if (options.englishSpecial) {
        addGlyphsToMap(targetGlyphs, englishFont, 0x00a0, 0x00ff, "English Special 1")
        currentStep++
        setProgress((currentStep / stepCount) * 100)
        await new Promise((resolve) => setTimeout(resolve, 100))
        addGlyphsToMap(targetGlyphs, englishFont, 0x2000, 0x206f, "English Special 2")
        currentStep++
        setProgress((currentStep / stepCount) * 100)
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      if (options.englishLigatures) {
        addGlyphsToMap(targetGlyphs, englishFont, 0xfb00, 0xfb4f, "Standard Ligatures")
        currentStep++
        setProgress((currentStep / stepCount) * 100)
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      if (options.englishIcons) {
        addGlyphsToMap(targetGlyphs, englishFont, 0xe5fa, 0xe6ac, "Icons 1")
        currentStep++
        setProgress((currentStep / stepCount) * 100)
        await new Promise((resolve) => setTimeout(resolve, 100))
        addGlyphsToMap(targetGlyphs, englishFont, 0xe700, 0xe7c5, "Icons 2")
        currentStep++
        setProgress((currentStep / stepCount) * 100)
        await new Promise((resolve) => setTimeout(resolve, 100))
        addGlyphsToMap(targetGlyphs, englishFont, 0xf000, 0xf2e0, "Icons 3")
        currentStep++
        setProgress((currentStep / stepCount) * 100)
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      // 글리프 배열로 변환
      const glyphsArray = Array.from(targetGlyphs.values()).map((glyph) => {
        if (glyph && typeof glyph === "object") {
          const clonedGlyph = Object.assign(Object.create(Object.getPrototypeOf(glyph)), glyph)
          return clonedGlyph
        }
        return glyph
      })

      // .notdef 글리프가 첫 번째에 위치하도록 정렬
      glyphsArray.sort((a, b) => {
        const aIsNotdef = a?.name === ".notdef" || (a as { index?: number })?.index === 0
        const bIsNotdef = b?.name === ".notdef" || (b as { index?: number })?.index === 0
        if (aIsNotdef && !bIsNotdef) return -1
        if (!aIsNotdef && bIsNotdef) return 1
        return 0
      })

      setProgress(100)

      // 폰트 생성
      const Font = (window as unknown as { opentype: { Font: new (options: unknown) => Font } })
        .opentype.Font

      // 글리프 인덱스 재할당
      glyphsArray.forEach((glyph, index) => {
        if (glyph && typeof glyph === "object" && "index" in glyph) {
          ;(glyph as { index: number }).index = index
        }
      })

      const fontOptions = {
        familyName: fontName,
        styleName: "Regular",
        unitsPerEm: englishFont.unitsPerEm || 1000,
        ascender: englishFont.ascender || 800,
        descender: englishFont.descender || -200,
        glyphs: glyphsArray,
        names: {
          fontFamily: { en: fontName },
          fontSubfamily: { en: "Regular" },
          postScriptName: { en: fontName.replace(/[^a-zA-Z0-9-]/g, "") },
          version: { en: "1.0" },
        },
      }

      const newMergedFont = new Font(fontOptions)
      setMergedFont(newMergedFont)

      // 미리보기를 위해 폰트 URL 생성
      const fontBuffer = newMergedFont.toArrayBuffer()
      const blob = new Blob([fontBuffer], { type: "font/truetype" })
      const url = URL.createObjectURL(blob)
      setFontUrl(url)

      const finalSizeKB = (fontBuffer.byteLength / 1024).toFixed(1)
      toast.success(
        `폰트 합치기가 완료되었습니다! (${finalSizeKB}KB, ${glyphsArray.length}개 글리프)`
      )

      console.log(`Created merged font with ${glyphsArray.length} glyphs`)
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
      const arrayBuffer = mergedFont.toArrayBuffer()
      const blob = new Blob([arrayBuffer], { type: "font/truetype" })
      const safeFontName = fileName.replace(/[^a-zA-Z0-9-]/g, "") || "HangeulCodingFont"

      saveAs(blob, `${safeFontName}.ttf`)

      const sizeKB = (arrayBuffer.byteLength / 1024).toFixed(1)
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
    setProgress(0)
    if (fontUrl) {
      URL.revokeObjectURL(fontUrl)
      setFontUrl("")
    }
  }

  return {
    koreanFont,
    englishFont,
    koreanFontInfo: koreanFont && koreanFontFile ? {
      font: koreanFont,
      file: koreanFontFile,
      name: koreanFontName,
      size: formatFileSize(koreanFontFile.size),
    } : null,
    englishFontInfo: englishFont && englishFontFile ? {
      font: englishFont,
      file: englishFontFile,
      name: englishFontName,
      size: formatFileSize(englishFontFile.size),
    } : null,
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

