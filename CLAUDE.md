# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Package Manager**: This project uses `pnpm` as the package manager. Always use `pnpm` commands instead of `npm`.

- `pnpm run dev` - Start development server with host binding
- `pnpm run build` - Build for production (runs TypeScript compilation first)  
- `pnpm run lint` - Run Biome linter for code quality checks
- `pnpm run lint:fix` - Run Biome linter and fix auto-fixable issues
- `pnpm run format` - Check code formatting with Biome
- `pnpm run format:fix` - Format code with Biome
- `pnpm run check` - Run both linting and formatting checks with Biome
- `pnpm run check:fix` - Run Biome check and fix all auto-fixable issues
- `pnpm run preview` - Preview production build locally
- `pnpm install` - Install dependencies

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

## Development Guidelines

### Code Standards
- Use TypeScript for all components and functions (no `any` types)
- Prefer functional components with React Hooks
- Follow established naming conventions:
  - Components: PascalCase (e.g., `FontUploader`)
  - Hooks: camelCase with 'use' prefix (e.g., `useFontMerger`)
  - Types/Interfaces: PascalCase (e.g., `FontInfo`)

### File Organization
- Components in `src/components/`
- Custom hooks in `src/hooks/`
- Type definitions in `src/types/`
- Utilities in `src/lib/`

### Font Processing Details
The font merging process uses specific Unicode ranges:
- **Korean Hangul**: U+AC00-U+D7AF (한글 음절)
- **Korean Jamo**: U+3130-U+318F, U+1100-U+11FF, U+A960-U+A97F
- **English Letters**: U+0041-U+005A (A-Z), U+0061-U+007A (a-z)
- **Numbers**: U+0030-U+0039 (0-9)
- **Symbols**: U+0020-U+007E (basic ASCII)
- **Extended**: U+00A0-U+00FF, U+2000-U+206F

### UI/UX Requirements
- All components must support dark mode using `dark:` Tailwind classes
- Use shadcn/ui components for consistency
- Implement proper loading states with progress indicators
- Provide immediate feedback for user actions
- Ensure accessibility with proper ARIA labels and keyboard navigation

### Error Handling
- Font loading errors should be caught and displayed to users
- Provide fallback font stacks when font registration fails
- Include detailed error messages in console for debugging
- Auto-dismiss success/error messages after 5 seconds