import type React from "react"
import { useEffect, useState } from "react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism"
import { Button } from "./ui/button"
import { Textarea } from "./ui/textarea"

interface FontPreviewProps {
  fontName: string
  previewText: string
  onPreviewTextChange: (text: string) => void
}

const FontPreview: React.FC<FontPreviewProps> = ({
  fontName,
  previewText,
  onPreviewTextChange,
}) => {
  const [fontSize, setFontSize] = useState(14)
  const [fontLoaded, setFontLoaded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // 다크모드 감지
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = () => {
      // 컴포넌트 리렌더링을 위해 상태 업데이트
      setFontLoaded((prev) => prev)
    }
    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  useEffect(() => {
    const checkFontLoad = async () => {
      if (fontName) {
        try {
          console.log(`Checking font load for: "${fontName}"`)

          // 폰트 로드 시도
          await document.fonts.load(`16px "${fontName}"`)

          // 여러 방법으로 폰트 로딩 확인
          let isFontAvailable = false

          // 방법 1: document.fonts API 사용
          const fontFaces = Array.from(document.fonts.values())
          isFontAvailable = fontFaces.some((font) => font.family === fontName)

          // 방법 2: 동적으로 추가된 style 태그 확인
          if (!isFontAvailable) {
            const styleTags = document.querySelectorAll("style")
            for (const style of styleTags) {
              if (
                style.textContent &&
                (style.textContent.includes(`font-family: '${fontName}'`) ||
                  style.textContent.includes(`font-family: "${fontName}"`))
              ) {
                isFontAvailable = true
                console.log(`✅ Font found in style tag: ${fontName}`)
                break
              }
            }
          }

          // 방법 3: 폰트가 실제로 적용되는지 테스트
          if (!isFontAvailable) {
            const testElement = document.createElement("div")
            testElement.style.fontFamily = `"${fontName}", monospace`
            testElement.style.position = "absolute"
            testElement.style.visibility = "hidden"
            testElement.textContent = "Test"
            document.body.appendChild(testElement)

            // 잠시 후 폰트가 적용되었는지 확인
            setTimeout(() => {
              const computedStyle = window.getComputedStyle(testElement)
              const actualFontFamily = computedStyle.fontFamily
              isFontAvailable = actualFontFamily.includes(fontName)
              document.body.removeChild(testElement)
              setFontLoaded(isFontAvailable)
              console.log(
                `Font test result for "${fontName}":`,
                isFontAvailable,
                `Actual: ${actualFontFamily}`
              )
            }, 500)
          } else {
            setFontLoaded(isFontAvailable)
          }

          console.log(`Font "${fontName}" loaded:`, isFontAvailable)
        } catch (error) {
          console.warn("Font load check failed:", error)

          // 오류가 발생해도 스타일 태그 존재 여부로 최종 확인
          const styleTags = document.querySelectorAll("style")
          let foundInStyles = false
          for (const style of styleTags) {
            if (style.textContent && style.textContent.includes(`font-family: '${fontName}'`)) {
              foundInStyles = true
              break
            }
          }
          setFontLoaded(foundInStyles)
        }
      } else {
        setFontLoaded(false)
      }
    }

    checkFontLoad()
  }, [fontName])

  const defaultPreviewText = `const message = "안녕하세요! Hello World!";
function greet(name: string) {
    return \`안녕하세요, \${name}님!\`;
}
console.log(greet("개발자"));

// 다양한 문자 테스트
// 한글: 가나다라마바사아자차카타파하
// 영문: abcdefghijklmnopqrstuvwxyz
//       ABCDEFGHIJKLMNOPQRSTUVWXYZ
// 혼동되기 쉬운 문자: o008 iIlL1 {} [] g9qCGQ ~-+=>
// 아이콘 문자 :      ⇡    `

  const sampleTexts = [
    {
      label: "코딩 예제",
      text: `const message = "안녕하세요! Hello World!";
function greet(name: string) {
    return \`안녕하세요, \${name}님!\`;
}
console.log(greet("개발자"));`,
    },
    {
      label: "문자 테스트",
      text: `abcdefghijklmnopqrstuvwxyz
ABCDEFGHIJKLMNOPQRSTUVWXYZ
o008 iIlL1 {} [] g9qCGQ ~-+=>

     ⇡  3.10.12   `,
    },
    {
      label: "실제 코드",
      text: `import React from 'react';

interface Props {
  name: string;
  age: number;
}

export const User: React.FC<Props> = ({ name, age }) => {
  const [count, setCount] = useState(0);
  
  return (
    <div className="user-card">
      <h1>사용자 정보: {name}</h1>
      <p>나이: {age}세</p>
      <button onClick={() => setCount(count + 1)}>
        클릭 수: {count}
      </button>
    </div>
  );
};`,
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">샘플 텍스트:</span>
          {sampleTexts.map((sample) => (
            <Button
              key={sample.label}
              variant="outline"
              size="sm"
              onClick={() => onPreviewTextChange(sample.text)}
              className="text-xs"
            >
              {sample.label}
            </Button>
          ))}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">크기:</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFontSize(Math.max(10, fontSize - 2))}
            className="p-0 w-8 h-8"
          >
            -
          </Button>
          <span className="text-sm min-w-[3rem] text-center">{fontSize}px</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFontSize(Math.min(24, fontSize + 2))}
            className="p-0 w-8 h-8"
          >
            +
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className="text-xs"
          >
            {isEditing ? "미리보기" : "편집"}
          </Button>
        </div>
      </div>

      <div className="overflow-hidden bg-white rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-900">
        {isEditing ? (
          <Textarea
            value={previewText || defaultPreviewText}
            onChange={(e) => onPreviewTextChange(e.target.value)}
            placeholder="미리보기 텍스트를 입력하세요..."
            className="min-h-[300px] font-mono leading-relaxed resize-none border-0 p-4 focus-visible:ring-0 bg-transparent"
            style={{
              fontFamily: fontName ? `"${fontName}", monospace` : "monospace",
              fontSize: `${fontSize}px`,
            }}
          />
        ) : (
          <div className="relative">
            <SyntaxHighlighter
              language="typescript"
              style={document.documentElement.classList.contains("dark") ? oneDark : oneLight}
              customStyle={{
                margin: 0,
                padding: "16px",
                background: "transparent",
                fontSize: `${fontSize}px`,
                fontFamily: fontName ? `"${fontName}", monospace` : "monospace",
                minHeight: "300px",
                lineHeight: "1.6",
              }}
              codeTagProps={{
                style: {
                  fontFamily: fontName ? `"${fontName}", monospace` : "monospace",
                },
              }}
            >
              {previewText || defaultPreviewText}
            </SyntaxHighlighter>
          </div>
        )}
      </div>

      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>
          현재 폰트: {fontName || "기본 폰트"} {fontLoaded ? "✓" : "⚠️"}
        </span>
        <span>글자 수: {(previewText || defaultPreviewText).length}</span>
      </div>

      {!fontLoaded && fontName && (
        <div className="p-2 text-xs text-yellow-600 bg-yellow-50 rounded dark:text-yellow-400 dark:bg-yellow-900/20">
          ⚠️ 폰트가 아직 로드되지 않았습니다. 브라우저 콘솔을 확인해주세요.
        </div>
      )}
    </div>
  )
}

export default FontPreview
