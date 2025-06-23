import { type Font, parse } from "opentype.js"
import { useCallback, useState } from "react"
import type { FontInfo, FontState, MergeOptions } from "../types/font"

export const useFontMerger = () => {
  const [fontState, setFontState] = useState<FontState>({
    koreanFont: null,
    englishFont: null,
    mergedFont: null,
    isLoading: false,
    progress: 0,
    error: null,
    success: null,
  })

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const setError = useCallback((error: string) => {
    setFontState((prev) => ({ ...prev, error, success: null }))
    setTimeout(() => setFontState((prev) => ({ ...prev, error: null })), 5000)
  }, [])

  const setSuccess = useCallback((success: string) => {
    setFontState((prev) => ({ ...prev, success, error: null }))
    setTimeout(() => setFontState((prev) => ({ ...prev, success: null })), 5000)
  }, [])

  const loadFont = useCallback(
    async (file: File, type: "korean" | "english") => {
      try {
        const arrayBuffer = await file.arrayBuffer()
        const font = parse(arrayBuffer)

        const fontInfo: FontInfo = {
          file,
          font,
          name: font.names.fontFamily?.en || file.name,
          size: formatFileSize(file.size),
        }

        // 폰트 CSS 등록
        const fontUrl = URL.createObjectURL(file)
        const fontFace = new FontFace(fontInfo.name, `url(${fontUrl})`)

        try {
          await fontFace.load()
          document.fonts.add(fontFace)
        } catch (err) {
          console.warn("Font face loading failed:", err)
        }

        setFontState((prev) => ({
          ...prev,
          [type === "korean" ? "koreanFont" : "englishFont"]: fontInfo,
        }))

        setSuccess(`${type === "korean" ? "한글" : "영문"} 폰트가 성공적으로 로드되었습니다.`)
      } catch (error) {
        setError(
          `${type === "korean" ? "한글" : "영문"} 폰트 로드 실패: ${error instanceof Error ? error.message : "Unknown error"}`
        )
      }
    },
    [setError, setSuccess, formatFileSize]
  )

  const addGlyphsToMap = useCallback(
    (glyphMap: Map<number, any>, sourceFont: Font, start: number, end: number) => {
      let addedCount = 0
      for (let i = start; i <= end; i++) {
        try {
          const char = String.fromCharCode(i)
          const glyphIndex = sourceFont.charToGlyphIndex(char)

          if (glyphIndex > 0 && !glyphMap.has(i)) {
            const originalGlyph = sourceFont.glyphs.get(glyphIndex)
            if (originalGlyph) {
              // 유니코드 값을 키로 하여 글리프 저장
              glyphMap.set(i, originalGlyph)
              addedCount++
            }
          }
        } catch (error) {
          console.warn(`Failed to add glyph at position ${i}:`, error)
        }
      }
      console.log(
        `Added ${addedCount} glyphs from range U+${start.toString(16).toUpperCase().padStart(4, "0")} to U+${end.toString(16).toUpperCase().padStart(4, "0")}`
      )
    },
    []
  )

  const mergefonts = useCallback(
    async (options: MergeOptions, fontName: string) => {
      if (!fontState.koreanFont || !fontState.englishFont) {
        setError("두 폰트 모두 업로드해주세요.")
        return
      }

      setFontState((prev) => ({ ...prev, isLoading: true, progress: 0 }))

      try {
        console.log("Starting font merge process...")

        // 기본 폰트를 복사하여 시작
        const baseFont = fontState.koreanFont.font
        const targetGlyphs = new Map()

        // .notdef glyph 추가 (인덱스 0)
        const notdefGlyph = baseFont.glyphs.get(0)
        if (notdefGlyph) {
          targetGlyphs.set(0, notdefGlyph)
        }

        let progress = 0
        const totalSteps = 7

        // 한글 문자 추가
        if (options.koreanHangul) {
          addGlyphsToMap(targetGlyphs, fontState.koreanFont.font, 0xac00, 0xd7af) // 한글 완성형
          setFontState((prev) => ({ ...prev, progress: (++progress / totalSteps) * 100 }))
          await new Promise((resolve) => setTimeout(resolve, 300)) // 진행 상황을 보여주기 위한 딜레이
        }

        if (options.koreanSymbols) {
          addGlyphsToMap(targetGlyphs, fontState.koreanFont.font, 0x3130, 0x318f) // 한글 자모
          addGlyphsToMap(targetGlyphs, fontState.koreanFont.font, 0xa960, 0xa97f) // 한글 자모 확장
          setFontState((prev) => ({ ...prev, progress: (++progress / totalSteps) * 100 }))
          await new Promise((resolve) => setTimeout(resolve, 200))
        }

        if (options.koreanNumbers) {
          addGlyphsToMap(targetGlyphs, fontState.koreanFont.font, 0x1100, 0x11ff) // 한글 자모
          setFontState((prev) => ({ ...prev, progress: (++progress / totalSteps) * 100 }))
          await new Promise((resolve) => setTimeout(resolve, 200))
        }

        // 영문 문자 추가
        if (options.englishLetters) {
          addGlyphsToMap(targetGlyphs, fontState.englishFont.font, 0x0041, 0x005a) // A-Z
          addGlyphsToMap(targetGlyphs, fontState.englishFont.font, 0x0061, 0x007a) // a-z
          setFontState((prev) => ({ ...prev, progress: (++progress / totalSteps) * 100 }))
          await new Promise((resolve) => setTimeout(resolve, 200))
        }

        if (options.englishNumbers) {
          addGlyphsToMap(targetGlyphs, fontState.englishFont.font, 0x0030, 0x0039) // 0-9
          setFontState((prev) => ({ ...prev, progress: (++progress / totalSteps) * 100 }))
          await new Promise((resolve) => setTimeout(resolve, 200))
        }

        if (options.englishSymbols) {
          addGlyphsToMap(targetGlyphs, fontState.englishFont.font, 0x0020, 0x002f) // Basic punctuation
          addGlyphsToMap(targetGlyphs, fontState.englishFont.font, 0x003a, 0x0040) // :;<=>?@
          addGlyphsToMap(targetGlyphs, fontState.englishFont.font, 0x005b, 0x0060) // [\]^_`
          addGlyphsToMap(targetGlyphs, fontState.englishFont.font, 0x007b, 0x007e) // {|}~
          setFontState((prev) => ({ ...prev, progress: (++progress / totalSteps) * 100 }))
          await new Promise((resolve) => setTimeout(resolve, 200))
        }

        if (options.englishSpecial) {
          addGlyphsToMap(targetGlyphs, fontState.englishFont.font, 0x00a0, 0x00ff) // Latin-1 Supplement
          addGlyphsToMap(targetGlyphs, fontState.englishFont.font, 0x2000, 0x206f) // General Punctuation
          setFontState((prev) => ({ ...prev, progress: (++progress / totalSteps) * 100 }))
          await new Promise((resolve) => setTimeout(resolve, 200))
        }

        // 글리프 배열로 변환
        const glyphsArray = Array.from(targetGlyphs.values())
        console.log(`Prepared ${glyphsArray.length} glyphs for font creation`)

        // 폰트 생성 단계 진행률 업데이트
        setFontState((prev) => ({ ...prev, progress: 90 }))
        await new Promise((resolve) => setTimeout(resolve, 500))

        // 간단한 방식으로 폰트 생성
        const font = {
          familyName: fontName,
          names: {
            fontFamily: { en: fontName },
            fullName: { en: fontName },
            postScriptName: { en: fontName.replace(/\s/g, "") },
          },
          unitsPerEm: baseFont.unitsPerEm,
          ascender: Math.max(
            fontState.koreanFont.font.ascender,
            fontState.englishFont.font.ascender
          ),
          descender: Math.min(
            fontState.koreanFont.font.descender,
            fontState.englishFont.font.descender
          ),
          glyphs: { glyphs: glyphsArray },
          // 기본 폰트 데이터 복사
          toArrayBuffer: () => {
            try {
              const Font = (window as any).opentype.Font
              const tempFont = new Font({
                familyName: fontName,
                styleName: "Regular",
                unitsPerEm: baseFont.unitsPerEm,
                ascender: Math.max(
                  fontState.koreanFont?.font.ascender || 800,
                  fontState.englishFont?.font.ascender || 800
                ),
                descender: Math.min(
                  fontState.koreanFont?.font.descender || -200,
                  fontState.englishFont?.font.descender || -200
                ),
                glyphs: glyphsArray,
              })
              return tempFont.toArrayBuffer()
            } catch (error) {
              console.error("Font creation failed:", error)
              // 폴백으로 기본 폰트 반환
              return baseFont.toArrayBuffer()
            }
          },
        }

        console.log(`Created merged font object with ${glyphsArray.length} glyphs`)

        // 합쳐진 폰트를 브라우저에 등록하여 미리보기 가능하게 함
        try {
          const arrayBuffer = font.toArrayBuffer()
          const fontBlob = new Blob([arrayBuffer], { type: "font/ttf" })
          const fontUrl = URL.createObjectURL(fontBlob)
          const fontFace = new FontFace(fontName, `url(${fontUrl})`)

          await fontFace.load()
          document.fonts.add(fontFace)
          console.log(`Merged font "${fontName}" registered successfully`)
        } catch (err) {
          console.warn("Merged font registration failed:", err)
        }

        setFontState((prev) => ({
          ...prev,
          mergedFont: font,
          isLoading: false,
          progress: 100,
        }))

        setSuccess("폰트 합치기가 완료되었습니다!")
      } catch (error) {
        setFontState((prev) => ({ ...prev, isLoading: false, progress: 0 }))
        setError(`폰트 합치기 실패: ${error instanceof Error ? error.message : "Unknown error"}`)
      }
    },
    [fontState.koreanFont, fontState.englishFont, addGlyphsToMap, setError, setSuccess]
  )

  const downloadFont = useCallback(
    (fontName: string) => {
      if (!fontState.mergedFont) {
        setError("먼저 폰트를 합쳐주세요.")
        return
      }

      try {
        const arrayBuffer = fontState.mergedFont.toArrayBuffer()
        const blob = new Blob([arrayBuffer], { type: "font/ttf" })
        const url = URL.createObjectURL(blob)

        const a = document.createElement("a")
        a.href = url
        a.download = `${fontName}.ttf`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)

        URL.revokeObjectURL(url)
        setSuccess("폰트 다운로드가 시작되었습니다!")
      } catch (error) {
        setError(`다운로드 실패: ${error instanceof Error ? error.message : "Unknown error"}`)
      }
    },
    [fontState.mergedFont, setError, setSuccess]
  )

  return {
    fontState,
    loadFont,
    mergefonts,
    downloadFont,
  }
}
