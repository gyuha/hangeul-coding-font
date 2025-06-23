import type React from "react"

interface DownloadOverlayProps {
  isVisible: boolean
  message?: string
}

const DownloadOverlay: React.FC<DownloadOverlayProps> = ({
  isVisible,
  message = "다운로드 폰트 준비 중...",
}) => {
  if (!isVisible) return null

  return (
    <div className="flex fixed inset-0 z-50 justify-center items-center backdrop-blur-sm bg-black/50">
      <div className="flex flex-col items-center p-8 mx-4 w-full max-w-xs bg-white rounded-lg shadow-2xl dark:bg-gray-800">
        {/* GIF 스피너 */}
        <img
          src={`${import.meta.env.BASE_URL}assets/spinner.gif`}
          alt="로딩 중"
          className="mb-6 w-12 h-12"
        />
        <h3 className="mb-2 text-lg font-semibold text-center text-gray-900 dark:text-white">
          {message}
        </h3>
        <p className="text-sm text-center text-gray-500 dark:text-gray-400">
          폰트 파일을 준비하고 있습니다. 잠시만 기다려주세요.
        </p>
      </div>
    </div>
  )
}

export default DownloadOverlay
