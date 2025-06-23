# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with host binding
- `npm run build` - Build for production (runs TypeScript compilation first)  
- `npm run lint` - Run Biome linter for code quality checks
- `npm run lint:fix` - Run Biome linter and fix auto-fixable issues
- `npm run format` - Check code formatting with Biome
- `npm run format:fix` - Format code with Biome
- `npm run check` - Run both linting and formatting checks with Biome
- `npm run check:fix` - Run Biome check and fix all auto-fixable issues
- `npm run preview` - Preview production build locally

## Project Architecture

This is a React + TypeScript + Vite application for merging Korean and English fonts into a single coding font. The app uses OpenType.js for font manipulation and shadcn/ui components with Tailwind CSS for styling.

### Key Components Structure

- **App.tsx**: Main application component orchestrating the entire font merging workflow
- **FontUploader**: Handles file upload and font loading with drag-and-drop support
- **MergeOptions**: Configuration interface for selecting which character ranges to include from each font
- **FontPreview**: Live preview component showing the merged font with customizable sample text
- **useFontMerger hook**: Core business logic for font loading, merging, and downloading

### Font Processing Architecture

The app processes fonts through these stages:
1. **Loading**: Uses OpenType.js to parse uploaded TTF/OTF/WOFF files
2. **Merging**: Selectively copies glyph ranges based on user options:
   - Korean: Hangul syllables (0xAC00-0xD7AF), Jamo (0x3130-0x318F)
   - English: Letters, numbers, symbols, punctuation, and special characters
3. **Output**: Generates TTF format for download

### Character Range Strategy

The merging logic uses Unicode ranges to separate Korean and English character sets:
- Korean font contributes Hangul syllables and Jamo
- English font contributes Latin letters, ASCII symbols, and punctuation
- Options allow granular control over which ranges to include

### UI Framework

Uses shadcn/ui component system with:
- Radix UI primitives for accessibility
- Tailwind CSS for styling with CSS variables
- Lucide React for icons
- Path alias `@/` pointing to `src/`

### State Management

Centralized in `useFontMerger` hook managing:
- Font loading states and progress tracking
- Error/success message handling with auto-dismissal
- Merged font generation and download functionality

### Font Registration

Loaded fonts are dynamically registered with the browser's FontFace API to enable live preview functionality.