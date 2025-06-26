# useFontMerger 백업 - State와 Functions 목록

## State Variables (상태 변수들)

### Font Objects
- `koreanFont: opentype.Font | null` - 한글 폰트 객체
- `englishFont: opentype.Font | null` - 영문 폰트 객체
- `mergedFont: opentype.Font | null` - 합쳐진 폰트 객체

### Font Files
- `koreanFontFile: File | null` - 한글 폰트 파일
- `englishFontFile: File | null` - 영문 폰트 파일

### Font Names
- `koreanFontName: string` - 한글 폰트 이름
- `englishFontName: string` - 영문 폰트 이름

### URLs for Preview
- `koreanFontUrl: string` - 한글 폰트 미리보기 URL
- `englishFontUrl: string` - 영문 폰트 미리보기 URL
- `fontUrl: string` - 합쳐진 폰트 URL

### Preview Font Families
- `koreanPreviewFontFamily: string` - 한글 폰트 미리보기용 폰트 패밀리
- `englishPreviewFontFamily: string` - 영문 폰트 미리보기용 폰트 패밀리
- `previewFontFamily: string` - 합쳐진 폰트 미리보기용 폰트 패밀리

### Processing State
- `isProcessing: boolean` - 처리 중 상태
- `progress: number` - 진행률 (0-100)

## Functions (함수들)

### Upload Handlers
- `handleKoreanFontUpload(file: File)` - 한글 폰트 업로드 처리
- `handleEnglishFontUpload(file: File)` - 영문 폰트 업로드 처리

### Font Processing
- `mergeFonts(options: MergeOptions, fontName: string)` - 폰트 합치기 메인 함수
- `buildSelectedText(options: MergeOptions): string` - 선택된 옵션에 따라 문자 생성
- `downloadFont(fileName: string)` - 폰트 다운로드

### Utilities
- `formatFileSize(bytes: number): string` - 파일 크기 포맷팅
- `resetFonts()` - 모든 폰트 상태 초기화

## useEffect Hooks

1. **Merged Font Preview** - 합쳐진 폰트 미리보기 CSS 등록
2. **Korean Font Preview** - 한글 폰트 미리보기 CSS 등록  
3. **English Font Preview** - 영문 폰트 미리보기 CSS 등록

## Return Values (반환값들)

### Font Objects & Info
- `koreanFont`
- `englishFont`
- `koreanFontInfo` - 한글 폰트 정보 객체 (font, file, name, size)
- `englishFontInfo` - 영문 폰트 정보 객체 (font, file, name, size)
- `mergedFont`

### Font Names & Families
- `koreanFontName`
- `englishFontName`
- `previewFontFamily`

### Processing State
- `isProcessing`
- `progress`

### Functions
- `handleKoreanFontUpload`
- `handleEnglishFontUpload`
- `mergeFonts`
- `downloadFont`
- `resetFonts`

## Key Features to Preserve

1. **듀얼 폰트 업로드** - 한글/영문 폰트 별도 관리
2. **선택적 문자 범위** - MergeOptions을 통한 문자 선택
3. **실시간 미리보기** - 개별 폰트와 합쳐진 폰트 모두
4. **진행률 표시** - 폰트 합치기 과정의 진행률
5. **파일 정보 제공** - 폰트 크기 등 메타데이터
6. **URL 관리** - 메모리 누수 방지를 위한 URL 정리