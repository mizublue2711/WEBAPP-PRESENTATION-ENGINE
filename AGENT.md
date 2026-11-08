# AGENT GOVERNANCE DIRECTIVE: WEBAPP-PRESENTATION-ENGINE (VITE EDITION)
> **System Identity:** ARTIFICIAL CRAFT (CRAFT//CODE) Architecture Substrate
> **Target Platform:** https://artificialcraft.space/
> **Primary Paradigm:** Vite + React + TypeScript (SPA) · 0-Code JSON-Driven Architecture · 3-Tier System
> **Core Visual Identity:** Cybernetic Swiss Brutalism, Graphic Precision & Parametric Line-Art

---

## 🏛️ SECTION 1: ARCHITECTURAL PARADIGM & SYSTEM GOVERNANCE

### 1.1 The 3-Tier Decoupled Operational Model (Vite Architecture)
All code written or modified for this repository MUST strictly respect the 3-Tier Decoupled Infrastructure built on **Vite + React + TypeScript**:
1. **Tier 1: Reasoning Core (Dify Cloud / Vertex AI)**: Emits structured JSON Abstract Syntax Tree (AST) payloads. Never outputs raw TSX/JSX code.
2. **Tier 2: Execution Orchestrator & Edge API Proxy (n8n / Cloudflare Workers / Vite Proxy)**: Handles deterministic 100% fanout, webhook proxying (`import.meta.env.VITE_N8N_WEBHOOK_URL`), and strict Zod validation.
3. **Tier 3: Presentation Canvas (Vite React SPA Substrate)**: Operates strictly as a lightweight "Data Projector" on the client's GPU ($0.00 Server Render Cost, 60 FPS Target).

### 1.2 0-Code Website Operations (Context Bloat Elimination)
- **Zero-Code Policy**: Routine updates (homepage layout, 3D showcases, directory trees, flipbooks) MUST be executed by pushing lightweight JSON AST payloads (~50 tokens).
- **Frozen UI Component Layer**: DO NOT alter existing `.tsx` component files in `src/components/` to perform content edits.
- **Single Source of Truth (SSOT) Registry**: All 3D procedural components, HUD overlays, and Canvas routines MUST be registered centrally in `src/core/registry.ts`.

---

## 📐 SECTION 2: SCOPED REFACTORING & AI WORKER DIRECTIVES

### 2.1 Surgical Edit Constraint (Token Conservation)
- **NO FULL-FILE REWRITES**: Autonomous AI Workers (Cursor, Antigravity, Claude Code, Jules) are STRICTLY FORBIDDEN from rewriting entire files exceeding 100 lines.
- **Snippet / Diff Delivery**: Output ONLY the exact target function/component snippet requiring modification.
- **Placeholder Syntax**: Use comments like `// ... keep existing code unchanged ...` for untouched sections above and below the edit.

### 2.2 Vite Path Alias & Environment Variables
- **NO Relative Imports**: Never use relative paths like `../../components` or `../../types`.
- **Standard Alias Path `@/`**: Configured in `vite.config.ts` and `tsconfig.json`. Convert all imports to standard alias paths:
  - `@/components/...`
  - `@/core/...`
  - `@/types/...`
  - `@/lib/...`
  - `@/data/...`
- **Vite Environment Variables**: MUST use `import.meta.env.VITE_*` (e.g. `import.meta.env.VITE_N8N_WEBHOOK_URL`). NEVER use `process.env` or `process.env.NEXT_PUBLIC_*`.

### 2.3 Stripping Shell Protocol
- **No Duplicate Wrappers**: When adding new landing modules or components into `src/components/`, DO NOT include duplicate `<Navbar />` or `<Footer />` elements. The top-level React root (`App.tsx` / `Layout.tsx`) already provides global navigation.

### 2.4 Strict Build Gate Protocol & Git Rules
- **TypeScript Verification**: Prior to creating Pull Requests or commits, execute:
  ```bash
  npx tsc --noEmit
  ```
  The execution MUST pass with exactly **`Found 0 errors`**.
- **NO Build Artifact Commits**: DO NOT manually edit or commit files inside the Vite build output directory `dist/`.

---

## 🎨 SECTION 3: BRANDING, DESIGN SYSTEM & NEGATIVE GEOMETRY RULES

### 3.1 Cybernetic Swiss Brutalism Tokens
- **Color Palette**:
  - Base Obsidian: `#09090B` / `#05030A`
  - Structural Charcoal: `#18181E`
  - Electric Indigo: `#5322FF`
  - Neon Cyan: `#00E5FF`
  - Alert Emerald: `#10B981`
  - Alert Red: `#EF4444`
- **Typography & Grid**:
  - JetBrains Mono / Space Grotesk monospaced technical font stack.
  - 1px Swiss coordinate grid overlays, 60 FPS blinking anchor crosshairs.

### 3.2 STRICT NEGATIVE GEOMETRY BAN
- **BAN Plastic Cone / Cylinder Caps**: DO NOT attach `THREE.ConeGeometry`, `THREE.CylinderGeometry`, or `THREE.TorusGeometry` caps on top of 3D data columns or monolith structures. Avoid any visual resemblance to condiment bottle caps or glossy plastic highlights.
- **MANDATORY Architectural Top Alternatives**:
  - **Flat Recessed Sensor Dock**: Flat top face with a 1px recessed glass inset emitting an Electric Cyan (`#00E5FF`) or Electric Indigo (`#5322FF`) grid core.
  - **Chamfered Brutalist Monolith**: 45-degree bevelled top edges (`THREE.EdgesGeometry` wireframe) over matte obsidian concrete or brushed charcoal metal.

---

## 🎮 SECTION 4: 3D SPATIAL ENGINE & CAMERA STATE CONTROLLER

### 4.1 Central Mediator Pattern (`PresentationEngine`)
- **No Direct Scene/Camera Mutating**: Individual components MUST NOT directly manipulate `scene` or `camera` instances.
- **`ISceneModule` Lifecycle Contract**: Every custom 3D scene module MUST implement the strict interface:
  ```typescript
  export interface ISceneModule {
    id: string;
    init(scene: THREE.Scene, camera: THREE.PerspectiveCamera): void;
    update(deltaTime: number, elapsedTime: number): void;
    onResize(width: number, height: number): void;
    dispose(): void; // MANDATORY VRAM cleanup ($0.00 Memory Leak SLA)
  }
  ```

### 4.2 Camera Control Priority Stack & Dual-State Inspector
To prevent camera jitter and state conflicts, enforce the following priority stack:
1. **Priority 100 (`NODE_INSPECT_MODE`)**: Triggered via Raycasting Click. Camera lerps to a close-up focus position (`nodeWorldPos + offset [0, 0.2, 1.5]`) and centers the target node regardless of radial dispersion.
2. **Priority 50 (`BEZIER_SPLINE_MODE`)**: Scroll/Slider driven perspective tunnel flight along the Z-axis.
3. **Priority 10 (`IDLE_AUTO_FLY`)**: Sine-wave continuous cruise.

**Anchor Memory & Un-focus Protocol**:
- Upon entering `NODE_INSPECT_MODE`, store the pre-focus position in `anchorCamPos`.
- When the user presses `ESC` or clicks the canvas background, animate camera position back to `anchorCamPos` and restore `lookAt` toward the horizon vanishing point `(0, 0, -20)`.

### 4.3 Radial Dispersion & Perspective Tunnel Mechanics
- **4 Spatial Z-Zones**:
  - Zone 01 (`Z = +10m -> +5m`): Surface UI Glass Viewport.
  - Zone 02 (`Z = +5m -> 0m`): Exploded Component Matrix (`DynamicSectionRenderer`, `VideoShowcase`, `FlipBookEngine`).
  - Zone 03 (`Z = 0m -> -5m`): Interactive 3D Digital Line-Branching Directory Tree & Zod Gate.
  - Zone 04 (`Z = -5m -> -10m`): Deep AI Reasoning Horizon (Dify & n8n Monolith under 900-star GLSL skyvault).
- **Radial Dispersion Math**: As camera Z approaches any layer, dynamically offset X/Y coordinates of objects toward screen margins (`xOffset = ±Math.pow(1 / deltaZ, 1.5)`), maintaining an unobstructed central flight corridor.

---

## 🔒 SECTION 5: RELIABILITY, ZOD SCHEMAS & CLIENT EXPORTER

### 5.1 Zod AST Ingestion Gate & 2-Tier Graceful Fallback
- **Zod safeParse Validation**: Every incoming JSON AST payload MUST be validated against `ZodSchema.safeParse(body)` before rendering.
- **2-Tier Fallback Policy (Zero-Crash SLA)**:
  - *Tier 1 (Compilation Phase)*: If an unregistered `componentKey` is provided, reassign `componentKey = "swiss-hud"` and generate a deterministic seed string from the section title.
  - *Tier 2 (Runtime Phase)*: If an unmapped key reaches `<GenerativeVisual />`, fall back to a procedural 2D/3D Canvas generator driven by the seed string. The UI MUST NOT throw unhandled exceptions.

### 5.2 Client-Side Auto-Fly Motion Video Exporter (.WebM)
- **Zero Server Fee ($0.00)**: Video recording MUST execute 100% on the client's browser.
- **Capture Specs**: Capture the HTML5 WebGL `<canvas>` stream using `MediaRecorder` API:
  - Codec: `video/webm;codecs=vp9`
  - Target Bitrate: `3000000` (3.0 Mbps -> ultra-light ~1.5MB to 3.5MB file size)
  - Frame Rate: 60 FPS Target
  - Filename: `artificialcraft-autofly-motion-[timestamp].webm`


---

## 🔒 SECTION 6: IMMUTABLE OPERATIONAL RULES

### 🚨 Rule 1: SCOPE LOCK (STRICT FILE BOUNDARY)
- **STRICTLY FORBIDDEN** from editing, refactoring, or overwriting files outside the user's explicitly requested file list.
- **STRICTLY FORBIDDEN** from deleting legacy code, changing directory structures, or auto-cleaning adjacent files.
- If a target file relies on a broken external dependency, **you MUST ask for user confirmation** before modifying the dependency file.

### ⚡ Rule 2: TOKEN OPTIMIZATION (CONTEXT BOUNDARY)
- **DO NOT** read, scan, or crawl the entire repository.
- **Context Boundary**: The AI Worker is restricted to reading ONLY the specified target file and direct TypeScript definitions in `src/types/`.
- Do NOT load binary assets, images, videos (.png, .jpg, .webm, .gltf), `node_modules`, `dist/`, or `.git/` into context.

### 🛡️ Rule 3: 3D CANVAS & SSOT PROTECTION
- This app is a **3D Spatial Engine** highly sensitive to camera displacement, depth buffer corruption, or rendering sequence breaks.
- **DO NOT** edit 3D Canvas source code, camera state machines (`TUNNEL_FLIGHT_MODE`, `NODE_INSPECT_MODE`), or GLSL shaders unless explicitly instructed.
- **Single Source of Truth (SSOT)**: If introducing new graphics components, store files in `src/core/remotion-presets/` and register a unique ID in `src/core/registry.ts` adhering to `UniversalComponentProps`.

### ⚙️ Rule 4: JSON-DRIVEN PRINCIPLE (0-CODE OPERATIONS)
- For content, text, navigation, or UI configuration updates: **modify JSON schema files ONLY** (e.g., `site-configs/template-schema.json`, `src/data/showcase-config.json`).
- **DO NOT** touch React UI code (`.tsx`) when the task only involves data or text updates.

---

## 2. STEP-BY-STEP WORKFLOW

All AI Agent modifications must follow this strict 4-step pipeline:

[STEP 1: MINIMAL CONTEXT] ──► [STEP 2: ATOMIC EDIT] ──► [STEP 3: BUILD GATE] ──► [STEP 4: HAND-OFF]
  (Target & Types Only)         (Isolated Diff)          (npx tsc --noEmit)        (Protect dist/)

1. **Step 1: Load Minimal Context**
   - Open only the designated target file.
   - If inspecting types, open only the interface definitions in `src/types/`.

2. **Step 2: Atomic Edit**
   - Apply the smallest possible diff.
   - Preserve all unrelated comments, logic, and component props.

3. **Step 3: TypeScript Build Gate**
   - Prior to finishing, run syntax validation:
     ```bash
     npx tsc --noEmit
     ```
   - Must pass with **0 TypeScript errors**. If type errors occur, resolve them immediately within the target file.

4. **Step 4: Hand-off & Build Protection**
   - **DO NOT** touch or commit any files in `dist/` or `build/`.
   - Provide a concise summary (under 3 sentences) of the exact lines modified.

---

## 3. PRE-HANDOFF SELF-CHECKLIST

- [ ] Did I modify any files outside the requested target? -> *(If yes: Revert immediately)*
- [ ] Does `npx tsc --noEmit` pass with 0 errors? -> *(Mandatory 0 errors)*
- [ ] Are the `dist/` directory and 3D Canvas code completely untouched? -> *(Mandatory untouched)*
- [ ] Is the code free of redundant imports or unused variables? -> *(Clean up immediately)*
