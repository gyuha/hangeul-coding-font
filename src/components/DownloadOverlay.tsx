import React from "react"

interface DownloadOverlayProps {
  isVisible: boolean
  message?: string
}

const DownloadOverlay: React.FC<DownloadOverlayProps> = ({ isVisible, message = "다운로드 폰트 준비 중..." }) => {
  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-2xl max-w-xs w-full mx-4 flex flex-col items-center">
        {/* GIF 스피너 */}
        <img src="/assets/spinner.gif" alt="로딩 중" className="h-12 w-12 mb-6" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 text-center">{message}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">폰트 파일을 준비하고 있습니다. 잠시만 기다려주세요.</p>
      </div>
    </div>
  )
}

export default DownloadOverlay 