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
import { languageManager, t, TranslationKey } from './i18n/languageManager';
import { createLanguageSwitcher } from './components/ui/LanguageSwitcher';

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

  private getWizardStepInfo(): { step: number; title: string } {
    switch (this.activeTab) {
      case 0:
        return { step: 1, title: t('wizard.step1') };
      case 3:
        return { step: 2, title: t('wizard.step2') };
      case 2:
        return { step: 3, title: t('wizard.step3') };
      case 1:
        return { step: 4, title: t('wizard.step4') };
      case 4:
      default:
        return { step: 5, title: t('wizard.step5') };
    }
  }

  private updateWizardBanner(): void {
    const banner = this.container.querySelector('#cyber-wizard-step-banner');
    if (!banner) return;
    const info = this.getWizardStepInfo();
    const kicker = banner.querySelector('#cyber-wizard-kicker');
    if (kicker) kicker.textContent = `${t('wizard.badge')} · STEP 0${info.step}/05`;
    const title = banner.querySelector('#cyber-wizard-title');
    if (title) title.textContent = info.title;
  }

  private buildDOM(): void {
    const wizardInfo = this.getWizardStepInfo();

    this.container.innerHTML = `
      <!-- TOP PERIMETER BAR -->
      <header class="cyber-top-bar">
        <div class="cyber-brand-cluster">
          <button id="cyber-dock-toggle-btn" class="cyber-btn-swiss cyber-btn-accent" type="button">
            ${t('topbar.dockToggle')}
          </button>
          <span class="cyber-brand-title">${t('topbar.brand')}</span>
          <span class="cyber-sep">·</span>
          <span id="cyber-cam-mode-badge" class="cyber-cam-mode-badge mode-tunnel">${t('topbar.modeTunnel')}</span>
        </div>

        <div class="cyber-telemetry-cluster">
          <span id="cyber-active-zone-label" class="cyber-zone-readout">ZONE 01 · ${t('zone.0.name').toUpperCase()}</span>
          <span class="cyber-sep">/</span>
          <span id="cyber-z-coord-readout" class="cyber-mono-num">${t('topbar.camZ')}: +10.20m</span>
          <span class="cyber-sep">/</span>
          <span id="cyber-selected-node-banner" class="cyber-node-readout">NODE: /src/core/registry.ts (~50 tokens)</span>
        </div>

        <div class="cyber-actions-cluster">
          <div id="cyber-top-lang-slot"></div>
          <button id="cyber-top-export-btn" class="cyber-btn-swiss cyber-btn-export" type="button">
            ${t('topbar.exportBtn')}
          </button>
          <button id="cyber-audio-btn" class="cyber-btn-swiss" type="button">
            ${t('topbar.audioOn')}
          </button>
        </div>
      </header>

      <!-- FLOATING [ESC // RETURN TO TUNNEL FLIGHT] BAR (VISIBLE IN NODE_INSPECT_MODE) -->
      <div id="cyber-esc-return-bar" class="cyber-esc-return-bar hidden">
        <div class="cyber-esc-meta">
          <span id="cyber-esc-kicker" class="cyber-esc-kicker">${t('esc.kicker')}</span>
          <span id="cyber-esc-node-label" class="cyber-esc-node-name">/src/core/registry.ts</span>
          <span id="cyber-esc-anchor-label" class="cyber-esc-anchor-info">${t('esc.anchorSaved')}: 4% (Z = +9.49m)</span>
        </div>
        <button id="cyber-esc-return-btn" class="cyber-btn-swiss cyber-esc-action-btn" type="button">
          ${t('esc.returnBtn')}
        </button>
      </div>

      <!-- COLLAPSIBLE LEFT CONFIGURATION DOCK -->
      <aside id="cyber-config-dock" class="cyber-config-dock">
        <div class="cyber-dock-header">
          <div class="cyber-dock-title-group">
            <span class="cyber-dock-kicker">${t('dock.kicker')}</span>
            <h2 class="cyber-dock-heading">${t('dock.heading')}</h2>
          </div>
          <button id="cyber-dock-close-btn" class="cyber-btn-icon" type="button" title="${t('dock.collapseBtn')}">
            ${t('dock.collapseBtn')}
          </button>
        </div>

        <!-- WIZARD STEP BANNER -->
        <div id="cyber-wizard-step-banner" class="cyber-wizard-step-banner">
          <span id="cyber-wizard-kicker" class="cyber-wizard-kicker">${t('wizard.badge')} · STEP 0${wizardInfo.step}/05</span>
          <span id="cyber-wizard-title" class="cyber-wizard-step-name">${wizardInfo.title}</span>
        </div>

        <!-- 5 TABS NAVIGATION -->
        <div class="cyber-dock-tabs" role="tablist">
          <button data-tab="0" class="cyber-tab-btn active" type="button">${t('tabs.tab0')}</button>
          <button data-tab="1" class="cyber-tab-btn" type="button">${t('tabs.tab1')}</button>
          <button data-tab="2" class="cyber-tab-btn" type="button">${t('tabs.tab2')}</button>
          <button data-tab="3" class="cyber-tab-btn" type="button">${t('tabs.tab3')}</button>
          <button data-tab="4" class="cyber-tab-btn" type="button">${t('tabs.tab4')}</button>
        </div>

        <!-- TAB BODY -->
        <div id="cyber-dock-body" class="cyber-dock-body"></div>

        <!-- COLLAPSIBLE HUD DIRECTORY QUICK-SELECTION DOCK -->
        <div class="cyber-quick-tree-section">
          <div class="cyber-quick-tree-header">
            <button id="cyber-quick-tree-toggle" class="cyber-quick-tree-toggle-btn" type="button">
              <span>${t('quicktree.header')}</span>
            </button>
            <button id="cyber-quick-unfocus-btn" class="cyber-quick-unfocus-mini hidden" type="button">
              ${t('quicktree.unfocusBtn')}
            </button>
          </div>
          <div id="cyber-quick-tree-list" class="cyber-quick-tree-list"></div>
        </div>

        <!-- DOCK FOOTER -->
        <div class="cyber-dock-footer">
          <span id="cyber-footer-hint1">${t('dock.footerHint1')}</span>
          <span>·</span>
          <span id="cyber-footer-hint2">${t('dock.footerHint2')}</span>
        </div>
      </aside>

      <!-- BOTTOM TIMELINE & ZONE SNAP CONTROLLER -->
      <section class="cyber-bottom-dock">
        <div class="cyber-bottom-collapse-row">
          <button id="cyber-bottom-collapse-btn" class="cyber-collapse-pill" type="button">
            ${t('bottom.hideTimeline')}
          </button>
        </div>
        <div id="cyber-bottom-body" class="cyber-bottom-body">
          <div class="cyber-zone-steps" id="cyber-zone-steps">
            ${ZONE_MARKERS.map(
              (z) => `
              <button data-zone="${z.index}" class="cyber-zone-step-btn ${
                z.index === 0 ? 'active' : ''
              }" type="button">
                <span class="cyber-step-code">${z.code}: ${t(`zone.${z.index}.name` as TranslationKey) || z.label}</span>
                <span class="cyber-step-range">${z.zRange}</span>
              </button>
            `
            ).join('')}
          </div>

          <div class="cyber-slider-row">
            <button id="cyber-quick-autofly-btn" class="cyber-btn-swiss cyber-autofly-btn" type="button">
              ${t('bottom.manualModeBtn')}
            </button>
            <div class="cyber-timeline-track-wrap">
              <span id="cyber-bottom-zdepth-label" class="cyber-mono-label">${t('bottom.zDepth')}</span>
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
              ${t('bottom.bloomBranches')}
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

    // Mount Top Bar Cyber-Brutalism Language Switcher
    const topLangSlot = this.container.querySelector('#cyber-top-lang-slot');
    if (topLangSlot) {
      topLangSlot.appendChild(createLanguageSwitcher());
    }

    // Subscribe to Language Manager to dynamically refresh all labels & tabs
    languageManager.subscribe(() => {
      this.refreshAllLocalizedUI();
    });

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
        this.quickTreeCollapsed ? t('quicktree.headerCollapsed') : t('quicktree.header')
      }</span>`;
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
      audioBtn.textContent = nextMuted ? t('topbar.audioMuted') : t('topbar.audioOn');
    });

    const tabBtns = Array.from(
      this.container.querySelectorAll('.cyber-tab-btn')
    ) as HTMLButtonElement[];
    tabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.tab) as 0 | 1 | 2 | 3 | 4;
        this.activeTab = idx;
        tabBtns.forEach((b, i) => b.classList.toggle('active', i === idx));
        this.updateWizardBanner();
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
        ? t('bottom.collapseBranches')
        : t('bottom.bloomBranches');
    });

    this.bottomCollapseBtnEl.addEventListener('click', () => {
      this.bottomHudCollapsed = !this.bottomHudCollapsed;
      this.bottomBarBodyEl.classList.toggle('collapsed', this.bottomHudCollapsed);
      this.bottomCollapseBtnEl.textContent = this.bottomHudCollapsed
        ? t('bottom.showTimeline')
        : t('bottom.hideTimeline');
    });

    this.renderTabContent();
    this.renderQuickNodeList();
    this.syncBottomFlightModeButton();
    this.syncCameraModeUI();
  }

  public refreshAllLocalizedUI(): void {
    if (this.dockToggleBtnEl) {
      this.dockToggleBtnEl.textContent = this.dockCollapsed
        ? t('topbar.dockToggleCollapsed')
        : t('topbar.dockToggle');
    }
    if (this.topExportBtnEl) {
      this.topExportBtnEl.textContent = this.state.isRecordingVideo
        ? `[RECORDING: ${Math.round(this.state.recordingProgress)}%] // 60 FPS`
        : t('topbar.exportBtn');
    }
    const audioBtn = this.container.querySelector(
      '#cyber-audio-btn'
    ) as HTMLButtonElement | null;
    if (audioBtn) {
      audioBtn.textContent = this.state.audioMuted ? t('topbar.audioMuted') : t('topbar.audioOn');
    }
    this.syncCameraModeUI();

    const dockKicker = this.container.querySelector('.cyber-dock-kicker');
    if (dockKicker) dockKicker.textContent = t('dock.kicker');
    const dockHeading = this.container.querySelector('.cyber-dock-heading');
    if (dockHeading) dockHeading.textContent = t('dock.heading');
    const dockCloseBtn = this.container.querySelector('#cyber-dock-close-btn') as HTMLButtonElement | null;
    if (dockCloseBtn) {
      dockCloseBtn.textContent = t('dock.collapseBtn');
      dockCloseBtn.title = t('dock.collapseBtn');
    }

    this.updateWizardBanner();

    const tabBtns = Array.from(
      this.container.querySelectorAll('.cyber-tab-btn')
    ) as HTMLButtonElement[];
    if (tabBtns.length >= 5) {
      tabBtns[0].textContent = t('tabs.tab0');
      tabBtns[1].textContent = t('tabs.tab1');
      tabBtns[2].textContent = t('tabs.tab2');
      tabBtns[3].textContent = t('tabs.tab3');
      tabBtns[4].textContent = t('tabs.tab4');
    }

    this.renderTabContent();

    if (this.quickNodeToggleBtnEl) {
      this.quickNodeToggleBtnEl.innerHTML = `<span>${
        this.quickTreeCollapsed ? t('quicktree.headerCollapsed') : t('quicktree.header')
      }</span>`;
    }
    const miniUnfocusBtn = this.container.querySelector('#cyber-quick-unfocus-btn');
    if (miniUnfocusBtn) {
      miniUnfocusBtn.textContent = t('quicktree.unfocusBtn');
    }

    const fHint1 = this.container.querySelector('#cyber-footer-hint1');
    if (fHint1) fHint1.textContent = t('dock.footerHint1');
    const fHint2 = this.container.querySelector('#cyber-footer-hint2');
    if (fHint2) fHint2.textContent = t('dock.footerHint2');

    const escKicker = this.container.querySelector('#cyber-esc-kicker');
    if (escKicker) escKicker.textContent = t('esc.kicker');
    const escReturnBtn = this.container.querySelector('#cyber-esc-return-btn');
    if (escReturnBtn) escReturnBtn.textContent = t('esc.returnBtn');

    if (this.bottomCollapseBtnEl) {
      this.bottomCollapseBtnEl.textContent = this.bottomHudCollapsed
        ? t('bottom.showTimeline')
        : t('bottom.hideTimeline');
    }
    const zDepthLabel = this.container.querySelector('#cyber-bottom-zdepth-label');
    if (zDepthLabel) zDepthLabel.textContent = t('bottom.zDepth');
    this.syncBottomFlightModeButton();

    this.zoneStepButtons.forEach((btn, idx) => {
      const z = ZONE_MARKERS[idx];
      if (z) {
        const stepCode = btn.querySelector('.cyber-step-code');
        if (stepCode) {
          const locName = t(`zone.${z.index}.name` as TranslationKey) || z.label;
          stepCode.textContent = `${z.code}: ${locName}`;
        }
      }
    });
  }

  public toggleDock(collapse: boolean): void {
    this.dockCollapsed = collapse;
    this.dockPanelEl.classList.toggle('collapsed', this.dockCollapsed);
    this.dockToggleBtnEl.textContent = this.dockCollapsed
      ? t('topbar.dockToggleCollapsed')
      : t('topbar.dockToggle');
  }

  private syncBottomFlightModeButton(): void {
    const btn = this.container.querySelector(
      '#cyber-quick-autofly-btn'
    ) as HTMLButtonElement | null;
    if (!btn) return;
    if (this.state.cameraMode === 'NODE_INSPECT_MODE') {
      btn.textContent = t('bottom.returnEscBtn');
      btn.classList.add('cyber-btn-accent');
      return;
    }
    const isAuto = this.state.flightMode === 'AUTO-FLY';
    btn.textContent = isAuto ? t('bottom.autoModeBtn') : t('bottom.manualModeBtn');
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
        ? t('topbar.modeInspect')
        : t('topbar.modeTunnel');
      this.camModeBadgeEl.classList.toggle('mode-inspect', isInspect);
      this.camModeBadgeEl.classList.toggle('mode-tunnel', !isInspect);
    }
    if (this.escReturnAnchorLabelEl) {
      const anchorPct = Math.round(this.state.anchorProgress * 100);
      const anchorZ = 10.2 + ( -7.6 - 10.2 ) * this.state.anchorProgress;
      const sign = anchorZ >= 0 ? '+' : '';
      this.escReturnAnchorLabelEl.textContent = `${t('esc.anchorSaved')}: ${anchorPct}% (Z = ${sign}${anchorZ.toFixed(
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
          <div class="cyber-section-title">${t('tabs.tab0.title')}</div>
          <p class="cyber-helper-text">
            ${t('tab0.helper')}
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
                  <span class="cyber-slot-num">${t('tab0.screenSlotPrefix')}${
                    slot.slotIndex + 1
                  }</span>
                  <button type="button" class="cyber-slot-upload-mini" data-upload-slot="${
                    slot.slotIndex
                  }">
                    ${t('tab0.uploadMini')}
                  </button>
                </div>
                <div class="cyber-slot-thumb-wrap">
                  <img src="${slot.imageUrl}" alt="${escapeAttr(
                  slot.label_vi && languageManager.getLanguage() === 'vi' ? slot.label_vi : slot.label
                )}" referrerpolicy="no-referrer" class="cyber-slot-thumb" />
                  <div class="cyber-slot-thumb-fallback">${escapeAttr(
                    slot.badge_vi && languageManager.getLanguage() === 'vi' ? slot.badge_vi : slot.badge
                  )}</div>
                </div>
                <span class="cyber-slot-caption">${escapeAttr(
                  slot.badge_vi && languageManager.getLanguage() === 'vi' ? slot.badge_vi : slot.badge
                )}</span>
              </div>
            `
              )
              .join('')}
          </div>

          <button id="ui-auto-advance-btn" class="cyber-btn-swiss ${
            this.state.autoAdvanceScreenSlot ? 'cyber-btn-accent' : ''
          }" type="button">
            ${
              this.state.autoAdvanceScreenSlot
                ? t('tab0.autoAdvanceBtnOn')
                : t('tab0.autoAdvanceBtnOff')
            }
          </button>

          <div class="cyber-dropzone" id="ui-image-dropzone">
            <span>${t('tab0.dropzone', { slot: activeSlotIdx + 1 })}</span>
            <input id="ui-image-file-input" type="file" accept="image/*" multiple style="display:none" />
          </div>

          <label class="cyber-field-label">${t('tab0.presetLabel', {
            slot: activeSlotIdx + 1,
          })}</label>
          <div class="cyber-btn-row">
            <button data-preset="${
              PLAYGROUND_SCREENSHOTS.monolith3D
            }" class="cyber-btn-swiss preset-slot-btn" type="button">
              ${t('tab0.presetNode1')}
            </button>
            <button data-preset="${
              PLAYGROUND_SCREENSHOTS.remotion60
            }" class="cyber-btn-swiss preset-slot-btn" type="button">
              ${t('tab0.presetNode2')}
            </button>
            <button data-preset="${
              PLAYGROUND_SCREENSHOTS.bannerStudio
            }" class="cyber-btn-swiss preset-slot-btn" type="button">
              ${t('tab0.presetNode3')}
            </button>
          </div>

          <label class="cyber-field-label">${t('tab0.titleLabel', {
            slot: activeSlotIdx + 1,
          })}</label>
          <input id="ui-swap-title" class="cyber-text-input" type="text" value="${escapeAttr(
            activeSlot.nodeTitle
          )}" />

          <label class="cyber-field-label">${t('tab0.subtitleLabel', {
            slot: activeSlotIdx + 1,
          })}</label>
          <input id="ui-swap-subtitle" class="cyber-text-input" type="text" value="${escapeAttr(
            activeSlot.subtitle
          )}" />

          <div class="cyber-btn-row">
            <button id="ui-apply-btn" class="cyber-btn-swiss cyber-btn-accent" type="button">
              ${t('tab0.applyBtn', { slot: activeSlotIdx + 1 })}
            </button>
            <button id="ui-focus-zone1-btn" class="cyber-btn-swiss" type="button">
              ${t('tab0.flyZone1Btn')}
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
          <div class="cyber-section-title">${t('tabs.tab1.title')}</div>
          <p class="cyber-helper-text">
            ${t('tab1.helper')}
          </p>

          <div class="cyber-dropzone" id="tree-json-dropzone">
            <span>${t('tab1.dropzone')}</span>
            <input id="tree-json-file-input" type="file" accept=".json,application/json" style="display:none" />
          </div>

          <div class="cyber-btn-row">
            <button id="tree-expand-all-btn" class="cyber-btn-swiss cyber-btn-accent" type="button">
              ${t('tab1.expandAll')}
            </button>
            <button id="tree-collapse-all-btn" class="cyber-btn-swiss" type="button">
              ${t('tab1.collapseAll')}
            </button>
          </div>

          <textarea id="tree-json-textarea" class="cyber-textarea cyber-mono-textarea" rows="7">${
            this.currentTreeJsonString
          }</textarea>

          <div id="tree-zod-status" class="cyber-status-strip">
            ${t('tab1.systemReady', { sys: escapeAttr(this.state.systemIdentity) })}
          </div>

          <div class="cyber-btn-row">
            <button id="tree-sync-btn" class="cyber-btn-swiss cyber-btn-accent" type="button">
              ${t('tab1.parseSyncBtn')}
            </button>
            <button id="tree-reset-default-btn" class="cyber-btn-swiss" type="button">
              ${t('tab1.resetDefaultBtn')}
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
          this.jsonStatusEl.textContent = t('tab1.zodVerified', {
            sys: docMeta.systemIdentity,
            count: totalNodes,
          });
          this.callbacks.onJumpToZone(2);
        } catch (err) {
          this.jsonStatusEl.textContent = t('tab1.zodError', {
            err: err instanceof Error ? err.message : 'Invalid JSON format',
          });
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
          <div class="cyber-section-title">${t('tabs.tab2.title')}</div>
          <p class="cyber-helper-text">
            ${t('tab2.helper')}
          </p>

          <div class="cyber-btn-row">
            <button id="cam-mode-auto" class="cyber-btn-swiss ${
              isAuto ? 'cyber-btn-accent' : ''
            }" type="button">
              ${t('tab2.modeAuto')}
            </button>
            <button id="cam-mode-manual" class="cyber-btn-swiss ${
              !isAuto ? 'cyber-btn-accent' : ''
            }" type="button">
              ${t('tab2.modeManual')}
            </button>
          </div>

          <label class="cyber-field-label">
            ${t('tab2.velocityLabel')} <span id="vel-val" class="cyber-mono-num">${this.state.flightVelocity.toFixed(
              2
            )}x</span>
          </label>
          <input id="cam-vel-slider" type="range" min="0.1" max="1.5" step="0.05" value="${
            this.state.flightVelocity
          }" class="cyber-range-input" />

          <label class="cyber-field-label">
            ${t('tab2.dampingLabel')} <span id="lerp-val" class="cyber-mono-num">${this.state.lerpSensitivity.toFixed(
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
          <div class="cyber-section-title">${t('tabs.tab3.title')}</div>
          <p class="cyber-helper-text">
            ${t('tab3.helper')}
          </p>

          <label class="cyber-field-label">${t('tab3.presetsLabel')}</label>
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
            ${t('tab3.explodeLabel')} <span id="explode-val" class="cyber-mono-num">${this.state.explodedScale.toFixed(
              2
            )}x</span>
          </label>
          <input id="fx-explode-slider" type="range" min="0.5" max="2.0" step="0.05" value="${
            this.state.explodedScale
          }" class="cyber-range-input" />

          <label class="cyber-field-label">
            ${t('tab3.starLabel')} <span id="star-val" class="cyber-mono-num">${
              this.state.starDensity
            } ${t('tab3.nodesUnit')}</span>
          </label>
          <input id="fx-star-slider" type="range" min="150" max="900" step="50" value="${
            this.state.starDensity
          }" class="cyber-range-input" />

          <label class="cyber-field-label">
            ${t('tab3.bloomLabel')} <span id="bloom-val" class="cyber-mono-num">${this.state.bloomStrength.toFixed(
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
              ${
                this.state.fogEnabled
                  ? t('tab3.fogToggleOn')
                  : t('tab3.fogToggleOff')
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
        starVal.textContent = `${s} ${t('tab3.nodesUnit')}`;
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
          <div class="cyber-section-title">${t('tabs.tab4.title')}</div>
          <p class="cyber-helper-text">
            ${t('tab4.helper')}
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
            <span class="cyber-exporter-kicker">${t('exporter.kicker')}</span>
            <span id="cyber-export-live-readout" class="cyber-exporter-readout">
              ${
                isRec
                  ? t('exporter.recReadout', { pct })
                  : t('exporter.readyReadout')
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
              ? t('exporter.mainBtnRec', { pct })
              : t('exporter.mainBtnReady')
          }
        </button>

        <div id="cyber-export-status-strip" class="cyber-status-strip">
          ${escapeAttr(this.lastExportStatusMsg || t('exporter.statusReady'))}
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
        ? t('exporter.recReadout', { pct: roundedPct })
        : t('exporter.mainBtnReady');
      this.topExportBtnEl.classList.toggle('recording', isRecording);
    }

    const dockBtn = this.container.querySelector(
      '#cyber-dock-export-webm-btn'
    ) as HTMLButtonElement | null;
    if (dockBtn) {
      dockBtn.textContent = isRecording
        ? t('exporter.mainBtnRec', { pct: roundedPct })
        : t('exporter.mainBtnReady');
      dockBtn.classList.toggle('recording', isRecording);
    }

    const readoutEl = this.container.querySelector(
      '#cyber-export-live-readout'
    ) as HTMLElement | null;
    if (readoutEl) {
      readoutEl.textContent = isRecording
        ? t('exporter.recReadout', { pct: roundedPct })
        : t('exporter.readyReadout');
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
