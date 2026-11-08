import * as THREE from 'three';

/**
 * ============================================================================
 * ARTIFICIAL CRAFT // 3D SCENE MODULE LIFECYCLE CONTRACT
 * File: scene-module.ts
 * Architecture: Modular 3D Scene Plugin Contract for PresentationEngine
 * Purpose: Enforces standardized lifecycle, event bus, camera priority stack,
 *          and mandatory memory disposal for $0.00 Memory Leak SLA.
 * ============================================================================
 */

export interface SceneModuleContext {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  container: HTMLElement;
}

export interface ModuleMetadata {
  id: string;
  name: string;
  version: string;
  author?: string;
  description?: string;
  /** Camera Control Priority Stack: 10 = Idle Auto-Fly, 50 = Bezier Spline, 100 = Node Inspect Focus */
  priority: number;
}

export interface ModuleState {
  isActive: boolean;
  isInitialized: boolean;
  isVisible: boolean;
}

export interface ISceneModule {
  /** Module identification & priority metadata */
  readonly metadata: ModuleMetadata;

  /** Current module state flags */
  readonly state: ModuleState;

  /**
   * Initialization phase: Mount 3D geometries, materials, custom GLSL shaders, 
   * and bind module-scoped event listeners.
   */
  init(ctx: SceneModuleContext): Promise<void> | void;

  /**
   * Frame update loop called by PresentationEngine's requestAnimationFrame.
   * @param deltaTime Time elapsed since last frame (seconds)
   * @param elapsedTime Total running time since engine start (seconds)
   */
  update(deltaTime: number, elapsedTime: number): void;

  /**
   * Viewport resize callback to dynamically update FOV, projection matrices, and resolution uniforms.
   */
  onResize(width: number, height: number): void;

  /**
   * Optional Raycasting interaction hooks for mouse hover & pointer clicks.
   */
  onPointerMove?(pointer: THREE.Vector2, raycaster: THREE.Raycaster): void;
  onPointerClick?(pointer: THREE.Vector2, raycaster: THREE.Raycaster): void;

  /**
   * Toggle visibility without unmounting or disposing VRAM resources.
   */
  setVisible?(visible: boolean): void;

  /**
   * Mandatory VRAM Memory Cleanup Protocol ($0.00 Memory Leak SLA).
   * MUST dispose geometries, materials, textures, render targets, and unbind listeners.
   */
  dispose(): void;
}
