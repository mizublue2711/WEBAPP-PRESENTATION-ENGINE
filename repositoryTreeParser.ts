import * as THREE from 'three';
import gsap from 'gsap';

/**
 * ============================================================================
 * ARTIFICIAL CRAFT // 3D REPOSITORY TREE PARSER & VECTOR BRANCHING ENGINE
 * File: repositoryTreeParser.ts
 * Purpose: Parses JSON AST (v2.0) into 3D Swiss Brutalist Monoliths, 
 *          Vector Line-Branching Tendrils, and Pollen Burst Particles.
 * ============================================================================
 */

export interface TreeNodeData {
  id: string;
  label: string;
  type: 'directory' | 'file';
  path: string;
  layer: 'foreground' | 'midground' | 'background';
  zone?: string;
  description?: string;
  colorHex?: string;
  tokenEstimate?: string;
  ssotKey?: string;
  position?: { x: number; y: number; z: number };
  children?: TreeNodeData[];
}

export interface RepositoryTreeConfig {
  systemIdentity: string;
  targetPlatform: string;
  architecturalParadigm: string;
  tree: TreeNodeData;
}

export class RepositoryTreeParser {
  private scene: THREE.Scene;
  private rootGroup: THREE.Group;
  private nodeMap: Map<string, THREE.Group> = new Map();
  private branchLines: THREE.LineSegments[] = [];
  private pollenParticles: THREE.Points | null = null;
  
  // Color Palette Tokens
  private static readonly COLORS = {
    OBSIDIAN: 0x09090B,
    TITANIUM: 0x18181E,
    ELECTRIC_INDIGO: 0x5322FF,
    NEON_CYAN: 0x00E5FF,
    ALERT_EMERALD: 0x10B981,
    WIRE_EDGE: 0x00E5FF
  };

  // Shared Geometries & Materials (Memory Optimization)
  private defaultBoxGeo = new THREE.BoxGeometry(0.8, 0.4, 0.3);
  private edgesGeo = new THREE.EdgesGeometry(this.defaultBoxGeo);
  private lineMat = new THREE.LineBasicMaterial({ color: RepositoryTreeParser.COLORS.NEON_CYAN, transparent: true, opacity: 0.8 });

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.rootGroup = new THREE.Group();
    this.rootGroup.name = 'RepositoryTree3D';
    this.scene.add(this.rootGroup);
  }

  /**
   * Main Entry: Parse JSON AST and build 3D Object Hierarchy
   */
  public parseAndRender(data: RepositoryTreeConfig): THREE.Group {
    this.clear(); // Reset previous tree meshes

    // Recursive traversal starting from root node
    this.buildNodeRecursive(data.tree, null, new THREE.Vector3(0, 0, 0), 0);

    // Create Pollen Particle Field for Blooming FX
    this.initPollenParticleSystem();

    return this.rootGroup;
  }

  /**
   * Recursive 3D Node & Branch Generator
   */
  private buildNodeRecursive(
    nodeData: TreeNodeData,
    parentGroup: THREE.Group | null,
    parentPos: THREE.Vector3,
    depth: number
  ): THREE.Group {
    const nodeGroup = new THREE.Group();
    nodeGroup.name = `node_${nodeData.id}`;
    nodeGroup.userData = { ...nodeData, depth };

    // Calculate Spatial Coordinates (Fallback if position not specified in JSON)
    const localPos = nodeData.position
      ? new THREE.Vector3(nodeData.position.x, nodeData.position.y, nodeData.position.z)
      : this.calculateDefaultPosition(depth, parentPos);

    nodeGroup.position.copy(localPos);

    // 1. Build Swiss Brutalist Mesh (No plastic nozzles!)
    const colorHex = nodeData.colorHex
      ? parseInt(nodeData.colorHex.replace('#', '0x'), 16)
      : (nodeData.type === 'directory' ? RepositoryTreeParser.COLORS.TITANIUM : RepositoryTreeParser.COLORS.ELECTRIC_INDIGO);

    const boxMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.3,
      metalness: 0.7,
      transparent: true,
      opacity: 0.9
    });

    const boxMesh = new THREE.Mesh(this.defaultBoxGeo, boxMat);
    nodeGroup.add(boxMesh);

    // 2. Add 1px Swiss Line-Art Edge Wireframe
    const wireframe = new THREE.LineSegments(this.edgesGeo, this.lineMat);
    nodeGroup.add(wireframe);

    // 3. Add Flat Recessed Top Inset (1px Glowing Sensor Core)
    const topInsetGeo = new THREE.BoxGeometry(0.65, 0.02, 0.22);
    const topInsetMat = new THREE.MeshBasicMaterial({ color: RepositoryTreeParser.COLORS.NEON_CYAN });
    const topInsetMesh = new THREE.Mesh(topInsetGeo, topInsetMat);
    topInsetMesh.position.y = 0.21;
    nodeGroup.add(topInsetMesh);

    // Register to Node Lookup Map
    this.nodeMap.set(nodeData.id, nodeGroup);
    this.rootGroup.add(nodeGroup);

    // 4. Draw Vector Line Branch to Parent
    if (parentGroup) {
      this.createVectorBranch(parentPos, localPos, nodeData.colorHex);
    }

    // 5. Recursively Render Child Nodes
    if (nodeData.children && nodeData.children.length > 0) {
      nodeData.children.forEach((child, index) => {
        const offsetAngle = (index / nodeData.children!.length) * Math.PI * 0.8 - Math.PI * 0.4;
        const childPos = new THREE.Vector3(
          localPos.x + Math.sin(offsetAngle) * 1.5,
          localPos.y + (index - nodeData.children!.length / 2) * 0.6,
          localPos.z - 1.2
        );

        if (!child.position) child.position = childPos;

        this.buildNodeRecursive(child, nodeGroup, localPos, depth + 1);
      });
    }

    return nodeGroup;
  }

  /**
   * Create 3D Vector Line Tendril connecting Parent and Child Node
   */
  private createVectorBranch(start: THREE.Vector3, end: THREE.Vector3, colorHexStr?: string): void {
    const points = [start.clone(), new THREE.Vector3(end.x, start.y, (start.z + end.z) / 2), end.clone()];
    const curve = new THREE.CatmullRomCurve3(points);
    const curvePoints = curve.getPoints(20);

    const geometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const lineMat = new THREE.LineBasicMaterial({
      color: colorHexStr ? parseInt(colorHexStr.replace('#', '0x'), 16) : RepositoryTreeParser.COLORS.NEON_CYAN,
      transparent: true,
      opacity: 0.6
    });

    const line = new THREE.LineSegments(geometry, lineMat);
    this.rootGroup.add(line);
    this.branchLines.push(line);
  }

  /**
   * Pollen Particle Burst System on Node Bloom
   */
  private initPollenParticleSystem(): void {
    const particleCount = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 10;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: RepositoryTreeParser.COLORS.NEON_CYAN,
      size: 0.05,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    this.pollenParticles = new THREE.Points(geometry, material);
    this.rootGroup.add(this.pollenParticles);
  }

  /**
   * Trigger Interactive Blooming & Pollen Burst Animation for Selected Node
   */
  public triggerNodeBloom(nodeId: string, onComplete?: () => void): void {
    const nodeGroup = this.nodeMap.get(nodeId);
    if (!nodeGroup) return;

    // Scale-up & Pulse Glow GSAP Animation
    gsap.to(nodeGroup.scale, {
      x: 1.3,
      y: 1.3,
      z: 1.3,
      duration: 0.4,
      yoyo: true,
      repeat: 1,
      ease: 'back.out(1.7)',
      onComplete
    });

    // Particle Swirl FX
    if (this.pollenParticles) {
      gsap.to(this.pollenParticles.rotation, {
        y: this.pollenParticles.rotation.y + Math.PI * 0.5,
        duration: 0.8,
        ease: 'power2.out'
      });
    }
  }

  /**
   * Calculate Default Spatial Position when JSON lacks coordinates
   */
  private calculateDefaultPosition(depth: number, parentPos: THREE.Vector3): THREE.Vector3 {
    return new THREE.Vector3(
      parentPos.x + (Math.random() - 0.5) * 2.0,
      parentPos.y + (Math.random() - 0.5) * 1.5,
      parentPos.z - depth * 1.8
    );
  }

  /**
   * Lookup 3D Node Group by ID
   */
  public getNodeById(id: string): THREE.Group | undefined {
    return this.nodeMap.get(id);
  }

  /**
   * Memory Cleanup & Disposal ($0.00 Memory Leak SLA)
   */
  public clear(): void {
    while (this.rootGroup.children.length > 0) {
      const obj = this.rootGroup.children[0];
      this.rootGroup.remove(obj);
      if ((obj as any).geometry) (obj as any).geometry.dispose();
    }
    this.nodeMap.clear();
    this.branchLines = [];
  }
}
