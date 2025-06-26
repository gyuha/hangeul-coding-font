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
            <h4 className="font-semibold text-blue-900 dark:text-blue-100">1. 운영체제별 폰트 설치</h4>
          </div>
          
          <div className="space-y-4">
            {/* Windows */}
            <div className="border border-blue-200 dark:border-blue-700 rounded-md p-3">
              <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">🪟 Windows</h5>
              <div className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                <p>• <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900 rounded text-xs">{downloadFileName}.ttf</code> 파일 우클릭 → "모든 사용자용으로 설치" 선택</p>
                <p>• <strong>중요:</strong> "모든 사용자용으로 설치"를 선택해야 VSCode에서 인식됩니다</p>
                <p>• 관리자 권한이 필요할 수 있습니다</p>
              </div>
            </div>

            {/* macOS */}
            <div className="border border-blue-200 dark:border-blue-700 rounded-md p-3">
              <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">🍎 macOS</h5>
              <div className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                <p>• 폰트 파일 더블클릭 → 폰트 미리보기에서 "설치" 클릭</p>
                <p>• 또는 Font Book.app으로 드래그 앤 드롭</p>
                <p>• 사용자별 설치: ~/Library/Fonts/</p>
                <p>• 시스템 전체 설치: /Library/Fonts/</p>
              </div>
            </div>

            {/* Linux */}
            <div className="border border-blue-200 dark:border-blue-700 rounded-md p-3">
              <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">🐧 Linux (Ubuntu/Debian)</h5>
              <div className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                <p>• 방법 1: <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900 rounded text-xs">sudo cp {downloadFileName}.ttf /usr/share/fonts/truetype/</code></p>
                <p>• 방법 2: <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900 rounded text-xs">mkdir -p ~/.fonts && cp {downloadFileName}.ttf ~/.fonts/</code></p>
                <p>• 폰트 캐시 업데이트: <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900 rounded text-xs">fc-cache -fv</code></p>
              </div>
            </div>
          </div>
          
          <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded text-sm text-amber-800 dark:text-amber-200">
            ⚠️ <strong>설치 후 필수:</strong> 시스템 재시작 또는 모든 에디터 완전 종료 후 재실행
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
            <p>
              • <strong>Windows:</strong> 제어판 → 폰트 → 속성 → PostScript 이름
            </p>
            <p>
              • <strong>macOS:</strong> 폰트 북 → 정보 → PostScript 이름
            </p>
            <p>
              • <strong>PowerShell:</strong>{" "}
              <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900 rounded text-xs">
                Get-Fonts -regex "{downloadFileName}"
              </code>
            </p>
          </div>
        </div>

        {/* 문제 해결 */}
        <div className="border-t border-blue-200 dark:border-blue-800 pt-4">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">🔄 문제 해결 단계별 가이드</h4>
          
          <div className="space-y-3">
            <div className="border-l-4 border-blue-300 pl-3">
              <p className="font-medium text-sm text-blue-900 dark:text-blue-100">1단계: VSCode 완전 재시작</p>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <kbd className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900 rounded text-xs">Ctrl+Shift+P</kbd>
                {" "}→ "Developer: Reload Window" 또는 VSCode 완전 종료 후 재실행
              </p>
            </div>
            
            <div className="border-l-4 border-blue-300 pl-3">
              <p className="font-medium text-sm text-blue-900 dark:text-blue-100">2단계: 폰트 이름 수정</p>
              <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <p>• 따옴표 추가: <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900 rounded text-xs">"{postScriptFamilyName}"</code></p>
                <p>• 또는 표시 이름 사용: <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900 rounded text-xs">"{originalFontName}"</code></p>
              </div>
            </div>
            
            <div className="border-l-4 border-blue-300 pl-3">
              <p className="font-medium text-sm text-blue-900 dark:text-blue-100">3단계: 폰트 설치 확인</p>
              <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <p>• Word나 메모장에서 폰트 선택 가능한지 확인</p>
                <p>• Windows: 제어판 → 폰트에서 폰트 존재 확인</p>
                <p>• macOS: Font Book에서 폰트 활성화 상태 확인</p>
              </div>
            </div>
            
            <div className="border-l-4 border-amber-300 pl-3">
              <p className="font-medium text-sm text-amber-900 dark:text-amber-100">4단계: 시스템 재시작</p>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                폰트 캐시 완전 새로고침을 위해 시스템 재시작
              </p>
            </div>
            
            <div className="border-l-4 border-red-300 pl-3">
              <p className="font-medium text-sm text-red-900 dark:text-red-100">5단계: 재설치</p>
              <p className="text-sm text-red-800 dark:text-red-200">
                여전히 안 되면 폰트 삭제 후 "모든 사용자용으로 설치" 다시 실행
              </p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded">
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              💡 <strong>성공 확인 방법:</strong> VSCode 설정에서 폰트 이름 입력 시 자동완성으로 나타나면 성공!
            </p>
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
