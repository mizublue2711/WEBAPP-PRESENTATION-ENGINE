# CURSOR & AI AGENT OPERATIONAL RULES
# Project: WEBAPP-PRESENTATION-ENGINE

## 1. SCOPE & FILE ACCESS LOCK
- NEVER edit, refactor, or delete files outside the explicitly requested target files.
- NEVER auto-clean or "improve" adjacent files without direct user confirmation.
- Keep modifications strictly isolated and atomic.

## 2. TOKEN & CONTEXT OPTIMIZATION
- DO NOT read, scan, or index the entire repository.
- Restrict context reading strictly to the target file and direct interface types in `src/types/`.
- Ignore all assets, images, media, node_modules, build outputs, and `.git/`.

## 3. 3D CANVAS & ARCHITECTURE PROTECTION
- 3D Engine code (Three.js, WebGL, Tunnel Flight, Camera Machine) is frozen unless explicitly requested.
- Respect JSON-Driven Architecture: Update configuration files (`site-configs/`, `src/data/`) for content changes instead of modifying React UI components (`.tsx`).
- For new visual presets, implement in `src/core/remotion-presets/` and register in `src/core/registry.ts`.

## 4. BUILD GATE & COMPLIANCE
- Always run `npx tsc --noEmit` before completing any task.
- Zero TypeScript errors required.
- NEVER touch or commit to `dist/` or `build/` directories.
