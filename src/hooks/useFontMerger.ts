import { saveAs } from "file-saver"
import * as opentype from "opentype.js"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import type { MergeOptions } from "../types/font"

export const useFontMerger = () => {
  const [koreanFont, setKoreanFont] = useState<opentype.Font | null>(null)
  const [englishFont, setEnglishFont] = useState<opentype.Font | null>(null)
  const [koreanFontFile, setKoreanFontFile] = useState<File | null>(null)
  const [englishFontFile, setEnglishFontFile] = useState<File | null>(null)
  const [koreanFontName, setKoreanFontName] = useState("")
  const [englishFontName, setEnglishFontName] = useState("")
  const [koreanFontUrl, setKoreanFontUrl] = useState<string>("")
  const [englishFontUrl, setEnglishFontUrl] = useState<string>("")
  const [koreanPreviewFontFamily, setKoreanPreviewFontFamily] = useState<string>("")
  const [englishPreviewFontFamily, setEnglishPreviewFontFamily] = useState<string>("")
  const [mergedFont, setMergedFont] = useState<opentype.Font | null>(null)
  const [fontUrl, setFontUrl] = useState<string>("")
  const [previewFontFamily, setPreviewFontFamily] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)

  // 폰트 URL이 변경될 때마다 CSS font-face 규칙을 동적으로 추가
  useEffect(() => {
    if (fontUrl && mergedFont) {
      const fontFamilyName = "MergedFont"
      setPreviewFontFamily(fontFamilyName)

      console.log(`🎨 Setting up merged font preview: ${fontFamilyName}`)
      console.log(`📎 Font URL: ${fontUrl.substring(0, 50)}...`)

      const style = document.createElement("style")
      style.textContent = `
        @font-face {
          font-family: '${fontFamilyName}';
          src: url('${fontUrl}') format('truetype');
          font-display: swap;
        }
      `
      document.head.appendChild(style)
      console.log(`📝 Style tag added to document head for: ${fontFamilyName}`)

      // 폰트 로딩 확인 - 더 자세한 로깅
      setTimeout(() => {
        document.fonts.load(`16px "${fontFamilyName}"`).then(() => {
          console.log(`✅ Merged font loaded successfully: ${fontFamilyName}`)
          
          // 실제로 사용 가능한지 테스트
          const testDiv = document.createElement('div')
          testDiv.style.fontFamily = `"${fontFamilyName}", monospace`
          testDiv.style.position = 'absolute'
          testDiv.style.visibility = 'hidden'
          testDiv.textContent = 'Test 안녕하세요'
          document.body.appendChild(testDiv)
          
          setTimeout(() => {
            const computedStyle = window.getComputedStyle(testDiv)
            console.log(`🔍 Computed font-family: ${computedStyle.fontFamily}`)
            document.body.removeChild(testDiv)
          }, 100)
          
        }).catch((error) => {
          console.error(`❌ Failed to load merged font: ${fontFamilyName}`, error)
        })
      }, 100)

      // 이전 스타일 태그 정리
      return () => {
        if (document.head.contains(style)) {
          document.head.removeChild(style)
          console.log(`🗑️ Cleaned up style tag for: ${fontFamilyName}`)
        }
      }
    }
  }, [fontUrl, mergedFont])

  // 한글 폰트 미리보기 URL 생성
  useEffect(() => {
    if (koreanFontUrl) {
      const fontFamilyName = `KoreanPreviewFont_${Date.now()}`
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
  }, [koreanFontUrl])

  // 영문 폰트 미리보기 URL 생성
  useEffect(() => {
    if (englishFontUrl) {
      const fontFamilyName = `EnglishPreviewFont_${Date.now()}`
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
  }, [englishFontUrl])

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
      const font = opentype.parse(arrayBuffer)
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

  // 유니코드 범위에서 문자 추출 - useFontSubset과 동일한 패턴으로 기존 글리프 직접 사용
  const extractGlyphsFromRange = useCallback(
    (sourceFont: opentype.Font, start: number, end: number, rangeDescription = "") => {
      const glyphs = []
      let addedCount = 0

      for (let i = start; i <= end; i++) {
        const char = String.fromCharCode(i)
        const glyph = sourceFont.charToGlyph(char)

        if (glyph && glyph.index !== 0) {
          // useFontSubset 방식: 기존 글리프를 직접 사용
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
      console.log("🚀 Starting font merge process with simpler approach...")

      // 더 간단한 접근: 영문폰트를 기본으로 하고 한글 글리프만 추가
      const baseFont = englishFont
      const selectedText = buildSelectedText(options)
      
      console.log(`📝 Selected characters: ${selectedText.substring(0, 50)}...`)
      
      const uniqueChars = Array.from(new Set(selectedText.split("")))
      console.log(`🔤 Unique characters count: ${uniqueChars.length}`)
      
      // useFontSubset과 완전히 동일한 방식
      const glyphs = [baseFont.glyphs.get(0)] // .notdef glyph
      
      setProgress(50)
      
      // 각 문자에 대해 적절한 폰트에서 글리프 찾기
      uniqueChars.forEach((char) => {
        const charCode = char.charCodeAt(0)
        let glyph = null
        
        // 한글 범위는 한글폰트에서, 나머지는 영문폰트에서
        if (charCode >= 0x1100 && charCode <= 0xd7af) {
          // 한글 범위
          glyph = koreanFont.charToGlyph(char)
        } else {
          // 영문/기호 범위
          glyph = englishFont.charToGlyph(char)
        }
        
        if (glyph && glyph.index !== 0) {
          glyphs.push(glyph)
        }
      })

      setProgress(100)

      // useFontSubset과 완전히 동일한 폰트 생성 방식
      const safeFontName = "MergedFont"
      
      console.log(`🔧 Creating font with ${glyphs.length} glyphs (useFontSubset style)`)
      
      const mergedFont = new opentype.Font({
        familyName: safeFontName,
        styleName: baseFont.names?.fontSubfamily?.en || "Regular",
        unitsPerEm: baseFont.unitsPerEm,
        ascender: baseFont.ascender,
        descender: baseFont.descender,
        glyphs: glyphs,
      })
      
      console.log(`✅ Font created successfully: ${safeFontName}`)

      setMergedFont(mergedFont)

      // 폰트 URL 생성
      const fontBuffer = mergedFont.toArrayBuffer()
      const blob = new Blob([fontBuffer], { type: "font/truetype" })
      const url = URL.createObjectURL(blob)
      setFontUrl(url)
      
      const finalSizeKB = (fontBuffer.byteLength / 1024).toFixed(1)
      toast.success(`폰트 합치기가 완료되었습니다! (${finalSizeKB}KB, ${glyphs.length}개 글리프)`)
      
      console.log(`📦 Font buffer: ${fontBuffer.byteLength} bytes`)
      console.log(`🔗 Font URL: ${url.substring(0, 50)}...`)
      
    } catch (error) {
      setProgress(0)
      throw new Error(
        `폰트 합치기 실패: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    } finally {
      setIsProcessing(false)
    }
  }

  // 선택된 옵션에 따라 텍스트 생성
  const buildSelectedText = (options: MergeOptions): string => {
    let text = ""
    
    if (options.koreanHangul) {
      // 기본 한글 문자들
      text += "가나다라마바사아자차카타파하"
      text += "안녕하세요"
    }
    
    if (options.englishLetters) {
      text += "abcdefghijklmnopqrstuvwxyz"
      text += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    }
    
    if (options.englishNumbers) {
      text += "0123456789"
    }
    
    if (options.englishSymbols) {
      text += "!@#$%^&*()_+-=[]{}|;':\",./<>?"
    }
    
    return text
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
    setKoreanPreviewFontFamily("")
    setEnglishPreviewFontFamily("")
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
