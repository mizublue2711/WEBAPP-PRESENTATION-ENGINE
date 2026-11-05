# AGENT_EN.md - OPERATIONAL CONSTITUTION & EXECUTION STANDARDS FOR AI AGENTS

---

## 1. IMMUTABLE OPERATIONAL RULES

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
