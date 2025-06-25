# 한글 코딩 폰트 병합기

## 🔤 개요

한글 폰트와 영문 코딩 폰트를 선택적으로 병합하여 완벽한 코딩 폰트를 만들 수 있는 웹 애플리케이션입니다.

## ✨ 특징

- 🎨 실시간 폰트 미리보기
- ⚙️ 세부적인 문자셋 선택
- 📥 TTF 폰트 다운로드
- 🌐 브라우저에서 바로 실행
- 📱 반응형 디자인

## 🚀 사용법

### 1. 폰트 업로드
- 한글 폰트 (.ttf, .otf)
- 영문 코딩 폰트 (.ttf, .otf)

### 2. 옵션 선택
- 한글: 완성형 한글, 자모, 숫자
- 영문: 대소문자, 숫자, 기호, 특수문자, 합자, 아이콘

### 3. 폰트 생성 및 미리보기
- 웹에서 실시간 미리보기 가능

### 4. VSCode에서 사용하기

⚠️ **중요**: 웹에서 생성된 폰트는 미리보기용입니다!

**VSCode, Sublime Text 등의 에디터에서 사용하려면:**

1. **폰트 다운로드** 후 **시스템에 설치** 필수
2. 다운로드된 `.ttf` 파일을 더블클릭 → "설치" 버튼 클릭
3. VSCode 설정(`settings.json`)에 추가:
   ```json
   {
     "editor.fontFamily": "YourFontName, monospace",
     "terminal.integrated.fontFamily": "YourFontName, monospace"
   }
   ```
4. VSCode 재시작

**문제 해결:**
- 폰트가 안 보이면: VSCode 완전 재시작
- 여전히 안 되면: 폰트명을 따옴표로 감싸기
- 시스템 폰트 목록에서 정확한 폰트 이름 확인

## 🛠️ 기술 스택

- React + TypeScript
- Vite
- OpenType.js (폰트 처리)
- shadcn/ui + Tailwind CSS (UI)
- Biome (코드 품질)

## 🖥 개발 환경 설정

이 프로젝트를 로컬에서 실행하려면:

```bash
# 의존성 설치
pnpm install

# 개발 서버 시작
pnpm run dev

# 빌드
pnpm run build

# 코드 검사
pnpm run lint
```

## 📝 라이선스

이 프로젝트는 개인 및 상업적 용도로 자유롭게 사용할 수 있습니다.

## 🤝 기여하기

버그 리포트나 기능 제안은 GitHub Issues를 통해 해주세요.
