import type React from "react"
import { useState } from "react"
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

  const defaultPreviewText = `const message = "안녕하세요! Hello World!";
function greet(name: string) {
    return \`안녕하세요, \${name}님!\`;
}
console.log(greet("개발자"));

// 다양한 문자 테스트
// 한글: 가나다라마바사아자차카타파하
// 영문: ABCDEFGHIJKLMNOPQRSTUVWXYZ
// 숫자: 0123456789
// 기호: !@#$%^&*()_+-=[]{}|;':"\\",./<>?`

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
      text: `// 한글: 가나다라마바사아자차카타파하
// 영문: ABCDEFGHIJKLMNOPQRSTUVWXYZ
// 숫자: 0123456789
// 기호: !@#$%^&*()_+-=[]{}|;':"\\",./<>?`,
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
      <div className="flex items-center justify-between flex-wrap gap-4">
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
            className="w-8 h-8 p-0"
          >
            -
          </Button>
          <span className="text-sm min-w-[3rem] text-center">{fontSize}px</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFontSize(Math.min(24, fontSize + 2))}
            className="w-8 h-8 p-0"
          >
            +
          </Button>
        </div>
      </div>

      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900">
        <Textarea
          value={previewText || defaultPreviewText}
          onChange={(e) => onPreviewTextChange(e.target.value)}
          placeholder="미리보기 텍스트를 입력하세요..."
          className="min-h-[300px] font-mono leading-relaxed resize-none border-0 p-0 focus-visible:ring-0 bg-transparent"
          style={{
            fontFamily: fontName ? `"${fontName}", monospace` : "monospace",
            fontSize: `${fontSize}px`,
          }}
        />
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400 flex justify-between">
        <span>현재 폰트: {fontName || "기본 폰트"}</span>
        <span>글자 수: {(previewText || defaultPreviewText).length}</span>
      </div>
    </div>
  )
}

export default FontPreview
