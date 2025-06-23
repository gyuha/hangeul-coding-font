import { useState } from 'react';
import { Button } from './components/ui/button';
import { Progress } from './components/ui/progress';
import { Alert, AlertDescription } from './components/ui/alert';
import { Loader2, Download, Merge } from 'lucide-react';
import FontUploader from './components/FontUploader';
import MergeOptions from './components/MergeOptions';
import FontPreview from './components/FontPreview';
import { useFontMerger } from './hooks/useFontMerger';
import type { MergeOptions as MergeOptionsType } from './types/font';

function App() {
  const { fontState, loadFont, mergefonts, downloadFont } = useFontMerger();
  
  const [mergeOptions, setMergeOptions] = useState<MergeOptionsType>({
    koreanHangul: true,
    koreanSymbols: true,
    koreanNumbers: false,
    englishLetters: true,
    englishNumbers: true,
    englishSymbols: true,
    englishSpecial: true
  });
  
  const [fontName, setFontName] = useState('한글코딩폰트');
  const [previewText, setPreviewText] = useState('');

  const canMerge = fontState.koreanFont && fontState.englishFont && !fontState.isLoading;
  const canDownload = fontState.mergedFont && !fontState.isLoading;

  const handleMerge = () => {
    mergefonts(mergeOptions, fontName);
  };

  const handleDownload = () => {
    downloadFont(fontName);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            한글 코딩 폰트 합치기
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            한글 폰트와 영문 폰트를 합쳐서 완벽한 코딩 폰트를 만들어보세요. 
            각 폰트에서 필요한 문자를 선택하여 나만의 폰트를 생성할 수 있습니다.
          </p>
        </div>

        {/* Error/Success Messages */}
        {fontState.error && (
          <Alert className="mb-6 border-red-200 bg-red-50 text-red-800">
            <AlertDescription>{fontState.error}</AlertDescription>
          </Alert>
        )}

        {fontState.success && (
          <Alert className="mb-6 border-green-200 bg-green-50 text-green-800">
            <AlertDescription>{fontState.success}</AlertDescription>
          </Alert>
        )}

        {/* Font Upload Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <FontUploader
            title="한글 폰트"
            description="한글 문자를 포함한 폰트 파일을 업로드하세요"
            fontInfo={fontState.koreanFont}
            onFontUpload={(file) => loadFont(file, 'korean')}
          />
          <FontUploader
            title="영문 폰트"
            description="영문 문자를 포함한 폰트 파일을 업로드하세요"
            fontInfo={fontState.englishFont}
            onFontUpload={(file) => loadFont(file, 'english')}
          />
        </div>

        {/* Options Section */}
        {canMerge && (
          <div className="mb-8">
            <MergeOptions
              options={mergeOptions}
              onOptionsChange={setMergeOptions}
              fontName={fontName}
              onFontNameChange={setFontName}
            />
          </div>
        )}

        {/* Preview Section */}
        {fontState.mergedFont && (
          <div className="mb-8">
            <FontPreview
              fontName={fontName}
              previewText={previewText}
              onPreviewTextChange={setPreviewText}
            />
          </div>
        )}

        {/* Progress Bar */}
        {fontState.isLoading && (
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                폰트 합치는 중... ({Math.round(fontState.progress)}%)
              </span>
            </div>
            <Progress value={fontState.progress} className="w-full" />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <Button
            onClick={handleMerge}
            disabled={!canMerge}
            size="lg"
            className="min-w-[160px]"
          >
            {fontState.isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                합치는 중...
              </>
            ) : (
              <>
                <Merge className="mr-2 h-4 w-4" />
                폰트 합치기
              </>
            )}
          </Button>

          <Button
            onClick={handleDownload}
            disabled={!canDownload}
            variant="secondary"
            size="lg"
            className="min-w-[160px]"
          >
            <Download className="mr-2 h-4 w-4" />
            다운로드
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-gray-500 dark:text-gray-400">
          <p>지원하는 폰트 형식: TTF, OTF, WOFF, WOFF2</p>
          <p className="mt-1">합쳐진 폰트는 TTF 형식으로 다운로드됩니다.</p>
        </div>
      </div>
    </div>
  );
}

export default App;