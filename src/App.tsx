import { Download, Loader2, Merge } from "lucide-react"
import { useEffect, useState } from "react"
import DownloadOverlay from "./components/DownloadOverlay"
import ErrorDialog from "./components/ErrorDialog"
import FontPreview from "./components/FontPreview"
import FontUploader from "./components/FontUploader"
import GitHubCorner from "./components/GitHubCorner"
import LoadingOverlay from "./components/LoadingOverlay"
import MergeOptions from "./components/MergeOptions"
import { Alert, AlertDescription } from "./components/ui/alert"
import { Button } from "./components/ui/button"
import { useFontMerger } from "./hooks/useFontMerger"
import type { MergeOptions as MergeOptionsType } from "./types/font"

function App() {
  const { fontState, loadFont, mergefonts, downloadFont, clearError } = useFontMerger()

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

  const canMerge = fontState.koreanFont && fontState.englishFont && !fontState.isLoading
  const canDownload = fontState.mergedFont && !fontState.isLoading

  useEffect(() => {
    if (fontState.englishFont && !isFontNameEdited) {
      setFontName(fontState.englishFont.name)
    }
  }, [fontState.englishFont, isFontNameEdited])

  const handleFontNameChange = (name: string) => {
    setFontName(name)
    setIsFontNameEdited(true)
  }

  const handleMerge = () => {
    mergefonts(mergeOptions, fontName)
    setMergedFontName(fontName) // 합치기 완료 후 미리보기용 폰트 이름 설정
  }

  const downloadFontAsync = (fontName: string) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        downloadFont(fontName)
        resolve()
      }, 100)
    })
  }

  const handleDownload = async () => {
    setIsDownloading(true)
    await downloadFontAsync(fontName)
    setTimeout(() => setIsDownloading(false), 800)
  }

  return (
    <>
      <GitHubCorner url="https://github.com/gyuha/hangeul-coding-font" />
      {isDownloading && <DownloadOverlay isVisible={isDownloading} />}
      <LoadingOverlay
        isVisible={fontState.isLoading && !isDownloading}
        progress={fontState.progress}
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

          {/* Error Dialog */}
          <ErrorDialog
            isOpen={!!fontState.error}
            onClose={clearError}
            message={fontState.error || ""}
          />

          {fontState.success && (
            <Alert className="mb-6 text-green-800 bg-green-50 border-green-200">
              <AlertDescription>{fontState.success}</AlertDescription>
            </Alert>
          )}

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
                    fontInfo={fontState.englishFont}
                    onFontUpload={(file) => loadFont(file, "english")}
                  />
                </div>
                <div className="min-w-[320px] bg-gray-50 dark:bg-gray-700 rounded-lg p-6 shadow">
                  <h3 className="mb-3 text-lg font-medium text-gray-900 dark:text-white">
                    한글 폰트
                  </h3>
                  <FontUploader
                    title="Korean Font"
                    description="한글 문자를 포함한 폰트 파일을 업로드하세요"
                    fontInfo={fontState.koreanFont}
                    onFontUpload={(file) => loadFont(file, "korean")}
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
                  showFontNameWarning={!!fontState.mergedFont && fontName !== mergedFontName}
                />

                {/* Action Buttons */}
                <div className="flex justify-center mt-6">
                  <Button
                    onClick={handleMerge}
                    disabled={!canMerge}
                    size="lg"
                    className="min-w-[200px] h-12 text-lg"
                  >
                    {fontState.isLoading ? (
                      <>
                        <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                        합치는 중...
                      </>
                    ) : (
                      <>
                        <Merge className="mr-2 w-5 h-5" />
                        폰트 합치기
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Preview Section */}
          {fontState.mergedFont && (
            <div className="mb-6 bg-white rounded-lg border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700">
              <div className="p-6">
                <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                  3. 미리보기
                </h2>
                <FontPreview
                  fontName={mergedFontName}
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
