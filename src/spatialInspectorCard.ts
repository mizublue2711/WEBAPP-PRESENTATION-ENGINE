import * as THREE from 'three';
import * as xb from 'xrblocks';
import { DirectoryNode } from './types';

/**
 * World-space 3D Hologram Glass Card built with XR Blocks `xb.UICard`.
 * Strictly positioned in elevated world space (Y >= 1.55m) with high renderOrder
 * so it always sits cleanly above the Obsidian Mirror Pool and never gets occluded.
 */
export class SpatialInspectorCard {
  public card: xb.UICard;
  private titleText: xb.UIText;
  private pathText: xb.UIText;
  private roleText: xb.UIText;
  private zodText: xb.UIText;
  private codeText: xb.UIText;
  private tokenBadgeText: xb.UIText;
  private branchButton: xb.UIButton;
  private returnTunnelButton: xb.UIButton;
  private onToggleBranch: () => void;
  private onReturnToTunnel: () => void;

  constructor(onToggleBranch: () => void, onReturnToTunnel: () => void) {
    this.onToggleBranch = onToggleBranch;
    this.onReturnToTunnel = onReturnToTunnel;

    this.titleText = new xb.UIText({
      text: 'registry.ts',
      style: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#00E5FF',
      },
    });

    this.tokenBadgeText = new xb.UIText({
      text: 'MIDGROUND · ~50 TOKENS',
      style: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#10B981',
      },
    });

    const headerRow = new xb.UIPanel({
      style: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      },
      children: [this.titleText, this.tokenBadgeText],
    });

    this.pathText = new xb.UIText({
      text: 'PATH: /src/core/registry.ts  ·  LAYER: MIDGROUND',
      style: {
        fontSize: 13,
        color: '#94A3B8',
      },
    });

    this.roleText = new xb.UIText({
      text: 'CENTRAL SSOT: Graphic Component & Preset Registry',
      style: {
        fontSize: 15,
        lineHeight: 1.3,
        color: '#F8FAFC',
      },
    });

    this.zodText = new xb.UIText({
      text: 'ZOD CONTRACT:\nz.enum(["swiss-hud", "isometric-matrix", "bento-3d", "logarithmic-spiral"])',
      style: {
        width: '100%',
        padding: 10,
        backgroundColor: '#11131C',
        borderRadius: 8,
        fontSize: 13,
        lineHeight: 1.3,
        color: '#00E5FF',
        whiteSpace: 'pre-line',
      },
    });

    this.codeText = new xb.UIText({
      text: 'export const REGISTERED_PRESETS = [\n  "swiss-hud", "isometric-matrix", "bento-3d",\n  "logarithmic-spiral", "code-editor", "rubik-3d", "dual-engine"\n] as const;',
      style: {
        width: '100%',
        padding: 12,
        backgroundColor: '#07080D',
        borderRadius: 8,
        fontSize: 13,
        lineHeight: 1.35,
        color: '#E2E8F0',
        whiteSpace: 'pre-line',
      },
    });

    this.branchButton = new xb.UIButton({
      label: 'Toggle Branch',
      icon: 'account_tree',
      style: {
        flexGrow: 1,
      },
      onClick: () => {
        this.onToggleBranch();
      },
    });

    this.returnTunnelButton = new xb.UIButton({
      label: 'ESC // Tunnel',
      icon: 'flight_takeoff',
      style: {
        flexGrow: 1,
      },
      onClick: () => {
        this.onReturnToTunnel();
      },
    });

    const actionRow = new xb.UIPanel({
      style: {
        width: '100%',
        flexDirection: 'row',
        gap: 10,
      },
      children: [this.branchButton, this.returnTunnelButton],
    });

    this.card = new xb.UICard({
      size: { width: 0.72, height: 'auto' },
      manipulation: true,
      edge: true,
      style: {
        flexDirection: 'column',
        gap: 10,
        padding: 18,
        backgroundColor: '#0E1018F5',
        borderRadius: 14,
      },
      children: [
        headerRow,
        this.pathText,
        this.roleText,
        this.zodText,
        this.codeText,
        actionRow,
      ],
    });

    this.card.name = 'Hologram AST Inspector Card';
    this.card.position.set(1.38, 1.72, -1.55);
    this.card.rotation.y = -0.22;
    this.card.renderOrder = 30;
  }

  public updateNode(
    node: DirectoryNode,
    worldPos?: THREE.Vector3,
    isFocusedMode = false
  ): void {
    this.titleText.text = node.name;
    this.titleText.style.color = node.colorHex || '#00E5FF';
    this.tokenBadgeText.text = `${(
      node.layer || 'midground'
    ).toUpperCase()} · ${node.tokenEstimate || `~${node.tokens} tokens`}`;
    this.pathText.text = `PATH: ${node.path}  ·  ${
      node.kind === 'folder' ? 'DIRECTORY' : 'FILE'
    }  ·  COLOR: ${node.colorHex}`;
    this.roleText.text = node.role;
    this.zodText.text = `ZOD CONTRACT:\n${
      node.zodContract || 'z.object({ valid: z.literal(true) })'
    }`;
    this.codeText.text = node.tsInterface;
    this.branchButton.label =
      node.kind === 'folder'
        ? node.expanded
          ? 'Collapse Branch'
          : 'Bloom Branch'
        : 'Pulse Tendril';

    if (worldPos) {
      if (isFocusedMode) {
        // In NODE_INSPECT_MODE, position the Hologram Card directly adjacent to the focused node
        // so both the 3D Node and its glowing Hologram Card are framed side-by-side in the viewport
        this.card.position.set(
          worldPos.x + 0.68,
          Math.max(1.18, worldPos.y + 0.04),
          worldPos.z + 0.06
        );
        this.card.rotation.set(0, -0.14, 0);
      } else {
        // In TUNNEL_FLIGHT_MODE, keep the Hologram Card well above the Obsidian Mirror Pool (Y >= 1.58m)
        const sideOffset = worldPos.x >= 0 ? 0.88 : -0.88;
        this.card.position.set(
          THREE.MathUtils.clamp(worldPos.x + sideOffset, -2.15, 2.15),
          THREE.MathUtils.clamp(worldPos.y + 0.25, 1.58, 2.42),
          worldPos.z + 0.42
        );
        this.card.rotation.set(0, worldPos.x >= 0 ? -0.22 : 0.22, 0);
      }
    }

    this.card.renderOrder = 30;
    this.card.traverse((obj) => {
      obj.renderOrder = 30;
    });
  }
}

