import { type Font, parse } from "opentype.js"
import { useCallback, useState } from "react"
import { toast } from "sonner"
import type { FontInfo, FontState, MergeOptions } from "../types/font"

export const useFontMerger = () => {
  const clearError = useCallback(() => {
    setFontState((prev) => ({ ...prev, error: null }))
  }, [])
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
    // Dialog 사용 시 자동으로 닫히지 않도록 setTimeout 제거
  }, [])

  const setSuccess = useCallback((success: string) => {
    toast.success(success)
    setFontState((prev) => ({ ...prev, success: null, error: null }))
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
    async (
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
        `${rangeDescription}: ${addedCount}/${scannedCount} glyphs added (${efficiency}% efficiency) - U+${start.toString(16).toUpperCase().padStart(4, "0")} to U+${end.toString(16).toUpperCase().padStart(4, "0")}`
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

        // .notdef glyph 추가 (인덱스 0) - 필수 글리프
        const notdefGlyph = baseFont.glyphs.get(0) || fontState.englishFont.font.glyphs.get(0)
        if (notdefGlyph) {
          // .notdef 글리프의 이름 확인 및 설정
          const clonedNotdef = Object.assign(
            Object.create(Object.getPrototypeOf(notdefGlyph)),
            notdefGlyph
          )
          if (!clonedNotdef.name || clonedNotdef.name === "") {
            clonedNotdef.name = ".notdef"
          }
          targetGlyphs.set(0, clonedNotdef)
        } else {
          // .notdef 글리프가 없으면 기본 생성
          console.warn("No .notdef glyph found, creating basic one")
        }

        // 한글 문자 추가
        if (options.koreanHangul) {
          await addGlyphsToMap(
            targetGlyphs,
            fontState.koreanFont.font,
            0xac00,
            0xd7af,
            "Korean Hangul"
          )
          currentStep++
          setFontState((prev) => ({ ...prev, progress: (currentStep / stepCount) * 100 }))
          await new Promise((resolve) => setTimeout(resolve, 300))
        }

        if (options.koreanSymbols) {
          await addGlyphsToMap(
            targetGlyphs,
            fontState.koreanFont.font,
            0x3130,
            0x318f,
            "Korean Symbols"
          )
          currentStep++
          setFontState((prev) => ({ ...prev, progress: (currentStep / stepCount) * 100 }))
          await new Promise((resolve) => setTimeout(resolve, 200))
          await addGlyphsToMap(
            targetGlyphs,
            fontState.koreanFont.font,
            0xa960,
            0xa97f,
            "Korean Numbers"
          )
          currentStep++
          setFontState((prev) => ({ ...prev, progress: (currentStep / stepCount) * 100 }))
          await new Promise((resolve) => setTimeout(resolve, 200))
        }

        if (options.koreanNumbers) {
          await addGlyphsToMap(
            targetGlyphs,
            fontState.koreanFont.font,
            0x1100,
            0x11ff,
            "Korean Numbers"
          )
          currentStep++
          setFontState((prev) => ({ ...prev, progress: (currentStep / stepCount) * 100 }))
          await new Promise((resolve) => setTimeout(resolve, 200))
        }

        // 영문 문자 추가
        if (options.englishLetters) {
          await addGlyphsToMap(
            targetGlyphs,
            fontState.englishFont.font,
            0x0041,
            0x005a,
            "English Uppercase"
          )
          currentStep++
          setFontState((prev) => ({ ...prev, progress: (currentStep / stepCount) * 100 }))
          await new Promise((resolve) => setTimeout(resolve, 200))
          await addGlyphsToMap(
            targetGlyphs,
            fontState.englishFont.font,
            0x0061,
            0x007a,
            "English Lowercase"
          )
          currentStep++
          setFontState((prev) => ({ ...prev, progress: (currentStep / stepCount) * 100 }))
          await new Promise((resolve) => setTimeout(resolve, 200))
        }

        if (options.englishNumbers) {
          await addGlyphsToMap(
            targetGlyphs,
            fontState.englishFont.font,
            0x0030,
            0x0039,
            "English Numbers"
          )
          currentStep++
          setFontState((prev) => ({ ...prev, progress: (currentStep / stepCount) * 100 }))
          await new Promise((resolve) => setTimeout(resolve, 200))
        }

        if (options.englishSymbols) {
          await addGlyphsToMap(
            targetGlyphs,
            fontState.englishFont.font,
            0x0020,
            0x002f,
            "English Symbols"
          )
          currentStep++
          setFontState((prev) => ({ ...prev, progress: (currentStep / stepCount) * 100 }))
          await new Promise((resolve) => setTimeout(resolve, 200))
          await addGlyphsToMap(
            targetGlyphs,
            fontState.englishFont.font,
            0x003a,
            0x0040,
            "English Symbols"
          )
          currentStep++
          setFontState((prev) => ({ ...prev, progress: (currentStep / stepCount) * 100 }))
          await new Promise((resolve) => setTimeout(resolve, 200))
          await addGlyphsToMap(
            targetGlyphs,
            fontState.englishFont.font,
            0x005b,
            0x0060,
            "English Symbols"
          )
          currentStep++
          setFontState((prev) => ({ ...prev, progress: (currentStep / stepCount) * 100 }))
          await new Promise((resolve) => setTimeout(resolve, 200))
          await addGlyphsToMap(
            targetGlyphs,
            fontState.englishFont.font,
            0x007b,
            0x007e,
            "English Symbols"
          )
          currentStep++
          setFontState((prev) => ({ ...prev, progress: (currentStep / stepCount) * 100 }))
          await new Promise((resolve) => setTimeout(resolve, 200))
        }

        if (options.englishSpecial) {
          await addGlyphsToMap(
            targetGlyphs,
            fontState.englishFont.font,
            0x00a0,
            0x00ff,
            "English Special"
          )
          currentStep++
          setFontState((prev) => ({ ...prev, progress: (currentStep / stepCount) * 100 }))
          await new Promise((resolve) => setTimeout(resolve, 200))
          await addGlyphsToMap(
            targetGlyphs,
            fontState.englishFont.font,
            0x2000,
            0x206f,
            "English Special"
          )
          currentStep++
          setFontState((prev) => ({ ...prev, progress: (currentStep / stepCount) * 100 }))
          await new Promise((resolve) => setTimeout(resolve, 200))
        }

        if (options.englishLigatures) {
          // 합자 스캔을 효율적으로 개선
          console.log("📝 합자 글리프 스캔 중... (실제 존재하는 글리프만 추가)")

          // 1. 먼저 작은 범위에서 합자 확인
          await addGlyphsToMap(
            targetGlyphs,
            fontState.englishFont.font,
            0xfb00,
            0xfb4f,
            "Standard Ligatures"
          ) // fi, fl 등
          await addGlyphsToMap(
            targetGlyphs,
            fontState.englishFont.font,
            0x2190,
            0x21ff,
            "Arrow Ligatures"
          ) // => <= 등
          await addGlyphsToMap(
            targetGlyphs,
            fontState.englishFont.font,
            0x2200,
            0x22ff,
            "Math Ligatures"
          ) // != == 등

          // 2. Private Use Area는 청크 단위로 효율적 스캔
          const privateUseChunks = [
            { start: 0xe000, end: 0xe0ff, name: "PUA Block 1" },
            { start: 0xe100, end: 0xe1ff, name: "PUA Block 2" },
            { start: 0xe200, end: 0xe2ff, name: "PUA Block 3" },
            { start: 0xf000, end: 0xf0ff, name: "PUA Block 4" },
            { start: 0xf100, end: 0xf1ff, name: "PUA Block 5" },
            { start: 0xf200, end: 0xf2ff, name: "PUA Block 6" },
          ]

          let ligatureCount = 0
          for (const chunk of privateUseChunks) {
            const beforeCount = targetGlyphs.size
            await addGlyphsToMap(
              targetGlyphs,
              fontState.englishFont.font,
              chunk.start,
              chunk.end,
              chunk.name
            )
            const addedInChunk = targetGlyphs.size - beforeCount
            ligatureCount += addedInChunk

            // 한 청크에서 글리프를 많이 찾으면 계속, 적으면 중단 (최적화)
            if (addedInChunk < 5) {
              console.log(`📊 ${chunk.name}에서 ${addedInChunk}개만 발견, 스캔 최적화`)
              break
            }
          }

          console.log(`📝 총 ${ligatureCount}개 합자 글리프 추가됨`)

          currentStep++
          setFontState((prev) => ({ ...prev, progress: (currentStep / stepCount) * 100 }))
          await new Promise((resolve) => setTimeout(resolve, 200))
        }

        if (options.englishIcons) {
          // NerdFonts 아이콘 유니코드 범위들
          await addGlyphsToMap(
            targetGlyphs,
            fontState.englishFont.font,
            0xe5fa,
            0xe6ac,
            "English Icons"
          ) // Seti-UI
          currentStep++
          setFontState((prev) => ({ ...prev, progress: (currentStep / stepCount) * 100 }))
          await new Promise((resolve) => setTimeout(resolve, 200))
          await addGlyphsToMap(
            targetGlyphs,
            fontState.englishFont.font,
            0xe700,
            0xe7c5,
            "English Icons"
          ) // Devicons
          currentStep++
          setFontState((prev) => ({ ...prev, progress: (currentStep / stepCount) * 100 }))
          await new Promise((resolve) => setTimeout(resolve, 200))
          await addGlyphsToMap(
            targetGlyphs,
            fontState.englishFont.font,
            0xf000,
            0xf2e0,
            "English Icons"
          ) // Font Awesome
          currentStep++
          setFontState((prev) => ({ ...prev, progress: (currentStep / stepCount) * 100 }))
          await new Promise((resolve) => setTimeout(resolve, 200))
        }

        // 글리프 배열로 변환 - 인덱스는 원본 유지
        const glyphsArray = Array.from(targetGlyphs.values()).map((glyph) => {
          if (glyph && typeof glyph === "object") {
            // 글리프 복사하여 원본 데이터 보호
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

        console.log(`Prepared ${glyphsArray.length} glyphs for font creation`)
        console.log(`Korean font original size: ${fontState.koreanFont.size}`)
        console.log(`English font original size: ${fontState.englishFont.size}`)
        console.log(`Target glyphs count: ${targetGlyphs.size}`)

        // 실제 글리프 정보 확인
        const glyphInfo = Array.from(targetGlyphs.entries()).slice(0, 10)
        console.log(
          "First 10 glyphs:",
          glyphInfo.map(([unicode, glyph]) => ({
            unicode: `U+${unicode.toString(16).padStart(4, "0")}`,
            char: String.fromCharCode(unicode),
            hasGlyph: !!glyph,
          }))
        )

        // 폰트 생성 단계 진행률 업데이트 (최종 100%)
        setFontState((prev) => ({ ...prev, progress: 100 }))
        await new Promise((resolve) => setTimeout(resolve, 300))

        // 폰트 생성 - 모든 선택된 글리프 포함
        let mergedFont: Font

        try {
          const Font = (window as unknown as { opentype: { Font: new (options: unknown) => Font } })
            .opentype.Font

          console.log(`🔧 폰트 생성 시작: ${glyphsArray.length}개 글리프 사용`)

          // 글리프 개수 검증 - 최소 글리프 수 확인
          if (glyphsArray.length < 10) {
            console.warn(
              `⚠️  글리프 수가 매우 적음: ${glyphsArray.length}개. 폰트 생성에 문제가 발생할 수 있습니다.`
            )
          }

          // VSCode 호환성을 위한 안전한 PostScript 이름 생성
          const safeFontName = fontName.replace(/[^a-zA-Z0-9-]/g, "")
          const postScriptName = safeFontName.length > 0 ? safeFontName : "HangeulCodingFont"

          // VSCode에서 인식하기 위한 더 정확한 폰트 메타데이터 설정
          const displayFamilyName = fontName
          const postScriptFamilyName = `${postScriptName}-Regular`

          // 영문 폰트의 메타데이터를 그대로 사용하고 이름만 변경
          const englishFont = fontState.englishFont.font

          // 글리프 유니코드 매핑 생성 및 검증 - cmap 테이블용
          console.log("📋 글리프 유니코드 매핑 검증 중...")
          const unicodeMappings = new Map()
          let validGlyphCount = 0

          glyphsArray.forEach((glyph, index) => {
            if (glyph && glyph.unicode !== undefined && glyph.unicode > 0) {
              unicodeMappings.set(glyph.unicode, index)
              validGlyphCount++
            }
          })

          console.log(
            `✅ ${validGlyphCount}개의 유효한 유니코드 매핑 생성 (총 ${glyphsArray.length}개 글리프 중)`
          )

          if (validGlyphCount === 0) {
            throw new Error(
              "유효한 유니코드 매핑이 없습니다. 글리프에 unicode 속성이 설정되지 않았습니다."
            )
          }
          // cmap 테이블 생성 - Unicode BMP와 전체 Unicode 평면 지원
          console.log("🗺️  cmap 테이블 생성 중...")

          const cmap = {
            version: 0,
            numTables: 2,
            encodingRecords: [
              {
                platformID: 3, // Microsoft
                encodingID: 1, // Unicode BMP
                offset: 0,
              },
              {
                platformID: 3, // Microsoft
                encodingID: 10, // Unicode full repertoire
                offset: 0,
              },
            ],
          }

          const fontOptions = {
            familyName: displayFamilyName,
            styleName: englishFont.names.fontSubfamily?.en || "Regular",
            unitsPerEm: englishFont.unitsPerEm || 1000,
            ascender: englishFont.ascender || 800,
            descender: englishFont.descender || -200,
            lineGap: (englishFont as { lineGap?: number }).lineGap || 0,
            glyphs: glyphsArray,
            // cmap 테이블 포함 - 필수!
            cmap: cmap,
            // 영문 폰트의 names 테이블을 기반으로 이름만 변경
            names: {
              fontFamily: { en: displayFamilyName },
              fontSubfamily: { en: englishFont.names.fontSubfamily?.en || "Regular" },
              uniqueID: { en: `${postScriptFamilyName}-${Date.now()}` },
              fullName: {
                en: `${displayFamilyName} ${englishFont.names.fontSubfamily?.en || "Regular"}`,
              },
              postScriptName: { en: postScriptFamilyName },
              preferredFamily: { en: displayFamilyName },
              preferredSubfamily: {
                en:
                  // @ts-ignore - OpenType.js 타입 정의에서 누락된 속성
                  englishFont.names.preferredSubfamily?.en ||
                  englishFont.names.fontSubfamily?.en ||
                  "Regular",
              },
              version: { en: englishFont.names.version?.en || "1.0" },
              description: {
                en: englishFont.names.description?.en || `Merged font: ${displayFamilyName}`,
              },
              copyright: { en: englishFont.names.copyright?.en || "Custom merged font" },
              trademark: { en: englishFont.names.trademark?.en || displayFamilyName },
              manufacturer: {
                en: englishFont.names.manufacturer?.en || "Hangeul Coding Font Merger",
              },
              designer: { en: englishFont.names.designer?.en || "Auto-generated" },
              // @ts-ignore - OpenType.js 타입 정의에서 누락된 속성
              vendorURL: { en: englishFont.names.vendorURL?.en || "" },
              // @ts-ignore - OpenType.js 타입 정의에서 누락된 속성
              designerURL: { en: englishFont.names.designerURL?.en || "" },
              license: { en: englishFont.names.license?.en || "Custom merged font" },
              // @ts-ignore - OpenType.js 타입 정의에서 누락된 속성
              licenseURL: { en: englishFont.names.licenseURL?.en || "" },
            },
            // 영문 폰트의 OS/2 테이블 설정을 그대로 사용
            os2: englishFont.tables?.os2
              ? {
                  usWeightClass: englishFont.tables.os2.usWeightClass || 400,
                  usWidthClass: englishFont.tables.os2.usWidthClass || 5,
                  fsType: englishFont.tables.os2.fsType || 0,
                  panose: englishFont.tables.os2.panose || [2, 11, 6, 9, 2, 2, 4, 2, 2, 4],
                  ulUnicodeRange1: englishFont.tables.os2.ulUnicodeRange1 || 0x00000000,
                  ulUnicodeRange2: englishFont.tables.os2.ulUnicodeRange2 || 0x00000000,
                  ulUnicodeRange3: englishFont.tables.os2.ulUnicodeRange3 || 0x00000000,
                  ulUnicodeRange4: englishFont.tables.os2.ulUnicodeRange4 || 0x00000000,
                  ulCodePageRange1: englishFont.tables.os2.ulCodePageRange1 || 0x00000001,
                  ulCodePageRange2: englishFont.tables.os2.ulCodePageRange2 || 0x00000000,
                  sxHeight:
                    englishFont.tables.os2.sxHeight ||
                    (englishFont.ascender ? Math.round(englishFont.ascender * 0.5) : 400),
                  sCapHeight:
                    englishFont.tables.os2.sCapHeight ||
                    (englishFont.ascender ? Math.round(englishFont.ascender * 0.7) : 600),
                  usDefaultChar: englishFont.tables.os2.usDefaultChar || 0,
                  usBreakChar: englishFont.tables.os2.usBreakChar || 32,
                  usMaxContext: englishFont.tables.os2.usMaxContext || 0,
                }
              : {
                  usWeightClass: 400,
                  usWidthClass: 5,
                  fsType: 0,
                  panose: [2, 11, 6, 9, 2, 2, 4, 2, 2, 4],
                  ulUnicodeRange1: 0x00000000,
                  ulUnicodeRange2: 0x00000000,
                  ulUnicodeRange3: 0x00000000,
                  ulUnicodeRange4: 0x00000000,
                  ulCodePageRange1: 0x00000001,
                  ulCodePageRange2: 0x00000000,
                  sxHeight: englishFont.ascender ? Math.round(englishFont.ascender * 0.5) : 400,
                  sCapHeight: englishFont.ascender ? Math.round(englishFont.ascender * 0.7) : 600,
                  usDefaultChar: 0,
                  usBreakChar: 32,
                  usMaxContext: 0,
                },
          }

          console.log(`Original Korean font size: ${fontState.koreanFont.size}`)
          console.log(`Original English font size: ${fontState.englishFont.size}`)
          console.log(`Glyph count: ${glyphsArray.length}`)

          // 폰트 생성 시 lookup type 오류 대응
          try {
            // 글리프 인덱스를 올바르게 재할당
            glyphsArray.forEach((glyph, index) => {
              if (glyph && typeof glyph === "object" && "index" in glyph) {
                ;(glyph as { index: number }).index = index
              }
            })

            console.log("🏗️  폰트 객체 생성 중...")
            mergedFont = new Font(fontOptions)

            console.log("✅ 폰트 객체 생성 완료")
            console.log("📊 폰트 정보:", {
              familyName: (mergedFont as unknown as { familyName?: string }).familyName,
              glyphCount: mergedFont.glyphs?.length || 0,
              unitsPerEm: mergedFont.unitsPerEm,
              ascender: mergedFont.ascender,
              descender: mergedFont.descender,
            })

            // 폰트 생성 후 즉시 직렬화 테스트
            console.log("🧪 폰트 직렬화 테스트 중...")
            const testBuffer = mergedFont.toArrayBuffer()
            console.log(`📏 생성된 폰트 크기: ${testBuffer.byteLength} bytes`)

            if (!testBuffer || testBuffer.byteLength < 10000) {
              // 최소 크기를 10KB로 증가
              throw new Error(
                `생성된 폰트가 너무 작습니다: ${testBuffer?.byteLength || 0} bytes (최소 10KB 필요)`
              )
            }

            // 폰트 헤더 검증
            const headerView = new Uint8Array(testBuffer.slice(0, 16))
            const header = Array.from(headerView)
              .map((b) => b.toString(16).padStart(2, "0"))
              .join(" ")
            console.log("🏷️  폰트 헤더:", header)

            // TTF/OTF 시그니처 검증
            const signature = new Uint32Array(testBuffer.slice(0, 4))[0]
            console.log(`🔐 폰트 시그니처: 0x${signature.toString(16)}`)

            if (signature !== 0x00010000 && signature !== 0x4f54544f) {
              // TTF 또는 OTF
              console.warn("⚠️  비표준 폰트 시그니처 감지")
            }
          } catch (fontError) {
            // 오류가 발생하면 더욱 간단한 옵션으로 다시 시도
            if (fontError instanceof Error) {
              console.warn("폰트 생성 오류, 최소 옵션으로 재시도:", fontError.message)

              // 유효한 글리프만 필터링
              const validGlyphs = glyphsArray.filter(
                (glyph) => glyph?.path?.commands && glyph.path.commands.length > 0
              )

              // 인덱스 재할당
              validGlyphs.forEach((glyph, index) => {
                if (glyph && typeof glyph === "object" && "index" in glyph) {
                  ;(glyph as { index: number }).index = index
                }
              })

              console.log(`🔄 최소 옵션으로 재시도: ${validGlyphs.length}개 유효 글리프 사용`)

              const minimalFontOptions = {
                familyName: fontName,
                styleName: "Regular",
                unitsPerEm: englishFont.unitsPerEm || 1000,
                ascender: englishFont.ascender || 800,
                descender: englishFont.descender || -200,
                glyphs: validGlyphs,
                // 최소 cmap 테이블
                cmap: {
                  version: 0,
                  numTables: 1,
                  encodingRecords: [
                    {
                      platformID: 3,
                      encodingID: 1,
                      offset: 0,
                    },
                  ],
                },
                names: {
                  fontFamily: { en: fontName },
                  fontSubfamily: { en: "Regular" },
                  postScriptName: { en: postScriptName },
                  version: { en: "1.0" },
                },
              }
              mergedFont = new Font(minimalFontOptions)
            } else {
              throw fontError
            }
          }

          // 생성된 폰트 크기 확인
          const fontBuffer = mergedFont.toArrayBuffer()
          const finalSizeKB = (fontBuffer.byteLength / 1024).toFixed(1)
          const bytesPerGlyph = Math.round(fontBuffer.byteLength / glyphsArray.length)

          console.log(`✅ 폰트 생성 완료:`)
          console.log(`   📊 최종 크기: ${finalSizeKB} KB`)
          console.log(`   🔤 글리프 수: ${glyphsArray.length}개`)
          console.log(`   📏 글리프당 크기: ${bytesPerGlyph} bytes`)

          // 원본 폰트 대비 크기 비교
          const koreanSizeKB = parseFloat(fontState.koreanFont.size.replace(/[^0-9.]/g, ""))
          const englishSizeKB = parseFloat(fontState.englishFont.size.replace(/[^0-9.]/g, ""))
          const originalTotalKB = koreanSizeKB + englishSizeKB
          const compressionRatio = ((parseFloat(finalSizeKB) / originalTotalKB) * 100).toFixed(1)

          console.log(`   📈 원본 합계: ${originalTotalKB.toFixed(1)} KB`)
          console.log(`   📉 압축률: ${compressionRatio}%`)

          console.log(`Created font with ${glyphsArray.length} glyphs`)

          // 폰트 크기 디버깅 (기존 코드 제거하여 중복 방지)
          console.log(`Font buffer size: ${fontBuffer.byteLength} bytes`)
          console.log(`Bytes per glyph: ${fontBuffer.byteLength / glyphsArray.length}`)

          // 글리프 상세 정보
          console.log(
            "First 5 glyph details:",
            glyphsArray.slice(0, 5).map((g) => ({
              name: g?.name || "unnamed",
              unicode: g?.unicode || "no unicode",
              index: g?.index || "no index",
            }))
          )
        } catch (error) {
          console.error("Font creation failed:", error)
          throw new Error(
            `Font creation failed: ${error instanceof Error ? error.message : "Unknown error"}`
          )
        }

        console.log(`Created merged font object with ${glyphsArray.length} glyphs`)

        // 미리보기를 위해 합쳐진 폰트 등록
        try {
          // 합쳐진 폰트 등록 시도 - lookup type 오류 대응
          let arrayBuffer: ArrayBuffer
          try {
            arrayBuffer = mergedFont.toArrayBuffer()
          } catch (serializationError) {
            // lookup type 오류 시 테이블 정보 제거하고 다시 생성
            if (
              serializationError instanceof Error &&
              serializationError.message.includes("lookup type")
            ) {
              console.warn(
                "폰트 직렬화 중 lookup type 오류 발생, 단순 폰트로 재생성:",
                serializationError.message
              )

              // 고급 테이블 정보 없이 새 폰트 생성
              const safeFontName = fontName.replace(/[^a-zA-Z0-9-]/g, "")
              const fallbackPostScriptName =
                safeFontName.length > 0 ? safeFontName : "HangeulCodingFont"
              const simpleFontOptions = {
                familyName: fontName,
                styleName: "Regular",
                unitsPerEm: baseFont.unitsPerEm || 1000,
                ascender: baseFont.ascender || 800,
                descender: baseFont.descender || -200,
                lineGap: (baseFont as { lineGap?: number }).lineGap || 0,
                glyphs: glyphsArray,
                // 기본 이름 정보만 포함 (오류 방지용)
                names: {
                  fontFamily: { en: fontName },
                  fontSubfamily: { en: "Regular" },
                  fullName: { en: `${fontName} Regular` },
                  postScriptName: { en: `${fallbackPostScriptName}-Regular` },
                  version: { en: "1.0" },
                },
              }

              const Font = (
                window as unknown as { opentype: { Font: new (...args: unknown[]) => Font } }
              ).opentype.Font

              mergedFont = new Font(simpleFontOptions)
              arrayBuffer = mergedFont.toArrayBuffer()
            } else {
              throw serializationError
            }
          }

          // VSCode 호환성을 위한 폰트 등록 개선
          if (arrayBuffer && arrayBuffer.byteLength > 1000) {
            const fontBlob = new Blob([arrayBuffer], { type: "font/opentype" })
            const fontUrl = URL.createObjectURL(fontBlob)

            // VSCode 인식을 위한 안전한 폰트 이름 생성
            const safeFontName = fontName.replace(/[^a-zA-Z0-9-]/g, "")
            const registrationName = safeFontName.length > 0 ? safeFontName : "HangeulCodingFont"

            const fontFace = new FontFace(registrationName, `url(${fontUrl})`, {
              style: "normal",
              weight: "400",
              stretch: "normal",
              unicodeRange:
                "U+0020-007E, U+00A0-00FF, U+1100-11FF, U+3130-318F, U+AC00-D7AF, U+A960-A97F, U+E000-F8FF",
            })

            await fontFace.load()
            document.fonts.add(fontFace)
            console.log(
              `Merged font "${registrationName}" registered successfully for VS Code compatibility`
            )

            // 추가로 원래 이름으로도 등록 (다른 에디터 호환성)
            if (registrationName !== fontName) {
              const alternateFontFace = new FontFace(fontName, `url(${fontUrl})`, {
                style: "normal",
                weight: "400",
                stretch: "normal",
              })
              await alternateFontFace.load()
              document.fonts.add(alternateFontFace)
              console.log(`Merged font also registered with original name "${fontName}"`)
            }
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

            // VSCode 호환성을 위한 안전한 폰트 이름 생성
            const safeFontName = fontName.replace(/[^a-zA-Z0-9-]/g, "")
            const fallbackName = safeFontName.length > 0 ? safeFontName : "HangeulCodingFont"

            const koreanFontFace = new FontFace(`${fallbackName}-Korean`, `url(${koreanFontUrl})`, {
              style: "normal",
              weight: "400",
              unicodeRange: "U+AC00-D7AF, U+1100-11FF, U+3130-318F, U+A960-A97F",
            })
            const englishFontFace = new FontFace(
              `${fallbackName}-English`,
              `url(${englishFontUrl})`,
              {
                style: "normal",
                weight: "400",
                unicodeRange: "U+0020-007E, U+00A0-00FF, U+2000-206F, U+E000-F8FF",
              }
            )

            await Promise.all([koreanFontFace.load(), englishFontFace.load()])

            document.fonts.add(koreanFontFace)
            document.fonts.add(englishFontFace)

            // CSS 폰트 스택을 동적으로 생성
            const style = document.createElement("style")
            style.textContent = `
              @font-face {
                font-family: "${fallbackName}";
                src: url("${koreanFontUrl}") format("truetype");
                font-weight: 400;
                font-style: normal;
                unicode-range: U+AC00-D7AF, U+1100-11FF, U+3130-318F, U+A960-A97F;
              }
              @font-face {
                font-family: "${fallbackName}";
                src: url("${englishFontUrl}") format("truetype");
                font-weight: 400;
                font-style: normal;
                unicode-range: U+0020-007E, U+00A0-00FF, U+2000-206F, U+E000-F8FF, U+E5FA-E6AC, U+E700-E7C5, U+F000-F2E0;
              }
            `
            document.head.appendChild(style)

            console.log(`Fallback font stack created for "${fallbackName}" (VSCode compatible)`)
          } catch (fallbackErr) {
            console.warn("Fallback font registration also failed:", fallbackErr)
          }
        }

        setFontState((prev) => ({
          ...prev,
          mergedFont: mergedFont,
          isLoading: false,
          progress: 100,
        }))

        // 폰트 크기 정보 계산
        const fontBuffer = mergedFont.toArrayBuffer()
        const finalSizeKB = (fontBuffer.byteLength / 1024).toFixed(1)

        const successMessage = `폰트 합치기가 완료되었습니다! (${finalSizeKB}KB, ${glyphsArray.length}개 글리프)`

        setSuccess(successMessage)

        // 폰트 합치기 완료 시 화면을 가장 밑으로 스크롤
        setTimeout(() => {
          window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: "smooth",
          })
        }, 300) // 약간의 지연을 주어 UI 업데이트 후 스크롤
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
        return null
      }

      // 폰트 생성 과정에서 사용된 데이터를 재활용하지 않고 처음부터 다시 생성
      if (!fontState.koreanFont || !fontState.englishFont) {
        setError("원본 폰트 데이터가 없습니다. 폰트를 다시 합쳐주세요.")
        return null
      }

      try {
        console.log("🚀 다운로드용 폰트 완전 재생성 시작...")

        // 1. 원본 폰트에서 글리프 다시 수집
        const downloadGlyphs = []
        const unicodeSet = new Set()

        // .notdef 글리프 추가 (필수) - OpenType.js의 Glyph 생성자 사용
        const Glyph = (
          window as unknown as { opentype: { Glyph: new (options: unknown) => unknown } }
        ).opentype.Glyph
        const Path = (window as unknown as { opentype: { Path: new () => unknown } }).opentype.Path

        // 기본 .notdef 글리프 생성
        const notdefPath = new Path() as unknown
        const notdefGlyph = new Glyph({
          name: ".notdef",
          advanceWidth: 500,
          path: notdefPath,
          index: 0,
        }) as unknown
        downloadGlyphs.push(notdefGlyph)

        console.log("📝 한글 글리프 수집 중...")

        // 한글 기본 음절 수집 (가, 나, 다... 각 초성별로)
        const basicKoreanChars = [
          0xac00, // 가
          0xb098, // 나
          0xb2e4, // 다
          0xb77c, // 라
          0xb9c8, // 마
          0xbc14, // 바
          0xc0ac, // 사
          0xc544, // 아
          0xc790, // 자
          0xcc28, // 차
          0xcee4, // 카
          0xd0c0, // 타
          0xd30c, // 파
          0xd558, // 하
        ]

        let koreanCount = 0

        // 기본 한글 문자들 수집
        for (const unicode of basicKoreanChars) {
          const glyphIndex = fontState.koreanFont.font.charToGlyphIndex(
            String.fromCharCode(unicode)
          )
          console.log(
            `한글 테스트: ${String.fromCharCode(unicode)} (U+${unicode.toString(16)}) -> 글리프 인덱스: ${glyphIndex}`
          )

          if (glyphIndex > 0 && !unicodeSet.has(unicode)) {
            const originalGlyph = fontState.koreanFont.font.glyphs.get(glyphIndex)
            console.log(`원본 글리프:`, {
              name: originalGlyph?.name,
              advanceWidth: originalGlyph?.advanceWidth,
              pathCommands: originalGlyph?.path?.commands?.length || 0,
            })

            if (originalGlyph?.path?.commands?.length > 0) {
              try {
                const newGlyph = new Glyph({
                  name:
                    originalGlyph.name ||
                    `uni${unicode.toString(16).toUpperCase().padStart(4, "0")}`,
                  unicode: unicode,
                  advanceWidth: originalGlyph.advanceWidth || 1000,
                  path: originalGlyph.path,
                  index: downloadGlyphs.length,
                }) as unknown
                downloadGlyphs.push(newGlyph)
                unicodeSet.add(unicode)
                koreanCount++
                console.log(`✅ 한글 글리프 추가: ${String.fromCharCode(unicode)}`)
              } catch (glyphError) {
                console.warn(
                  `❌ 한글 글리프 생성 실패 (${String.fromCharCode(unicode)}):`,
                  glyphError
                )
              }
            } else {
              console.warn(`⚠️  한글 글리프 경로 없음: ${String.fromCharCode(unicode)}`)
            }
          }
        }

        // 추가 한글 수집 (더 많은 문자)
        for (let unicode = 0xac00; unicode <= 0xac0f && koreanCount < 100; unicode++) {
          if (!unicodeSet.has(unicode)) {
            const glyphIndex = fontState.koreanFont.font.charToGlyphIndex(
              String.fromCharCode(unicode)
            )
            if (glyphIndex > 0) {
              const originalGlyph = fontState.koreanFont.font.glyphs.get(glyphIndex)
              if (originalGlyph?.path?.commands?.length > 0) {
                try {
                  const newGlyph = new Glyph({
                    name:
                      originalGlyph.name ||
                      `uni${unicode.toString(16).toUpperCase().padStart(4, "0")}`,
                    unicode: unicode,
                    advanceWidth: originalGlyph.advanceWidth || 1000,
                    path: originalGlyph.path,
                    index: downloadGlyphs.length,
                  }) as unknown
                  downloadGlyphs.push(newGlyph)
                  unicodeSet.add(unicode)
                  koreanCount++
                } catch (glyphError) {
                  console.warn(`한글 글리프 생성 실패 (U+${unicode.toString(16)}):`, glyphError)
                }
              }
            }
          }
        }

        console.log("📝 영문 글리프 수집 중...")
        // 영문 글리프 수집 (기본 ASCII)
        let englishCount = 0

        // 기본 영문 문자 테스트
        const testChars = ["A", "a", "0", " ", "!"]
        for (const char of testChars) {
          const unicode = char.charCodeAt(0)
          const glyphIndex = fontState.englishFont.font.charToGlyphIndex(char)
          console.log(
            `영문 테스트: ${char} (U+${unicode.toString(16)}) -> 글리프 인덱스: ${glyphIndex}`
          )

          if (glyphIndex > 0) {
            const originalGlyph = fontState.englishFont.font.glyphs.get(glyphIndex)
            console.log(`원본 글리프:`, {
              name: originalGlyph?.name,
              advanceWidth: originalGlyph?.advanceWidth,
              pathCommands: originalGlyph?.path?.commands?.length || 0,
            })
          }
        }

        for (let unicode = 0x0020; unicode <= 0x007e; unicode++) {
          if (!unicodeSet.has(unicode)) {
            const glyphIndex = fontState.englishFont.font.charToGlyphIndex(
              String.fromCharCode(unicode)
            )
            if (glyphIndex > 0) {
              const originalGlyph = fontState.englishFont.font.glyphs.get(glyphIndex)
              if (originalGlyph?.path?.commands?.length > 0) {
                try {
                  const newGlyph = new Glyph({
                    name:
                      originalGlyph.name ||
                      `uni${unicode.toString(16).toUpperCase().padStart(4, "0")}`,
                    unicode: unicode,
                    advanceWidth: originalGlyph.advanceWidth || 500,
                    path: originalGlyph.path,
                    index: downloadGlyphs.length,
                  }) as unknown
                  downloadGlyphs.push(newGlyph)
                  unicodeSet.add(unicode)
                  englishCount++
                } catch (glyphError) {
                  console.warn(`영문 글리프 생성 실패 (U+${unicode.toString(16)}):`, glyphError)
                }
              }
            }
          }
        }

        console.log(
          `✅ 총 ${downloadGlyphs.length}개 글리프 수집 완료 (한글: ${koreanCount}개, 영문: ${englishCount}개)`
        )

        if (downloadGlyphs.length < 10) {
          throw new Error(`수집된 글리프가 너무 적습니다: ${downloadGlyphs.length}개`)
        }

        // 2. 기존 영문 폰트를 베이스로 한글 글리프 추가하는 방식
        console.log("🏗️  영문 폰트 베이스로 한글 글리프 추가 방식 시도...")

        const englishFont = fontState.englishFont.font
        const safeFontName = fontName.replace(/[^a-zA-Z0-9-]/g, "")

        // 영문 폰트를 복사
        let downloadFont: Font

        try {
          // 방법 1: 영문 폰트 복사 후 한글 글리프 추가
          console.log("📋 영문 폰트 복사 중...")

          // 영문 폰트의 모든 글리프 수집
          const allGlyphs = []

          // 영문 폰트의 기존 글리프들을 모두 복사 (OpenType.js 객체 그대로 사용)
          for (let i = 0; i < englishFont.glyphs.length; i++) {
            const glyph = englishFont.glyphs.get(i)
            if (glyph) {
              // 인덱스 재할당
              if (typeof glyph === "object" && "index" in glyph) {
                ;(glyph as { index: number }).index = allGlyphs.length
              }
              allGlyphs.push(glyph)
            }
          }

          console.log(`📊 영문 폰트 글리프: ${allGlyphs.length}개`)

          // 한글 글리프 추가
          let addedKoreanCount = 0
          for (const unicode of basicKoreanChars) {
            const glyphIndex = fontState.koreanFont.font.charToGlyphIndex(
              String.fromCharCode(unicode)
            )
            if (glyphIndex > 0) {
              const koreanGlyph = fontState.koreanFont.font.glyphs.get(glyphIndex)
              if (
                koreanGlyph &&
                (koreanGlyph.path?.commands?.length > 0 || (koreanGlyph.advanceWidth ?? 0) > 0)
              ) {
                // OpenType.js Glyph 생성자를 사용한 올바른 글리프 객체 생성
                try {
                  const Glyph = (
                    window as unknown as { opentype: { Glyph: new (options: unknown) => unknown } }
                  ).opentype.Glyph

                  const clonedGlyph = new Glyph({
                    name:
                      koreanGlyph.name ||
                      `uni${unicode.toString(16).toUpperCase().padStart(4, "0")}`,
                    unicode: unicode,
                    advanceWidth: koreanGlyph.advanceWidth || 1000,
                    leftSideBearing: koreanGlyph.leftSideBearing || 0,
                    path: koreanGlyph.path,
                    index: allGlyphs.length,
                  }) as unknown

                  allGlyphs.push(clonedGlyph)
                  addedKoreanCount++
                } catch (glyphError) {
                  console.warn(
                    `한글 글리프 생성 실패 (${String.fromCharCode(unicode)}):`,
                    glyphError
                  )
                }
              }
            }
          }

          console.log(`📊 추가된 한글 글리프: ${addedKoreanCount}개`)
          console.log(`📊 총 글리프 수: ${allGlyphs.length}개`)

          // 영문 폰트의 메타데이터를 유지하면서 새 폰트 생성
          const Font = (window as unknown as { opentype: { Font: new (options: unknown) => Font } })
            .opentype.Font

          const fontOptions = {
            familyName: fontName,
            styleName: englishFont.names?.fontSubfamily?.en || "Regular",
            unitsPerEm: englishFont.unitsPerEm || 1000,
            ascender: englishFont.ascender || 800,
            descender: englishFont.descender || -200,
            glyphs: allGlyphs,
            names: {
              fontFamily: { en: fontName },
              fontSubfamily: { en: englishFont.names?.fontSubfamily?.en || "Regular" },
              postScriptName: { en: `${safeFontName}-Regular` },
              version: { en: "1.0" },
            },
          }

          console.log("🏗️  확장된 폰트 생성 중...")
          downloadFont = new Font(fontOptions)
        } catch (copyError) {
          console.error("❌ 폰트 복사 방식 실패:", copyError)

          // 폴백: 기본 방식으로 재시도
          console.log("🔄 기본 방식으로 폴백...")
          const Font = (window as unknown as { opentype: { Font: new (options: unknown) => Font } })
            .opentype.Font

          const minimalOptions = {
            familyName: fontName,
            styleName: "Regular",
            unitsPerEm: 1000,
            ascender: 800,
            descender: -200,
            glyphs: downloadGlyphs,
          }

          downloadFont = new Font(minimalOptions)
        }

        console.log("🔄 폰트 직렬화 중...")
        const arrayBuffer = downloadFont.toArrayBuffer()

        if (!arrayBuffer || arrayBuffer.byteLength < 10000) {
          throw new Error(`폰트 크기가 너무 작습니다: ${arrayBuffer?.byteLength || 0} bytes`)
        }

        console.log(`✅ 다운로드용 폰트 생성 성공: ${arrayBuffer.byteLength} bytes`)

        // 폰트 헤더 검증
        const headerView = new Uint8Array(arrayBuffer.slice(0, 16))
        const headerHex = Array.from(headerView)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(" ")
        console.log("🏷️  폰트 헤더:", headerHex)

        // 생성된 폰트에서 한글 글리프 확인
        console.log("🔍 생성된 폰트의 한글 글리프 확인...")
        const testFont = downloadFont as unknown as { charToGlyphIndex: (char: string) => number }

        for (const unicode of basicKoreanChars.slice(0, 5)) {
          const char = String.fromCharCode(unicode)
          const glyphIndex = testFont.charToGlyphIndex(char)
          console.log(
            `생성된 폰트에서 ${char} (U+${unicode.toString(16)}) -> 글리프 인덱스: ${glyphIndex}`
          )
        }

        // 예상 폰트 크기 계산
        const expectedSize = downloadGlyphs.length * 500 + 20000 // 글리프당 대략 500바이트 + 헤더
        console.log(
          `📊 크기 분석: 실제 ${arrayBuffer.byteLength}bytes vs 예상 ${expectedSize}bytes`
        )
        console.log(`📊 압축률: ${((arrayBuffer.byteLength / expectedSize) * 100).toFixed(1)}%`)

        const downloadData = new Uint8Array(arrayBuffer)
        const blob = new Blob([downloadData], { type: "font/ttf" })
        const url = URL.createObjectURL(blob)

        // VSCode 호환성을 위한 안전한 파일명 생성
        const downloadFileName = safeFontName.length > 0 ? safeFontName : "HangeulCodingFont"
        const postScriptFamilyName = `${downloadFileName}-Regular`

        const link = document.createElement("a")
        link.href = url
        link.download = `${downloadFileName}.ttf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        // 다운로드 완료 toast 메시지 (크기 정보 포함)
        const sizeKB = (downloadData.length / 1024).toFixed(1)
        setSuccess(`폰트 다운로드가 완료되었습니다! (${downloadFileName}.ttf, ${sizeKB}KB)`)

        console.log("📁 다운로드 완료:", {
          fileName: `${downloadFileName}.ttf`,
          size: `${sizeKB}KB`,
          glyphCount: downloadGlyphs.length,
        })

        // VSCode 사용 안내 정보 반환
        return {
          downloadFileName,
          originalFontName: fontName,
          postScriptFamilyName,
          fileSize: downloadData.length,
        }
      } catch (error) {
        console.error("❌ 다운로드 실패:", error)
        setError(`다운로드 실패: ${error instanceof Error ? error.message : "Unknown error"}`)
        return null
      }
    },
    [fontState.mergedFont, fontState.koreanFont, fontState.englishFont, setError, setSuccess]
  )

  return {
    fontState,
    loadFont,
    mergefonts,
    downloadFont,
    clearError,
  }
}
