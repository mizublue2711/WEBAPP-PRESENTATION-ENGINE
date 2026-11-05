import {
  DirectoryNode,
  ExplodedComponentSpec,
  RawSpatialTreeNode,
  RepositoryTreeDocument,
  ScreenSlotConfig,
  SpatialConfigState,
  SpatialLayerType,
  ThemePalette,
  ThemePresetId,
} from './types';

export const PLAYGROUND_SCREENSHOTS = {
  monolith3D:
    '/assets/aistudio/screencapture-artificialcraft-space-playground-2026-11-05-11_17_52_1afc6599.png',
  remotion60:
    '/assets/aistudio/screencapture-artificialcraft-space-playground-2026-11-05-11_18_10_5eae90f1.png',
  bannerStudio:
    '/assets/aistudio/screencapture-artificialcraft-space-playground-2026-11-05-11_18_39_a0e302f4.png',
} as const;

export const DEFAULT_SCREEN_SLOTS: ScreenSlotConfig[] = [
  {
    slotIndex: 0,
    label: 'Màn Hình 01 · NODE 01: 3D MONOLITH',
    nodeTitle: 'ARTIFICIALCRAFT // MONOLITH 60FPS',
    subtitle:
      'Separation of Powers: Dify Orchestrates Cognition → n8n Executes Worker Tasks',
    badge: 'NODE 01: 3D MONOLITH',
    imageUrl: PLAYGROUND_SCREENSHOTS.monolith3D,
    accentCss: '#00E5FF',
  },
  {
    slotIndex: 1,
    label: 'Màn Hình 02 · NODE 02: REMOTION',
    nodeTitle: '4-SLOT LEGO ASSEMBLY // HYPERBOLIC LATTICE',
    subtitle: '60 FPS Stage Frame Sequencer & 3D Parametric Inspector',
    badge: 'NODE 02: REMOTION 60FPS',
    imageUrl: PLAYGROUND_SCREENSHOTS.remotion60,
    accentCss: '#5322FF',
  },
  {
    slotIndex: 2,
    label: 'Màn Hình 03 · NODE 03: BANNER STUDIO',
    nodeTitle: 'PLUG & PLAY STUDIO BANNER LINKEDIN',
    subtitle:
      'Genetic Algorithm Active // Canvas Engine v3.0 // Swiss Grid Resolution',
    badge: 'NODE 03: BANNER STUDIO',
    imageUrl: PLAYGROUND_SCREENSHOTS.bannerStudio,
    accentCss: '#10B981',
  },
  {
    slotIndex: 3,
    label: 'Màn Hình 04 · STUDIO FACTORY & DEPLOY',
    nodeTitle: 'SHIP YOUR FIRST AGENT NODE IN 90 SECONDS',
    subtitle: 'Zero-Code JSON AST Stream · CLI, Blueprint & Webhook URL',
    badge: 'NODE 04: CRAFT DEPLOY',
    imageUrl: PLAYGROUND_SCREENSHOTS.monolith3D,
    accentCss: '#00E5FF',
  },
];

export const THEME_PALETTES: Record<ThemePresetId, ThemePalette> = {
  cybernetic_swiss: {
    id: 'cybernetic_swiss',
    name: 'Deep Midnight (01:00 AM)',
    bgHex: 0x090912,
    bgCss: '#090912',
    primaryHex: 0x00e5ff,
    primaryCss: '#00E5FF',
    secondaryHex: 0x5322ff,
    secondaryCss: '#5322FF',
    accentHex: 0x10b981,
    accentCss: '#10B981',
    surfaceHex: 0x18181e,
    surfaceCss: '#18181E',
    gridHex: 0x242636,
  },
  titanium_mono: {
    id: 'titanium_mono',
    name: 'Titanium Cleanroom',
    bgHex: 0x08090d,
    bgCss: '#08090D',
    primaryHex: 0xf4f8ff,
    primaryCss: '#F4F8FF',
    secondaryHex: 0x64748b,
    secondaryCss: '#64748B',
    accentHex: 0x00e5ff,
    accentCss: '#00E5FF',
    surfaceHex: 0x18181e,
    surfaceCss: '#18181E',
    gridHex: 0x2e323d,
  },
  amber_gold: {
    id: 'amber_gold',
    name: 'Midnight Amber Gold',
    bgHex: 0x08070a,
    bgCss: '#08070A',
    primaryHex: 0xf59e0b,
    primaryCss: '#F59E0B',
    secondaryHex: 0x5322ff,
    secondaryCss: '#5322FF',
    accentHex: 0x10b981,
    accentCss: '#10B981',
    surfaceHex: 0x18181e,
    surfaceCss: '#18181E',
    gridHex: 0x33281e,
  },
};

export const INITIAL_STATE: SpatialConfigState = {
  cameraMode: 'TUNNEL_FLIGHT_MODE',
  anchorProgress: 0.04,
  focusedNodeId: null,
  isRecordingVideo: false,
  recordingProgress: 0,
  flightMode: 'MANUAL',
  progress: 0.04,
  flightVelocity: 0.35,
  lerpSensitivity: 0.05,
  themeId: 'cybernetic_swiss',
  explodedScale: 1.0,
  fogEnabled: true,
  starDensity: 900,
  bloomStrength: 1.25,
  audioMuted: false,
  activeZoneIndex: 0,
  selectedScreenSlot: 0,
  autoAdvanceScreenSlot: true,
  screenSlots: DEFAULT_SCREEN_SLOTS.map((s) => ({ ...s })),
  systemIdentity: 'ARTIFICIAL CRAFT (CRAFT//CODE)',
  targetPlatform: 'https://artificialcraft.space/',
  architecturalParadigm:
    '0-Code JSON-Driven Architecture & Decoupled 3-Tier System',
  uiSurfaceTitle: 'ARTIFICIALCRAFT.SPACE',
  uiSurfaceSubtitle:
    'Deep Midnight 01:00 AM · Studio Playground & Interactive Node Matrix',
  uiSurfaceTag: 'DEEP MIDNIGHT 01:00 AM · 6500K CHIAROSCURO · ZOD GATE',
  uiSurfaceAccent: '#00E5FF',
  uiSurfaceCustomHtml:
    '<section class="node-matrix"><h1>STUDIO PLAYGROUND // INTERACTIVE NODE MATRIX</h1><p>Node 01: 3D Monolith · Node 02: Remotion 60FPS · Node 03: Banner Studio</p></section>',
};

export const ZONE_MARKERS = [
  {
    index: 0,
    code: 'ZONE 01',
    label: 'UI Glass Screen',
    zRange: 'Z: +10m → +5m',
    targetProgress: 0.06,
    summary: '4-Screen Surface UI Glass Viewport & Sequential Image Swapper',
  },
  {
    index: 1,
    code: 'ZONE 02',
    label: 'Exploded Components',
    zRange: 'Z: +5m → 0m',
    targetProgress: 0.36,
    summary: '3D Monolith, Remotion 60FPS & Banner Studio Exploded Matrix',
  },
  {
    index: 2,
    code: 'ZONE 03',
    label: '3D Directory Tree',
    zRange: 'Z: 0m → -5m',
    targetProgress: 0.68,
    summary: 'Interactive Digital Line-Branching Tree & Zod Validation Gate',
  },
  {
    index: 3,
    code: 'ZONE 04',
    codeName: 'AI Core Horizon',
    label: 'AI Core',
    zRange: 'Z: -5m → -10m',
    targetProgress: 0.95,
    summary: 'Dify.ai Cloud Brain, n8n Orchestrator & Binary Galaxy Sky Dome',
  },
];

export const EXPLODED_COMPONENTS: ExplodedComponentSpec[] = [
  {
    id: 'comp-dynamic-renderer',
    title: 'DynamicSectionRenderer.tsx',
    filePath: 'src/components/DynamicSectionRenderer.tsx',
    fpsTarget: '60 FPS MONOLITH',
    badge: 'NODE 01 · 3D MONOLITH',
    description: 'Separation of Powers: Dify Cognition + n8n Execution Pods',
    zPos: 3.8,
    xPos: -1.38,
    yPos: 1.85,
    accentHex: 0x00e5ff,
    screenSlotIndex: 0,
    metrics: { renderMs: '0.42ms', astNodes: 48, memoryKb: 124 },
    codePreview: `export function DynamicSectionRenderer({ ast }: Props) {\n  const Component = REGISTRY[ast.componentId];\n  return <Component {...ast.props} tokens={50} />;\n}`,
  },
  {
    id: 'comp-video-showcase',
    title: 'VideoShowcase.tsx',
    filePath: 'src/components/VideoShowcase.tsx',
    fpsTarget: '60 FPS REMOTION',
    badge: 'NODE 02 · REMOTION 60FPS',
    description: '4-Slot Lego Assembly & Hyperbolic Lattice Cage Stage',
    zPos: 2.6,
    xPos: 1.4,
    yPos: 1.85,
    accentHex: 0x5322ff,
    screenSlotIndex: 1,
    metrics: { renderMs: '0.85ms', astNodes: 64, memoryKb: 310 },
    codePreview: `export const VideoShowcase: React.FC<RemotionSpec> = ({ fps = 60 }) => {\n  const frame = useCurrentFrame();\n  return <HyperbolicLatticeStage frame={frame} fps={fps} />;\n};`,
  },
  {
    id: 'comp-flipbook-engine',
    title: 'FlipBookEngine.tsx',
    filePath: 'src/components/flipbook/FlipBookEngine.tsx',
    fpsTarget: 'CANVAS ENGINE V3.0',
    badge: 'NODE 03 · BANNER STUDIO',
    description: 'Plug & Play Studio Banner & Genetic Algorithm Artifact Engine',
    zPos: 1.5,
    xPos: -1.28,
    yPos: 1.22,
    accentHex: 0x10b981,
    screenSlotIndex: 2,
    metrics: { renderMs: '0.61ms', astNodes: 36, memoryKb: 198 },
    codePreview: `export class BannerAndFlipBookEngine {\n  synthesizeArtifact(seed = 0x61668035) {\n    return renderSwissGridCanvas(1584, 396, seed);\n  }\n}`,
  },
  {
    id: 'comp-studio-configurator',
    title: 'CraftStudioConfigurator.tsx',
    filePath: 'src/components/studio/CraftStudioConfigurator.tsx',
    fpsTarget: 'IN-MEMORY STREAM',
    badge: 'NODE 04 · CRAFT DEPLOY',
    description: 'Ship Your First Agent Node in 90s · CLI, Blueprint & Webhook',
    zPos: 0.7,
    xPos: 1.3,
    yPos: 1.22,
    accentHex: 0x00e5ff,
    screenSlotIndex: 3,
    metrics: { renderMs: '0.33ms', astNodes: 52, memoryKb: 142 },
    codePreview: `export function CraftStudioConfigurator() {\n  const [step, setStep] = useWizardStep(5);\n  return <LiveSandboxStream ast={compileInMemory(step)} />;\n}`,
  },
];

/**
 * Exact standardized `repository-tree.json` document for artificialcraft.space
 */
export const DEFAULT_REPOSITORY_TREE_DOCUMENT: RepositoryTreeDocument = {
  systemIdentity: 'ARTIFICIAL CRAFT (CRAFT//CODE)',
  targetPlatform: 'https://artificialcraft.space/',
  architecturalParadigm:
    '0-Code JSON-Driven Architecture & Decoupled 3-Tier System',
  tree: {
    id: 'root',
    label: 'artificialcraft.space',
    type: 'directory',
    path: '/',
    zone: 'Zone 03: Directory Tree',
    layer: 'midground',
    children: [
      {
        id: 'agent-md',
        label: 'AGENT.md',
        type: 'file',
        path: '/AGENT.md',
        layer: 'foreground',
        description: 'AI Worker Operational Governance Rules & GitOps Protocol',
        tokenEstimate: '~50 tokens',
        colorHex: '#00E5FF',
      },
      {
        id: 'agent-flipbook-spec',
        label: 'AGENT_FLIPBOOK_SPEC.md',
        type: 'file',
        path: '/AGENT_FLIPBOOK_SPEC.md',
        layer: 'foreground',
        description: 'Technical Specification for 3D Flipbooks',
        tokenEstimate: '~50 tokens',
        colorHex: '#00E5FF',
      },
      {
        id: 'site-configs',
        label: 'site-configs',
        type: 'directory',
        path: '/site-configs',
        layer: 'foreground',
        children: [
          {
            id: 'template-schema-json',
            label: 'template-schema.json',
            type: 'file',
            path: '/site-configs/template-schema.json',
            layer: 'foreground',
            description:
              'Single Source of Truth for Homepage Sections (0-Code Operations)',
            ssotKey: 'homepage-layout',
            colorHex: '#10B981',
          },
        ],
      },
      {
        id: 'src',
        label: 'src',
        type: 'directory',
        path: '/src',
        layer: 'midground',
        children: [
          {
            id: 'src-app',
            label: 'app',
            type: 'directory',
            path: '/src/app',
            layer: 'midground',
            children: [
              {
                id: 'src-app-api',
                label: 'api/craft/generate',
                type: 'directory',
                path: '/src/app/api/craft/generate',
                layer: 'midground',
                children: [
                  {
                    id: 'api-route-ts',
                    label: 'route.ts',
                    type: 'file',
                    path: '/src/app/api/craft/generate/route.ts',
                    layer: 'midground',
                    description:
                      'Next.js API Proxy Route & Zod Validation Gate',
                    zodValidated: true,
                    colorHex: '#5322FF',
                  },
                ],
              },
              {
                id: 'src-app-studio',
                label: 'studio',
                type: 'directory',
                path: '/src/app/studio',
                layer: 'foreground',
                children: [
                  {
                    id: 'studio-page-tsx',
                    label: 'page.tsx',
                    type: 'file',
                    path: '/src/app/studio/page.tsx',
                    layer: 'foreground',
                    description:
                      'Main Route Page embedding Studio Configurator Shell',
                    colorHex: '#00E5FF',
                  },
                ],
              },
            ],
          },
          {
            id: 'src-components',
            label: 'components',
            type: 'directory',
            path: '/src/components',
            layer: 'foreground',
            children: [
              {
                id: 'dynamic-section-renderer',
                label: 'DynamicSectionRenderer.tsx',
                type: 'file',
                path: '/src/components/DynamicSectionRenderer.tsx',
                layer: 'foreground',
                description: 'Dynamic JSON AST Homepage Renderer',
                colorHex: '#00E5FF',
              },
              {
                id: 'video-showcase',
                label: 'VideoShowcase.tsx',
                type: 'file',
                path: '/src/components/VideoShowcase.tsx',
                layer: 'foreground',
                description: '60 FPS Remotion Video Showcase Player',
                colorHex: '#00E5FF',
              },
              {
                id: 'flipbook-engine',
                label: 'FlipBookEngine.tsx',
                type: 'file',
                path: '/src/components/flipbook/FlipBookEngine.tsx',
                layer: 'foreground',
                description: 'Interactive 3D Flipbook Reader',
                colorHex: '#00E5FF',
              },
              {
                id: 'craft-studio-configurator',
                label: 'CraftStudioConfigurator.tsx',
                type: 'file',
                path: '/src/components/studio/CraftStudioConfigurator.tsx',
                layer: 'foreground',
                description: '5-Step Wizard Dock & Live Preview Sandbox',
                colorHex: '#00E5FF',
              },
            ],
          },
          {
            id: 'src-core',
            label: 'core',
            type: 'directory',
            path: '/src/core',
            layer: 'midground',
            children: [
              {
                id: 'core-registry-ts',
                label: 'registry.ts',
                type: 'file',
                path: '/src/core/registry.ts',
                layer: 'midground',
                description:
                  'CENTRAL SSOT: Graphic Component & Preset Registry',
                registeredPresets: [
                  'swiss-hud',
                  'isometric-matrix',
                  'bento-3d',
                  'logarithmic-spiral',
                  'code-editor',
                  'rubik-3d',
                  'dual-engine',
                ],
                colorHex: '#5322FF',
              },
              {
                id: 'remotion-presets',
                label: 'remotion-presets',
                type: 'directory',
                path: '/src/core/remotion-presets',
                layer: 'midground',
                description: 'Procedural 3D/HUD/Canvas Component Store',
              },
            ]
          },
          {
            id: 'src-lib',
            label: 'lib',
            type: 'directory',
            path: '/src/lib',
            layer: 'midground',
            children: [
              {
                id: 'studio-ast-generator',
                label: 'studioAstGenerator.ts',
                type: 'file',
                path: '/src/lib/studioAstGenerator.ts',
                layer: 'midground',
                description: 'AST Generator & Local Fallback Compiler',
                colorHex: '#5322FF',
              },
            ],
          },
          {
            id: 'src-types',
            label: 'types',
            type: 'directory',
            path: '/src/types',
            layer: 'midground',
            children: [
              {
                id: 'craft-studio-types',
                label: 'craft-studio.ts',
                type: 'file',
                path: '/src/types/craft-studio.ts',
                layer: 'midground',
                description: 'TypeScript Interfaces & Zod Validation Gates',
                colorHex: '#5322FF',
              },
            ],
          },
        ],
      },
    ],
  },
};

/**
 * Converts any valid `repository-tree.json` payload (either wrapped in `{ systemIdentity, tree }`
 * or a direct root `RawSpatialTreeNode`) into a normalized 3D `DirectoryNode` hierarchy with
 * non-overlapping spatial offsets strictly elevated above the Obsidian Mirror Pool.
 */
export function parseSpatialRepositoryTree(
  input: unknown
): {
  docMeta: {
    systemIdentity: string;
    targetPlatform: string;
    architecturalParadigm: string;
  };
  rootNode: DirectoryNode;
} {
  const obj = (input && typeof input === 'object' ? input : {}) as Record<
    string,
    unknown
  >;

  const rawRoot: RawSpatialTreeNode =
    obj.tree && typeof obj.tree === 'object'
      ? (obj.tree as RawSpatialTreeNode)
      : (obj as RawSpatialTreeNode);

  const docMeta = {
    systemIdentity: String(
      obj.systemIdentity || 'ARTIFICIAL CRAFT (CRAFT//CODE)'
    ),
    targetPlatform: String(
      obj.targetPlatform || 'https://artificialcraft.space/'
    ),
    architecturalParadigm: String(
      obj.architecturalParadigm ||
        '0-Code JSON-Driven Architecture & Decoupled 3-Tier System'
    ),
  };

  const buildNode = (
    raw: RawSpatialTreeNode,
    depth: number,
    siblingIdx: number,
    siblingCount: number
  ): DirectoryNode => {
    const label = String(raw.label || raw.name || `node-${siblingIdx}`);
    const isDir =
      raw.type === 'directory' ||
      raw.type === 'folder' ||
      raw.kind === 'folder' ||
      Array.isArray(raw.children);
    const kind: 'folder' | 'file' = isDir ? 'folder' : 'file';
    const layer: SpatialLayerType =
      raw.layer === 'foreground' ||
      raw.layer === 'midground' ||
      raw.layer === 'background'
        ? raw.layer
        : kind === 'folder'
          ? 'midground'
          : 'foreground';

    const defaultColor =
      layer === 'foreground'
        ? '#00E5FF'
        : layer === 'midground'
          ? '#5322FF'
          : '#10B981';
    const colorHex = String(raw.colorHex || defaultColor);

    const tokenEstimate = String(
      raw.tokenEstimate || `~${raw.tokens || 50} tokens`
    );
    const numericTokens =
      typeof raw.tokens === 'number'
        ? raw.tokens
        : Number((tokenEstimate.match(/\d+/) || [50])[0]);

    const path = String(raw.path || `/${label}`);
    const role = String(
      raw.description ||
        raw.role ||
        (kind === 'folder'
          ? `Spatial Directory Module (${layer.toUpperCase()})`
          : `Spatial AST File Node (${layer.toUpperCase()})`)
    );

    // Synthesize rich Zod Contract & TypeScript Interface from node metadata
    let zodContract = raw.zodContract || '';
    if (!zodContract) {
      if (raw.zodValidated) {
        zodContract =
          'z.object({ prompt: z.string(), astVersion: z.literal("v2"), zodValidated: z.literal(true) })';
      } else if (raw.ssotKey) {
        zodContract = `z.object({ ssotKey: z.literal("${raw.ssotKey}"), zeroCode: z.literal(true) })`;
      } else if (
        Array.isArray(raw.registeredPresets) &&
        raw.registeredPresets.length > 0
      ) {
        zodContract = `z.enum([${raw.registeredPresets
          .slice(0, 4)
          .map((p) => `"${p}"`)
          .join(', ')}])`;
      } else {
        zodContract = `z.object({ path: z.literal("${path}"), layer: z.literal("${layer}") })`;
      }
    }

    let tsInterface = raw.tsInterface || '';
    if (!tsInterface) {
      if (
        Array.isArray(raw.registeredPresets) &&
        raw.registeredPresets.length > 0
      ) {
        tsInterface = `export const REGISTERED_PRESETS = [\n  ${raw.registeredPresets
          .map((p) => `"${p}"`)
          .join(', ')}\n] as const;`;
      } else if (raw.ssotKey) {
        tsInterface = `export interface SSOTConfig {\n  ssotKey: "${raw.ssotKey}";\n  path: "${path}";\n  layer: "${layer}";\n}`;
      } else if (raw.zodValidated) {
        tsInterface = `export async function POST(req: Request) {\n  // Zod Validation Gate Active\n  return verifyAndProxyToDify(req);\n}`;
      } else {
        tsInterface = `export interface SpatialNodeSpec {\n  id: "${
          raw.id || label
        }";\n  path: "${path}";\n  layer: "${layer}";\n}`;
      }
    }

    // Compute balanced 3D spatial offset relative to parent
    let offset: [number, number, number] = [0, 0, 0];
    if (depth === 0) {
      offset = [0, 1.78, -1.0];
    } else {
      const normalizedIdx =
        siblingCount === 1
          ? 0
          : (siblingIdx / (siblingCount - 1)) * 2 - 1; // -1 to +1
      const spreadX =
        depth === 1 ? 1.85 : depth === 2 ? 1.45 : depth === 3 ? 0.95 : 0.68;
      const xOff =
        siblingCount === 1
          ? depth % 2 === 0
            ? 0.42
            : -0.42
          : normalizedIdx * spreadX;

      // Alternate vertical arch so siblings never collide and stay high above the water pool
      const archY =
        siblingCount === 1
          ? 0.16
          : Math.cos(normalizedIdx * Math.PI * 0.65) * 0.36 +
            (siblingIdx % 2 === 0 ? 0.14 : -0.12);

      // Layer-aware Z depth step
      const layerZStep =
        layer === 'foreground'
          ? -0.58
          : layer === 'midground'
            ? -0.82
            : -1.08;

      offset = [xOff, archY, layerZStep];
    }

    const rawChildren = Array.isArray(raw.children) ? raw.children : [];
    const children = rawChildren.map((child, idx) =>
      buildNode(child, depth + 1, idx, rawChildren.length)
    );

    return {
      id: String(raw.id || `node-${depth}-${siblingIdx}-${label}`),
      name: label,
      path,
      kind,
      layer,
      colorHex,
      role,
      tokenEstimate,
      tokens: numericTokens,
      ssotKey: raw.ssotKey,
      zodValidated: raw.zodValidated,
      registeredPresets: raw.registeredPresets,
      zodContract,
      tsInterface,
      positionOffset: offset,
      expanded: raw.expanded !== false,
      children,
    };
  };

  return {
    docMeta,
    rootNode: buildNode(rawRoot, 0, 0, 1),
  };
}

export const DEFAULT_REPOSITORY_TREE: DirectoryNode =
  parseSpatialRepositoryTree(DEFAULT_REPOSITORY_TREE_DOCUMENT).rootNode;
