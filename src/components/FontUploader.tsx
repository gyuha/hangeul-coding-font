import { FileText, Upload } from "lucide-react"
import type React from "react"
import { useCallback } from "react"
import { cn } from "../lib/utils"
import type { FontInfo } from "../types/font"
import { Button } from "./ui/button"
import loremIpsumKR from "lorem-ipsum-kr"

const ko = loremIpsumKR({
    count: 3,
    units: "sentences", 
  })

const sampleTexts = {
  ko  ,
  en: `abcdefghijklmnopqrstuvwxyz
ABCDEFGHIJKLMNOPQRSTUVWXYZ
o008 iIlL1 {} [] g9qCGQ ~-+=>`,
}

interface FontUploaderProps {
  title: string
  description: string
  fontInfo: FontInfo | null
  onFontUpload: (file: File) => void
  acceptedTypes?: string
}

const FontUploader: React.FC<FontUploaderProps> = ({
  title,
  fontInfo,
  onFontUpload,
  acceptedTypes = ".ttf,.otf,.woff,.woff2",
}) => {
  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        onFontUpload(file)
      }
    },
    [onFontUpload]
  )

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      const file = event.dataTransfer.files[0]
      if (file) {
        onFontUpload(file)
      }
    },
    [onFontUpload]
  )

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }, [])

  return (
    <div className="w-full">
      {!fontInfo ? (
        <div
          className={cn(
            "p-6 text-center rounded-lg border-2 border-gray-300 border-dashed transition-colors cursor-pointer hover:border-gray-400 hover:bg-gray-50",
            "dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-800"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => document.getElementById(`file-input-${title}`)?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              document.getElementById(`file-input-${title}`)?.click()
            }
          }}
        >
          <Upload className="mx-auto mb-3 w-8 h-8 text-gray-400" />
          <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">
            TTF, OTF, WOFF, WOFF2 파일 선택
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">클릭하거나 드래그해서 업로드</p>
          <input
            id={`file-input-${title}`}
            type="file"
            accept={acceptedTypes}
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      ) : (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center mb-3 space-x-3">
            <FileText className="w-6 h-6 text-blue-500" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{fontInfo.file.name}</p>
              <p className="text-xs text-gray-500">{fontInfo.size}</p>
            </div>
          </div>

          <div className="p-3 mb-3 bg-white rounded-md border dark:bg-gray-900">
            <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">미리보기</p>
            <div className="text-sm" style={{ fontFamily: fontInfo.name }}>
              {title.includes("Korean") ? sampleTexts.ko : sampleTexts.en}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById(`file-input-${title}`)?.click()}
            className="w-full text-xs"
          >
            다른 파일 선택
          </Button>
          <input
            id={`file-input-${title}`}
            type="file"
            accept={acceptedTypes}
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}
    </div>
  )
}

export default FontUploader
