import { Download, Loader2, Merge } from "lucide-react"
import { useEffect, useState } from "react"
import { Toaster } from "sonner"
import DownloadOverlay from "./components/DownloadOverlay"
import FontPreview from "./components/FontPreview"
import FontUploader from "./components/FontUploader"
import GitHubCorner from "./components/GitHubCorner"
import LoadingOverlay from "./components/LoadingOverlay"
import MergeOptions from "./components/MergeOptions"
import { Button } from "./components/ui/button"
import VSCodeGuide from "./components/VSCodeGuide"
import { useFontMerger } from "./hooks/useFontMerger"
import type { MergeOptions as MergeOptionsType } from "./types/font"

function App() {
  const {
    koreanFont,
    englishFont,
    koreanFontInfo,
    englishFontInfo,
    englishFontName,
    mergedFont,
    previewFontFamily,
    isProcessing,
    progress,
    handleKoreanFontUpload,
    handleEnglishFontUpload,
    mergeFonts,
    downloadFont,
  } = useFontMerger()

  const [mergeOptions, setMergeOptions] = useState<MergeOptionsType>({
    koreanHangul: true,
    koreanSymbols: true,
    koreanNumbers: false,
    englishLetters: true,
    englishNumbers: true,
    englishSymbols: true,
    englishSpecial: true,
    englishLigatures: true,
    englishIcons: true,
  })

  const [fontName, setFontName] = useState("")
  const [mergedFontName, setMergedFontName] = useState("")
  const [isFontNameEdited, setIsFontNameEdited] = useState(false)
  const [previewText, setPreviewText] = useState("")
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadInfo, setDownloadInfo] = useState<{
    downloadFileName: string
    originalFontName: string
    postScriptFamilyName: string
  } | null>(null)

  const canMerge = koreanFont && englishFont && !isProcessing
  const canDownload = mergedFont && !isProcessing

  useEffect(() => {
    if (englishFontName && !isFontNameEdited) {
      setFontName(englishFontName.replace(/\.[^/.]+$/, ""))
    }
  }, [englishFontName, isFontNameEdited])

  const handleFontNameChange = (name: string) => {
    setFontName(name)
    setIsFontNameEdited(true)
  }

  const handleMerge = async () => {
    try {
      await mergeFonts(mergeOptions, fontName)
      setMergedFontName(fontName) // 합치기 완료 후 미리보기용 폰트 이름 설정
    } catch (error) {
      console.error("Merge failed:", error)
    }
  }

  const handleDownload = async () => {
    setIsDownloading(true)

    // UI 업데이트를 위해 잠시 대기
    await new Promise((resolve) => setTimeout(resolve, 100))

    try {
      // 다운로드 처리를 비동기로 실행
      await downloadFont(fontName)
      setDownloadInfo({
        downloadFileName: fontName.replace(/[^a-zA-Z0-9-]/g, "") || "HangeulCodingFont",
        originalFontName: fontName,
        postScriptFamilyName: `${fontName.replace(/[^a-zA-Z0-9-]/g, "")}-Regular`,
      })
    } catch (error) {
      console.error("Download failed:", error)
    } finally {
      // 다운로드 완료 후 스피너 숨기기
      setTimeout(() => setIsDownloading(false), 800)
    }
  }

  return (
    <>
      <Toaster position="top-center" />
      <GitHubCorner url="https://github.com/gyuha/hangeul-coding-font" />
      {isDownloading && <DownloadOverlay isVisible={isDownloading} />}
      <LoadingOverlay
        isVisible={isProcessing && !isDownloading}
        progress={progress}
        message="폰트 합치는 중..."
      />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container px-4 py-8 mx-auto max-w-5xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
              한글 코딩 폰트 합치기
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              한글 폰트와 영문 폰트를 합쳐서 완벽한 코딩 폰트를 만들어보세요
            </p>
          </div>


          {/* Font Upload Section - Split Layout */}
          <div className="mb-6 bg-white rounded-lg border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700">
            <div className="p-6">
              <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                1. 폰트 파일 업로드
              </h2>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="min-w-[320px] bg-gray-50 dark:bg-gray-700 rounded-lg p-6 shadow">
                  <h3 className="mb-3 text-lg font-medium text-gray-900 dark:text-white">
                    영문 폰트
                  </h3>
                  <FontUploader
                    title="English Font"
                    description="영문 문자를 포함한 폰트 파일을 업로드하세요"
                    fontInfo={englishFontInfo}
                    onFontUpload={handleEnglishFontUpload}
                  />
                </div>
                <div className="min-w-[320px] bg-gray-50 dark:bg-gray-700 rounded-lg p-6 shadow">
                  <h3 className="mb-3 text-lg font-medium text-gray-900 dark:text-white">
                    한글 폰트
                  </h3>
                  <FontUploader
                    title="Korean Font"
                    description="한글 문자를 포함한 폰트 파일을 업로드하세요"
                    fontInfo={koreanFontInfo}
                    onFontUpload={handleKoreanFontUpload}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Merge Options and Actions Section */}
          {canMerge && (
            <div className="mb-6 bg-white rounded-lg border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700">
              <div className="p-6">
                <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                  2. 합치기 설정
                </h2>
                <MergeOptions
                  options={mergeOptions}
                  onOptionsChange={setMergeOptions}
                  fontName={fontName}
                  onFontNameChange={handleFontNameChange}
                  showFontNameWarning={!!mergedFont && fontName !== mergedFontName}
                />

                {/* Action Buttons */}
                <div className="flex justify-center mt-6">
                  <Button
                    onClick={handleMerge}
                    disabled={!canMerge}
                    size="lg"
                    className="min-w-[200px] h-12 text-lg"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                        합치는 중...
                      </>
                    ) : (
                      <>
                        <Merge className="mr-2 w-5 h-5 rotate-180" />
                        폰트 합치기
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Preview Section */}
          {mergedFont && (
            <div className="mb-6 bg-white rounded-lg border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700">
              <div className="p-6">
                <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                  3. 미리보기
                </h2>
                <FontPreview
                  fontName={previewFontFamily || mergedFontName}
                  previewText={previewText}
                  onPreviewTextChange={setPreviewText}
                />

                {/* Download Button */}
                <div className="flex justify-center mt-6">
                  <Button
                    onClick={handleDownload}
                    disabled={!canDownload}
                    size="lg"
                    className="min-w-[200px] h-12 text-lg"
                  >
                    <Download className="mr-2 w-5 h-5" />
                    다운로드
                  </Button>
                </div>

                {/* VSCode Guide - 다운로드 버튼 밑에 표시 */}
                {downloadInfo && (
                  <VSCodeGuide
                    downloadFileName={downloadInfo.downloadFileName}
                    originalFontName={downloadInfo.originalFontName}
                    postScriptFamilyName={downloadInfo.postScriptFamilyName}
                  />
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-sm text-center text-gray-500 dark:text-gray-400">
            <p>지원하는 폰트 형식: TTF, OTF, WOFF, WOFF2</p>
            <p className="mt-1">합쳐진 폰트는 TTF 형식으로 다운로드됩니다.</p>
          </div>
        </div>
      </div>
    </>
  )
}

export default App
