# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Package Manager**: This project uses `pnpm` as the package manager. Always use `pnpm` commands instead of `npm`.

**Development**: 
- `pnpm run dev` - Start development server with host binding for external access
- `pnpm install` - Install dependencies

**Production**:
- `pnpm run build` - Build for production (runs TypeScript compilation first, outputs to `docs/`)
- `pnpm run preview` - Preview production build locally

**Code Quality**:
- `pnpm run lint` - Run Biome linter for code quality checks
- `pnpm run lint:fix` - Run Biome linter and fix auto-fixable issues
- `pnpm run format` - Check code formatting with Biome
- `pnpm run format:fix` - Format code with Biome
- `pnpm run check` - Run both linting and formatting checks with Biome
- `pnpm run check:fix` - Run Biome check and fix all auto-fixable issues

**Note**: No testing framework is configured in this project.

## Environment Configuration

The project uses environment-specific configuration files:
- `.env.development` - Development environment (base path: `/`)
- `.env.production` - Production environment (base path: `/hangeul-coding-font/`)
- `.env.example` - Example environment file

**Key Variables**:
- `VITE_BASE_PATH` - Deployment base path configuration

**Build Output**: Production builds output to `docs/` directory for GitHub Pages deployment.

### Deployment Process

When user requests deployment, follow this sequence:

1. **Version Update**: Increment version in `package.json` (patch/minor/major)
2. **Build**: Run `pnpm run build` to generate production assets in `docs/`
3. **Quality Check**: Run `pnpm run check` to ensure code quality
4. **Commit**: Stage and commit all changes with descriptive message
5. **Push**: Push to remote repository

```bash
# Update version in package.json first
pnpm run build
pnpm run check
git add .
git commit -m "descriptive message"
git push
```

## Project Architecture

React + TypeScript + Vite application for merging Korean and English fonts into coding fonts. Core technology stack: OpenType.js for font processing, shadcn/ui + Tailwind CSS for UI.

### Application Flow

1. **Font Upload** (FontUploader) → **Options Configuration** (MergeOptions) → **Live Preview** (FontPreview) → **Download Merged Font**
2. State orchestrated through `useFontMerger` hook with centralized error handling and progress tracking

### Key Components

- **App.tsx**: Main orchestrator managing font state, merge options, and component coordination
- **FontUploader**: Drag-and-drop file upload with format validation (TTF/OTF/WOFF/WOFF2)
- **MergeOptions**: Character range selection interface (Korean/English character sets)
- **FontPreview**: Real-time preview with custom text input and syntax highlighting
- **useFontMerger**: Core font processing logic, state management, and download functionality

### Font Processing Pipeline

1. **Parse**: OpenType.js loads and parses font files
2. **Merge**: Selective glyph copying based on Unicode ranges:
   - Korean: Hangul syllables (U+AC00-U+D7AF), Jamo (U+1100-U+11FF, U+3130-U+318F)
   - English: Latin letters, numerals, ASCII symbols, extended characters
3. **Register**: Dynamic FontFace API registration for live preview
4. **Export**: TTF format generation for download

### Technical Architecture

- **Build System**: Vite with TypeScript compilation, outputs to `docs/` for GitHub Pages
- **Styling**: Tailwind CSS with CSS variables, dark mode support
- **Icons**: Lucide React
- **Path Alias**: `@/` → `src/`
- **Host Configuration**: Allows external access (fe.gyuha.com, localhost, .gyuha.com)

### Unicode Range Strategy

Font merging uses precise Unicode ranges for character separation:
- Korean font: Hangul syllables, Jamo, Korean-specific symbols
- English font: Latin alphabet, ASCII symbols, punctuation, extended Latin
- User configurable: Granular control over which character sets to include

## Development Guidelines

### Code Standards
- **TypeScript**: Strict typing, no `any` types permitted
- **Components**: Functional components with React Hooks pattern
- **Naming**: PascalCase for components/types, camelCase for hooks/functions
- **UI Consistency**: Use shadcn/ui components exclusively for interface elements

### File Structure
```
src/
├── components/     # React components
├── hooks/         # Custom React hooks
├── types/         # TypeScript type definitions
└── lib/           # Utility functions
```

### Font Processing Implementation
OpenType.js integration requires careful handling of:
- **Memory Management**: Large font files need efficient parsing
- **Error Boundaries**: Font parsing failures must be gracefully handled
- **Progress Tracking**: Long operations need user feedback
- **Character Encoding**: Unicode range validation for proper glyph copying

### UI/UX Patterns
- **Dark Mode**: All components support automatic theme detection
- **Loading States**: Progress indicators for all async operations
- **Accessibility**: ARIA labels and keyboard navigation throughout
- **Responsive Design**: Mobile-friendly font preview and controls
- **Feedback**: Auto-dismissing success/error messages (5 second timeout)

### Performance Considerations
- Font files can be large (several MB) - handle parsing asynchronously
- Real-time preview updates should be debounced
- Memory cleanup after font processing completion