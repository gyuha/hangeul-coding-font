import { Loader2 } from "lucide-react"
import type React from "react"
import { Progress } from "./ui/progress"

interface LoadingOverlayProps {
  isVisible: boolean
  progress: number
  message?: string
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  progress,
  message = "작업 중...",
}) => {
  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-2xl max-w-md w-full mx-4">
        <div className="text-center">
          {/* 애니메이션 아이콘 */}
          <div className="mb-6">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-500" />
          </div>

          {/* 메시지 */}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{message}</h3>

          {/* 진행률 */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>진행률</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>

          {/* 상세 진행 상황 */}
          <p className="text-sm text-gray-500 dark:text-gray-400">
            폰트를 합치는 중입니다. 잠시만 기다려주세요.
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoadingOverlay
