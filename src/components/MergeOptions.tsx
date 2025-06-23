import type React from "react"
import { useId } from "react"
import type { MergeOptions as MergeOptionsType } from "../types/font"
import { Checkbox } from "./ui/checkbox"
import { Input } from "./ui/input"
import { Label } from "./ui/label"

interface MergeOptionsProps {
  options: MergeOptionsType
  onOptionsChange: (options: MergeOptionsType) => void
  fontName: string
  onFontNameChange: (name: string) => void
  showFontNameWarning: boolean
}

const MergeOptions: React.FC<MergeOptionsProps> = ({
  options,
  onOptionsChange,
  fontName,
  onFontNameChange,
  showFontNameWarning,
}) => {
  const fontNameId = useId()

  const handleOptionChange = (key: keyof MergeOptionsType, checked: boolean) => {
    onOptionsChange({
      ...options,
      [key]: checked,
    })
  }

  const koreanOptions = [
    { key: "koreanHangul" as const, label: "한글 (가-힣)", description: "한글 완성형 문자" },
    { key: "koreanSymbols" as const, label: "한글 기호", description: "한글 자모, 호환 자모" },
    { key: "koreanNumbers" as const, label: "한글 숫자", description: "한글 숫자 관련 문자" },
  ]

  const englishOptions = [
    { key: "englishLetters" as const, label: "영문 (A-Z, a-z)", description: "영문 대소문자" },
    { key: "englishNumbers" as const, label: "영문 숫자 (0-9)", description: "아라비아 숫자" },
    { key: "englishSymbols" as const, label: "영문 기호", description: "기본 ASCII 기호" },
    { key: "englishSpecial" as const, label: "특수문자", description: "확장 ASCII, 유니코드 기호" },
    {
      key: "englishLigatures" as const,
      label: "합자 (Ligatures)",
      description: "코딩용 합자 (=>, !=, == 등)",
    },
    {
      key: "englishIcons" as const,
      label: "아이콘 (NerdFonts)",
      description: "개발자 아이콘 및 심볼",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div>
          <h4 className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
            영문 문자 선택
          </h4>
          <div className="space-y-3">
            {englishOptions.map(({ key, label, description }) => (
              <div key={key} className="flex items-start space-x-3">
                <Checkbox
                  id={key}
                  checked={options[key]}
                  onCheckedChange={(checked) => handleOptionChange(key, checked as boolean)}
                  className="mt-1"
                />
                <div className="space-y-1">
                  <Label htmlFor={key} className="text-sm font-medium cursor-pointer">
                    {label}
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
            한글 문자 선택
          </h4>
          <div className="space-y-3">
            {koreanOptions.map(({ key, label, description }) => (
              <div key={key} className="flex items-start space-x-3">
                <Checkbox
                  id={key}
                  checked={options[key]}
                  onCheckedChange={(checked) => handleOptionChange(key, checked as boolean)}
                  className="mt-1"
                />
                <div className="space-y-1">
                  <Label htmlFor={key} className="text-sm font-medium cursor-pointer">
                    {label}
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="space-y-2">
          <Label htmlFor={fontNameId} className="text-sm font-medium">
            합쳐진 폰트 이름
          </Label>
          <Input
            id={fontNameId}
            value={fontName}
            onChange={(e) => onFontNameChange(e.target.value)}
            placeholder="폰트 이름을 입력하세요"
            className="max-w-sm"
          />
          {showFontNameWarning && (
            <p className="mt-2 text-sm text-orange-600 dark:text-orange-400">
              ⚠️ 폰트 이름이 변경되었습니다. 폰트 합치기를 다시 실행하면 미리보기에 적용됩니다.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default MergeOptions
