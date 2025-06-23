import { useState, useCallback } from 'react';
import { load } from 'opentype.js';
import { Font } from 'opentype.js';
import { FontInfo, FontState, MergeOptions } from '@/types/font';

export const useFontMerger = () => {
  const [fontState, setFontState] = useState<FontState>({
    koreanFont: null,
    englishFont: null,
    mergedFont: null,
    isLoading: false,
    progress: 0,
    error: null,
    success: null
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const setError = useCallback((error: string) => {
    setFontState(prev => ({ ...prev, error, success: null }));
    setTimeout(() => setFontState(prev => ({ ...prev, error: null })), 5000);
  }, []);

  const setSuccess = useCallback((success: string) => {
    setFontState(prev => ({ ...prev, success, error: null }));
    setTimeout(() => setFontState(prev => ({ ...prev, success: null })), 5000);
  }, []);

  const loadFont = useCallback(async (file: File, type: 'korean' | 'english') => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const font = load(arrayBuffer);
      
      const fontInfo: FontInfo = {
        file,
        font,
        name: font.names.fontFamily?.en || file.name,
        size: formatFileSize(file.size)
      };

      // 폰트 CSS 등록
      const fontUrl = URL.createObjectURL(file);
      const fontFace = new FontFace(fontInfo.name, `url(${fontUrl})`);
      
      try {
        await fontFace.load();
        document.fonts.add(fontFace);
      } catch (err) {
        console.warn('Font face loading failed:', err);
      }

      setFontState(prev => ({
        ...prev,
        [type === 'korean' ? 'koreanFont' : 'englishFont']: fontInfo
      }));

      setSuccess(`${type === 'korean' ? '한글' : '영문'} 폰트가 성공적으로 로드되었습니다.`);
    } catch (error) {
      setError(`${type === 'korean' ? '한글' : '영문'} 폰트 로드 실패: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [setError, setSuccess]);

  const addGlyphRange = useCallback((glyphs: any[], sourceFont: Font, start: number, end: number) => {
    for (let i = start; i <= end; i++) {
      try {
        const glyph = sourceFont.charToGlyph(String.fromCharCode(i));
        if (glyph && glyph.unicode !== undefined && glyph.unicode !== 0) {
          const newGlyph = {
            name: glyph.name || `uni${i.toString(16).toUpperCase().padStart(4, '0')}`,
            unicode: glyph.unicode,
            advanceWidth: glyph.advanceWidth || 500,
            path: glyph.path || new (sourceFont.constructor as any).Path()
          };
          glyphs.push(newGlyph);
        }
      } catch (error) {
        console.warn(`Failed to add glyph at position ${i}:`, error);
      }
    }
  }, []);

  const mergefonts = useCallback(async (options: MergeOptions, fontName: string) => {
    if (!fontState.koreanFont || !fontState.englishFont) {
      setError('두 폰트 모두 업로드해주세요.');
      return;
    }

    setFontState(prev => ({ ...prev, isLoading: true, progress: 0 }));

    try {
      // OpenType.js Font 생성
      const Font = (window as any).opentype.Font;
      const Glyph = (window as any).opentype.Glyph;
      const Path = (window as any).opentype.Path;
      
      const font = new Font({
        familyName: fontName,
        styleName: 'Regular',
        unitsPerEm: fontState.koreanFont.font.unitsPerEm,
        ascender: Math.max(fontState.koreanFont.font.ascender, fontState.englishFont.font.ascender),
        descender: Math.min(fontState.koreanFont.font.descender, fontState.englishFont.font.descender),
        glyphs: []
      });

      const glyphs = [font.glyphs.get(0)]; // .notdef glyph
      let progress = 0;
      const totalSteps = 7;

      // 한글 문자 추가
      if (options.koreanHangul) {
        addGlyphRange(glyphs, fontState.koreanFont.font, 0xAC00, 0xD7AF); // 한글 완성형
        setFontState(prev => ({ ...prev, progress: (++progress / totalSteps) * 100 }));
      }

      if (options.koreanSymbols) {
        addGlyphRange(glyphs, fontState.koreanFont.font, 0x3130, 0x318F); // 한글 자모
        addGlyphRange(glyphs, fontState.koreanFont.font, 0xA960, 0xA97F); // 한글 자모 확장
        setFontState(prev => ({ ...prev, progress: (++progress / totalSteps) * 100 }));
      }

      if (options.koreanNumbers) {
        addGlyphRange(glyphs, fontState.koreanFont.font, 0x1100, 0x11FF); // 한글 자모
        setFontState(prev => ({ ...prev, progress: (++progress / totalSteps) * 100 }));
      }

      // 영문 문자 추가
      if (options.englishLetters) {
        addGlyphRange(glyphs, fontState.englishFont.font, 0x0041, 0x005A); // A-Z
        addGlyphRange(glyphs, fontState.englishFont.font, 0x0061, 0x007A); // a-z
        setFontState(prev => ({ ...prev, progress: (++progress / totalSteps) * 100 }));
      }

      if (options.englishNumbers) {
        addGlyphRange(glyphs, fontState.englishFont.font, 0x0030, 0x0039); // 0-9
        setFontState(prev => ({ ...prev, progress: (++progress / totalSteps) * 100 }));
      }

      if (options.englishSymbols) {
        addGlyphRange(glyphs, fontState.englishFont.font, 0x0020, 0x002F); // Basic punctuation
        addGlyphRange(glyphs, fontState.englishFont.font, 0x003A, 0x0040); // :;<=>?@
        addGlyphRange(glyphs, fontState.englishFont.font, 0x005B, 0x0060); // [\]^_`
        addGlyphRange(glyphs, fontState.englishFont.font, 0x007B, 0x007E); // {|}~
        setFontState(prev => ({ ...prev, progress: (++progress / totalSteps) * 100 }));
      }

      if (options.englishSpecial) {
        addGlyphRange(glyphs, fontState.englishFont.font, 0x00A0, 0x00FF); // Latin-1 Supplement
        addGlyphRange(glyphs, fontState.englishFont.font, 0x2000, 0x206F); // General Punctuation
        setFontState(prev => ({ ...prev, progress: (++progress / totalSteps) * 100 }));
      }

      // 글리프 설정
      const GlyphSet = (window as any).opentype.GlyphSet;
      font.glyphs = new GlyphSet(font, glyphs);

      setFontState(prev => ({ 
        ...prev, 
        mergedFont: font, 
        isLoading: false, 
        progress: 100 
      }));

      setSuccess('폰트 합치기가 완료되었습니다!');
    } catch (error) {
      setFontState(prev => ({ ...prev, isLoading: false, progress: 0 }));
      setError(`폰트 합치기 실패: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [fontState.koreanFont, fontState.englishFont, addGlyphRange, setError, setSuccess]);

  const downloadFont = useCallback((fontName: string) => {
    if (!fontState.mergedFont) {
      setError('먼저 폰트를 합쳐주세요.');
      return;
    }

    try {
      const arrayBuffer = fontState.mergedFont.toArrayBuffer();
      const blob = new Blob([arrayBuffer], { type: 'font/ttf' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fontName}.ttf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
      setSuccess('폰트 다운로드가 시작되었습니다!');
    } catch (error) {
      setError(`다운로드 실패: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [fontState.mergedFont, setError, setSuccess]);

  return {
    fontState,
    loadFont,
    mergefonts,
    downloadFont
  };
};