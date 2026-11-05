import {
  DEFAULT_REPOSITORY_TREE_DOCUMENT,
  parseSpatialRepositoryTree,
  PLAYGROUND_SCREENSHOTS,
  THEME_PALETTES,
  ZONE_MARKERS,
} from './constants';
import {
  DirectoryNode,
  SpatialConfigState,
  ThemePresetId,
} from './types';

export interface DockCallbacks {
  onStateChange: (partial: Partial<SpatialConfigState>) => void;
  onJumpToZone: (zoneIndex: number) => void;
  onUploadScreenSlotImage: (
    slotIndex: 0 | 1 | 2 | 3,
    img: HTMLImageElement,
    dataUrl: string
  ) => void;
  onAssignPresetToSlot: (slotIndex: 0 | 1 | 2 | 3, imageUrl: string) => void;
  onUpdateSlotText: (
    slotIndex: 0 | 1 | 2 | 3,
    nodeTitle: string,
    subtitle: string
  ) => void;
  onSyncDirectoryJson: (
    rootNode: DirectoryNode,
    meta?: {
      systemIdentity: string;
      targetPlatform: string;
      architecturalParadigm: string;
    }
  ) => void;
  onExpandCollapseAll: (expanded: boolean) => void;
  onFocusNodeById: (nodeId: string) => void;
  onReturnToTunnelFlight: () => void;
  onExportAutoFlyVideo: () => void;
}

export class SpatialControlDockUI {
  private container: HTMLElement;
  private state: SpatialConfigState;
  private callbacks: DockCallbacks;
  private currentTreeRoot: DirectoryNode;
  private activeTab: 0 | 1 | 2 | 3 | 4 = 0;
  private dockCollapsed = false;
  private bottomHudCollapsed = false;
  private quickTreeCollapsed = false;
  private currentTreeJsonString = JSON.stringify(
    DEFAULT_REPOSITORY_TREE_DOCUMENT,
    null,
    2
  );

  // Live DOM elements for fast tabular-nums updates
  private zCoordReadoutEl!: HTMLElement;
  private zoneBadgeEl!: HTMLElement;
  private progressSliderEl!: HTMLInputElement;
  private progressPctEl!: HTMLElement;
  private zoneStepButtons: HTMLButtonElement[] = [];
  private dockPanelEl!: HTMLElement;
  private dockToggleBtnEl!: HTMLButtonElement;
  private bottomBarBodyEl!: HTMLElement;
  private bottomCollapseBtnEl!: HTMLButtonElement;
  private selectedNodeBannerEl!: HTMLElement;
  private jsonStatusEl!: HTMLElement;
  private escReturnFloatingBarEl!: HTMLElement;
  private escReturnNodeLabelEl!: HTMLElement;
  private escReturnAnchorLabelEl!: HTMLElement;
  private quickNodeListBodyEl!: HTMLElement;
  private quickNodeToggleBtnEl!: HTMLButtonElement;
  private camModeBadgeEl!: HTMLElement;
  private topExportBtnEl!: HTMLButtonElement;
  private lastExportStatusMsg =
    'READY · VP9 CODEC (3.0 Mbps) · 60 FPS · 6.0s AUTO-FLY (~2MB)';

  constructor(
    state: SpatialConfigState,
    initialTreeRoot: DirectoryNode,
    callbacks: DockCallbacks
  ) {
    this.state = state;
    this.currentTreeRoot = initialTreeRoot;
    this.callbacks = callbacks;
    this.container = document.createElement('div');
    this.container.id = 'cyber-spatial-hud';
    document.body.appendChild(this.container);

    this.buildDOM();
    this.bindKeyboardShortcuts();
  }

  public syncStateRef(nextState: SpatialConfigState): void {
    this.state = nextState;
    this.syncCameraModeUI();
  }

  public syncTreeRoot(nextTreeRoot: DirectoryNode): void {
    this.currentTreeRoot = nextTreeRoot;
    this.renderQuickNodeList();
  }

  public isDockCollapsed(): boolean {
    return this.dockCollapsed;
  }

  private bindKeyboardShortcuts(): void {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.state.cameraMode === 'NODE_INSPECT_MODE') {
          e.preventDefault();
          this.callbacks.onReturnToTunnelFlight();
        }
        return;
      }

      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.key === 'h' || e.key === 'H') {
        this.toggleDock(!this.dockCollapsed);
      } else if (e.key === ' ') {
        e.preventDefault();
        if (this.state.cameraMode === 'NODE_INSPECT_MODE') {
          this.callbacks.onReturnToTunnelFlight();
          return;
        }
        const nextMode =
          this.state.flightMode === 'AUTO-FLY' ? 'MANUAL' : 'AUTO-FLY';
        this.callbacks.onStateChange({ flightMode: nextMode });
        this.renderTabContent();
        this.syncBottomFlightModeButton();
      } else if (e.key === '1') {
        this.callbacks.onJumpToZone(0);
      } else if (e.key === '2') {
        this.callbacks.onJumpToZone(1);
      } else if (e.key === '3') {
        this.callbacks.onJumpToZone(2);
      } else if (e.key === '4') {
        this.callbacks.onJumpToZone(3);
      }
    });
  }

  private buildDOM(): void {
    this.container.innerHTML = `
      <!-- TOP PERIMETER BAR -->
      <header class="cyber-top-bar">
        <div class="cyber-brand-cluster">
          <button id="cyber-dock-toggle-btn" class="cyber-btn-swiss cyber-btn-accent" type="button">
            [SYS//CONFIG DOCK ▾]
          </button>
          <span class="cyber-brand-title">ARTIFICIALCRAFT.SPACE</span>
          <span class="cyber-sep">·</span>
          <span id="cyber-cam-mode-badge" class="cyber-cam-mode-badge mode-tunnel">MODE A: TUNNEL FLIGHT</span>
        </div>

        <div class="cyber-telemetry-cluster">
          <span id="cyber-active-zone-label" class="cyber-zone-readout">ZONE 01 · UI GLASS SCREEN</span>
          <span class="cyber-sep">/</span>
          <span id="cyber-z-coord-readout" class="cyber-mono-num">CAM Z: +10.20m</span>
          <span class="cyber-sep">/</span>
          <span id="cyber-selected-node-banner" class="cyber-node-readout">NODE: /src/core/registry.ts (~50 tokens)</span>
        </div>

        <div class="cyber-actions-cluster">
          <button id="cyber-top-export-btn" class="cyber-btn-swiss cyber-btn-export" type="button">
            [EXPORT AUTO-FLY CLIP (.WEBM)]
          </button>
          <button id="cyber-audio-btn" class="cyber-btn-swiss" type="button">
            AUDIO: ON
          </button>
        </div>
      </header>

      <!-- FLOATING [ESC // RETURN TO TUNNEL FLIGHT] BAR (VISIBLE IN NODE_INSPECT_MODE) -->
      <div id="cyber-esc-return-bar" class="cyber-esc-return-bar hidden">
        <div class="cyber-esc-meta">
          <span class="cyber-esc-kicker">MODE B · NODE INSPECT FOCUS (SCROLL PAUSED)</span>
          <span id="cyber-esc-node-label" class="cyber-esc-node-name">/src/core/registry.ts</span>
          <span id="cyber-esc-anchor-label" class="cyber-esc-anchor-info">ANCHOR SAVED: 4% (Z = +9.49m)</span>
        </div>
        <button id="cyber-esc-return-btn" class="cyber-btn-swiss cyber-esc-action-btn" type="button">
          [ESC // RETURN TO TUNNEL FLIGHT]
        </button>
      </div>

      <!-- COLLAPSIBLE LEFT CONFIGURATION DOCK -->
      <aside id="cyber-config-dock" class="cyber-config-dock">
        <div class="cyber-dock-header">
          <div class="cyber-dock-title-group">
            <span class="cyber-dock-kicker">DUAL-STATE CAMERA · 01:00 AM</span>
            <h2 class="cyber-dock-heading">Spatial Configurator Dock</h2>
          </div>
          <button id="cyber-dock-close-btn" class="cyber-btn-icon" type="button" title="Collapse Config Dock (Key: H)">
            [COLLAPSE ×]
          </button>
        </div>

        <!-- 5 TABS NAVIGATION -->
        <div class="cyber-dock-tabs" role="tablist">
          <button data-tab="0" class="cyber-tab-btn active" type="button">01. Surface</button>
          <button data-tab="1" class="cyber-tab-btn" type="button">02. JSON</button>
          <button data-tab="2" class="cyber-tab-btn" type="button">03. Flight</button>
          <button data-tab="3" class="cyber-tab-btn" type="button">04. Visual</button>
          <button data-tab="4" class="cyber-tab-btn" type="button">05. .WEBM</button>
        </div>

        <!-- TAB BODY -->
        <div id="cyber-dock-body" class="cyber-dock-body"></div>

        <!-- COLLAPSIBLE HUD DIRECTORY QUICK-SELECTION DOCK -->
        <div class="cyber-quick-tree-section">
          <div class="cyber-quick-tree-header">
            <button id="cyber-quick-tree-toggle" class="cyber-quick-tree-toggle-btn" type="button">
              <span>▾ HUD DIRECTORY QUICK-SELECT (CLICK TO ZOOM)</span>
            </button>
            <button id="cyber-quick-unfocus-btn" class="cyber-quick-unfocus-mini hidden" type="button">
              [ESC // UN-FOCUS]
            </button>
          </div>
          <div id="cyber-quick-tree-list" class="cyber-quick-tree-list"></div>
        </div>

        <!-- DOCK FOOTER -->
        <div class="cyber-dock-footer">
          <span>CLICK NODE: GSAP FOCUS</span>
          <span>·</span>
          <span>ESC / BG CLICK: TUNNEL</span>
        </div>
      </aside>

      <!-- BOTTOM TIMELINE & ZONE SNAP CONTROLLER -->
      <section class="cyber-bottom-dock">
        <div class="cyber-bottom-collapse-row">
          <button id="cyber-bottom-collapse-btn" class="cyber-collapse-pill" type="button">
            ▾ Hide Timeline Controls
          </button>
        </div>
        <div id="cyber-bottom-body" class="cyber-bottom-body">
          <div class="cyber-zone-steps" id="cyber-zone-steps">
            ${ZONE_MARKERS.map(
              (z) => `
              <button data-zone="${z.index}" class="cyber-zone-step-btn ${
                z.index === 0 ? 'active' : ''
              }" type="button">
                <span class="cyber-step-code">${z.code}: ${z.label}</span>
                <span class="cyber-step-range">${z.zRange}</span>
              </button>
            `
            ).join('')}
          </div>

          <div class="cyber-slider-row">
            <button id="cyber-quick-autofly-btn" class="cyber-btn-swiss cyber-autofly-btn" type="button">
              MODE: MANUAL SLIDER
            </button>
            <div class="cyber-timeline-track-wrap">
              <span class="cyber-mono-label">Z-TUNNEL DEPTH</span>
              <input
                id="cyber-timeline-slider"
                type="range"
                min="0"
                max="1000"
                step="1"
                value="${Math.round(this.state.progress * 1000)}"
                class="cyber-range-input"
                aria-label="Z-Axis Tunnel Progress"
              />
              <span id="cyber-timeline-pct" class="cyber-mono-num">4%</span>
            </div>
            <button id="cyber-expand-all-quick-btn" class="cyber-btn-swiss" type="button">
              BLOOM ALL 3D BRANCHES
            </button>
          </div>
        </div>
      </section>
    `;

    this.zCoordReadoutEl = this.container.querySelector('#cyber-z-coord-readout')!;
    this.zoneBadgeEl = this.container.querySelector('#cyber-active-zone-label')!;
    this.progressSliderEl = this.container.querySelector('#cyber-timeline-slider')!;
    this.progressPctEl = this.container.querySelector('#cyber-timeline-pct')!;
    this.dockPanelEl = this.container.querySelector('#cyber-config-dock')!;
    this.dockToggleBtnEl = this.container.querySelector('#cyber-dock-toggle-btn')!;
    this.bottomBarBodyEl = this.container.querySelector('#cyber-bottom-body')!;
    this.bottomCollapseBtnEl = this.container.querySelector('#cyber-bottom-collapse-btn')!;
    this.selectedNodeBannerEl = this.container.querySelector('#cyber-selected-node-banner')!;
    this.escReturnFloatingBarEl = this.container.querySelector('#cyber-esc-return-bar')!;
    this.escReturnNodeLabelEl = this.container.querySelector('#cyber-esc-node-label')!;
    this.escReturnAnchorLabelEl = this.container.querySelector('#cyber-esc-anchor-label')!;
    this.quickNodeListBodyEl = this.container.querySelector('#cyber-quick-tree-list')!;
    this.quickNodeToggleBtnEl = this.container.querySelector('#cyber-quick-tree-toggle')!;
    this.camModeBadgeEl = this.container.querySelector('#cyber-cam-mode-badge')!;
    this.topExportBtnEl = this.container.querySelector('#cyber-top-export-btn')!;

    this.zoneStepButtons = Array.from(
      this.container.querySelectorAll('.cyber-zone-step-btn')
    );

    // Bind Top Bar [EXPORT AUTO-FLY CLIP (.WEBM)] button
    this.topExportBtnEl.addEventListener('click', () => {
      this.callbacks.onExportAutoFlyVideo();
    });

    // Bind floating [ESC // RETURN TO TUNNEL FLIGHT] button and quick un-focus mini button
    this.container
      .querySelector('#cyber-esc-return-btn')!
      .addEventListener('click', () => {
        this.callbacks.onReturnToTunnelFlight();
      });
    this.container
      .querySelector('#cyber-quick-unfocus-btn')!
      .addEventListener('click', () => {
        this.callbacks.onReturnToTunnelFlight();
      });

    // Bind collapsible HUD Directory Quick-Selection toggle
    this.quickNodeToggleBtnEl.addEventListener('click', () => {
      this.quickTreeCollapsed = !this.quickTreeCollapsed;
      this.quickNodeListBodyEl.classList.toggle(
        'collapsed',
        this.quickTreeCollapsed
      );
      this.quickNodeToggleBtnEl.innerHTML = `<span>${
        this.quickTreeCollapsed ? '▸' : '▾'
      } HUD DIRECTORY QUICK-SELECT (CLICK TO ZOOM)</span>`;
    });

    this.dockToggleBtnEl.addEventListener('click', () => {
      this.toggleDock(!this.dockCollapsed);
    });
    this.container
      .querySelector('#cyber-dock-close-btn')!
      .addEventListener('click', () => {
        this.toggleDock(true);
      });

    const audioBtn = this.container.querySelector(
      '#cyber-audio-btn'
    ) as HTMLButtonElement;
    audioBtn.addEventListener('click', () => {
      const nextMuted = !this.state.audioMuted;
      this.callbacks.onStateChange({ audioMuted: nextMuted });
      audioBtn.textContent = nextMuted ? 'AUDIO: MUTED' : 'AUDIO: ON';
    });

    const tabBtns = Array.from(
      this.container.querySelectorAll('.cyber-tab-btn')
    ) as HTMLButtonElement[];
    tabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.tab) as 0 | 1 | 2 | 3 | 4;
        this.activeTab = idx;
        tabBtns.forEach((b, i) => b.classList.toggle('active', i === idx));
        this.renderTabContent();
      });
    });

    this.zoneStepButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const zIdx = Number(btn.dataset.zone);
        this.callbacks.onJumpToZone(zIdx);
      });
    });

    this.progressSliderEl.addEventListener('input', () => {
      const val = Number(this.progressSliderEl.value) / 1000;
      this.callbacks.onStateChange({
        cameraMode: 'TUNNEL_FLIGHT_MODE',
        focusedNodeId: null,
        flightMode: 'MANUAL',
        progress: val,
      });
      this.syncBottomFlightModeButton();
      if (this.activeTab === 2) {
        this.renderTabContent();
      }
    });

    const quickAutoFlyBtn = this.container.querySelector(
      '#cyber-quick-autofly-btn'
    ) as HTMLButtonElement;
    quickAutoFlyBtn.addEventListener('click', () => {
      if (this.state.cameraMode === 'NODE_INSPECT_MODE') {
        this.callbacks.onReturnToTunnelFlight();
        return;
      }
      const nextMode =
        this.state.flightMode === 'AUTO-FLY' ? 'MANUAL' : 'AUTO-FLY';
      this.callbacks.onStateChange({ flightMode: nextMode });
      this.syncBottomFlightModeButton();
      if (this.activeTab === 2) {
        this.renderTabContent();
      }
    });

    let allExpanded = true;
    const expandAllQuickBtn = this.container.querySelector(
      '#cyber-expand-all-quick-btn'
    ) as HTMLButtonElement;
    expandAllQuickBtn.addEventListener('click', () => {
      allExpanded = !allExpanded;
      this.callbacks.onExpandCollapseAll(allExpanded);
      expandAllQuickBtn.textContent = allExpanded
        ? 'COLLAPSE 3D BRANCHES'
        : 'BLOOM ALL 3D BRANCHES';
    });

    this.bottomCollapseBtnEl.addEventListener('click', () => {
      this.bottomHudCollapsed = !this.bottomHudCollapsed;
      this.bottomBarBodyEl.classList.toggle('collapsed', this.bottomHudCollapsed);
      this.bottomCollapseBtnEl.textContent = this.bottomHudCollapsed
        ? '▴ Show Timeline Controls'
        : '▾ Hide Timeline Controls';
    });

    this.renderTabContent();
    this.renderQuickNodeList();
    this.syncBottomFlightModeButton();
    this.syncCameraModeUI();
  }

  public toggleDock(collapse: boolean): void {
    this.dockCollapsed = collapse;
    this.dockPanelEl.classList.toggle('collapsed', this.dockCollapsed);
    this.dockToggleBtnEl.textContent = this.dockCollapsed
      ? '[SYS//CONFIG DOCK ▸]'
      : '[SYS//CONFIG DOCK ▾]';
  }

  private syncBottomFlightModeButton(): void {
    const btn = this.container.querySelector(
      '#cyber-quick-autofly-btn'
    ) as HTMLButtonElement | null;
    if (!btn) return;
    if (this.state.cameraMode === 'NODE_INSPECT_MODE') {
      btn.textContent = '[ESC // RETURN TO TUNNEL]';
      btn.classList.add('cyber-btn-accent');
      return;
    }
    const isAuto = this.state.flightMode === 'AUTO-FLY';
    btn.textContent = isAuto ? 'CRUISE: AUTO-FLY [ACTIVE]' : 'MODE: MANUAL SLIDER';
    btn.classList.toggle('cyber-btn-accent', isAuto);
  }

  public syncCameraModeUI(): void {
    const isInspect = this.state.cameraMode === 'NODE_INSPECT_MODE';
    if (this.escReturnFloatingBarEl) {
      this.escReturnFloatingBarEl.classList.toggle('hidden', !isInspect);
    }
    const miniUnfocusBtn = this.container.querySelector(
      '#cyber-quick-unfocus-btn'
    );
    if (miniUnfocusBtn) {
      miniUnfocusBtn.classList.toggle('hidden', !isInspect);
    }
    if (this.camModeBadgeEl) {
      this.camModeBadgeEl.textContent = isInspect
        ? 'MODE B: NODE INSPECT FOCUS'
        : 'MODE A: TUNNEL FLIGHT';
      this.camModeBadgeEl.classList.toggle('mode-inspect', isInspect);
      this.camModeBadgeEl.classList.toggle('mode-tunnel', !isInspect);
    }
    if (this.escReturnAnchorLabelEl) {
      const anchorPct = Math.round(this.state.anchorProgress * 100);
      const anchorZ = 10.2 + ( -7.6 - 10.2 ) * this.state.anchorProgress;
      const sign = anchorZ >= 0 ? '+' : '';
      this.escReturnAnchorLabelEl.textContent = `ANCHOR SAVED: ${anchorPct}% (Z = ${sign}${anchorZ.toFixed(
        2
      )}m)`;
    }
    this.syncBottomFlightModeButton();
    this.renderQuickNodeList();
  }

  public renderQuickNodeList(): void {
    if (!this.quickNodeListBodyEl || !this.currentTreeRoot) return;
    const flatNodes: Array<{ node: DirectoryNode; depth: number }> = [];
    const walk = (n: DirectoryNode, depth: number) => {
      flatNodes.push({ node: n, depth });
      if (n.children) {
        for (const c of n.children) {
          walk(c, depth + 1);
        }
      }
    };
    walk(this.currentTreeRoot, 0);

    this.quickNodeListBodyEl.innerHTML = flatNodes
      .map(({ node, depth }) => {
        const isFocused = this.state.focusedNodeId === node.id;
        const indentPx = depth * 12;
        const badge = node.kind === 'folder' ? 'DIR' : 'FILE';
        return `
          <button
            type="button"
            class="cyber-quick-node-item ${isFocused ? 'active' : ''}"
            data-focus-node="${escapeAttr(node.id)}"
            style="padding-left: ${8 + indentPx}px"
          >
            <span class="cyber-quick-node-dot" style="background:${escapeAttr(
              node.colorHex || '#00E5FF'
            )}"></span>
            <span class="cyber-quick-node-kind">[${badge}]</span>
            <span class="cyber-quick-node-label">${escapeAttr(node.name)}</span>
            <span class="cyber-quick-node-tokens">${escapeAttr(
              node.tokenEstimate || `~${node.tokens}t`
            )}</span>
          </button>
        `;
      })
      .join('');

    const itemBtns = Array.from(
      this.quickNodeListBodyEl.querySelectorAll('[data-focus-node]')
    ) as HTMLButtonElement[];
    itemBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const nodeId = btn.dataset.focusNode;
        if (nodeId) {
          this.callbacks.onFocusNodeById(nodeId);
        }
      });
    });
  }

  public updateLiveTelemetry(
    camZ: number,
    progress: number,
    activeZoneIndex: number
  ): void {
    const sign = camZ >= 0 ? '+' : '';
    this.zCoordReadoutEl.textContent =
      this.state.cameraMode === 'NODE_INSPECT_MODE'
        ? `INSPECT Z: ${sign}${camZ.toFixed(2)}m`
        : `CAM Z: ${sign}${camZ.toFixed(2)}m`;

    const pct = Math.round(progress * 100);
    this.progressPctEl.textContent = `${pct}%`;
    if (document.activeElement !== this.progressSliderEl) {
      this.progressSliderEl.value = String(Math.round(progress * 1000));
    }

    const zInfo = ZONE_MARKERS[activeZoneIndex] || ZONE_MARKERS[0];
    this.zoneBadgeEl.textContent = `${zInfo.code} · ${zInfo.label.toUpperCase()}`;

    this.zoneStepButtons.forEach((btn, idx) => {
      btn.classList.toggle('active', idx === activeZoneIndex);
    });
  }

  public updateSelectedNodeBanner(node: DirectoryNode): void {
    this.selectedNodeBannerEl.textContent = `NODE: ${node.path} (${
      node.tokenEstimate || `~${node.tokens} tokens`
    })`;
    if (this.escReturnNodeLabelEl) {
      this.escReturnNodeLabelEl.textContent = `${node.path} · ${
        node.tokenEstimate || `~${node.tokens} tokens`
      }`;
    }
  }

  public refreshCurrentTab(): void {
    this.renderTabContent();
  }

  private renderTabContent(): void {
    const body = this.container.querySelector('#cyber-dock-body') as HTMLElement;
    if (!body) return;

    if (this.activeTab === 0) {
      const activeSlotIdx = this.state.selectedScreenSlot;
      const activeSlot =
        this.state.screenSlots[activeSlotIdx] || this.state.screenSlots[0];

      body.innerHTML = `
        <div class="cyber-tab-section">
          <div class="cyber-section-title">Tab 01 · Sequential 4-Screen Surface Swapper</div>
          <p class="cyber-helper-text">
            Chọn màn hình (01 → 04) hoặc bật <strong>Tự động chuyển màn hình</strong> để tải ảnh lên thay thế lần lượt từng màn hình 3D.
          </p>

          <!-- 4 SCREEN SLOT SELECTOR GRID -->
          <div class="cyber-screen-slot-grid">
            ${this.state.screenSlots
              .map(
                (slot) => `
              <div class="cyber-screen-slot-card ${
                slot.slotIndex === activeSlotIdx ? 'active' : ''
              }" data-slot-card="${slot.slotIndex}">
                <div class="cyber-slot-card-top">
                  <span class="cyber-slot-num">MÀN HÌNH 0${
                    slot.slotIndex + 1
                  }</span>
                  <button type="button" class="cyber-slot-upload-mini" data-upload-slot="${
                    slot.slotIndex
                  }">
                    Tải Ảnh ▴
                  </button>
                </div>
                <div class="cyber-slot-thumb-wrap">
                  <img src="${slot.imageUrl}" alt="${escapeAttr(
                  slot.label
                )}" referrerpolicy="no-referrer" class="cyber-slot-thumb" />
                  <div class="cyber-slot-thumb-fallback">${escapeAttr(
                    slot.badge
                  )}</div>
                </div>
                <span class="cyber-slot-caption">${escapeAttr(
                  slot.badge
                )}</span>
              </div>
            `
              )
              .join('')}
          </div>

          <button id="ui-auto-advance-btn" class="cyber-btn-swiss ${
            this.state.autoAdvanceScreenSlot ? 'cyber-btn-accent' : ''
          }" type="button">
            CHẾ ĐỘ TẢI LẦN LƯỢT (01→02→03→04): ${
              this.state.autoAdvanceScreenSlot ? 'BẬT' : 'TẮT'
            }
          </button>

          <div class="cyber-dropzone" id="ui-image-dropzone">
            <span>KÉO THẢ HOẶC CLICK TẢI ẢNH CHO [MÀN HÌNH 0${
              activeSlotIdx + 1
            }] (Hỗ trợ chọn nhiều ảnh cùng lúc để thay lần lượt)</span>
            <input id="ui-image-file-input" type="file" accept="image/*" multiple style="display:none" />
          </div>

          <label class="cyber-field-label">Preset Gốc ArtificialCraft.space (Gán vào Màn Hình 0${
            activeSlotIdx + 1
          })</label>
          <div class="cyber-btn-row">
            <button data-preset="${
              PLAYGROUND_SCREENSHOTS.monolith3D
            }" class="cyber-btn-swiss preset-slot-btn" type="button">
              Node 01: Monolith
            </button>
            <button data-preset="${
              PLAYGROUND_SCREENSHOTS.remotion60
            }" class="cyber-btn-swiss preset-slot-btn" type="button">
              Node 02: Remotion
            </button>
            <button data-preset="${
              PLAYGROUND_SCREENSHOTS.bannerStudio
            }" class="cyber-btn-swiss preset-slot-btn" type="button">
              Node 03: Banner
            </button>
          </div>

          <label class="cyber-field-label">Tiêu Đề Màn Hình 0${
            activeSlotIdx + 1
          }</label>
          <input id="ui-swap-title" class="cyber-text-input" type="text" value="${escapeAttr(
            activeSlot.nodeTitle
          )}" />

          <label class="cyber-field-label">Phụ Đề Telemetry Màn Hình 0${
            activeSlotIdx + 1
          }</label>
          <input id="ui-swap-subtitle" class="cyber-text-input" type="text" value="${escapeAttr(
            activeSlot.subtitle
          )}" />

          <div class="cyber-btn-row">
            <button id="ui-apply-btn" class="cyber-btn-swiss cyber-btn-accent" type="button">
              Cập Nhật Màn Hình 0${activeSlotIdx + 1}
            </button>
            <button id="ui-focus-zone1-btn" class="cyber-btn-swiss" type="button">
              Bay Tới Zone 01
            </button>
          </div>
        </div>
      `;

      const slotCards = Array.from(
        body.querySelectorAll('[data-slot-card]')
      ) as HTMLElement[];
      slotCards.forEach((card) => {
        card.addEventListener('click', (e) => {
          if (
            e.target instanceof HTMLElement &&
            e.target.closest('[data-upload-slot]')
          ) {
            return;
          }
          const idx = Number(card.dataset.slotCard) as 0 | 1 | 2 | 3;
          this.callbacks.onStateChange({ selectedScreenSlot: idx });
          this.renderTabContent();
        });
      });

      const miniUploadBtns = Array.from(
        body.querySelectorAll('[data-upload-slot]')
      ) as HTMLButtonElement[];
      const fileInput = body.querySelector(
        '#ui-image-file-input'
      ) as HTMLInputElement;

      miniUploadBtns.forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = Number(btn.dataset.uploadSlot) as 0 | 1 | 2 | 3;
          this.callbacks.onStateChange({ selectedScreenSlot: idx });
          this.renderTabContent();
          const refreshedInput = this.container.querySelector(
            '#ui-image-file-input'
          ) as HTMLInputElement | null;
          refreshedInput?.click();
        });
      });

      body
        .querySelector('#ui-auto-advance-btn')!
        .addEventListener('click', () => {
          this.callbacks.onStateChange({
            autoAdvanceScreenSlot: !this.state.autoAdvanceScreenSlot,
          });
          this.renderTabContent();
        });

      const presetBtns = Array.from(
        body.querySelectorAll('.preset-slot-btn')
      ) as HTMLButtonElement[];
      presetBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          const url = btn.dataset.preset!;
          this.callbacks.onAssignPresetToSlot(this.state.selectedScreenSlot, url);
        });
      });

      body.querySelector('#ui-apply-btn')!.addEventListener('click', () => {
        const titleInput = body.querySelector(
          '#ui-swap-title'
        ) as HTMLInputElement;
        const subInput = body.querySelector(
          '#ui-swap-subtitle'
        ) as HTMLInputElement;
        this.callbacks.onUpdateSlotText(
          this.state.selectedScreenSlot,
          titleInput.value || activeSlot.nodeTitle,
          subInput.value || activeSlot.subtitle
        );
      });

      body
        .querySelector('#ui-focus-zone1-btn')!
        .addEventListener('click', () => {
          this.callbacks.onJumpToZone(0);
        });

      const dropzone = body.querySelector('#ui-image-dropzone') as HTMLElement;
      dropzone.addEventListener('click', () => fileInput.click());
      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });
      dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
      });
      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
          this.loadUploadedFilesSequentially(Array.from(files));
        }
      });
      fileInput.addEventListener('change', () => {
        const files = fileInput.files;
        if (files && files.length > 0) {
          this.loadUploadedFilesSequentially(Array.from(files));
        }
      });
    } else if (this.activeTab === 1) {
      body.innerHTML = `
        <div class="cyber-tab-section">
          <div class="cyber-section-title">Tab 02 · Spatial Tree AST (repository-tree.json)</div>
          <p class="cyber-helper-text">
            Hỗ trợ đầy đủ schema <code>systemIdentity</code>, <code>tree</code>, <code>layer: foreground | midground</code>, <code>colorHex</code>, <code>zodValidated</code>, <code>registeredPresets</code>.
          </p>

          <div class="cyber-dropzone" id="tree-json-dropzone">
            <span>KÉO THẢ HOẶC CLICK TẢI TỆP <code>repository-tree.json</code></span>
            <input id="tree-json-file-input" type="file" accept=".json,application/json" style="display:none" />
          </div>

          <div class="cyber-btn-row">
            <button id="tree-expand-all-btn" class="cyber-btn-swiss cyber-btn-accent" type="button">
              Bloom All Branches
            </button>
            <button id="tree-collapse-all-btn" class="cyber-btn-swiss" type="button">
              Collapse to Buds
            </button>
          </div>

          <textarea id="tree-json-textarea" class="cyber-textarea cyber-mono-textarea" rows="7">${
            this.currentTreeJsonString
          }</textarea>

          <div id="tree-zod-status" class="cyber-status-strip">
            SYSTEM: ${escapeAttr(this.state.systemIdentity)} · ZOD PARSER READY
          </div>

          <div class="cyber-btn-row">
            <button id="tree-sync-btn" class="cyber-btn-swiss cyber-btn-accent" type="button">
              Parse &amp; Bloom 3D Tree
            </button>
            <button id="tree-reset-default-btn" class="cyber-btn-swiss" type="button">
              Restore Official SSOT JSON
            </button>
          </div>
        </div>
      `;

      this.jsonStatusEl = body.querySelector('#tree-zod-status')!;
      const textareaEl = body.querySelector(
        '#tree-json-textarea'
      ) as HTMLTextAreaElement;

      const applyRawJsonString = (rawText: string) => {
        try {
          const parsed = JSON.parse(rawText);
          const { docMeta, rootNode } = parseSpatialRepositoryTree(parsed);
          this.currentTreeJsonString = JSON.stringify(parsed, null, 2);
          textareaEl.value = this.currentTreeJsonString;
          const totalNodes = countTreeNodes(rootNode);
          this.syncTreeRoot(rootNode);
          this.callbacks.onSyncDirectoryJson(rootNode, docMeta);
          this.jsonStatusEl.textContent = `ZOD VERIFIED: ${docMeta.systemIdentity} · ${totalNodes} NODES BLOOMED`;
          this.callbacks.onJumpToZone(2);
        } catch (err) {
          this.jsonStatusEl.textContent = `ZOD VALIDATION ERROR: ${
            err instanceof Error ? err.message : 'Invalid JSON format'
          }`;
        }
      };

      // Wire JSON File Drag-and-Drop & File Picker
      const jsonDropzone = body.querySelector(
        '#tree-json-dropzone'
      ) as HTMLElement;
      const jsonFileInput = body.querySelector(
        '#tree-json-file-input'
      ) as HTMLInputElement;

      jsonDropzone.addEventListener('click', () => jsonFileInput.click());
      jsonDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        jsonDropzone.classList.add('dragover');
      });
      jsonDropzone.addEventListener('dragleave', () => {
        jsonDropzone.classList.remove('dragover');
      });
      jsonDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        jsonDropzone.classList.remove('dragover');
        const file = e.dataTransfer?.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => applyRawJsonString(String(reader.result));
          reader.readAsText(file);
        }
      });
      jsonFileInput.addEventListener('change', () => {
        const file = jsonFileInput.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => applyRawJsonString(String(reader.result));
          reader.readAsText(file);
        }
      });

      body
        .querySelector('#tree-expand-all-btn')!
        .addEventListener('click', () => {
          this.callbacks.onExpandCollapseAll(true);
          this.callbacks.onJumpToZone(2);
        });
      body
        .querySelector('#tree-collapse-all-btn')!
        .addEventListener('click', () => {
          this.callbacks.onExpandCollapseAll(false);
          this.callbacks.onJumpToZone(2);
        });
      body
        .querySelector('#tree-reset-default-btn')!
        .addEventListener('click', () => {
          const defaultStr = JSON.stringify(
            DEFAULT_REPOSITORY_TREE_DOCUMENT,
            null,
            2
          );
          applyRawJsonString(defaultStr);
        });

      body.querySelector('#tree-sync-btn')!.addEventListener('click', () => {
        applyRawJsonString(textareaEl.value);
      });
    } else if (this.activeTab === 2) {
      const isAuto = this.state.flightMode === 'AUTO-FLY';
      body.innerHTML = `
        <div class="cyber-tab-section">
          <div class="cyber-section-title">Tab 03 · Flight Cam &amp; Auto-Fly Video Exporter</div>
          <p class="cyber-helper-text">
            Switch between Cruise Auto-Fly and Manual Timeline Control, or export a 6-second 60 FPS <code>.webm</code> motion clip.
          </p>

          <div class="cyber-btn-row">
            <button id="cam-mode-auto" class="cyber-btn-swiss ${
              isAuto ? 'cyber-btn-accent' : ''
            }" type="button">
              AUTO-FLY CRUISE
            </button>
            <button id="cam-mode-manual" class="cyber-btn-swiss ${
              !isAuto ? 'cyber-btn-accent' : ''
            }" type="button">
              MANUAL SLIDER
            </button>
          </div>

          <label class="cyber-field-label">
            Cruise Velocity Multiplier: <span id="vel-val" class="cyber-mono-num">${this.state.flightVelocity.toFixed(
              2
            )}x</span>
          </label>
          <input id="cam-vel-slider" type="range" min="0.1" max="1.5" step="0.05" value="${
            this.state.flightVelocity
          }" class="cyber-range-input" />

          <label class="cyber-field-label">
            Camera Damping (Lerp Sensitivity): <span id="lerp-val" class="cyber-mono-num">${this.state.lerpSensitivity.toFixed(
              2
            )}</span>
          </label>
          <input id="cam-lerp-slider" type="range" min="0.01" max="0.18" step="0.01" value="${
            this.state.lerpSensitivity
          }" class="cyber-range-input" />

          ${this.buildVideoExporterWidgetHTML()}
        </div>
      `;

      body.querySelector('#cam-mode-auto')!.addEventListener('click', () => {
        this.callbacks.onStateChange({ flightMode: 'AUTO-FLY' });
        this.syncBottomFlightModeButton();
        this.renderTabContent();
      });
      body.querySelector('#cam-mode-manual')!.addEventListener('click', () => {
        this.callbacks.onStateChange({ flightMode: 'MANUAL' });
        this.syncBottomFlightModeButton();
        this.renderTabContent();
      });

      const velSlider = body.querySelector('#cam-vel-slider') as HTMLInputElement;
      const velVal = body.querySelector('#vel-val') as HTMLElement;
      velSlider.addEventListener('input', () => {
        const v = Number(velSlider.value);
        velVal.textContent = `${v.toFixed(2)}x`;
        this.callbacks.onStateChange({ flightVelocity: v });
      });

      const lerpSlider = body.querySelector('#cam-lerp-slider') as HTMLInputElement;
      const lerpVal = body.querySelector('#lerp-val') as HTMLElement;
      lerpSlider.addEventListener('input', () => {
        const l = Number(lerpSlider.value);
        lerpVal.textContent = l.toFixed(2);
        this.callbacks.onStateChange({ lerpSensitivity: l });
      });

      this.bindVideoExporterWidgetEvents(body);
    } else if (this.activeTab === 3) {
      body.innerHTML = `
        <div class="cyber-tab-section">
          <div class="cyber-section-title">Tab 04 · Deep Midnight (01:00 AM) Visuals &amp; Explode</div>

          <label class="cyber-field-label">Atmosphere &amp; Material Presets</label>
          <div class="cyber-swatch-grid">
            ${(Object.keys(THEME_PALETTES) as ThemePresetId[])
              .map((id) => {
                const p = THEME_PALETTES[id];
                const active = this.state.themeId === id;
                return `
                  <button data-theme="${id}" class="cyber-swatch-btn ${
                  active ? 'active' : ''
                }" type="button">
                    <span class="cyber-swatch-bar" style="background:${
                      p.primaryCss
                    }"></span>
                    <span>${p.name}</span>
                  </button>
                `;
              })
              .join('')}
          </div>

          <label class="cyber-field-label">
            Exploded View Z/Y Spacing: <span id="explode-val" class="cyber-mono-num">${this.state.explodedScale.toFixed(
              2
            )}x</span>
          </label>
          <input id="fx-explode-slider" type="range" min="0.5" max="2.0" step="0.05" value="${
            this.state.explodedScale
          }" class="cyber-range-input" />

          <label class="cyber-field-label">
            Binary Matrix Galaxy &amp; Skyvault Density: <span id="star-val" class="cyber-mono-num">${
              this.state.starDensity
            } nodes</span>
          </label>
          <input id="fx-star-slider" type="range" min="150" max="900" step="50" value="${
            this.state.starDensity
          }" class="cyber-range-input" />

          <label class="cyber-field-label">
            Indigo Rim &amp; Laser Bloom Halo: <span id="bloom-val" class="cyber-mono-num">${this.state.bloomStrength.toFixed(
              2
            )}</span>
          </label>
          <input id="fx-bloom-slider" type="range" min="0.3" max="2.0" step="0.05" value="${
            this.state.bloomStrength
          }" class="cyber-range-input" />

          <div class="cyber-btn-row" style="margin-top:8px">
            <button id="fx-fog-toggle" class="cyber-btn-swiss ${
              this.state.fogEnabled ? 'cyber-btn-accent' : ''
            }" type="button">
              ELECTRO-VOLUMETRIC FOG (0.012): ${
                this.state.fogEnabled ? 'ON' : 'OFF'
              }
            </button>
          </div>
        </div>
      `;

      const swatchBtns = Array.from(
        body.querySelectorAll('.cyber-swatch-btn')
      ) as HTMLButtonElement[];
      swatchBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          const themeId = btn.dataset.theme as ThemePresetId;
          this.callbacks.onStateChange({ themeId });
          this.renderTabContent();
        });
      });

      const explodeSlider = body.querySelector(
        '#fx-explode-slider'
      ) as HTMLInputElement;
      const explodeVal = body.querySelector('#explode-val') as HTMLElement;
      explodeSlider.addEventListener('input', () => {
        const v = Number(explodeSlider.value);
        explodeVal.textContent = `${v.toFixed(2)}x`;
        this.callbacks.onStateChange({ explodedScale: v });
      });

      const starSlider = body.querySelector('#fx-star-slider') as HTMLInputElement;
      const starVal = body.querySelector('#star-val') as HTMLElement;
      starSlider.addEventListener('input', () => {
        const s = Number(starSlider.value);
        starVal.textContent = `${s} nodes`;
        this.callbacks.onStateChange({ starDensity: s });
      });

      const bloomSlider = body.querySelector('#fx-bloom-slider') as HTMLInputElement;
      const bloomVal = body.querySelector('#bloom-val') as HTMLElement;
      bloomSlider.addEventListener('input', () => {
        const b = Number(bloomSlider.value);
        bloomVal.textContent = b.toFixed(2);
        this.callbacks.onStateChange({ bloomStrength: b });
      });

      const fogBtn = body.querySelector('#fx-fog-toggle') as HTMLButtonElement;
      fogBtn.addEventListener('click', () => {
        const nextFog = !this.state.fogEnabled;
        this.callbacks.onStateChange({ fogEnabled: nextFog });
        this.renderTabContent();
      });
    } else if (this.activeTab === 4) {
      body.innerHTML = `
        <div class="cyber-tab-section">
          <div class="cyber-section-title">Tab 05 · Client-Side Auto-Fly Motion Exporter (.WEBM)</div>
          <p class="cyber-helper-text">
            Zero-server-cost (<code>$0.00</code>) WebGL canvas video recorder. Captures a full 6-second 60 FPS fly-through from <strong>Zone 01 (Z = +10m)</strong> to <strong>Zone 04 (Z = -8m)</strong> encoded with VP9 at 3.0 Mbps (~2MB output).
          </p>
          ${this.buildVideoExporterWidgetHTML()}
        </div>
      `;
      this.bindVideoExporterWidgetEvents(body);
    }
  }

  private buildVideoExporterWidgetHTML(): string {
    const isRec = this.state.isRecordingVideo;
    const pct = Math.round(this.state.recordingProgress);
    const circumference = 2 * Math.PI * 16; // r = 16 => ~100.53
    const dashOffset = circumference - (pct / 100) * circumference;

    return `
      <div class="cyber-video-exporter-box ${isRec ? 'recording' : ''}">
        <div class="cyber-exporter-top-row">
          <svg class="cyber-progress-ring" width="40" height="40" viewBox="0 0 40 40">
            <circle
              class="cyber-ring-bg"
              cx="20"
              cy="20"
              r="16"
              fill="transparent"
              stroke="rgba(255,255,255,0.14)"
              stroke-width="3"
            />
            <circle
              id="cyber-export-ring-circle"
              class="cyber-ring-fill"
              cx="20"
              cy="20"
              r="16"
              fill="transparent"
              stroke="${isRec ? '#f43f5e' : '#00e5ff'}"
              stroke-width="3"
              stroke-dasharray="${circumference.toFixed(2)}"
              stroke-dashoffset="${dashOffset.toFixed(2)}"
            />
          </svg>
          <div class="cyber-exporter-meta">
            <span class="cyber-exporter-kicker">CLIENT-SIDE WEBCODECS / MEDIARECORDER</span>
            <span id="cyber-export-live-readout" class="cyber-exporter-readout">
              ${
                isRec
                  ? `[RECORDING: ${pct}%] // 60 FPS`
                  : 'VP9 · 3.0 Mbps · 60 FPS (~2MB .WEBM)'
              }
            </span>
          </div>
        </div>

        <button
          id="cyber-dock-export-webm-btn"
          class="cyber-btn-swiss cyber-export-main-btn ${
            isRec ? 'recording' : ''
          }"
          type="button"
        >
          ${
            isRec
              ? `[RECORDING: ${pct}%] // 60 FPS (CLICK TO STOP & SAVE)`
              : '[EXPORT AUTO-FLY CLIP (.WEBM)]'
          }
        </button>

        <div id="cyber-export-status-strip" class="cyber-status-strip">
          ${escapeAttr(this.lastExportStatusMsg)}
        </div>
      </div>
    `;
  }

  private bindVideoExporterWidgetEvents(body: HTMLElement): void {
    const btn = body.querySelector(
      '#cyber-dock-export-webm-btn'
    ) as HTMLButtonElement | null;
    if (btn) {
      btn.addEventListener('click', () => {
        this.callbacks.onExportAutoFlyVideo();
      });
    }
  }

  public updateVideoRecordingUI(
    isRecording: boolean,
    pct: number,
    statusMessage?: string
  ): void {
    this.state.isRecordingVideo = isRecording;
    this.state.recordingProgress = pct;
    if (statusMessage) {
      this.lastExportStatusMsg = statusMessage;
    }

    const roundedPct = Math.round(pct);

    if (this.topExportBtnEl) {
      this.topExportBtnEl.textContent = isRecording
        ? `[RECORDING: ${roundedPct}%] // 60 FPS`
        : '[EXPORT AUTO-FLY CLIP (.WEBM)]';
      this.topExportBtnEl.classList.toggle('recording', isRecording);
    }

    const dockBtn = this.container.querySelector(
      '#cyber-dock-export-webm-btn'
    ) as HTMLButtonElement | null;
    if (dockBtn) {
      dockBtn.textContent = isRecording
        ? `[RECORDING: ${roundedPct}%] // 60 FPS (CLICK TO STOP & SAVE)`
        : '[EXPORT AUTO-FLY CLIP (.WEBM)]';
      dockBtn.classList.toggle('recording', isRecording);
    }

    const readoutEl = this.container.querySelector(
      '#cyber-export-live-readout'
    ) as HTMLElement | null;
    if (readoutEl) {
      readoutEl.textContent = isRecording
        ? `[RECORDING: ${roundedPct}%] // 60 FPS`
        : 'VP9 · 3.0 Mbps · 60 FPS (~2MB .WEBM)';
    }

    const ringCircle = this.container.querySelector(
      '#cyber-export-ring-circle'
    ) as SVGCircleElement | null;
    if (ringCircle) {
      const circumference = 2 * Math.PI * 16;
      const dashOffset = circumference - (roundedPct / 100) * circumference;
      ringCircle.style.strokeDashoffset = `${dashOffset.toFixed(2)}`;
      ringCircle.setAttribute('stroke', isRecording ? '#f43f5e' : '#00e5ff');
    }

    const statusStrip = this.container.querySelector(
      '#cyber-export-status-strip'
    ) as HTMLElement | null;
    if (statusStrip && statusMessage) {
      statusStrip.textContent = statusMessage;
    }
  }

  private loadUploadedFilesSequentially(files: File[]): void {
    const targetSlot = this.state.selectedScreenSlot;

    files.forEach((file, idx) => {
      const slotForThisFile = ((targetSlot + idx) % 4) as 0 | 1 | 2 | 3;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result);
        const img = new Image();
        img.onload = () => {
          this.callbacks.onUploadScreenSlotImage(slotForThisFile, img, dataUrl);
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });
  }
}

function countTreeNodes(node: DirectoryNode): number {
  let count = 1;
  if (node.children) {
    for (const c of node.children) {
      count += countTreeNodes(c);
    }
  }
  return count;
}

function escapeAttr(val: string): string {
  return val.replace(/"/g, '&quot;');
}
