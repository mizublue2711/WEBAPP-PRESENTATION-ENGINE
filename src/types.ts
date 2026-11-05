export type ThemePresetId = 'cybernetic_swiss' | 'titanium_mono' | 'amber_gold';

export type SpatialLayerType = 'foreground' | 'midground' | 'background';

export interface ThemePalette {
  id: ThemePresetId;
  name: string;
  bgHex: number;
  bgCss: string;
  primaryHex: number;
  primaryCss: string;
  secondaryHex: number;
  secondaryCss: string;
  accentHex: number;
  accentCss: string;
  surfaceHex: number;
  surfaceCss: string;
  gridHex: number;
}

export interface ScreenSlotConfig {
  slotIndex: 0 | 1 | 2 | 3;
  label: string;
  label_vi?: string;
  label_en?: string;
  nodeTitle: string;
  nodeTitle_vi?: string;
  nodeTitle_en?: string;
  subtitle: string;
  subtitle_vi?: string;
  subtitle_en?: string;
  badge: string;
  badge_vi?: string;
  badge_en?: string;
  imageUrl: string;
  accentCss: string;
}

/**
 * Raw schema format for `repository-tree.json` uploaded or pasted in Tab 02.
 */
export interface RawSpatialTreeNode {
  id?: string;
  label?: string;
  label_vi?: string;
  label_en?: string;
  name?: string;
  type?: 'directory' | 'file' | 'folder';
  kind?: 'folder' | 'file';
  path?: string;
  zone?: string;
  layer?: SpatialLayerType;
  description?: string;
  description_vi?: string;
  description_en?: string;
  role?: string;
  role_vi?: string;
  role_en?: string;
  tokenEstimate?: string;
  tokens?: number;
  colorHex?: string;
  ssotKey?: string;
  zodValidated?: boolean;
  registeredPresets?: string[];
  zodContract?: string;
  tsInterface?: string;
  expanded?: boolean;
  children?: RawSpatialTreeNode[];
}

export interface RepositoryTreeDocument {
  systemIdentity: string;
  targetPlatform: string;
  architecturalParadigm: string;
  tree: RawSpatialTreeNode;
}

/**
 * Normalized runtime 3D node with computed non-overlapping spatial coordinates.
 */
export interface DirectoryNode {
  id: string;
  name: string;
  path: string;
  kind: 'folder' | 'file';
  layer: SpatialLayerType;
  colorHex: string;
  role: string;
  tokenEstimate: string;
  tokens: number;
  ssotKey?: string;
  zodValidated?: boolean;
  registeredPresets?: string[];
  zodContract: string;
  tsInterface: string;
  positionOffset: [number, number, number];
  expanded?: boolean;
  children?: DirectoryNode[];
}

export interface ExplodedComponentSpec {
  id: string;
  title: string;
  filePath: string;
  fpsTarget: string;
  badge: string;
  badge_vi?: string;
  badge_en?: string;
  description: string;
  description_vi?: string;
  description_en?: string;
  zPos: number;
  xPos: number;
  yPos: number;
  accentHex: number;
  screenSlotIndex: 0 | 1 | 2 | 3;
  metrics: {
    renderMs: string;
    astNodes: number;
    memoryKb: number;
  };
  codePreview: string;
}

export type CameraStateMode = 'TUNNEL_FLIGHT_MODE' | 'NODE_INSPECT_MODE';

export interface SpatialConfigState {
  cameraMode: CameraStateMode;
  anchorProgress: number; // Stored tunnel progress (0..1) before entering NODE_INSPECT_MODE
  focusedNodeId: string | null;
  isRecordingVideo: boolean;
  recordingProgress: number; // 0 to 100 percentage during 6-second .webm export
  flightMode: 'AUTO-FLY' | 'MANUAL';
  progress: number; // 0 to 1 along tunnel Z (+10.2m to -7.6m)
  flightVelocity: number; // cruise speed multiplier
  lerpSensitivity: number; // 0.01 to 0.20
  themeId: ThemePresetId;
  explodedScale: number; // 0.5 to 2.2
  fogEnabled: boolean;
  starDensity: number; // 100 to 900
  bloomStrength: number; // 0.2 to 2.0
  audioMuted: boolean;
  activeZoneIndex: number; // 0..3
  selectedScreenSlot: 0 | 1 | 2 | 3;
  autoAdvanceScreenSlot: boolean;
  screenSlots: ScreenSlotConfig[];
  systemIdentity: string;
  targetPlatform: string;
  architecturalParadigm: string;
  uiSurfaceTitle: string;
  uiSurfaceSubtitle: string;
  uiSurfaceTag: string;
  uiSurfaceAccent: string;
  uiSurfaceCustomHtml: string;
}

