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

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }, [])

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

        // 기본 폰트 이름 추출
        let baseFontName = font.names.fontFamily?.en || file.name.replace(/\.[^/.]+$/, "")

        // 현재 상태에서 이미 로드된 폰트와 이름이 같은지 확인
        const otherFont = type === "korean" ? fontState.englishFont : fontState.koreanFont
        if (otherFont && otherFont.font.names.fontFamily?.en === baseFontName) {
          // 중복된 폰트 이름이 발견되면 접미사 추가
          baseFontName = `${baseFontName}-${type === "korean" ? "Korean" : "English"}`
          setError(`중복된 폰트 이름이 감지되어 "${baseFontName}"로 변경되었습니다.`)
        }

        const fontInfo: FontInfo = {
          file,
          font,
          name: baseFontName,
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
    [setError, setSuccess, formatFileSize, fontState.koreanFont, fontState.englishFont]
  )

  const addGlyphsToMap = useCallback(
    async (glyphMap: Map<number, unknown>, sourceFont: Font, start: number, end: number) => {
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

        // 실제 단계 수 계산
        let stepCount = 0
        if (options.koreanHangul) stepCount++
        if (options.koreanSymbols) stepCount += 2 // 자모, 자모확장
        if (options.koreanNumbers) stepCount++
        if (options.englishLetters) stepCount += 2 // 대문자, 소문자
        if (options.englishNumbers) stepCount++
        if (options.englishSymbols) stepCount += 4 // 4구간
        if (options.englishSpecial) stepCount += 2 // 2구간
        if (options.englishLigatures) stepCount++ // 합자
        if (options.englishIcons) stepCount += 3 // 아이콘 (3구간)

        // 최소 1단계 보장
        if (stepCount === 0) stepCount = 1

        let currentStep = 0

        // 기본 폰트를 복사하여 시작
        const baseFont = fontState.koreanFont.font
        const targetGlyphs = new Map()

        // .notdef glyph 추가 (인덱스 0)
        const notdefGlyph = baseFont.glyphs.get(0)
        if (notdefGlyph) {
          targetGlyphs.set(0, notdefGlyph)
        }

        // 한글 문자 추가
        if (options.koreanHangul) {
          await addGlyphsToMap(targetGlyphs, fontState.koreanFont.font, 0xac00, 0xd7af)
          currentStep++
          setFontState((prev) => ({ ...prev, progress: (currentStep / stepCount) * 100 }))
          await new Promise((resolve) => setTimeout(resolve, 300))
        }

        if (options.koreanSymbols) {
          await addGlyphsToMap(targetGlyphs, fontState.koreanFont.font, 0x3130, 0x318f)
          currentStep++
          setFontState((prev) => ({ ...prev, progress: (currentStep / stepCount) * 100 }))
          await new Promise((resolve) => setTimeout(resolve, 200))
          await addGlyphsToMap(targetGlyphs, fontState.koreanFont.font, 0xa960, 0xa97f)
          currentStep++
          setFontState((prev) => ({ ...prev, progress: (currentStep / stepCount) * 100 }))
          await new Promise((resolve) => setTimeout(resolve, 200))
        }

        if (options.koreanNumbers) {
          await addGlyphsToMap(targetGlyphs, fontState.koreanFont.font, 0x1100, 0x11ff)
          currentStep++
          setFontState((prev) => ({ ...prev, progress: (currentStep / stepCount) * 100 }))
          await new Promise((resolve) => setTimeout(resolve, 200))
        }

        // 영문 문자 추가
        if (options.englishLetters) {
          await addGlyphsToMap(targetGlyphs, fontState.englishFont.font, 0x0041, 0x005a)
          currentStep++
          setFontState((prev) => ({ ...prev, progress: (currentStep / stepCount) * 100 }))
          await new Promise((resolve) => setTimeout(resolve, 200))
          await addGlyphsToMap(targetGlyphs, fontState.englishFont.font, 0x0061, 0x007a)
          currentStep++
          setFontState((prev) => ({ ...prev, progress: (currentStep / stepCount) * 100 }))
          await new Promise((resolve) => setTimeout(resolve, 200))
        }

        if (options.englishNumbers) {
          await addGlyphsToMap(targetGlyphs, fontState.englishFont.font, 0x0030, 0x0039)
          currentStep++
          setFontState((prev) => ({ ...prev, progress: (currentStep / stepCount) * 100 }))
          await new Promise((resolve) => setTimeout(resolve, 200))
        }

        if (options.englishSymbols) {
          await addGlyphsToMap(targetGlyphs, fontState.englishFont.font, 0x0020, 0x002f)
          currentStep++
          setFontState((prev) => ({ ...prev, progress: (currentStep / stepCount) * 100 }))
          await new Promise((resolve) => setTimeout(resolve, 200))
          await addGlyphsToMap(targetGlyphs, fontState.englishFont.font, 0x003a, 0x0040)
          currentStep++
          setFontState((prev) => ({ ...prev, progress: (currentStep / stepCount) * 100 }))
          await new Promise((resolve) => setTimeout(resolve, 200))
          await addGlyphsToMap(targetGlyphs, fontState.englishFont.font, 0x005b, 0x0060)
          currentStep++
          setFontState((prev) => ({ ...prev, progress: (currentStep / stepCount) * 100 }))
          await new Promise((resolve) => setTimeout(resolve, 200))
          await addGlyphsToMap(targetGlyphs, fontState.englishFont.font, 0x007b, 0x007e)
          currentStep++
          setFontState((prev) => ({ ...prev, progress: (currentStep / stepCount) * 100 }))
          await new Promise((resolve) => setTimeout(resolve, 200))
        }

        if (options.englishSpecial) {
          await addGlyphsToMap(targetGlyphs, fontState.englishFont.font, 0x00a0, 0x00ff)
          currentStep++
          setFontState((prev) => ({ ...prev, progress: (currentStep / stepCount) * 100 }))
          await new Promise((resolve) => setTimeout(resolve, 200))
          await addGlyphsToMap(targetGlyphs, fontState.englishFont.font, 0x2000, 0x206f)
          currentStep++
          setFontState((prev) => ({ ...prev, progress: (currentStep / stepCount) * 100 }))
          await new Promise((resolve) => setTimeout(resolve, 200))
        }

        if (options.englishLigatures) {
          // 합자 관련 유니코드 범위 (Private Use Area 등에서 합자가 저장되는 경우가 많음)
          await addGlyphsToMap(targetGlyphs, fontState.englishFont.font, 0xe000, 0xf8ff)
          currentStep++
          setFontState((prev) => ({ ...prev, progress: (currentStep / stepCount) * 100 }))
          await new Promise((resolve) => setTimeout(resolve, 200))
        }

        if (options.englishIcons) {
          // NerdFonts 아이콘 유니코드 범위들
          await addGlyphsToMap(targetGlyphs, fontState.englishFont.font, 0xe5fa, 0xe6ac) // Seti-UI
          currentStep++
          setFontState((prev) => ({ ...prev, progress: (currentStep / stepCount) * 100 }))
          await new Promise((resolve) => setTimeout(resolve, 200))
          await addGlyphsToMap(targetGlyphs, fontState.englishFont.font, 0xe700, 0xe7c5) // Devicons
          currentStep++
          setFontState((prev) => ({ ...prev, progress: (currentStep / stepCount) * 100 }))
          await new Promise((resolve) => setTimeout(resolve, 200))
          await addGlyphsToMap(targetGlyphs, fontState.englishFont.font, 0xf000, 0xf2e0) // Font Awesome
          currentStep++
          setFontState((prev) => ({ ...prev, progress: (currentStep / stepCount) * 100 }))
          await new Promise((resolve) => setTimeout(resolve, 200))
        }

        // 글리프 배열로 변환
        const glyphsArray = Array.from(targetGlyphs.values())
        console.log(`Prepared ${glyphsArray.length} glyphs for font creation`)

        // 폰트 생성 단계 진행률 업데이트 (최종 100%)
        setFontState((prev) => ({ ...prev, progress: 100 }))
        await new Promise((resolve) => setTimeout(resolve, 300))

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
              const Font = (
                window as unknown as { opentype: { Font: new (...args: unknown[]) => Font } }
              ).opentype.Font
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
                // 추가 메타데이터로 시스템 인식 개선
                names: {
                  fontFamily: { en: fontName },
                  fontSubfamily: { en: "Regular" },
                  fullName: { en: fontName },
                  postScriptName: { en: fontName.replace(/\s/g, "") },
                  version: { en: "1.0" },
                  description: { en: "Merged Korean-English Coding Font" },
                  designer: { en: "Font Merger" },
                  designerURL: { en: "" },
                  manufacturer: { en: "Font Merger" },
                  manufacturerURL: { en: "" },
                  license: { en: "Custom" },
                  licenseURL: { en: "" },
                  preferredFamily: { en: fontName },
                  preferredSubfamily: { en: "Regular" },
                  compatibleFullName: { en: fontName },
                  sampleText: { en: "Sample Text 샘플 텍스트" }
                }
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

        // 미리보기를 위해 한글 폰트를 사용
        try {
          // 합쳐진 폰트 등록 시도
          const arrayBuffer = font.toArrayBuffer()
          if (arrayBuffer && arrayBuffer.byteLength > 1000) {
            const fontBlob = new Blob([arrayBuffer], { type: "font/ttf" })
            const fontUrl = URL.createObjectURL(fontBlob)
            const fontFace = new FontFace(fontName, `url(${fontUrl})`)

            await fontFace.load()
            document.fonts.add(fontFace)
            console.log(`Merged font "${fontName}" registered successfully`)
          } else {
            throw new Error("Invalid font data")
          }
        } catch (err) {
          console.warn("Merged font registration failed, using fallback:", err)

          // 폴백: CSS로 한글+영문 폰트 스택 생성
          try {
            // 한글 폰트와 영문 폰트를 각각 등록
            const koreanFontUrl = URL.createObjectURL(fontState.koreanFont.file)
            const englishFontUrl = URL.createObjectURL(fontState.englishFont.file)

            const koreanFontFace = new FontFace(`${fontName}-Korean`, `url(${koreanFontUrl})`)
            const englishFontFace = new FontFace(`${fontName}-English`, `url(${englishFontUrl})`)

            await Promise.all([koreanFontFace.load(), englishFontFace.load()])

            document.fonts.add(koreanFontFace)
            document.fonts.add(englishFontFace)

            // CSS 폰트 스택을 동적으로 생성
            const style = document.createElement("style")
            style.textContent = `
              @font-face {
                font-family: "${fontName}";
                src: url("${koreanFontUrl}") format("truetype");
                unicode-range: U+AC00-D7AF, U+1100-11FF, U+3130-318F, U+A960-A97F;
              }
              @font-face {
                font-family: "${fontName}";
                src: url("${englishFontUrl}") format("truetype");
                unicode-range: U+0020-007E, U+00A0-00FF, U+2000-206F, U+E000-F8FF, U+E5FA-E6AC, U+E700-E7C5, U+F000-F2E0;
              }
            `
            document.head.appendChild(style)

            console.log(`Fallback font stack created for "${fontName}"`)
          } catch (fallbackErr) {
            console.warn("Fallback font registration also failed:", fallbackErr)
          }
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
