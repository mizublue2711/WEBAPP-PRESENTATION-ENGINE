import gsap from 'gsap';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import * as xb from 'xrblocks';
import { CyberAudioSynth } from './audioSynth';
import {
  DEFAULT_REPOSITORY_TREE,
  EXPLODED_COMPONENTS,
  INITIAL_STATE,
  THEME_PALETTES,
  ZONE_MARKERS,
} from './constants';
import {
  createBinaryMatrixAtlasTexture,
  createExplodedComponentTexture,
  createMonolithBannerTexture,
  createNodeLabelTexture,
  createObsidianConcreteFloorTexture,
  createTitaniumRoughnessTexture,
  createZone01ScreenSlotTexture,
} from './proceduralTextures';
import { SpatialInspectorCard } from './spatialInspectorCard';
import {
  DirectoryNode,
  SpatialConfigState,
  ThemePalette,
} from './types';
import { SpatialControlDockUI } from './uiDock';

// Pre-allocated scratch math objects to prevent GC in 60 FPS loop
const _dummyObj = new THREE.Object3D();
const _scratchVec3 = new THREE.Vector3();
const _nodeWorldPos = new THREE.Vector3();
const _raycaster = new THREE.Raycaster();
const _pointerNdc = new THREE.Vector2();

interface RuntimeTreeNode {
  data: DirectoryNode;
  parent: RuntimeTreeNode | null;
  group: THREE.Group;
  hitMesh: THREE.Mesh;
  wireframeMat: THREE.LineBasicMaterial;
  beaconMat: THREE.MeshStandardMaterial;
  labelMesh: THREE.Mesh;
  baseLocalPos: THREE.Vector3;
  worldTargetPos: THREE.Vector3;
  branchLine: THREE.Line | null;
  branchGeometry: THREE.BufferGeometry | null;
  branchStart: THREE.Vector3;
  branchMid: THREE.Vector3;
  branchEnd: THREE.Vector3;
  branchProgress: number;
  targetBranchProgress: number;
  children: RuntimeTreeNode[];
}

interface PollenBurst {
  points: THREE.Points;
  velocities: Float32Array;
  age: number;
  maxAge: number;
}

export class SpatialAppConfigurator3D extends xb.Script {
  private state: SpatialConfigState = {
    ...INITIAL_STATE,
    screenSlots: INITIAL_STATE.screenSlots.map((s) => ({ ...s })),
  };
  private repositoryTree: DirectoryNode = JSON.parse(
    JSON.stringify(DEFAULT_REPOSITORY_TREE)
  );
  private audio = new CyberAudioSynth();
  private dockUI!: SpatialControlDockUI;
  private inspectorCard!: SpatialInspectorCard;

  // Root moving tunnel container so flight works identically in Desktop & XR Headset
  private tunnelWorld = new THREE.Group();

  // Camera virtual Z position along the tunnel (+10.2m -> -7.6m) & Dual-State Machine (TUNNEL_FLIGHT_MODE vs NODE_INSPECT_MODE)
  private currentVirtualCamZ = 10.2;
  private targetVirtualCamZ = 10.2;
  private anchorVirtualCamZ = 10.2;
  private anchorCamPos = new THREE.Vector3(0, 1.62, 10.2);
  private dispersionReferenceZ = 10.2;
  private isGsapTransitioning = false;
  private virtualCamRig = {
    x: 0,
    y: 1.62,
    z: 10.2,
    lookX: 0,
    lookY: 1.6,
    lookZ: -20,
  };
  private elapsedTime = 0;
  private isSoftwareGl = false;

  // Client-Side Auto-Fly Motion Video Exporter (.WEBM)
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: BlobPart[] = [];
  private recordingElapsedSec = 0;
  private readonly recordingDurationSec = 6.0;

  // Shared procedural maps
  private titaniumBumpTex!: THREE.DataTexture;
  private concreteFloorTex!: THREE.CanvasTexture;
  private binaryAtlasTex!: THREE.CanvasTexture;
  private maxAnisotropy = 4;

  // Loaded HTMLImageElement for each of the 4 Screen Slots (0, 1, 2, 3)
  private slotImages: Array<HTMLImageElement | null> = [null, null, null, null];

  // Zone 01: 4 Individual Glass Screens
  private zone01Group = new THREE.Group();
  private zone01Quadrants: THREE.Group[] = [];
  private zone01Textures: THREE.CanvasTexture[] = [];
  private readonly ZONE01_Z = 7.6;

  // Zone 02: Exploded Components Matrix
  private zone02Group = new THREE.Group();
  private zone02Modules: Array<{
    group: THREE.Group;
    screenMesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
    basePos: THREE.Vector3;
    specIdx: number;
    borderMat: THREE.LineBasicMaterial;
  }> = [];
  private zone02ConnectorLines!: THREE.LineSegments;

  // Zone 03: Zod Gate + Interactive 3D Directory Tree
  private zone03Group = new THREE.Group();
  private zodGateGroup = new THREE.Group();
  private zodInnerRing!: THREE.Mesh;
  private zodOuterRing!: THREE.Mesh;
  private treeRootGroup = new THREE.Group();
  private runtimeNodes: RuntimeTreeNode[] = [];
  private interactiveHitMeshes: THREE.Object3D[] = [];
  private selectedRuntimeNode: RuntimeTreeNode | null = null;
  private pollenBursts: PollenBurst[] = [];
  private readonly ZONE03_BASE_Z = -1.5;

  // Zone 04 & Deep Midnight Architecture:
  // Sky Dome, Binary Galaxy, Indoor Cleanroom, Outdoor Courtyard, Obsidian Mirror Pool, Quartz Tubes, Volumetric Cones
  private architectureGroup = new THREE.Group();
  private skyDomeShaderMat!: THREE.ShaderMaterial;
  private mirrorPoolShaderMat!: THREE.ShaderMaterial;
  private volumetricConeMats: THREE.ShaderMaterial[] = [];
  private laserHaloMats: THREE.ShaderMaterial[] = [];

  private zone04Group = new THREE.Group();
  private difyCoreGroup = new THREE.Group();
  private n8nCoreGroup = new THREE.Group();
  private starfieldPoints!: THREE.Points;
  private starfieldShaderMat!: THREE.ShaderMaterial;
  private readonly ZONE04_Z = -8.2;

  // Tunnel Swiss Grid & Instanced Rivet/Anchor Nodes
  private tunnelGridLines!: THREE.LineSegments;
  private anchorInstancedMesh!: THREE.InstancedMesh;
  private readonly ANCHOR_COUNT = 160;

  // High-Contrast Chiaroscuro Lights (Deep Midnight 01:00 AM)
  private keyLight!: THREE.DirectionalLight;
  private ambientLight!: THREE.AmbientLight;
  private fillLight!: THREE.HemisphereLight;
  private indigoSpotLeft!: THREE.SpotLight;
  private indigoSpotRight!: THREE.SpotLight;
  private cyanRimPoint!: THREE.PointLight;

  public init(): void {
    const renderer = xb.core?.renderer;
    if (renderer instanceof THREE.WebGLRenderer) {
      const gl = renderer.getContext();
      const dbg = gl.getExtension('WEBGL_debug_renderer_info');
      const gpuStr = String(
        gl.getParameter(dbg ? dbg.UNMASKED_RENDERER_WEBGL : gl.RENDERER)
      );
      this.isSoftwareGl =
        /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpuStr);

      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      renderer.shadowMap.enabled = !this.isSoftwareGl;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.maxAnisotropy = renderer.capabilities.getMaxAnisotropy() || 4;

      if (xb.core?.scene) {
        const pmrem = new THREE.PMREMGenerator(renderer);
        xb.core.scene.environment = pmrem.fromScene(
          new RoomEnvironment(),
          0.04
        ).texture;
        pmrem.dispose();
      }
    }

    this.titaniumBumpTex = createTitaniumRoughnessTexture();
    this.concreteFloorTex = createObsidianConcreteFloorTexture(
      this.maxAnisotropy
    );
    this.binaryAtlasTex = createBinaryMatrixAtlasTexture();

    this.add(this.tunnelWorld);

    this.setupDeepMidnightLightingAndAtmosphere();
    this.buildDeepMidnightArchitectureAndCourtyard();
    this.buildSwissTunnelCorridor();
    this.buildZone01SurfaceGlass();
    this.buildZone02ExplodedMatrix();
    this.buildZone03DirectoryTreeAndZodGate();
    this.buildZone04DeepAICoreAndBinaryGalaxy();

    // Preload the 3 Playground Screenshots into the 4 Screen Slots
    this.preloadInitialScreenSlotImages();

    // Add XR Blocks 3D Hologram Inspector Card (`xb.UICard`) into the tunnel world
    this.inspectorCard = new SpatialInspectorCard(
      () => {
        if (this.selectedRuntimeNode) {
          this.toggleDirectoryNodeBranchOnly(this.selectedRuntimeNode);
        }
      },
      () => {
        this.returnToTunnelFlight();
      }
    );
    this.tunnelWorld.add(this.inspectorCard.card);

    // Select `src/core/registry.ts` initially
    const defaultRegistryNode =
      this.runtimeNodes.find((n) => n.data.name === 'registry.ts') ||
      this.runtimeNodes[0];
    if (defaultRegistryNode) {
      this.selectNodeForInspector(defaultRegistryNode, false);
    }

    // Initialize 2D Cybernetic Swiss Collapsible Control Dock & Timeline Bar
    this.dockUI = new SpatialControlDockUI(
      this.state,
      this.repositoryTree,
      {
        onStateChange: (partial) => this.handleStateUpdate(partial),
        onJumpToZone: (zoneIndex) => this.jumpToZone(zoneIndex),
        onUploadScreenSlotImage: (slotIndex, img, dataUrl) => {
          this.applyImageToScreenSlot(slotIndex, img, dataUrl, true);
        },
        onAssignPresetToSlot: (slotIndex, imageUrl) => {
          this.loadPresetUrlIntoSlot(slotIndex, imageUrl);
        },
        onUpdateSlotText: (slotIndex, nodeTitle, subtitle) => {
          const slot = this.state.screenSlots[slotIndex];
          if (slot) {
            slot.nodeTitle = nodeTitle;
            slot.subtitle = subtitle;
            this.refreshZone01Textures();
            this.refreshZone02Textures();
            this.audio.playSurfaceSync();
            this.dockUI?.refreshCurrentTab();
          }
        },
        onSyncDirectoryJson: (newTree, meta) => {
          if (this.state.cameraMode === 'NODE_INSPECT_MODE') {
            this.returnToTunnelFlight();
          }
          this.repositoryTree = newTree;
          if (meta) {
            this.state.systemIdentity = meta.systemIdentity;
            this.state.targetPlatform = meta.targetPlatform;
            this.state.architecturalParadigm = meta.architecturalParadigm;
          }
          this.rebuildDirectoryTreeMeshes();
          this.dockUI?.syncTreeRoot(this.repositoryTree);
          const firstInteresting =
            this.runtimeNodes.find((n) => n.data.name === 'registry.ts') ||
            this.runtimeNodes[0];
          if (firstInteresting) {
            this.selectNodeForInspector(firstInteresting, false);
          }
          this.audio.playBranchBloom();
        },
        onExpandCollapseAll: (expanded) => {
          this.setAllTreeBranchesExpanded(expanded);
        },
        onFocusNodeById: (nodeId) => {
          const targetNode = this.runtimeNodes.find(
            (n) => n.data.id === nodeId
          );
          if (targetNode) {
            this.focusOnNode(targetNode);
          }
        },
        onReturnToTunnelFlight: () => {
          this.returnToTunnelFlight();
        },
        onExportAutoFlyVideo: () => {
          this.toggleOrStartAutoFlyVideoExport();
        },
      }
    );

    this.bindViewportInteractions();
  }

  /**
   * Preloads the default images for Screen 01, 02, 03, and 04 from `/assets/aistudio/...`
   */
  private preloadInitialScreenSlotImages(): void {
    this.state.screenSlots.forEach((slot) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.slotImages[slot.slotIndex] = img;
        this.refreshSingleScreenSlot(slot.slotIndex);
      };
      img.src = slot.imageUrl;
    });
  }

  private loadPresetUrlIntoSlot(
    slotIndex: 0 | 1 | 2 | 3,
    imageUrl: string
  ): void {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      this.applyImageToScreenSlot(slotIndex, img, imageUrl, false);
    };
    img.src = imageUrl;
  }

  /**
   * Replaces a specific screen slot's image texture in Zone 01 & Zone 02.
   * When `advanceIfEnabled` is true and `autoAdvanceScreenSlot` is ON, automatically
   * advances `selectedScreenSlot` to the next screen (01 -> 02 -> 03 -> 04) for sequential uploads!
   */
  private applyImageToScreenSlot(
    slotIndex: 0 | 1 | 2 | 3,
    img: HTMLImageElement,
    imageUrl: string,
    advanceIfEnabled: boolean
  ): void {
    this.slotImages[slotIndex] = img;
    const slot = this.state.screenSlots[slotIndex];
    if (slot) {
      slot.imageUrl = imageUrl;
    }

    if (advanceIfEnabled && this.state.autoAdvanceScreenSlot) {
      this.state.selectedScreenSlot = ((slotIndex + 1) % 4) as 0 | 1 | 2 | 3;
    }

    this.refreshZone01Textures();
    this.refreshSingleZone02Module(slotIndex);
    this.audio.playSurfaceSync();
    this.dockUI?.syncStateRef(this.state);
    this.dockUI?.refreshCurrentTab();
  }

  /**
   * Configures Deep Midnight (01:00 AM) High-Contrast Chiaroscuro Lighting & Electro-Volumetric Fog:
   * - FogExp2(0x090912, 0.012)
   * - Key Light (6500K #F4F8FF) angled 20 deg from above with 2048x2048 shadow map
   * - Ambient Light (#060810, intensity 0.15)
   * - Pair of Electric Indigo (#5322FF) SpotLights + Cyan Laser Rim PointLight
   */
  private setupDeepMidnightLightingAndAtmosphere(): void {
    const palette = this.getPalette();
    if (xb.core?.scene) {
      xb.core.scene.background = new THREE.Color(0x050508);
      xb.core.scene.fog = new THREE.FogExp2(0x090912, 0.012);
    }

    // 1. Ambient Light (#060810, intensity 0.15)
    this.ambientLight = new THREE.AmbientLight(0x060810, 0.15);
    this.add(this.ambientLight);

    // Subtle cool Hemisphere fill to preserve metallic PBR readability
    this.fillLight = new THREE.HemisphereLight(0x1e293b, 0x050508, 0.85);
    this.add(this.fillLight);

    // 2. Key Light (6500K industrial cool white #F4F8FF) angled 20° from above with 2048x2048 shadows
    this.keyLight = new THREE.DirectionalLight(0xf4f8ff, 2.8);
    // 20 degree tilt from vertical zenith
    const tiltRad = THREE.MathUtils.degToRad(20);
    this.keyLight.position.set(
      Math.sin(tiltRad) * 12,
      Math.cos(tiltRad) * 12,
      4.5
    );
    if (!this.isSoftwareGl) {
      this.keyLight.castShadow = true;
      this.keyLight.shadow.mapSize.set(2048, 2048);
      this.keyLight.shadow.camera.near = 1;
      this.keyLight.shadow.camera.far = 28;
      const d = 10;
      this.keyLight.shadow.camera.left = -d;
      this.keyLight.shadow.camera.right = d;
      this.keyLight.shadow.camera.top = d;
      this.keyLight.shadow.camera.bottom = -d;
      this.keyLight.shadow.bias = -0.0005;
      this.keyLight.shadow.normalBias = 0.02;
    }
    this.add(this.keyLight);

    // 3. Pair of Electric Indigo (#5322FF) Rim SpotLights
    this.indigoSpotLeft = new THREE.SpotLight(
      palette.secondaryHex,
      14,
      24,
      Math.PI / 5,
      0.45,
      1.2
    );
    this.indigoSpotLeft.position.set(-4.2, 4.8, 2.5);
    this.indigoSpotLeft.target.position.set(0, 0.5, -2.0);
    this.tunnelWorld.add(this.indigoSpotLeft);
    this.tunnelWorld.add(this.indigoSpotLeft.target);

    this.indigoSpotRight = new THREE.SpotLight(
      palette.secondaryHex,
      14,
      24,
      Math.PI / 5,
      0.45,
      1.2
    );
    this.indigoSpotRight.position.set(4.2, 4.8, -3.5);
    this.indigoSpotRight.target.position.set(0, 0.5, -6.5);
    this.tunnelWorld.add(this.indigoSpotRight);
    this.tunnelWorld.add(this.indigoSpotRight.target);

    // 4. Cyan Laser Core PointLight
    this.cyanRimPoint = new THREE.PointLight(palette.primaryHex, 5.0, 20);
    this.cyanRimPoint.position.set(0, 2.2, -2.0);
    this.tunnelWorld.add(this.cyanRimPoint);
  }

  /**
   * Builds the Deep Midnight (01:00 AM) Architectural Environment:
   * - Sky Dome Shader (#050508 zenith -> #090912 horizon)
   * - Outdoor Courtyard Obsidian Floor (#09090B, roughness: 0.15, 1px micro-drainage grooves) at Y = -0.45m
   * - 60 FPS Reflective Obsidian Mirror Water Pool at Y = -0.42m (OPAQUE with depthWrite: true, renderOrder: -15
   *   so it NEVER overlaps any 3D screen, directory node, or Hologram card!)
   * - Indoor Cleanroom Transparent Glass Curtain Walls + Concrete Piers + Matte Titanium (#18181E) Beams
   * - Two Towering Exterior Glass Monoliths & Transparent Quartz Glass Conduits (transmission: 0.95)
   * - Electro-Volumetric Light Shaft Cones & 1px Cyan Laser Beams with Additive Bloom Halos
   */
  private buildDeepMidnightArchitectureAndCourtyard(): void {
    this.tunnelWorld.add(this.architectureGroup);
    const palette = this.getPalette();

    // 1. Deep Midnight Sky Dome Shader (#050508 zenith -> #090912 horizon)
    const skyGeo = new THREE.SphereGeometry(34, 40, 24);
    this.skyDomeShaderMat = new THREE.ShaderMaterial({
      uniforms: {
        uZenithColor: { value: new THREE.Color(0x050508) },
        uHorizonColor: { value: new THREE.Color(0x090912) },
        uIndigoGlow: { value: new THREE.Color(palette.secondaryHex) },
        uTime: { value: 0 },
      },
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vWorldPos;
        uniform vec3 uZenithColor;
        uniform vec3 uHorizonColor;
        uniform vec3 uIndigoGlow;
        uniform float uTime;

        void main() {
          vec3 dir = normalize(vWorldPos);
          float h = clamp(dir.y * 0.8 + 0.2, 0.0, 1.0);
          vec3 col = mix(uHorizonColor, uZenithColor, smoothstep(0.0, 0.85, h));
          float horizonBand = exp(-abs(dir.y) * 9.0);
          col += uIndigoGlow * horizonBand * 0.12;
          gl_FragColor = vec4(col, 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
    });
    const skyDome = new THREE.Mesh(skyGeo, this.skyDomeShaderMat);
    skyDome.renderOrder = -20;
    skyDome.xb = { pointerEvents: 'none' };
    this.architectureGroup.add(skyDome);

    // 2. Outdoor Courtyard Polished Matte Obsidian Concrete Floor (#09090B, roughness: 0.15) at Y = -0.45m
    const floorGeo = new THREE.PlaneGeometry(28, 36);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x09090b,
      map: this.concreteFloorTex,
      roughness: 0.15,
      metalness: 0.35,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.position.set(0, -0.45, -1.0);
    floorMesh.receiveShadow = true;
    floorMesh.renderOrder = -16;
    floorMesh.xb = { pointerEvents: 'none' };
    this.architectureGroup.add(floorMesh);

    // 3. 60 FPS Obsidian Mirror Water Pool at Y = -0.42m
    // CRITICAL: transparent: false and depthWrite: true so it writes to the Z-buffer in the opaque pass
    // and can NEVER sort on top of any 3D node or Hologram card above it!
    const poolGeo = new THREE.PlaneGeometry(3.4, 24.5, 32, 64);
    poolGeo.rotateX(-Math.PI / 2);
    this.mirrorPoolShaderMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uCyanColor: { value: new THREE.Color(palette.primaryHex) },
        uIndigoColor: { value: new THREE.Color(palette.secondaryHex) },
        uBloomStrength: { value: this.state.bloomStrength },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPos;
        void main() {
          vUv = uv;
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying vec3 vPos;
        uniform float uTime;
        uniform vec3 uCyanColor;
        uniform vec3 uIndigoColor;
        uniform float uBloomStrength;

        void main() {
          float ripple = sin(vPos.z * 8.0 - uTime * 3.2) * cos(vPos.x * 12.0 + uTime * 2.1) * 0.015;
          vec2 uvDistort = vUv + vec2(ripple, ripple * 0.5);

          float centerLaser = exp(-abs(uvDistort.x - 0.5) * 38.0);
          float railLeft = exp(-abs(uvDistort.x - 0.12) * 32.0);
          float railRight = exp(-abs(uvDistort.x - 0.88) * 32.0);
          float zPulse = 0.55 + 0.45 * sin(vPos.z * 2.5 - uTime * 4.0);

          vec3 baseObsidian = vec3(0.02, 0.024, 0.038);
          vec3 refl = uCyanColor * (centerLaser * 0.72 + (railLeft + railRight) * 0.42) * zPulse * uBloomStrength;
          refl += uIndigoColor * exp(-abs(uvDistort.x - 0.5) * 7.0) * 0.25 * uBloomStrength;

          gl_FragColor = vec4(baseObsidian + refl, 1.0);
        }
      `,
      transparent: false,
      depthTest: true,
      depthWrite: true,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const mirrorPool = new THREE.Mesh(poolGeo, this.mirrorPoolShaderMat);
    mirrorPool.position.set(0, -0.42, -0.5);
    mirrorPool.renderOrder = -15;
    mirrorPool.xb = { pointerEvents: 'none' };
    this.architectureGroup.add(mirrorPool);

    // 4. Indoor Cleanroom Transparent Glass Curtain Walls + Concrete Piers + Titanium (#18181E) Beams
    const cleanroomWallGroup = new THREE.Group();
    cleanroomWallGroup.xb = { pointerEvents: 'none' };
    this.architectureGroup.add(cleanroomWallGroup);

    const glassWallMat = new THREE.MeshPhysicalMaterial({
      color: 0xdbeafe,
      transparent: true,
      opacity: this.isSoftwareGl ? 0.16 : 0.22,
      roughness: 0.08,
      metalness: 0.1,
      transmission: this.isSoftwareGl ? 0 : 0.88,
      ior: 1.52,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    const concretePierMat = new THREE.MeshStandardMaterial({
      color: 0x14151c,
      roughnessMap: this.concreteFloorTex,
      roughness: 0.75,
      metalness: 0.2,
    });

    const titaniumBeamMat = new THREE.MeshStandardMaterial({
      color: 0x18181e,
      roughnessMap: this.titaniumBumpTex,
      roughness: 0.42,
      metalness: 0.86,
    });

    // Left and Right Cleanroom Glass Curtain Walls at X = ±4.6m
    for (const side of [-1, 1]) {
      const wallX = side * 4.65;
      const glassPane = new THREE.Mesh(
        new THREE.PlaneGeometry(24, 3.6),
        glassWallMat
      );
      glassPane.rotation.y = side * (Math.PI / 2);
      glassPane.position.set(wallX, 1.44, -0.5);
      cleanroomWallGroup.add(glassPane);

      // Titanium Top & Bottom Longitudinal Beams (#18181E)
      const topBeam = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.16, 24.5),
        titaniumBeamMat
      );
      topBeam.position.set(wallX, 3.25, -0.5);
      cleanroomWallGroup.add(topBeam);

      const botBeam = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.12, 24.5),
        titaniumBeamMat
      );
      botBeam.position.set(wallX, -0.36, -0.5);
      cleanroomWallGroup.add(botBeam);

      // Cast Concrete Monolithic Structural Piers every 5m so exterior remains visible through wide glass bays
      for (let z = -10.5; z <= 9.5; z += 5.0) {
        const pier = new THREE.Mesh(
          new THREE.BoxGeometry(0.26, 3.68, 0.38),
          concretePierMat
        );
        pier.position.set(wallX + side * 0.08, 1.44, z);
        cleanroomWallGroup.add(pier);
      }
    }

    // 5. Outdoor Courtyard: Two Towering Exterior Glass Monoliths visible through the Cleanroom Glass Walls
    for (const side of [-1, 1]) {
      const towerGroup = new THREE.Group();
      towerGroup.position.set(side * 8.2, 4.5, -5.5);
      towerGroup.xb = { pointerEvents: 'none' };

      const towerCore = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 9.5, 1.8),
        new THREE.MeshStandardMaterial({
          color: 0x090912,
          roughness: 0.15,
          metalness: 0.88,
        })
      );
      towerGroup.add(towerCore);

      const towerCage = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(1.86, 9.56, 1.86)),
        new THREE.LineBasicMaterial({
          color: side < 0 ? palette.primaryHex : palette.secondaryHex,
          transparent: true,
          opacity: 0.7,
        })
      );
      towerGroup.add(towerCage);

      this.architectureGroup.add(towerGroup);
    }

    // 6. Transparent Quartz Glass Tube Conduits (transmission: 0.95) running along the outer courtyard & ceiling
    const quartzMat = new THREE.MeshPhysicalMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: this.isSoftwareGl ? 0.28 : 1.0,
      transmission: this.isSoftwareGl ? 0 : 0.95,
      ior: 1.55,
      thickness: 1.2,
      roughness: 0.06,
      metalness: 0.05,
      clearcoat: 1.0,
      depthWrite: false,
    });

    const quartzTubePositions = [
      [-3.85, 2.95],
      [3.85, 2.95],
      [-5.6, 1.35],
      [5.6, 1.35],
    ];
    for (const [qx, qy] of quartzTubePositions) {
      const outerTubeGeo = new THREE.CylinderGeometry(0.085, 0.085, 22, 16, 1, true);
      outerTubeGeo.rotateX(Math.PI / 2);
      const outerTube = new THREE.Mesh(outerTubeGeo, quartzMat);
      outerTube.position.set(qx, qy, -1.0);
      outerTube.xb = { pointerEvents: 'none' };
      this.architectureGroup.add(outerTube);

      // Glowing inner filament core inside each quartz glass conduit
      const coreFilamentGeo = new THREE.CylinderGeometry(0.014, 0.014, 22, 8);
      coreFilamentGeo.rotateX(Math.PI / 2);
      const coreFilamentMat = new THREE.MeshBasicMaterial({
        color: qx < 0 ? palette.primaryHex : palette.secondaryHex,
      });
      const coreFilament = new THREE.Mesh(coreFilamentGeo, coreFilamentMat);
      coreFilament.position.set(qx, qy, -1.0);
      coreFilament.xb = { pointerEvents: 'none' };
      this.architectureGroup.add(coreFilament);
    }

    // 7. Electro-Volumetric Light Shaft Cones & 1px Cyan Laser Beams with Additive Bloom Halos
    const conePositions: Array<[number, number, number, number]> = [
      [-3.2, 3.2, 3.0, palette.secondaryHex],
      [3.2, 3.2, 0.2, palette.primaryHex],
      [-3.0, 3.2, -3.2, palette.secondaryHex],
      [3.0, 3.2, -6.5, palette.primaryHex],
    ];
    for (const [cx, cy, cz, cHex] of conePositions) {
      const coneGeo = new THREE.ConeGeometry(1.45, 3.4, 24, 1, true);
      const coneMat = new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color(cHex) },
          uStrength: { value: this.state.bloomStrength },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec2 vUv;
          uniform vec3 uColor;
          uniform float uStrength;
          void main() {
            float verticalFade = smoothstep(0.0, 0.95, vUv.y);
            float alpha = verticalFade * (1.0 - vUv.y * 0.5) * 0.11 * uStrength;
            gl_FragColor = vec4(uColor, alpha);
          }
        `,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      });
      this.volumetricConeMats.push(coneMat);

      const coneMesh = new THREE.Mesh(coneGeo, coneMat);
      coneMesh.position.set(cx, cy - 1.6, cz);
      coneMesh.rotation.z = cx < 0 ? -0.26 : 0.26;
      coneMesh.xb = { pointerEvents: 'none' };
      this.architectureGroup.add(coneMesh);
    }

    // 1px Cyan Laser Beams with Additive Bloom Halos running down the Z-axis
    const laserRails = [
      [-1.7, -0.36],
      [1.7, -0.36],
      [-4.55, 1.62],
      [4.55, 1.62],
    ];
    for (const [lx, ly] of laserRails) {
      const haloGeo = new THREE.CylinderGeometry(0.035, 0.035, 24, 12, 1, true);
      haloGeo.rotateX(Math.PI / 2);
      const haloMat = new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color(palette.primaryHex) },
          uStrength: { value: this.state.bloomStrength },
        },
        vertexShader: `
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec3 vNormal;
          uniform vec3 uColor;
          uniform float uStrength;
          void main() {
            float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
            gl_FragColor = vec4(uColor, clamp(intensity * 0.38 * uStrength, 0.0, 0.85));
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      this.laserHaloMats.push(haloMat);

      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      haloMesh.position.set(lx, ly, -0.5);
      haloMesh.xb = { pointerEvents: 'none' };
      this.architectureGroup.add(haloMesh);
    }
  }

  /**
   * Builds the 1px Swiss Grid perspective corridor and 160 InstancedMesh 1px Titanium rivets & anchor nodes.
   */
  private buildSwissTunnelCorridor(): void {
    const palette = this.getPalette();
    const positions: number[] = [];

    const tunnelMinZ = -13;
    const tunnelMaxZ = 12;
    const width = 4.6;
    const floorY = -0.40;
    const ceilY = 3.25;

    // Longitudinal Z rails
    const railX = [-width, -width * 0.5, 0, width * 0.5, width];
    for (const x of railX) {
      positions.push(x, floorY, tunnelMaxZ, x, floorY, tunnelMinZ);
      positions.push(x, ceilY, tunnelMaxZ, x, ceilY, tunnelMinZ);
    }

    // Cross-sectional Swiss grid frames every 1.25m along Z
    for (let z = tunnelMinZ; z <= tunnelMaxZ; z += 1.25) {
      positions.push(-width, floorY, z, width, floorY, z);
      positions.push(-width, ceilY, z, width, ceilY, z);
      positions.push(-width, floorY, z, -width, ceilY, z);
      positions.push(width, floorY, z, width, ceilY, z);
    }

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    );
    const lineMat = new THREE.LineBasicMaterial({
      color: palette.gridHex,
      transparent: true,
      opacity: 0.6,
    });
    this.tunnelGridLines = new THREE.LineSegments(lineGeo, lineMat);
    this.tunnelGridLines.xb = { pointerEvents: 'none' };
    this.tunnelWorld.add(this.tunnelGridLines);

    // 160 InstancedMesh precision Titanium rivets & cross-anchor nodes along the tunnel beams
    const anchorGeo = new THREE.OctahedronGeometry(0.028, 0);
    const anchorMat = new THREE.MeshStandardMaterial({
      color: palette.primaryHex,
      emissive: palette.primaryHex,
      emissiveIntensity: 0.9,
      roughness: 0.2,
      metalness: 0.85,
    });
    this.anchorInstancedMesh = new THREE.InstancedMesh(
      anchorGeo,
      anchorMat,
      this.ANCHOR_COUNT
    );
    this.anchorInstancedMesh.frustumCulled = false;
    this.anchorInstancedMesh.xb = { pointerEvents: 'none' };

    let idx = 0;
    for (let z = tunnelMinZ; z < tunnelMaxZ && idx < this.ANCHOR_COUNT; z += 0.65) {
      const corners = [
        [-width, floorY],
        [width, floorY],
        [-width, ceilY],
        [width, ceilY],
      ];
      for (const [cx, cy] of corners) {
        if (idx >= this.ANCHOR_COUNT) break;
        _dummyObj.position.set(cx, cy, z);
        _dummyObj.rotation.set(0, z * 0.5, 0);
        _dummyObj.scale.setScalar(1.0);
        _dummyObj.updateMatrix();
        this.anchorInstancedMesh.setMatrixAt(idx++, _dummyObj.matrix);
      }
    }
    this.anchorInstancedMesh.instanceMatrix.needsUpdate = true;
    this.anchorInstancedMesh.computeBoundingSphere();
    this.tunnelWorld.add(this.anchorInstancedMesh);
  }

  /**
   * ZONE 01 (Z = +10m -> +5m): Surface UI Glass Viewport.
   * Built as 4 Individual Glass Screens (Screen 01, 02, 03, 04) preloaded with the 3 ArtificialCraft
   * Playground screenshots, and individually swappable in Tab 01!
   */
  private buildZone01SurfaceGlass(): void {
    this.zone01Group.position.set(0, 1.62, this.ZONE01_Z);
    this.tunnelWorld.add(this.zone01Group);

    const palette = this.getPalette();
    const qWidth = 1.34;
    const qHeight = 0.84;

    const quadrantOffsets: Array<[number, number, 0 | 1 | 2 | 3]> = [
      [-qWidth * 0.5 - 0.025, qHeight * 0.5 + 0.025, 0], // Screen 01 (Top-Left)
      [qWidth * 0.5 + 0.025, qHeight * 0.5 + 0.025, 1], // Screen 02 (Top-Right)
      [-qWidth * 0.5 - 0.025, -qHeight * 0.5 - 0.025, 2], // Screen 03 (Bottom-Left)
      [qWidth * 0.5 + 0.025, -qHeight * 0.5 - 0.025, 3], // Screen 04 (Bottom-Right)
    ];

    for (const [bx, by, slotIdx] of quadrantOffsets) {
      const qGroup = new THREE.Group();
      qGroup.position.set(bx, by, 0);
      qGroup.userData = { baseX: bx, baseY: by, slotIndex: slotIdx };

      const slotCfg = this.state.screenSlots[slotIdx];
      const tex = createZone01ScreenSlotTexture(
        {
          slot: slotCfg,
          globalTitle: this.state.uiSurfaceTitle,
          globalSubtitle: this.state.uiSurfaceSubtitle,
          customHtml: this.state.uiSurfaceCustomHtml,
          imageElement: this.slotImages[slotIdx],
          isSelectedSlot: this.state.selectedScreenSlot === slotIdx,
        },
        palette,
        this.maxAnisotropy
      );
      this.zone01Textures.push(tex);

      // 1. Primary Glass Display Plane (opaque depth write so water/surfaces never sort over screens)
      const panelGeo = new THREE.PlaneGeometry(qWidth, qHeight);
      const panelMat = new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.14,
        metalness: 0.12,
        transparent: false,
        depthTest: true,
        depthWrite: true,
        side: THREE.DoubleSide,
      });
      const panelMesh = new THREE.Mesh(panelGeo, panelMat);
      qGroup.renderOrder = 10;
      qGroup.add(panelMesh);

      // 2. Titanium #18181E Structural Bezel Backing Frame
      const bezelGeo = new THREE.BoxGeometry(
        qWidth + 0.04,
        qHeight + 0.04,
        0.028
      );
      const bezelMat = new THREE.MeshStandardMaterial({
        color: palette.surfaceHex,
        roughness: 0.35,
        metalness: 0.88,
        roughnessMap: this.titaniumBumpTex,
      });
      const bezelMesh = new THREE.Mesh(bezelGeo, bezelMat);
      bezelMesh.position.z = -0.018;
      qGroup.add(bezelMesh);

      // 3. 1px Swiss Cyan Wireframe Trim
      const edgeGeo = new THREE.EdgesGeometry(bezelGeo);
      const edgeMat = new THREE.LineBasicMaterial({
        color: palette.primaryHex,
      });
      const edgeLines = new THREE.LineSegments(edgeGeo, edgeMat);
      edgeLines.position.z = -0.018;
      qGroup.add(edgeLines);

      // 4. Corner Precision Clamps (4 metallic bolts per screen)
      const clampGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.045, 12);
      clampGeo.rotateX(Math.PI / 2);
      const clampMat = new THREE.MeshStandardMaterial({
        color: palette.primaryHex,
        emissive: palette.primaryHex,
        emissiveIntensity: 0.65,
        roughness: 0.2,
        metalness: 0.9,
      });
      const corners = [
        [-qWidth * 0.48, qHeight * 0.46],
        [qWidth * 0.48, qHeight * 0.46],
        [-qWidth * 0.48, -qHeight * 0.46],
        [qWidth * 0.48, -qHeight * 0.46],
      ];
      for (const [cx, cy] of corners) {
        const bolt = new THREE.Mesh(clampGeo, clampMat);
        bolt.position.set(cx, cy, 0.005);
        qGroup.add(bolt);
      }

      this.zone01Quadrants.push(qGroup);
      this.zone01Group.add(qGroup);
    }
  }

  private refreshSingleScreenSlot(slotIdx: 0 | 1 | 2 | 3): void {
    const palette = this.getPalette();
    const qGroup = this.zone01Quadrants[slotIdx];
    const slotCfg = this.state.screenSlots[slotIdx];
    if (qGroup && slotCfg) {
      const newTex = createZone01ScreenSlotTexture(
        {
          slot: slotCfg,
          globalTitle: this.state.uiSurfaceTitle,
          globalSubtitle: this.state.uiSurfaceSubtitle,
          customHtml: this.state.uiSurfaceCustomHtml,
          imageElement: this.slotImages[slotIdx],
          isSelectedSlot: this.state.selectedScreenSlot === slotIdx,
        },
        palette,
        this.maxAnisotropy
      );
      const mesh = qGroup.children[0] as THREE.Mesh<
        THREE.BufferGeometry,
        THREE.MeshStandardMaterial
      >;
      if (mesh && mesh.material) {
        mesh.material.map?.dispose();
        mesh.material.map = newTex;
        mesh.material.needsUpdate = true;
      }
      this.zone01Textures[slotIdx] = newTex;
    }
    this.refreshSingleZone02Module(slotIdx);
  }

  private refreshZone01Textures(): void {
    for (let i = 0; i < 4; i++) {
      this.refreshSingleScreenSlot(i as 0 | 1 | 2 | 3);
    }
  }

  /**
   * ZONE 02 (Z = +5m -> 0m): Exploded Page & Component Matrix.
   * Each exploded module displays both its TypeScript AST code and the live screenshot from its screenSlotIndex!
   */
  private buildZone02ExplodedMatrix(): void {
    this.tunnelWorld.add(this.zone02Group);
    const palette = this.getPalette();

    EXPLODED_COMPONENTS.forEach((spec, idx) => {
      const modGroup = new THREE.Group();
      modGroup.position.set(spec.xPos, spec.yPos, spec.zPos);

      const chassisW = 1.52;
      const chassisH = 0.86;
      const chassisGeo = new THREE.BoxGeometry(chassisW, chassisH, 0.045);
      const chassisMat = new THREE.MeshStandardMaterial({
        color: palette.surfaceHex,
        roughness: 0.38,
        metalness: 0.85,
        roughnessMap: this.titaniumBumpTex,
      });
      const chassisMesh = new THREE.Mesh(chassisGeo, chassisMat);
      chassisMesh.position.z = -0.03;
      modGroup.add(chassisMesh);

      const screenTex = createExplodedComponentTexture(
        spec,
        palette,
        this.maxAnisotropy,
        this.slotImages[spec.screenSlotIndex]
      );
      const screenGeo = new THREE.PlaneGeometry(chassisW - 0.04, chassisH - 0.04);
      const screenMat = new THREE.MeshStandardMaterial({
        map: screenTex,
        roughness: 0.18,
        metalness: 0.1,
      });
      const screenMesh = new THREE.Mesh(screenGeo, screenMat);
      screenMesh.position.z = 0.025;
      modGroup.add(screenMesh);

      const cageGeo = new THREE.EdgesGeometry(
        new THREE.BoxGeometry(chassisW + 0.06, chassisH + 0.06, 0.12)
      );
      const borderMat = new THREE.LineBasicMaterial({
        color: spec.accentHex,
      });
      const cageLines = new THREE.LineSegments(cageGeo, borderMat);
      modGroup.add(cageLines);

      if (spec.id === 'comp-flipbook-engine') {
        const folioGroup = new THREE.Group();
        folioGroup.position.set(0, chassisH * 0.5 + 0.12, 0.04);
        for (let p = -2; p <= 2; p++) {
          const pageGeo = new THREE.BoxGeometry(0.24, 0.18, 0.006);
          const pageMat = new THREE.MeshStandardMaterial({
            color: p === 0 ? palette.primaryHex : 0xe2e8f0,
            roughness: 0.3,
            metalness: 0.4,
          });
          const pageMesh = new THREE.Mesh(pageGeo, pageMat);
          pageMesh.rotation.z = p * 0.24;
          pageMesh.position.x = p * 0.05;
          folioGroup.add(pageMesh);
        }
        modGroup.add(folioGroup);
      } else {
        const finGeo = new THREE.BoxGeometry(0.16, 0.05, 0.06);
        const finMat = new THREE.MeshStandardMaterial({
          color: spec.accentHex,
          emissive: spec.accentHex,
          emissiveIntensity: 0.45,
          roughness: 0.25,
          metalness: 0.85,
        });
        for (let f = -2; f <= 2; f++) {
          const fin = new THREE.Mesh(finGeo, finMat);
          fin.position.set(f * 0.24, chassisH * 0.5 + 0.035, 0);
          modGroup.add(fin);
        }
      }

      modGroup.rotation.y = spec.xPos < 0 ? 0.18 : -0.18;

      this.zone02Group.add(modGroup);
      this.zone02Modules.push({
        group: modGroup,
        screenMesh,
        basePos: new THREE.Vector3(spec.xPos, spec.yPos, spec.zPos),
        specIdx: idx,
        borderMat,
      });
    });

    const linePts: number[] = [];
    for (let i = 0; i < EXPLODED_COMPONENTS.length - 1; i++) {
      const a = EXPLODED_COMPONENTS[i];
      const b = EXPLODED_COMPONENTS[i + 1];
      linePts.push(a.xPos, a.yPos, a.zPos, b.xPos, b.yPos, b.zPos);
    }
    const last = EXPLODED_COMPONENTS[EXPLODED_COMPONENTS.length - 1];
    linePts.push(last.xPos, last.yPos, last.zPos, 0, 1.45, -0.3);

    const connGeo = new THREE.BufferGeometry();
    connGeo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(linePts, 3)
    );
    this.zone02ConnectorLines = new THREE.LineSegments(
      connGeo,
      new THREE.LineBasicMaterial({
        color: palette.primaryHex,
        transparent: true,
        opacity: 0.75,
      })
    );
    this.zone02Group.add(this.zone02ConnectorLines);
  }

  private refreshSingleZone02Module(slotIdx: 0 | 1 | 2 | 3): void {
    const palette = this.getPalette();
    const mod = this.zone02Modules[slotIdx];
    const spec = EXPLODED_COMPONENTS[slotIdx];
    if (!mod || !spec) return;

    const newTex = createExplodedComponentTexture(
      spec,
      palette,
      this.maxAnisotropy,
      this.slotImages[slotIdx]
    );
    mod.screenMesh.material.map?.dispose();
    mod.screenMesh.material.map = newTex;
    mod.screenMesh.material.needsUpdate = true;
  }

  private refreshZone02Textures(): void {
    for (let i = 0; i < 4; i++) {
      this.refreshSingleZone02Module(i as 0 | 1 | 2 | 3);
    }
  }

  /**
   * ZONE 03 (Z = 0m -> -5m): Interactive 3D Digital Line-Branching Directory Tree & Zod Validation Gate.
   */
  private buildZone03DirectoryTreeAndZodGate(): void {
    this.tunnelWorld.add(this.zone03Group);
    const palette = this.getPalette();

    this.zodGateGroup.position.set(0, 1.55, -0.35);
    this.zone03Group.add(this.zodGateGroup);

    const outerTorusGeo = new THREE.TorusGeometry(1.75, 0.028, 16, 64);
    const outerTorusMat = new THREE.MeshStandardMaterial({
      color: palette.surfaceHex,
      metalness: 0.9,
      roughness: 0.25,
    });
    this.zodOuterRing = new THREE.Mesh(outerTorusGeo, outerTorusMat);
    this.zodGateGroup.add(this.zodOuterRing);

    const innerOctGeo = new THREE.RingGeometry(1.48, 1.54, 8);
    const innerOctMat = new THREE.MeshStandardMaterial({
      color: palette.accentHex,
      emissive: palette.accentHex,
      emissiveIntensity: 0.75,
      side: THREE.DoubleSide,
    });
    this.zodInnerRing = new THREE.Mesh(innerOctGeo, innerOctMat);
    this.zodGateGroup.add(this.zodInnerRing);

    const gateBannerTex = createMonolithBannerTexture(
      'ZOD VALIDATION GATE · /api/craft/generate/route.ts',
      'STRICT SCHEMA CONTRACT ENFORCEMENT · 0-CODE AST PIPELINE',
      palette.accentCss,
      this.maxAnisotropy
    );
    const gateBannerMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.85, 0.42),
      new THREE.MeshBasicMaterial({ map: gateBannerTex })
    );
    gateBannerMesh.position.set(0, 1.92, 0.05);
    this.zodGateGroup.add(gateBannerMesh);

    this.zone03Group.add(this.treeRootGroup);
    this.rebuildDirectoryTreeMeshes();
  }

  private rebuildDirectoryTreeMeshes(): void {
    while (this.treeRootGroup.children.length > 0) {
      const child = this.treeRootGroup.children[0];
      this.treeRootGroup.remove(child);
    }
    this.runtimeNodes = [];
    this.interactiveHitMeshes = [];

    // Root elevated at Y = 1.78m so the entire 3D AST hierarchy floats cleanly above the Obsidian Mirror Pool (Y = -0.42m)
    const rootWorldPos = new THREE.Vector3(0, 1.78, this.ZONE03_BASE_Z);
    this.buildTreeNodeRecursive(this.repositoryTree, null, rootWorldPos);
  }

  private buildTreeNodeRecursive(
    nodeData: DirectoryNode,
    parentRuntime: RuntimeTreeNode | null,
    worldPos: THREE.Vector3
  ): RuntimeTreeNode {
    const palette = this.getPalette();
    const isFolder = nodeData.kind === 'folder';
    const isExpanded = nodeData.expanded !== false;

    const nodeGroup = new THREE.Group();
    nodeGroup.position.copy(worldPos);
    nodeGroup.renderOrder = 10;

    const boxW = isFolder ? 0.56 : 0.48;
    const boxH = isFolder ? 0.22 : 0.18;
    const boxD = isFolder ? 0.16 : 0.12;

    const coreGeo = new THREE.BoxGeometry(boxW, boxH, boxD);
    const coreMat = new THREE.MeshStandardMaterial({
      color: palette.surfaceHex,
      roughness: 0.32,
      metalness: 0.86,
      roughnessMap: this.titaniumBumpTex,
      transparent: false,
      depthTest: true,
      depthWrite: true,
    });
    const hitMesh = new THREE.Mesh(coreGeo, coreMat);
    hitMesh.name = `tree-node-${nodeData.id}`;
    hitMesh.renderOrder = 10;
    nodeGroup.add(hitMesh);

    const plinthGeo = new THREE.BoxGeometry(boxW + 0.06, 0.025, boxD + 0.04);
    const plinthMat = new THREE.MeshStandardMaterial({
      color: 0x09090b,
      roughness: 0.6,
      metalness: 0.5,
      transparent: false,
      depthTest: true,
      depthWrite: true,
    });
    const plinthMesh = new THREE.Mesh(plinthGeo, plinthMat);
    plinthMesh.position.y = -boxH * 0.5 - 0.015;
    plinthMesh.renderOrder = 10;
    plinthMesh.xb = { pointerEvents: 'none' };
    nodeGroup.add(plinthMesh);

    const wireGeo = new THREE.EdgesGeometry(
      new THREE.BoxGeometry(boxW + 0.02, boxH + 0.02, boxD + 0.02)
    );
    const fallbackWireHex = isFolder
      ? isExpanded
        ? palette.primaryHex
        : palette.secondaryHex
      : palette.accentHex;
    const nodeColorObj = nodeData.colorHex
      ? new THREE.Color(nodeData.colorHex)
      : new THREE.Color(fallbackWireHex);

    const wireframeMat = new THREE.LineBasicMaterial({
      color: nodeColorObj.clone(),
    });
    const wireSegments = new THREE.LineSegments(wireGeo, wireframeMat);
    wireSegments.renderOrder = 11;
    wireSegments.xb = { pointerEvents: 'none' };
    nodeGroup.add(wireSegments);

    const beaconGeo = new THREE.OctahedronGeometry(0.036, 0);
    const beaconMat = new THREE.MeshStandardMaterial({
      color: nodeColorObj.clone(),
      emissive: nodeColorObj.clone(),
      emissiveIntensity: 0.95,
      roughness: 0.2,
      metalness: 0.8,
    });
    const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
    beaconMesh.position.set(0, boxH * 0.5 + 0.055, 0);
    beaconMesh.renderOrder = 11;
    beaconMesh.xb = { pointerEvents: 'none' };
    nodeGroup.add(beaconMesh);

    const labelTex = createNodeLabelTexture(
      nodeData.name,
      nodeData.kind,
      nodeData.tokens,
      isExpanded,
      palette,
      this.maxAnisotropy,
      nodeData.colorHex,
      nodeData.layer
    );
    const labelGeo = new THREE.PlaneGeometry(boxW - 0.02, boxH - 0.02);
    const labelMat = new THREE.MeshBasicMaterial({
      map: labelTex,
      transparent: false,
      depthTest: true,
      depthWrite: true,
    });
    const labelMesh = new THREE.Mesh(labelGeo, labelMat);
    labelMesh.position.z = boxD * 0.5 + 0.004;
    labelMesh.renderOrder = 11;
    labelMesh.xb = { pointerEvents: 'none' };
    nodeGroup.add(labelMesh);

    let branchLine: THREE.Line | null = null;
    let branchGeometry: THREE.BufferGeometry | null = null;
    const branchStart = parentRuntime
      ? parentRuntime.worldTargetPos.clone()
      : worldPos.clone();
    const branchMid = new THREE.Vector3(
      worldPos.x,
      parentRuntime ? parentRuntime.worldTargetPos.y : worldPos.y,
      (branchStart.z + worldPos.z) * 0.5
    );
    const branchEnd = worldPos.clone();

    if (parentRuntime) {
      branchGeometry = new THREE.BufferGeometry();
      const initialPts = new Float32Array(9);
      branchGeometry.setAttribute(
        'position',
        new THREE.BufferAttribute(initialPts, 3)
      );
      const lineMat = new THREE.LineBasicMaterial({
        color: nodeColorObj.clone(),
      });
      branchLine = new THREE.Line(branchGeometry, lineMat);
      branchLine.frustumCulled = false;
      branchLine.renderOrder = 9;
      branchLine.xb = { pointerEvents: 'none' };
      this.treeRootGroup.add(branchLine);
    }

    const parentVisible = parentRuntime
      ? parentRuntime.targetBranchProgress > 0.5 &&
        parentRuntime.data.expanded !== false
      : true;

    const initialProgress = parentVisible ? 1.0 : 0.0;
    nodeGroup.visible = initialProgress > 0.02;
    this.treeRootGroup.add(nodeGroup);

    const runtimeNode: RuntimeTreeNode = {
      data: nodeData,
      parent: parentRuntime,
      group: nodeGroup,
      hitMesh,
      wireframeMat,
      beaconMat,
      labelMesh,
      baseLocalPos: worldPos.clone(),
      worldTargetPos: worldPos.clone(),
      branchLine,
      branchGeometry,
      branchStart,
      branchMid,
      branchEnd,
      branchProgress: initialProgress,
      targetBranchProgress: initialProgress,
      children: [],
    };

    hitMesh.userData.runtimeNode = runtimeNode;
    this.runtimeNodes.push(runtimeNode);
    this.interactiveHitMeshes.push(hitMesh);

    if (nodeData.children && nodeData.children.length > 0) {
      for (const childData of nodeData.children) {
        // Clamp Y >= 0.78m so no node (including src/app/api/) ever dips near the Obsidian Mirror Pool at Y = -0.42m
        const childWorldPos = new THREE.Vector3(
          worldPos.x + childData.positionOffset[0],
          THREE.MathUtils.clamp(
            worldPos.y + childData.positionOffset[1],
            0.78,
            2.75
          ),
          worldPos.z + childData.positionOffset[2]
        );
        const childRuntime = this.buildTreeNodeRecursive(
          childData,
          runtimeNode,
          childWorldPos
        );
        runtimeNode.children.push(childRuntime);
      }
    }

    return runtimeNode;
  }

  private toggleDirectoryNode(node: RuntimeTreeNode): void {
    // If already focused on this exact folder node in NODE_INSPECT_MODE, toggle its branch tendrils
    if (
      this.state.cameraMode === 'NODE_INSPECT_MODE' &&
      this.selectedRuntimeNode === node &&
      node.data.kind === 'folder' &&
      node.children.length > 0
    ) {
      this.toggleDirectoryNodeBranchOnly(node);
      return;
    }

    // Otherwise, ensure folder is expanded if collapsed, and enter NODE_INSPECT_MODE via GSAP
    if (
      node.data.kind === 'folder' &&
      node.children.length > 0 &&
      node.data.expanded === false
    ) {
      node.data.expanded = true;
      this.refreshNodeVisualLabel(node);
      this.setSubtreeVisibilityTarget(node, true);
    }

    this.focusOnNode(node);
  }

  private toggleDirectoryNodeBranchOnly(node: RuntimeTreeNode): void {
    if (node.data.kind === 'folder' && node.children.length > 0) {
      const nextExpanded = !(node.data.expanded !== false);
      node.data.expanded = nextExpanded;
      this.refreshNodeVisualLabel(node);
      this.setSubtreeVisibilityTarget(node, nextExpanded);
      this.inspectorCard.updateNode(
        node.data,
        node.group.position,
        this.state.cameraMode === 'NODE_INSPECT_MODE'
      );

      if (nextExpanded) {
        this.audio.playBranchBloom();
        node.children.forEach((child) => {
          this.spawnPollenBurst(child.group.position);
        });
      } else {
        this.audio.playNodeCollapse();
      }
    } else {
      this.spawnPollenBurst(node.group.position);
      this.audio.playBranchBloom();
    }
  }

  /**
   * Computes a node's dispersed Tunnel-Space position at the current dispersionReferenceZ.
   */
  private computeNodeDispersedTunnelPos(node: RuntimeTreeNode): THREE.Vector3 {
    const explode = this.state.explodedScale;
    const nodeBaseZ = node.baseLocalPos.z * explode;
    const dzNode = Math.max(
      0.65,
      Math.abs(this.dispersionReferenceZ - nodeBaseZ)
    );
    const nodeDispersion =
      this.dispersionReferenceZ < nodeBaseZ + 1.8 &&
      Math.abs(node.baseLocalPos.x) > 0.15
        ? Math.min(1.1, Math.pow(1 / dzNode, 1.5) * 0.28)
        : 0;
    const signX = node.baseLocalPos.x >= 0 ? 1 : -1;

    return new THREE.Vector3(
      node.baseLocalPos.x * explode + signX * nodeDispersion,
      node.baseLocalPos.y,
      nodeBaseZ
    );
  }

  /**
   * MODE B: NODE_INSPECT_MODE (GSAP Click-to-Zoom Node Focus).
   * - Saves anchorProgress & anchorCamPos when transitioning from TUNNEL_FLIGHT_MODE.
   * - Expands any collapsed ancestor folders so the target node is guaranteed visible.
   * - Reads `node.hitMesh.getWorldPosition(_nodeWorldPos)` and animates camera via GSAP
   *   (`duration: 0.8, ease: "power3.inOut"`) to `(nodeWorldPos.x, nodeWorldPos.y + 0.2, nodeWorldPos.z + 1.5)`
   *   while locking `lookAt` onto the focused node and its adjacent `xb.UICard` Hologram Inspector Card.
   */
  public focusOnNode(node: RuntimeTreeNode): void {
    // Ensure all ancestor folders are expanded and bloomed so off-screen / nested nodes are visible
    let ancestor = node.parent;
    while (ancestor) {
      if (ancestor.data.expanded === false) {
        ancestor.data.expanded = true;
        this.refreshNodeVisualLabel(ancestor);
        this.setSubtreeVisibilityTarget(ancestor, true);
      }
      ancestor.targetBranchProgress = 1.0;
      ancestor.branchProgress = 1.0;
      ancestor.group.visible = true;
      ancestor = ancestor.parent;
    }
    node.targetBranchProgress = 1.0;
    node.branchProgress = 1.0;
    node.group.visible = true;

    // 1. Anchor Memory: Store pre-click tunnel position if entering from TUNNEL_FLIGHT_MODE
    if (this.state.cameraMode === 'TUNNEL_FLIGHT_MODE') {
      this.state.anchorProgress = this.state.progress;
      this.anchorVirtualCamZ = this.currentVirtualCamZ;
      this.anchorCamPos.set(0, 1.62, this.currentVirtualCamZ);
      this.dispersionReferenceZ = this.currentVirtualCamZ;
    }

    // 2. Update state machine to NODE_INSPECT_MODE
    this.state.cameraMode = 'NODE_INSPECT_MODE';
    this.state.focusedNodeId = node.data.id;
    this.selectedRuntimeNode = node;

    // 3. Calculate target world & tunnel coordinates (`node.getWorldPosition()`)
    const nodeTunnelPos = this.computeNodeDispersedTunnelPos(node);
    node.worldTargetPos.copy(nodeTunnelPos);
    node.group.position.copy(nodeTunnelPos);
    node.group.updateMatrixWorld(true);
    node.hitMesh.getWorldPosition(_nodeWorldPos);

    // 4. Position and illuminate the adjacent 3D Hologram Card (`xb.UICard`)
    this.inspectorCard.updateNode(node.data, nodeTunnelPos, true);
    if (this.dockUI) {
      this.dockUI.updateSelectedNodeBanner(node.data);
      this.dockUI.syncStateRef(this.state);
    }

    node.group.scale.setScalar(1.18);
    this.spawnPollenBurst(nodeTunnelPos);
    this.audio.playBranchBloom();

    // 5. GSAP smooth camera transition (duration: 0.8s, ease: "power3.inOut")
    // Position camera 1.5m in front of the node (`nodeTunnelPos.z + 1.5 + viewerRefZ`),
    // +0.2m above `nodeTunnelPos.y`, and centered horizontally on the [Node + Hologram Card] pair.
    const viewerRefZ = 1.2;
    const dockOffset = this.dockUI && !this.dockUI.isDockCollapsed() ? 0.14 : 0.24;
    const targetCamX = nodeTunnelPos.x + dockOffset;
    const targetCamY = nodeTunnelPos.y + 0.2;
    const targetCamZ = nodeTunnelPos.z + viewerRefZ + 1.5;

    gsap.killTweensOf(this.virtualCamRig);
    this.isGsapTransitioning = true;
    gsap.to(this.virtualCamRig, {
      x: targetCamX,
      y: targetCamY,
      z: targetCamZ,
      lookX: 0.16,
      lookY: 1.44,
      lookZ: -1.5,
      duration: 0.8,
      ease: 'power3.inOut',
      onUpdate: () => {
        this.currentVirtualCamZ = this.virtualCamRig.z;
      },
      onComplete: () => {
        this.isGsapTransitioning = false;
      },
    });
  }

  /**
   * MODE A RESTORATION: `[ESC // RETURN TO TUNNEL FLIGHT]`
   * Smoothly animates camera back to `anchorCamPos` on the Z-tunnel and restores `lookAt`
   * toward the horizon vanishing point `(0, 1.6, -20)` with zero angle drift.
   */
  public returnToTunnelFlight(): void {
    if (
      this.state.cameraMode !== 'NODE_INSPECT_MODE' &&
      !this.isGsapTransitioning
    ) {
      return;
    }

    this.state.cameraMode = 'TUNNEL_FLIGHT_MODE';
    this.state.focusedNodeId = null;
    this.state.progress = this.state.anchorProgress;
    this.targetVirtualCamZ = this.anchorVirtualCamZ;

    if (this.selectedRuntimeNode) {
      this.inspectorCard.updateNode(
        this.selectedRuntimeNode.data,
        this.selectedRuntimeNode.group.position,
        false
      );
    }

    this.dockUI?.syncStateRef(this.state);
    this.audio.playZoneSnap(this.state.activeZoneIndex);

    gsap.killTweensOf(this.virtualCamRig);
    this.isGsapTransitioning = true;
    gsap.to(this.virtualCamRig, {
      x: this.anchorCamPos.x,
      y: this.anchorCamPos.y,
      z: this.anchorCamPos.z,
      lookX: 0,
      lookY: 1.6,
      lookZ: -20,
      duration: 0.8,
      ease: 'power3.inOut',
      onUpdate: () => {
        this.currentVirtualCamZ = this.virtualCamRig.z;
        this.dispersionReferenceZ = this.virtualCamRig.z;
      },
      onComplete: () => {
        this.currentVirtualCamZ = this.anchorVirtualCamZ;
        this.targetVirtualCamZ = this.anchorVirtualCamZ;
        this.dispersionReferenceZ = this.anchorVirtualCamZ;
        this.isGsapTransitioning = false;
      },
    });
  }

  private setSubtreeVisibilityTarget(
    folderNode: RuntimeTreeNode,
    visible: boolean
  ): void {
    for (const child of folderNode.children) {
      child.targetBranchProgress = visible ? 1.0 : 0.0;
      if (!visible && child.children.length > 0) {
        this.setSubtreeVisibilityTarget(child, false);
      } else if (
        visible &&
        child.data.kind === 'folder' &&
        child.data.expanded !== false
      ) {
        this.setSubtreeVisibilityTarget(child, true);
      }
    }
  }

  private setAllTreeBranchesExpanded(expanded: boolean): void {
    for (const n of this.runtimeNodes) {
      if (n.data.kind === 'folder') {
        n.data.expanded = expanded;
        this.refreshNodeVisualLabel(n);
      }
      if (n.parent) {
        n.targetBranchProgress = expanded ? 1.0 : 0.0;
        if (expanded) {
          this.spawnPollenBurst(n.group.position);
        }
      }
    }
    if (expanded) {
      this.audio.playBranchBloom();
    } else {
      this.audio.playNodeCollapse();
    }
  }

  private refreshNodeVisualLabel(node: RuntimeTreeNode): void {
    const palette = this.getPalette();
    const isExpanded = node.data.expanded !== false;
    const newTex = createNodeLabelTexture(
      node.data.name,
      node.data.kind,
      node.data.tokens,
      isExpanded,
      palette,
      this.maxAnisotropy,
      node.data.colorHex,
      node.data.layer
    );
    const mat = node.labelMesh.material as THREE.MeshBasicMaterial;
    mat.map?.dispose();
    mat.map = newTex;
    mat.needsUpdate = true;

    const fallbackHex =
      node.data.kind === 'folder'
        ? isExpanded
          ? palette.primaryHex
          : palette.secondaryHex
        : palette.accentHex;
    const nextColor =
      node.data.colorHex && isExpanded
        ? new THREE.Color(node.data.colorHex)
        : new THREE.Color(fallbackHex);
    node.wireframeMat.color.copy(nextColor);
    node.beaconMat.color.copy(nextColor);
    node.beaconMat.emissive.copy(nextColor);
  }

  private selectNodeForInspector(
    node: RuntimeTreeNode,
    playFeedback = false
  ): void {
    this.selectedRuntimeNode = node;
    this.inspectorCard.updateNode(
      node.data,
      node.group.position,
      this.state.cameraMode === 'NODE_INSPECT_MODE'
    );
    if (this.dockUI) {
      this.dockUI.updateSelectedNodeBanner(node.data);
    }
    if (playFeedback) {
      node.group.scale.setScalar(1.22);
    }
  }

  private spawnPollenBurst(origin: THREE.Vector3): void {
    const palette = this.getPalette();
    const count = 28;
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = origin.x;
      positions[i * 3 + 1] = origin.y;
      positions[i * 3 + 2] = origin.z;

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = 0.4 + Math.random() * 1.1;
      velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
      velocities[i * 3 + 1] = Math.cos(phi) * speed;
      velocities[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * speed;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: palette.primaryHex,
      size: 0.045,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const points = new THREE.Points(geo, mat);
    points.xb = { pointerEvents: 'none' };
    this.treeRootGroup.add(points);

    this.pollenBursts.push({
      points,
      velocities,
      age: 0,
      maxAge: 0.75,
    });
  }

  /**
   * ZONE 04 (Z = -5m -> -10m Vanishing Point):
   * Deep AI Reasoning & Orchestration Core (Dify.ai Cloud + n8n Monolith) under the
   * 900-Node Digital Binary Matrix Galaxy Skyvault!
   */
  private buildZone04DeepAICoreAndBinaryGalaxy(): void {
    this.zone04Group.position.set(0, 0, this.ZONE04_Z);
    this.tunnelWorld.add(this.zone04Group);
    const palette = this.getPalette();

    // 1. Dify.ai Cloud ("The Brain")
    this.difyCoreGroup.position.set(-1.35, 1.65, 0);
    this.zone04Group.add(this.difyCoreGroup);

    const brainCoreGeo = new THREE.IcosahedronGeometry(0.46, 1);
    const brainCoreMat = new THREE.MeshStandardMaterial({
      color: palette.primaryHex,
      emissive: palette.primaryHex,
      emissiveIntensity: 0.65,
      roughness: 0.18,
      metalness: 0.85,
    });
    this.difyCoreGroup.add(new THREE.Mesh(brainCoreGeo, brainCoreMat));

    const brainShellGeo = new THREE.IcosahedronGeometry(0.58, 1);
    const brainShellMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    this.difyCoreGroup.add(new THREE.Mesh(brainShellGeo, brainShellMat));

    for (let r = 0; r < 3; r++) {
      const gyroGeo = new THREE.TorusGeometry(0.72 + r * 0.12, 0.016, 12, 48);
      const gyroMat = new THREE.MeshStandardMaterial({
        color: r % 2 === 0 ? palette.primaryHex : palette.secondaryHex,
        emissive: r % 2 === 0 ? palette.primaryHex : palette.secondaryHex,
        emissiveIntensity: 0.5,
        roughness: 0.25,
        metalness: 0.9,
      });
      const gyro = new THREE.Mesh(gyroGeo, gyroMat);
      gyro.rotation.set(r * 0.8, r * 0.5, 0);
      this.difyCoreGroup.add(gyro);
    }

    const difyBannerTex = createMonolithBannerTexture(
      'DIFY.AI CLOUD · THE BRAIN',
      'DEEP LLM REASONING & AST SYNTHESIS CORE',
      palette.primaryCss,
      this.maxAnisotropy
    );
    const difyPlaque = new THREE.Mesh(
      new THREE.PlaneGeometry(1.45, 0.36),
      new THREE.MeshBasicMaterial({ map: difyBannerTex })
    );
    difyPlaque.position.set(0, -1.05, 0.2);
    this.difyCoreGroup.add(difyPlaque);

    // 2. n8n Orchestrator ("The Muscle")
    this.n8nCoreGroup.position.set(1.35, 1.65, 0);
    this.zone04Group.add(this.n8nCoreGroup);

    const towerOffsets = [
      [-0.26, 0, 0, 1.15],
      [0.0, 0.08, 0.16, 1.35],
      [0.26, -0.05, -0.1, 1.05],
    ];
    for (const [tx, ty, tz, th] of towerOffsets) {
      const tGeo = new THREE.BoxGeometry(0.24, th, 0.24);
      const tMat = new THREE.MeshStandardMaterial({
        color: palette.surfaceHex,
        roughness: 0.28,
        metalness: 0.88,
        roughnessMap: this.titaniumBumpTex,
      });
      const tMesh = new THREE.Mesh(tGeo, tMat);
      tMesh.position.set(tx, ty, tz);
      this.n8nCoreGroup.add(tMesh);

      const tEdges = new THREE.LineSegments(
        new THREE.EdgesGeometry(tGeo),
        new THREE.LineBasicMaterial({ color: palette.secondaryHex })
      );
      tEdges.position.set(tx, ty, tz);
      this.n8nCoreGroup.add(tEdges);
    }

    for (let c = -1; c <= 1; c++) {
      const collarGeo = new THREE.CylinderGeometry(
        0.58,
        0.58,
        0.04,
        6,
        1,
        true
      );
      const collarMat = new THREE.MeshStandardMaterial({
        color: palette.accentHex,
        emissive: palette.accentHex,
        emissiveIntensity: 0.8,
        side: THREE.DoubleSide,
      });
      const collar = new THREE.Mesh(collarGeo, collarMat);
      collar.position.y = c * 0.36;
      this.n8nCoreGroup.add(collar);
    }

    const n8nBannerTex = createMonolithBannerTexture(
      'n8n ORCHESTRATOR · THE MUSCLE',
      'AUTONOMOUS WEBHOOKS & WORKFLOW PIPELINE',
      palette.accentCss,
      this.maxAnisotropy
    );
    const n8nPlaque = new THREE.Mesh(
      new THREE.PlaneGeometry(1.45, 0.36),
      new THREE.MeshBasicMaterial({ map: n8nBannerTex })
    );
    n8nPlaque.position.set(0, -1.05, 0.2);
    this.n8nCoreGroup.add(n8nPlaque);

    // 3. 900-Node Digital Binary Matrix Galaxy arranged in a Milky Way spiral across the Sky Dome
    const maxStars = 900;
    const starPositions = new Float32Array(maxStars * 3);
    const starPhases = new Float32Array(maxStars);
    const starSizes = new Float32Array(maxStars);
    const starGlyphIdx = new Float32Array(maxStars);

    for (let i = 0; i < maxStars; i++) {
      // Arrange 70% of particles along a galactic spiral band overhead & around the horizon
      const arm = i % 3;
      const t = (i / maxStars) * Math.PI * 6.0 + (arm * Math.PI * 2) / 3;
      const radius = 5.0 + (i / maxStars) * 16.0 + (Math.random() - 0.5) * 2.5;
      const spiralX = Math.cos(t) * radius;
      const spiralZ = Math.sin(t) * radius * 0.85 - 1.5;
      const galacticPlaneY =
        3.2 +
        Math.sin(t * 0.5) * 2.4 +
        (Math.random() - 0.5) * 2.8;

      starPositions[i * 3] = spiralX;
      starPositions[i * 3 + 1] = Math.max(0.6, galacticPlaneY);
      starPositions[i * 3 + 2] = spiralZ;
      starPhases[i] = Math.random() * Math.PI * 2;
      starSizes[i] = 7.0 + Math.random() * 9.0;
      starGlyphIdx[i] = Math.floor(Math.random() * 4);
    }

    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute(
      'position',
      new THREE.BufferAttribute(starPositions, 3)
    );
    starGeo.setAttribute('aPhase', new THREE.BufferAttribute(starPhases, 1));
    starGeo.setAttribute('aSize', new THREE.BufferAttribute(starSizes, 1));
    starGeo.setAttribute(
      'aGlyph',
      new THREE.BufferAttribute(starGlyphIdx, 1)
    );
    starGeo.setDrawRange(0, this.state.starDensity);

    this.starfieldShaderMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uAtlas: { value: this.binaryAtlasTex },
        uPrimaryColor: { value: new THREE.Color(palette.primaryHex) },
        uSecondaryColor: { value: new THREE.Color(palette.secondaryHex) },
        uGlowStrength: { value: this.state.bloomStrength },
      },
      vertexShader: `
        attribute float aPhase;
        attribute float aSize;
        attribute float aGlyph;
        varying float vTwinkle;
        varying float vPhase;
        varying float vGlyph;
        uniform float uTime;
        uniform float uGlowStrength;

        void main() {
          vPhase = aPhase;
          vGlyph = aGlyph;
          vTwinkle = 0.55 + 0.45 * sin(uTime * 2.4 + aPhase);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * uGlowStrength * (14.0 / max(2.0, -mvPosition.z));
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vTwinkle;
        varying float vPhase;
        varying float vGlyph;
        uniform sampler2D uAtlas;
        uniform vec3 uPrimaryColor;
        uniform vec3 uSecondaryColor;

        void main() {
          float gx = mod(floor(vGlyph + 0.5), 2.0);
          float gy = floor(floor(vGlyph + 0.5) / 2.0);
          vec2 cellUv = (gl_PointCoord * 0.5) + vec2(gx * 0.5, gy * 0.5);
          vec4 glyphSample = texture2D(uAtlas, cellUv);

          vec2 cxy = 2.0 * gl_PointCoord - 1.0;
          float radialGlow = exp(-dot(cxy, cxy) * 2.5) * 0.45;
          float alpha = max(glyphSample.a, radialGlow) * vTwinkle;
          if (alpha < 0.05) discard;

          vec3 starColor = mix(uPrimaryColor, vec3(0.95, 0.98, 1.0), 0.4 + 0.4 * sin(vPhase));
          starColor = mix(starColor, uSecondaryColor, 0.3);
          gl_FragColor = vec4(starColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.starfieldPoints = new THREE.Points(starGeo, this.starfieldShaderMat);
    this.starfieldPoints.xb = { pointerEvents: 'none' };
    this.zone04Group.add(this.starfieldPoints);
  }

  private bindViewportInteractions(): void {
    window.addEventListener(
      'wheel',
      (e) => {
        if (
          e.target instanceof HTMLElement &&
          e.target.closest('#cyber-config-dock')
        ) {
          return;
        }
        // Pause Z-axis scroll flight while in NODE_INSPECT_MODE
        if (this.state.cameraMode === 'NODE_INSPECT_MODE') {
          return;
        }
        const delta = e.deltaY * 0.00045 * (0.5 + this.state.flightVelocity);
        const nextProgress = THREE.MathUtils.clamp(
          this.state.progress + delta,
          0,
          1
        );
        this.handleStateUpdate({
          flightMode: 'MANUAL',
          progress: nextProgress,
        });
      },
      { passive: true }
    );

    window.addEventListener('pointerdown', (e) => {
      if (
        e.target instanceof HTMLElement &&
        (e.target.closest('#cyber-config-dock') ||
          e.target.closest('.cyber-top-bar') ||
          e.target.closest('.cyber-bottom-dock') ||
          e.target.closest('.cyber-esc-return-bar') ||
          e.target.closest('#XRButtonWrapper'))
      ) {
        return;
      }

      const camera = xb.core?.camera;
      if (!camera || this.interactiveHitMeshes.length === 0) return;

      _pointerNdc.x = (e.clientX / window.innerWidth) * 2 - 1;
      _pointerNdc.y = -(e.clientY / window.innerHeight) * 2 + 1;
      _raycaster.setFromCamera(_pointerNdc, camera);

      const hits = _raycaster.intersectObjects(
        this.interactiveHitMeshes,
        false
      );
      if (hits.length > 0) {
        const hitObj = hits[0].object;
        const runtimeNode = hitObj.userData?.runtimeNode as
          | RuntimeTreeNode
          | undefined;
        if (runtimeNode && runtimeNode.group.visible) {
          this.toggleDirectoryNode(runtimeNode);
          return;
        }
      }

      // If in NODE_INSPECT_MODE and user clicked empty background space (not on the 3D Hologram Card),
      // smoothly return to TUNNEL_FLIGHT_MODE at anchorProgress!
      if (this.state.cameraMode === 'NODE_INSPECT_MODE') {
        const cardHits = this.inspectorCard?.card
          ? _raycaster.intersectObject(this.inspectorCard.card, true)
          : [];
        if (cardHits.length === 0) {
          this.returnToTunnelFlight();
        }
      }
    });
  }

  public onSelectStart(event: xb.SelectEvent): void {
    const target = event?.target as THREE.Object3D | undefined;
    if (!target) return;
    let curr: THREE.Object3D | null = target;
    while (curr) {
      if (curr.userData?.runtimeNode) {
        this.toggleDirectoryNode(curr.userData.runtimeNode as RuntimeTreeNode);
        return;
      }
      curr = curr.parent;
    }
  }

  private handleStateUpdate(partial: Partial<SpatialConfigState>): void {
    const prevTheme = this.state.themeId;
    const prevSelectedSlot = this.state.selectedScreenSlot;

    this.state = { ...this.state, ...partial };
    this.dockUI?.syncStateRef(this.state);
    this.audio.muted = this.state.audioMuted;

    if (partial.progress !== undefined) {
      gsap.killTweensOf(this.virtualCamRig);
      this.isGsapTransitioning = false;
      this.state.cameraMode = 'TUNNEL_FLIGHT_MODE';
      this.state.focusedNodeId = null;
      this.targetVirtualCamZ = THREE.MathUtils.lerp(
        10.2,
        -7.6,
        this.state.progress
      );
      this.virtualCamRig.x = 0;
      this.virtualCamRig.y = 1.62;
      this.virtualCamRig.lookX = 0;
      this.virtualCamRig.lookY = 1.6;
      this.virtualCamRig.lookZ = -20;
    }

    if (partial.starDensity !== undefined && this.starfieldPoints) {
      this.starfieldPoints.geometry.setDrawRange(0, this.state.starDensity);
    }

    if (partial.bloomStrength !== undefined) {
      if (this.starfieldShaderMat) {
        this.starfieldShaderMat.uniforms.uGlowStrength.value =
          this.state.bloomStrength;
      }
      if (this.mirrorPoolShaderMat) {
        this.mirrorPoolShaderMat.uniforms.uBloomStrength.value =
          this.state.bloomStrength;
      }
      for (const m of this.volumetricConeMats) {
        m.uniforms.uStrength.value = this.state.bloomStrength;
      }
      for (const m of this.laserHaloMats) {
        m.uniforms.uStrength.value = this.state.bloomStrength;
      }
    }

    if (partial.fogEnabled !== undefined && xb.core?.scene) {
      xb.core.scene.fog = this.state.fogEnabled
        ? new THREE.FogExp2(0x090912, 0.012)
        : null;
    }

    if (prevTheme !== this.state.themeId) {
      this.applyThemePalette();
    } else if (prevSelectedSlot !== this.state.selectedScreenSlot) {
      this.refreshZone01Textures();
    }
  }

  private jumpToZone(zoneIndex: number): void {
    const zInfo = ZONE_MARKERS[zoneIndex] || ZONE_MARKERS[0];
    this.audio.playZoneSnap(zoneIndex);
    this.handleStateUpdate({
      cameraMode: 'TUNNEL_FLIGHT_MODE',
      focusedNodeId: null,
      flightMode: 'MANUAL',
      progress: zInfo.targetProgress,
      activeZoneIndex: zoneIndex,
    });
  }

  private applyThemePalette(): void {
    const palette = this.getPalette();
    if (xb.core?.scene) {
      xb.core.scene.background = new THREE.Color(0x050508);
      if (this.state.fogEnabled) {
        xb.core.scene.fog = new THREE.FogExp2(0x090912, 0.012);
      }
    }
    this.cyanRimPoint.color.setHex(palette.primaryHex);
    this.indigoSpotLeft.color.setHex(palette.secondaryHex);
    this.indigoSpotRight.color.setHex(palette.secondaryHex);

    (this.tunnelGridLines.material as THREE.LineBasicMaterial).color.setHex(
      palette.gridHex
    );
    (
      this.anchorInstancedMesh.material as THREE.MeshStandardMaterial
    ).color.setHex(palette.primaryHex);
    (
      this.anchorInstancedMesh.material as THREE.MeshStandardMaterial
    ).emissive.setHex(palette.primaryHex);

    this.starfieldShaderMat.uniforms.uPrimaryColor.value.setHex(
      palette.primaryHex
    );
    this.starfieldShaderMat.uniforms.uSecondaryColor.value.setHex(
      palette.secondaryHex
    );
    this.mirrorPoolShaderMat.uniforms.uCyanColor.value.setHex(
      palette.primaryHex
    );
    this.mirrorPoolShaderMat.uniforms.uIndigoColor.value.setHex(
      palette.secondaryHex
    );

    this.refreshZone01Textures();
    this.refreshZone02Textures();
    this.rebuildDirectoryTreeMeshes();
  }

  private getPalette(): ThemePalette {
    return (
      THEME_PALETTES[this.state.themeId] || THEME_PALETTES.cybernetic_swiss
    );
  }

  /**
   * Client-Side Auto-Fly Motion Video Exporter (.WEBM)
   * Toggles or starts 6-second 60 FPS WebGL canvas recording from Zone 01 (+10.2m) to Zone 04 (-7.6m).
   */
  public toggleOrStartAutoFlyVideoExport(): void {
    if (this.state.isRecordingVideo) {
      this.stopAutoFlyVideoExport();
    } else {
      this.startAutoFlyVideoExport();
    }
  }

  private startAutoFlyVideoExport(): void {
    const rendererDom =
      xb.core?.renderer instanceof THREE.WebGLRenderer
        ? xb.core.renderer.domElement
        : (document.querySelector('canvas') as HTMLCanvasElement | null);

    if (!rendererDom || typeof rendererDom.captureStream !== 'function') {
      this.dockUI?.updateVideoRecordingUI(
        false,
        0,
        'ERROR // CANVAS CAPTURESTREAM(60) UNSUPPORTED'
      );
      return;
    }

    // Cancel any active GSAP node inspect tween and reset camera cleanly to Zone 01 (Z = +10.2m)
    gsap.killTweensOf(this.virtualCamRig);
    this.isGsapTransitioning = false;
    this.state.cameraMode = 'TUNNEL_FLIGHT_MODE';
    this.state.focusedNodeId = null;
    this.state.flightMode = 'AUTO-FLY';
    this.state.progress = 0;
    this.targetVirtualCamZ = 10.2;
    this.currentVirtualCamZ = 10.2;
    this.dispersionReferenceZ = 10.2;
    this.virtualCamRig.x = 0;
    this.virtualCamRig.y = 1.62;
    this.virtualCamRig.z = 10.2;
    this.virtualCamRig.lookX = 0;
    this.virtualCamRig.lookY = 1.6;
    this.virtualCamRig.lookZ = -20;

    if (this.inspectorCard?.card) {
      this.inspectorCard.card.visible = false;
    }
    this.dockUI?.syncStateRef(this.state);

    // Capture WebGL canvas stream at 60 FPS
    const stream = rendererDom.captureStream(60);
    this.recordedChunks = [];
    this.recordingElapsedSec = 0;

    // Configure MediaRecorder with VP9 Codec settings (3.0 Mbps -> ~2MB output) with safe codec fallback
    const preferredMimeTypes = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
    ];
    let selectedMimeType = '';
    if (typeof MediaRecorder !== 'undefined') {
      for (const candidate of preferredMimeTypes) {
        if (MediaRecorder.isTypeSupported(candidate)) {
          selectedMimeType = candidate;
          break;
        }
      }
    }

    const recorderOptions: MediaRecorderOptions = selectedMimeType
      ? {
          mimeType: selectedMimeType,
          videoBitsPerSecond: 3000000, // 3.0 Mbps bit rate -> ultra-light ~2MB output
        }
      : {
          videoBitsPerSecond: 3000000,
        };

    try {
      this.mediaRecorder = new MediaRecorder(stream, recorderOptions);
    } catch {
      this.mediaRecorder = new MediaRecorder(stream);
    }

    const activeMimeType = selectedMimeType || 'video/webm';

    this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
      if (event.data && event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.onstop = () => {
      const blob = new Blob(this.recordedChunks, { type: activeMimeType });
      const timestamp = Date.now();
      const filename = `artificialcraft-autofly-motion-${timestamp}.webm`;

      // Trigger instant browser file download
      const downloadUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.style.display = 'none';
      anchor.href = downloadUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      setTimeout(() => {
        document.body.removeChild(anchor);
        URL.revokeObjectURL(downloadUrl);
      }, 400);

      // Return camera control back to user's manual mode seamlessly
      this.state.isRecordingVideo = false;
      this.state.recordingProgress = 100;
      this.state.flightMode = 'MANUAL';
      this.dockUI?.syncStateRef(this.state);
      this.dockUI?.updateVideoRecordingUI(
        false,
        100,
        `DOWNLOADED // ${filename}`
      );
    };

    this.state.isRecordingVideo = true;
    this.state.recordingProgress = 0;
    this.mediaRecorder.start(100);
    this.dockUI?.updateVideoRecordingUI(true, 0);
  }

  private stopAutoFlyVideoExport(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    } else {
      this.state.isRecordingVideo = false;
      this.state.flightMode = 'MANUAL';
      this.dockUI?.syncStateRef(this.state);
      this.dockUI?.updateVideoRecordingUI(false, 0);
    }
  }

  public update(): void {
    const rawDt = xb.getDeltaTime ? xb.getDeltaTime() : 0.016;
    const dt = Math.min(rawDt || 0.016, 0.05);
    this.elapsedTime += dt;

    const isInspectMode = this.state.cameraMode === 'NODE_INSPECT_MODE';

    // CLIENT-SIDE AUTO-FLY VIDEO EXPORTER (6.0-Second Trajectory from Zone 01 to Zone 04)
    if (this.state.isRecordingVideo) {
      this.recordingElapsedSec += dt;
      const recProgress = Math.min(
        1.0,
        this.recordingElapsedSec / this.recordingDurationSec
      );
      this.state.progress = recProgress;
      this.state.recordingProgress = Math.round(recProgress * 100);

      this.targetVirtualCamZ = THREE.MathUtils.lerp(10.2, -7.6, recProgress);
      this.currentVirtualCamZ = this.targetVirtualCamZ;
      this.virtualCamRig.x = 0;
      this.virtualCamRig.y = 1.62;
      this.virtualCamRig.z = this.currentVirtualCamZ;
      this.dispersionReferenceZ = this.currentVirtualCamZ;

      this.dockUI?.updateVideoRecordingUI(true, this.state.recordingProgress);

      if (recProgress >= 1.0) {
        this.stopAutoFlyVideoExport();
      }
    } else if (!isInspectMode && !this.isGsapTransitioning) {
      // MODE A: TUNNEL_FLIGHT_MODE progression (disabled during NODE_INSPECT_MODE or GSAP tween)
      if (this.state.flightMode === 'AUTO-FLY') {
        const step = dt * 0.045 * this.state.flightVelocity;
        let nextProg = this.state.progress + step;
        if (nextProg > 1.0) nextProg = 0.0;
        this.state.progress = nextProg;
        this.targetVirtualCamZ = THREE.MathUtils.lerp(10.2, -7.6, nextProg);
      }

      const lambda = Math.max(1.5, this.state.lerpSensitivity * 65);
      this.currentVirtualCamZ = THREE.MathUtils.damp(
        this.currentVirtualCamZ,
        this.targetVirtualCamZ,
        lambda,
        dt
      );

      this.virtualCamRig.x = THREE.MathUtils.damp(
        this.virtualCamRig.x,
        0,
        10,
        dt
      );
      this.virtualCamRig.y = THREE.MathUtils.damp(
        this.virtualCamRig.y,
        1.62,
        10,
        dt
      );
      this.virtualCamRig.z = this.currentVirtualCamZ;
      this.dispersionReferenceZ = this.currentVirtualCamZ;
    }

    const breathWeight = isInspectMode ? 0.2 : 1.0;
    const breathY = Math.sin(this.elapsedTime * 1.45) * 0.045 * breathWeight;
    const breathX = Math.cos(this.elapsedTime * 0.9) * 0.03 * breathWeight;

    const viewerRefZ = 1.2;
    this.tunnelWorld.position.set(
      -this.virtualCamRig.x + breathX,
      1.62 - this.virtualCamRig.y + breathY,
      viewerRefZ - this.virtualCamRig.z
    );

    // Smoothly lock camera lookAt target in desktop preview mode
    const camera = xb.core?.camera;
    const isXrPresenting = Boolean(xb.core?.renderer?.xr?.isPresenting);
    if (camera && !isXrPresenting) {
      camera.lookAt(
        this.virtualCamRig.lookX,
        this.virtualCamRig.lookY,
        this.virtualCamRig.lookZ
      );
    }

    const activeZone =
      this.currentVirtualCamZ > 5.2
        ? 0
        : this.currentVirtualCamZ > 0.2
          ? 1
          : this.currentVirtualCamZ > -4.8
            ? 2
            : 3;
    this.state.activeZoneIndex = activeZone;

    if (this.dockUI) {
      this.dockUI.updateLiveTelemetry(
        this.currentVirtualCamZ,
        this.state.progress,
        activeZone
      );
    }

    const explode = this.state.explodedScale;

    // ZONE 01: 4-Screen Glass Split & Radial Dispersion
    const dz01 = Math.max(
      0.42,
      Math.abs(this.dispersionReferenceZ - this.ZONE01_Z)
    );
    const proximity01 =
      this.dispersionReferenceZ < this.ZONE01_Z + 2.8
        ? Math.min(2.2, Math.pow(1 / dz01, 1.5) * 0.65)
        : 0.0;
    const passedBoost =
      this.dispersionReferenceZ < this.ZONE01_Z ? 1.35 : 0.0;
    const radial01 = (proximity01 + passedBoost) * explode;

    for (const qGroup of this.zone01Quadrants) {
      const { baseX, baseY } = qGroup.userData as {
        baseX: number;
        baseY: number;
      };
      const signX = baseX >= 0 ? 1 : -1;
      const signY = baseY >= 0 ? 1 : -1;
      const targetX = baseX + signX * radial01 * 0.85;
      const targetY = baseY + signY * radial01 * 0.38;
      qGroup.position.x = THREE.MathUtils.damp(
        qGroup.position.x,
        targetX,
        8,
        dt
      );
      qGroup.position.y = THREE.MathUtils.damp(
        qGroup.position.y,
        targetY,
        8,
        dt
      );
      qGroup.rotation.y = THREE.MathUtils.damp(
        qGroup.rotation.y,
        -signX * radial01 * 0.18,
        8,
        dt
      );
    }

    // ZONE 02: Exploded Component Matrix Radial Dispersion
    for (const mod of this.zone02Modules) {
      const scaledBaseZ = mod.basePos.z * explode;
      const deltaZ = Math.max(
        0.55,
        Math.abs(this.dispersionReferenceZ - scaledBaseZ)
      );
      const radialDispersion =
        this.dispersionReferenceZ < scaledBaseZ + 2.4
          ? Math.min(1.65, Math.pow(1 / deltaZ, 1.5) * 0.42)
          : 0;
      const signX = mod.basePos.x >= 0 ? 1 : -1;

      const targetX = mod.basePos.x * explode + signX * radialDispersion;
      const targetY =
        mod.basePos.y +
        Math.sin(this.elapsedTime * 1.8 + mod.specIdx) * 0.035;

      mod.group.position.x = THREE.MathUtils.damp(
        mod.group.position.x,
        targetX,
        7,
        dt
      );
      mod.group.position.y = THREE.MathUtils.damp(
        mod.group.position.y,
        targetY,
        7,
        dt
      );
      mod.group.position.z = THREE.MathUtils.damp(
        mod.group.position.z,
        scaledBaseZ,
        7,
        dt
      );
    }

    // ZONE 03: Zod Gate & 3D Directory Tree
    this.zodInnerRing.rotation.z += dt * 0.45;
    this.zodOuterRing.rotation.z -= dt * 0.2;

    for (const rNode of this.runtimeNodes) {
      rNode.branchProgress = THREE.MathUtils.damp(
        rNode.branchProgress,
        rNode.targetBranchProgress,
        10,
        dt
      );

      const nodeBaseZ = rNode.baseLocalPos.z * explode;
      const dzNode = Math.max(
        0.65,
        Math.abs(this.dispersionReferenceZ - nodeBaseZ)
      );
      const nodeDispersion =
        this.dispersionReferenceZ < nodeBaseZ + 1.8 &&
        Math.abs(rNode.baseLocalPos.x) > 0.15
          ? Math.min(1.1, Math.pow(1 / dzNode, 1.5) * 0.28)
          : 0;
      const signX = rNode.baseLocalPos.x >= 0 ? 1 : -1;

      rNode.worldTargetPos.set(
        rNode.baseLocalPos.x * explode + signX * nodeDispersion,
        rNode.baseLocalPos.y,
        nodeBaseZ
      );

      if (rNode.parent) {
        const pPos = rNode.parent.group.position;
        rNode.branchStart.copy(pPos);
        rNode.branchEnd.copy(rNode.worldTargetPos);
        rNode.branchMid.set(
          rNode.branchEnd.x,
          rNode.branchStart.y,
          (rNode.branchStart.z + rNode.branchEnd.z) * 0.5
        );

        _scratchVec3.lerpVectors(
          rNode.branchStart,
          rNode.branchEnd,
          rNode.branchProgress
        );
        rNode.group.position.copy(_scratchVec3);
        rNode.group.visible = rNode.branchProgress > 0.04;

        const targetScale = Math.max(0.001, rNode.branchProgress);
        rNode.group.scale.x = THREE.MathUtils.damp(
          rNode.group.scale.x,
          targetScale,
          12,
          dt
        );
        rNode.group.scale.y = THREE.MathUtils.damp(
          rNode.group.scale.y,
          targetScale,
          12,
          dt
        );
        rNode.group.scale.z = THREE.MathUtils.damp(
          rNode.group.scale.z,
          targetScale,
          12,
          dt
        );

        if (rNode.branchLine && rNode.branchGeometry) {
          rNode.branchLine.visible = rNode.branchProgress > 0.02;
          const posAttr = rNode.branchGeometry.getAttribute(
            'position'
          ) as THREE.BufferAttribute;
          const t = rNode.branchProgress;
          posAttr.setXYZ(
            0,
            rNode.branchStart.x,
            rNode.branchStart.y,
            rNode.branchStart.z
          );
          if (t < 0.5) {
            const subT = t * 2.0;
            const mx = THREE.MathUtils.lerp(
              rNode.branchStart.x,
              rNode.branchMid.x,
              subT
            );
            const my = THREE.MathUtils.lerp(
              rNode.branchStart.y,
              rNode.branchMid.y,
              subT
            );
            const mz = THREE.MathUtils.lerp(
              rNode.branchStart.z,
              rNode.branchMid.z,
              subT
            );
            posAttr.setXYZ(1, mx, my, mz);
            posAttr.setXYZ(2, mx, my, mz);
          } else {
            const subT = (t - 0.5) * 2.0;
            posAttr.setXYZ(
              1,
              rNode.branchMid.x,
              rNode.branchMid.y,
              rNode.branchMid.z
            );
            posAttr.setXYZ(
              2,
              THREE.MathUtils.lerp(rNode.branchMid.x, rNode.branchEnd.x, subT),
              THREE.MathUtils.lerp(rNode.branchMid.y, rNode.branchEnd.y, subT),
              THREE.MathUtils.lerp(rNode.branchMid.z, rNode.branchEnd.z, subT)
            );
          }
          posAttr.needsUpdate = true;
        }
      } else {
        rNode.group.position.copy(rNode.worldTargetPos);
        rNode.group.scale.x = THREE.MathUtils.damp(
          rNode.group.scale.x,
          1,
          10,
          dt
        );
        rNode.group.scale.y = THREE.MathUtils.damp(
          rNode.group.scale.y,
          1,
          10,
          dt
        );
        rNode.group.scale.z = THREE.MathUtils.damp(
          rNode.group.scale.z,
          1,
          10,
          dt
        );
      }
    }

    for (let i = this.pollenBursts.length - 1; i >= 0; i--) {
      const burst = this.pollenBursts[i];
      burst.age += dt;
      if (burst.age >= burst.maxAge) {
        this.treeRootGroup.remove(burst.points);
        burst.points.geometry.dispose();
        (burst.points.material as THREE.Material).dispose();
        this.pollenBursts.splice(i, 1);
        continue;
      }
      const posAttr = burst.points.geometry.getAttribute(
        'position'
      ) as THREE.BufferAttribute;
      for (let p = 0; p < posAttr.count; p++) {
        posAttr.setXYZ(
          p,
          posAttr.getX(p) + burst.velocities[p * 3] * dt,
          posAttr.getY(p) + burst.velocities[p * 3 + 1] * dt,
          posAttr.getZ(p) + burst.velocities[p * 3 + 2] * dt
        );
      }
      posAttr.needsUpdate = true;
      (burst.points.material as THREE.PointsMaterial).opacity =
        1.0 - burst.age / burst.maxAge;
    }

    // ZONE 04 & Deep Midnight Shaders update at 60 FPS
    this.difyCoreGroup.rotation.y += dt * 0.45;
    this.difyCoreGroup.rotation.x = Math.sin(this.elapsedTime * 0.8) * 0.15;
    this.n8nCoreGroup.rotation.y -= dt * 0.32;
    this.starfieldShaderMat.uniforms.uTime.value = this.elapsedTime;
    this.starfieldPoints.rotation.y = this.elapsedTime * 0.018;
    this.skyDomeShaderMat.uniforms.uTime.value = this.elapsedTime;
    this.mirrorPoolShaderMat.uniforms.uTime.value = this.elapsedTime;
  }

  public dispose(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.titaniumBumpTex?.dispose();
    this.concreteFloorTex?.dispose();
    this.binaryAtlasTex?.dispose();
    this.zone01Textures.forEach((t) => t.dispose());
  }
}
