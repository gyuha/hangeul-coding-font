import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

interface FontPreviewProps {
  fontName: string;
  previewText: string;
  onPreviewTextChange: (text: string) => void;
}

const FontPreview: React.FC<FontPreviewProps> = ({
  fontName,
  previewText,
  onPreviewTextChange
}) => {
  const defaultPreviewText = `const message = "안녕하세요! Hello World!";
function greet(name: string) {
    return \`안녕하세요, \${name}님!\`;
}
console.log(greet("개발자"));

// 다양한 문자 테스트
// 한글: 가나다라마바사아자차카타파하
// 영문: ABCDEFGHIJKLMNOPQRSTUVWXYZ
// 숫자: 0123456789
// 기호: !@#$%^&*()_+-=[]{}|;':"\\",./<>?`;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>폰트 미리보기</CardTitle>
        <CardDescription>
          합쳐진 폰트의 모습을 미리 확인해보세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Textarea
            value={previewText || defaultPreviewText}
            onChange={(e) => onPreviewTextChange(e.target.value)}
            placeholder="미리보기 텍스트를 입력하세요..."
            className="min-h-[300px] font-mono text-sm leading-relaxed resize-none"
            style={{ 
              fontFamily: fontName ? `"${fontName}", monospace` : 'monospace' 
            }}
          />
          <div className="text-xs text-muted-foreground">
            현재 폰트: {fontName || '기본 폰트'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FontPreview;