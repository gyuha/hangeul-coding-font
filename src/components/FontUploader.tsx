import React, { useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText } from 'lucide-react';
import { FontInfo } from '@/types/font';
import { cn } from '@/lib/utils';

interface FontUploaderProps {
  title: string;
  description: string;
  fontInfo: FontInfo | null;
  onFontUpload: (file: File) => void;
  acceptedTypes?: string;
}

const FontUploader: React.FC<FontUploaderProps> = ({
  title,
  description,
  fontInfo,
  onFontUpload,
  acceptedTypes = ".ttf,.otf,.woff,.woff2"
}) => {
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFontUpload(file);
    }
  }, [onFontUpload]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      onFontUpload(file);
    }
  }, [onFontUpload]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {!fontInfo ? (
          <div
            className={cn(
              "border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer transition-colors hover:border-gray-400 hover:bg-gray-50",
              "dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-800"
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => document.getElementById(`file-input-${title}`)?.click()}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              폰트 파일을 드래그하거나 클릭하여 업로드
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              지원 형식: TTF, OTF, WOFF, WOFF2
            </p>
            <input
              id={`file-input-${title}`}
              type="file"
              accept={acceptedTypes}
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-blue-500" />
              <div>
                <p className="font-medium text-sm">{fontInfo.file.name}</p>
                <p className="text-xs text-gray-500">{fontInfo.size}</p>
              </div>
            </div>
            
            <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
              <h4 className="text-sm font-medium mb-2">미리보기</h4>
              <div 
                className="text-lg leading-relaxed"
                style={{ fontFamily: fontInfo.name }}
              >
                {title.includes('한글') ? 
                  "안녕하세요! 한글 코딩 폰트입니다." : 
                  "Hello! This is English coding font."}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById(`file-input-${title}`)?.click()}
              className="w-full"
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
      </CardContent>
    </Card>
  );
};

export default FontUploader;