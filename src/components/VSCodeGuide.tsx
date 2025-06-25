import { CodeXml, ExternalLink, Settings } from "lucide-react"
import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"

interface VSCodeGuideProps {
  downloadFileName: string
  originalFontName: string
  postScriptFamilyName: string
}

const VSCodeGuide: React.FC<VSCodeGuideProps> = ({
  downloadFileName,
  originalFontName,
  postScriptFamilyName,
}) => {
  return (
    <Card className="mt-6 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <CodeXml className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <CardTitle className="text-lg text-blue-900 dark:text-blue-100">
            VSCode에서 사용하기
          </CardTitle>
        </div>
        <CardDescription className="text-blue-700 dark:text-blue-300">
          다운로드한 폰트를 VSCode에서 사용하는 방법을 안내합니다
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 시스템 설치 방법 */}
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <Settings className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h4 className="font-semibold text-blue-900 dark:text-blue-100">
              1. 시스템 설치
            </h4>
          </div>
          <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <p>• 다운로드된 <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900 rounded text-xs">{downloadFileName}.ttf</code> 파일을 더블클릭</p>
            <p>• "설치" 버튼을 클릭하여 시스템에 설치</p>
            <p>• 설치 완료 후 모든 에디터 완전 종료</p>
          </div>
        </div>

        {/* VSCode 설정 방법 */}
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <ExternalLink className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h4 className="font-semibold text-blue-900 dark:text-blue-100">
              2. VSCode 설정 (settings.json)
            </h4>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                📝 방법 1 (표시 이름):
              </p>
              <pre className="p-3 bg-blue-100 dark:bg-blue-900 rounded-md text-xs overflow-x-auto">
                <code>{`{
  "editor.fontFamily": "${originalFontName}, monospace",
  "terminal.integrated.fontFamily": "${originalFontName}, monospace"
}`}</code>
              </pre>
            </div>
            
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                ✅ 방법 2 (PostScript 이름 - 권장):
              </p>
              <pre className="p-3 bg-blue-100 dark:bg-blue-900 rounded-md text-xs overflow-x-auto">
                <code>{`{
  "editor.fontFamily": "${postScriptFamilyName}, monospace",
  "terminal.integrated.fontFamily": "${postScriptFamilyName}, monospace"
}`}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* 폰트 이름 확인 방법 */}
        <div>
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
            🔍 시스템에서 폰트 이름 확인
          </h4>
          <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <p>• <strong>Windows:</strong> 제어판 → 폰트 → 속성 → PostScript 이름</p>
            <p>• <strong>macOS:</strong> 폰트 북 → 정보 → PostScript 이름</p>
            <p>• <strong>PowerShell:</strong> <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900 rounded text-xs">Get-Fonts -regex "{downloadFileName}"</code></p>
          </div>
        </div>

        {/* 문제 해결 */}
        <div className="border-t border-blue-200 dark:border-blue-800 pt-4">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
            🔄 문제 해결
          </h4>
          <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <p>• 폰트가 안 보이면: VSCode 완전 재시작 (<kbd className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900 rounded text-xs">Ctrl+Shift+P</kbd> → "Developer: Reload Window")</p>
            <p>• 여전히 안 되면: 폰트명을 따옴표로 감싸기 <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900 rounded text-xs">"{postScriptFamilyName}"</code></p>
            <p>• 계속 문제 시: 시스템 재시작으로 폰트 캐시 새로고침</p>
          </div>
        </div>

        {/* 중요 안내 */}
        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md p-3">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            ⚠️ <strong>중요:</strong> VSCode는 시스템에 설치된 폰트만 인식합니다!
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default VSCodeGuide 