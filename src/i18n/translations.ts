export type SupportedLanguage = 'vi' | 'en';

export const TRANSLATIONS = {
  vi: {
    // Top Bar
    'topbar.dockToggle': '[SYS//BẢNG CẤU HÌNH ▾]',
    'topbar.dockToggleCollapsed': '[SYS//BẢNG CẤU HÌNH ▸]',
    'topbar.brand': 'ARTIFICIALCRAFT.SPACE',
    'topbar.modeTunnel': 'CHẾ ĐỘ A: BAY TRONG ĐƯỜNG HẦM 3D',
    'topbar.modeInspect': 'CHẾ ĐỘ B: SOI LINH KIỆN & CÂY THƯ MỤC',
    'topbar.exportBtn': '[XUẤT VIDEO HÀNH TRÌNH (.WEBM)]',
    'topbar.audioOn': 'ÂM THANH: BẬT',
    'topbar.audioMuted': 'ÂM THANH: TẮT',
    'topbar.camZ': 'TỌA ĐỘ CAM Z',
    'topbar.inspectZ': 'TỌA ĐỘ SOI Z',

    // Floating ESC Return Bar
    'esc.kicker': 'CHẾ ĐỘ B · TIÊU ĐIỂM SOI LINH KIỆN (TẠM DỪNG ĐƯỜNG BAY)',
    'esc.anchorSaved': 'ĐIỂM NEO ĐÃ LƯU',
    'esc.returnBtn': '[ESC // TRỞ VỀ HÀNH TRÌNH BAY 3D]',

    // Config Dock Main Headers
    'dock.kicker': 'CAMERA TRẠNG THÁI KÉP · 01:00 SÁNG',
    'dock.heading': 'Bảng Điều Khiển Cấu Hình Không Gian',
    'dock.collapseBtn': '[THU GỌN ×]',
    'dock.footerHint1': 'CLICK NÚT: PHÓNG TO GSAP',
    'dock.footerHint2': 'ESC / CLICK NỀN: TRỞ VỀ ĐƯỜNG BAY',

    // Tab Navigation Buttons
    'tabs.tab0': '01. Giao Diện',
    'tabs.tab1': '02. Cây JSON',
    'tabs.tab2': '03. Góc Bay',
    'tabs.tab3': '04. Thị Giác',
    'tabs.tab4': '05. .WEBM',

    // Tab Titles (Prompt requirements)
    'tabs.tab0.title': 'Tab 01 · Chuyển Đổi Giao Diện Màn Hình',
    'tabs.tab1.title': 'Tab 02 · Đồng Bộ Cây Thư Mục JSON',
    'tabs.tab2.title': 'Tab 03 · Bảng Điều Khiển Góc Bay & Camera',
    'tabs.tab3.title': 'Tab 04 · Tùy Chỉnh Thị Giác & Bóc Tách Không Gian',
    'tabs.tab4.title': 'Tab 05 · Xuất Video Hành Trình (.WEBM)',

    // Wizard Dock Steps (Prompt requirements)
    'wizard.badge': 'QUY TRÌNH WIZARD 5 BƯỚC',
    'wizard.step1': 'Định Danh Thương Hiệu (Brand Identification)',
    'wizard.step2': 'Phong Cách & AI Stylist (Aesthetic & AI Stylist)',
    'wizard.step3': 'Mô Hình 3D & Bóc Tách Linh Kiện (3D Engine & Exploded Assembly)',
    'wizard.step4': 'Chỉ Số Telemetry & Bento Grid (Telemetry & Bento Grid)',
    'wizard.step5': 'Bàn Giao & Xuất File AST (Export & Hand-off Dock)',

    // Tab 01: UI Surface Swapper
    'tab0.helper': 'Chọn màn hình (01 → 04) hoặc bật chế độ tự động chuyển để tải ảnh thay thế lần lượt từng màn hình 3D.',
    'tab0.screenSlotPrefix': 'MÀN HÌNH 0',
    'tab0.uploadMini': 'Tải Ảnh ▴',
    'tab0.autoAdvanceBtnOn': 'CHẾ ĐỘ TẢI LẦN LƯỢT (01→02→03→04): BẬT',
    'tab0.autoAdvanceBtnOff': 'CHẾ ĐỘ TẢI LẦN LƯỢT (01→02→03→04): TẮT',
    'tab0.dropzone': 'KÉO THẢ HOẶC CLICK TẢI ẢNH CHO [MÀN HÌNH 0{slot}] (Hỗ trợ chọn nhiều ảnh cùng lúc để thay lần lượt)',
    'tab0.presetLabel': 'Mẫu Preset Gốc ArtificialCraft.space (Gán vào Màn Hình 0{slot})',
    'tab0.presetNode1': 'Node 01: Khối Trụ Monolith',
    'tab0.presetNode2': 'Node 02: Khung Remotion',
    'tab0.presetNode3': 'Node 03: Banner Studio',
    'tab0.titleLabel': 'Tiêu Đề Màn Hình 0{slot}',
    'tab0.subtitleLabel': 'Phụ Đề Telemetry Màn Hình 0{slot}',
    'tab0.applyBtn': 'Cập Nhật Màn Hình 0{slot}',
    'tab0.flyZone1Btn': 'Bay Tới Zone 01',

    // Tab 02: Directory JSON Sync
    'tab1.helper': 'Hỗ trợ đầy đủ định dạng schema systemIdentity, tree, layer: foreground | midground, colorHex, zodValidated, registeredPresets.',
    'tab1.dropzone': 'KÉO THẢ HOẶC CLICK TẢI TỆP repository-tree.json',
    'tab1.expandAll': 'Bung Toàn Bộ Nhánh 3D',
    'tab1.collapseAll': 'Thu Về Nụ Gốc',
    'tab1.systemReady': 'HỆ THỐNG: {sys} · TRÌNH PHÂN TÍCH ZOD SẴN SÀNG',
    'tab1.parseSyncBtn': 'Phân Tích & Bung Cây 3D',
    'tab1.resetDefaultBtn': 'Khôi Phục JSON SSOT Chuẩn',
    'tab1.zodVerified': 'ZOD ĐÃ XÁC THỰC: {sys} · {count} NÚT ĐÃ BUNG TỎA',
    'tab1.zodError': 'LỖI XÁC THỰC ZOD: {err}',

    // Tab 03: Flight & Camera Engine
    'tab2.helper': 'Chuyển đổi giữa Chế độ Tuần tra Tự động và Điều khiển Thủ công, hoặc xuất đoạn phim chuyển động .webm 60 FPS độ dài 6 giây.',
    'tab2.modeAuto': 'TUẦN TRA TỰ ĐỘNG (AUTO-FLY)',
    'tab2.modeManual': 'THANH TRƯỢT THỦ CÔNG (MANUAL)',
    'tab2.velocityLabel': 'Hệ Số Tốc Độ Bay:',
    'tab2.dampingLabel': 'Độ Mượt Chuyển Động (Lerp Sensitivity):',

    // Tab 04: Visual Styling & Spatial Explode
    'tab3.helper': 'Tùy chỉnh ánh sáng Deep Midnight 01:00 AM, bóc tách linh kiện và mật độ thiên hà nhị phân.',
    'tab3.presetsLabel': 'Thiết Lập Khí Quyển & Vật Liệu',
    'tab3.explodeLabel': 'Khoảng Cách Bóc Tách Z/Y:',
    'tab3.starLabel': 'Mật Độ Thiên Hà Ma Trận & Vòm Trời:',
    'tab3.nodesUnit': 'nút mạng',
    'tab3.bloomLabel': 'Quầng Sáng Laser Xanh Viền Đậm:',
    'tab3.fogToggleOn': 'SƯƠNG MÙ ĐIỆN TỬ KHỐI (0.012): BẬT',
    'tab3.fogToggleOff': 'SƯƠNG MÙ ĐIỆN TỬ KHỐI (0.012): TẮT',

    // Tab 05: .WEBM Exporter
    'tab4.helper': 'Bộ ghi hình canvas WebGL trực tiếp trên trình duyệt chi phí $0.00. Ghi hình hành trình 6 giây 60 FPS từ Zone 01 (Z = +10m) tới Zone 04 (Z = -8m) chuẩn VP9 3.0 Mbps (~2MB).',
    'exporter.kicker': 'BỘ NÉN CLIENT-SIDE WEBCODECS / MEDIARECORDER',
    'exporter.readyReadout': 'VP9 · 3.0 Mbps · 60 FPS (~2MB .WEBM)',
    'exporter.recReadout': '[ĐANG GHI HÌNH: {pct}%] // 60 FPS',
    'exporter.mainBtnReady': '[XUẤT VIDEO HÀNH TRÌNH (.WEBM)]',
    'exporter.mainBtnRec': '[ĐANG GHI HÌNH: {pct}%] // 60 FPS (BẤM ĐỂ DỪNG & LƯU)',
    'exporter.statusReady': 'SẴN SÀNG · CHUẨN NÉN VP9 (3.0 Mbps) · 60 FPS · 6.0 GIÂY AUTO-FLY (~2MB)',
    'exporter.statusRecording': 'ĐANG GHI HÌNH VIDEO HÀNH TRÌNH... VUI LÒNG KHÔNG ĐÓNG TRÌNH DUYỆT',
    'exporter.statusSaved': 'XUẤT VIDEO THÀNH CÔNG! ĐÃ TỰ ĐỘNG TẢI FILE .WEBM VỀ MÁY',

    // Bottom HUD & Timeline
    'bottom.hideTimeline': '▾ Thu Gọn Bảng Điều Khiển Dòng Thời Gian',
    'bottom.showTimeline': '▴ Mở Rộng Bảng Điều Khiển Dòng Thời Gian',
    'bottom.manualModeBtn': 'CHẾ ĐỘ: THANH TRƯỢT THỦ CÔNG',
    'bottom.autoModeBtn': 'TUẦN TRA: AUTO-FLY [ĐANG CHẠY]',
    'bottom.returnEscBtn': '[ESC // TRỞ VỀ ĐƯỜNG BAY]',
    'bottom.zDepth': 'CHIỀU SÂU ĐƯỜNG HẦM Z',
    'bottom.bloomBranches': 'BUNG TOÀN BỘ CÀNH 3D',
    'bottom.collapseBranches': 'THU GỌN CÀNH 3D',

    // Quick Directory Tree
    'quicktree.header': '▾ DANH MỤC CÂY THƯ MỤC NHANH (BẤM ĐỂ PHÓNG TO)',
    'quicktree.headerCollapsed': '▸ DANH MỤC CÂY THƯ MỤC NHANH (BẤM ĐỂ PHÓNG TO)',
    'quicktree.unfocusBtn': '[ESC // BỎ CHỌN]',

    // 3D Hologram Inspector Card
    'card.toggleBranch': 'Bật/Tắt Nhánh',
    'card.returnTunnel': 'ESC // Đường Bay',
    'card.bloomBranch': 'Bung Nhánh',
    'card.collapseBranch': 'Thu Nhánh',
    'card.pulseTendril': 'Kích Hoạt Xung',
    'card.pathPrefix': 'ĐƯỜNG DẪN:',
    'card.layerPrefix': 'TẦNG:',
    'card.colorPrefix': 'MÃ MÀU:',
    'card.zodContract': 'RÀNG BUỘC HỢP ĐỒNG ZOD:',
    'card.dirBadge': 'THƯ MỤC',
    'card.fileBadge': 'TẬP TIN',

    // Zones
    'zone.0.name': 'Màn Hình Giao Diện Kính',
    'zone.0.summary': 'Màn hình kính 4 vị trí & Bộ chuyển đổi hình ảnh tuần tự',
    'zone.1.name': 'Linh Kiện Bóc Tách',
    'zone.1.summary': 'Khối Monolith 3D, Remotion 60FPS & Bảng Bóc Tách Linh Kiện',
    'zone.2.name': 'Cây Thư Mục 3D',
    'zone.2.summary': 'Cây số hóa phân nhánh tương tác & Cổng kiểm tra Zod Schema',
    'zone.3.name': 'Chân Trời Lõi AI',
    'zone.3.summary': 'Não bộ Đám mây Dify.ai, Điều phối viên n8n & Vòm trời Ma trận Nhị phân',

    // Language switcher
    'lang.vi': 'VI',
    'lang.en': 'EN',
    'lang.switchTooltip': 'Chuyển đổi Ngôn ngữ [Việt - Anh]',
  },
  en: {
    // Top Bar
    'topbar.dockToggle': '[SYS//CONFIG DOCK ▾]',
    'topbar.dockToggleCollapsed': '[SYS//CONFIG DOCK ▸]',
    'topbar.brand': 'ARTIFICIALCRAFT.SPACE',
    'topbar.modeTunnel': 'MODE A: TUNNEL FLIGHT',
    'topbar.modeInspect': 'MODE B: NODE INSPECT FOCUS',
    'topbar.exportBtn': '[EXPORT AUTO-FLY CLIP (.WEBM)]',
    'topbar.audioOn': 'AUDIO: ON',
    'topbar.audioMuted': 'AUDIO: MUTED',
    'topbar.camZ': 'CAM Z',
    'topbar.inspectZ': 'INSPECT Z',

    // Floating ESC Return Bar
    'esc.kicker': 'MODE B · NODE INSPECT FOCUS (SCROLL PAUSED)',
    'esc.anchorSaved': 'ANCHOR SAVED',
    'esc.returnBtn': '[ESC // RETURN TO TUNNEL FLIGHT]',

    // Config Dock Main Headers
    'dock.kicker': 'DUAL-STATE CAMERA · 01:00 AM',
    'dock.heading': 'Spatial Configurator Dock',
    'dock.collapseBtn': '[COLLAPSE ×]',
    'dock.footerHint1': 'CLICK NODE: GSAP FOCUS',
    'dock.footerHint2': 'ESC / BG CLICK: TUNNEL',

    // Tab Navigation Buttons
    'tabs.tab0': '01. Surface',
    'tabs.tab1': '02. JSON',
    'tabs.tab2': '03. Flight',
    'tabs.tab3': '04. Visual',
    'tabs.tab4': '05. .WEBM',

    // Tab Titles (Prompt requirements)
    'tabs.tab0.title': 'Tab 01 · UI Surface Swapper',
    'tabs.tab1.title': 'Tab 02 · Directory JSON Sync',
    'tabs.tab2.title': 'Tab 03 · Flight & Camera Engine',
    'tabs.tab3.title': 'Tab 04 · Visual Styling & Spatial Explode',
    'tabs.tab4.title': 'Tab 05 · .WEBM Exporter',

    // Wizard Dock Steps (Prompt requirements)
    'wizard.badge': '5-STEP WIZARD DOCK',
    'wizard.step1': 'Brand Identification',
    'wizard.step2': 'Aesthetic & AI Stylist',
    'wizard.step3': '3D Engine & Exploded Assembly',
    'wizard.step4': 'Telemetry & Bento Grid',
    'wizard.step5': 'Export & Hand-off Dock',

    // Tab 01: UI Surface Swapper
    'tab0.helper': 'Select screen (01 → 04) or enable sequential advance to upload replacement textures for 3D screens.',
    'tab0.screenSlotPrefix': 'SCREEN 0',
    'tab0.uploadMini': 'Upload ▴',
    'tab0.autoAdvanceBtnOn': 'SEQUENTIAL ADVANCE MODE (01→02→03→04): ON',
    'tab0.autoAdvanceBtnOff': 'SEQUENTIAL ADVANCE MODE (01→02→03→04): OFF',
    'tab0.dropzone': 'DRAG & DROP OR CLICK TO UPLOAD FOR [SCREEN 0{slot}] (Supports batch multiple file upload)',
    'tab0.presetLabel': 'Official ArtificialCraft.space Preset (Assign to Screen 0{slot})',
    'tab0.presetNode1': 'Node 01: Monolith',
    'tab0.presetNode2': 'Node 02: Remotion',
    'tab0.presetNode3': 'Node 03: Banner',
    'tab0.titleLabel': 'Screen 0{slot} Title',
    'tab0.subtitleLabel': 'Screen 0{slot} Telemetry Subtitle',
    'tab0.applyBtn': 'Update Screen 0{slot}',
    'tab0.flyZone1Btn': 'Fly To Zone 01',

    // Tab 02: Directory JSON Sync
    'tab1.helper': 'Full schema support for systemIdentity, tree, layer: foreground | midground, colorHex, zodValidated, registeredPresets.',
    'tab1.dropzone': 'DRAG & DROP OR CLICK TO UPLOAD repository-tree.json',
    'tab1.expandAll': 'Bloom All Branches',
    'tab1.collapseAll': 'Collapse to Buds',
    'tab1.systemReady': 'SYSTEM: {sys} · ZOD PARSER READY',
    'tab1.parseSyncBtn': 'Parse & Bloom 3D Tree',
    'tab1.resetDefaultBtn': 'Restore Official SSOT JSON',
    'tab1.zodVerified': 'ZOD VERIFIED: {sys} · {count} NODES BLOOMED',
    'tab1.zodError': 'ZOD VALIDATION ERROR: {err}',

    // Tab 03: Flight & Camera Engine
    'tab2.helper': 'Switch between Cruise Auto-Fly and Manual Timeline Control, or export a 6-second 60 FPS .webm motion clip.',
    'tab2.modeAuto': 'AUTO-FLY CRUISE',
    'tab2.modeManual': 'MANUAL SLIDER',
    'tab2.velocityLabel': 'Cruise Velocity Multiplier:',
    'tab2.dampingLabel': 'Camera Damping (Lerp Sensitivity):',

    // Tab 04: Visual Styling & Spatial Explode
    'tab3.helper': 'Customize Deep Midnight 01:00 AM atmosphere, component exploded view and binary galaxy density.',
    'tab3.presetsLabel': 'Atmosphere & Material Presets',
    'tab3.explodeLabel': 'Exploded View Z/Y Spacing:',
    'tab3.starLabel': 'Binary Matrix Galaxy & Skyvault Density:',
    'tab3.nodesUnit': 'nodes',
    'tab3.bloomLabel': 'Indigo Rim & Laser Bloom Halo:',
    'tab3.fogToggleOn': 'ELECTRO-VOLUMETRIC FOG (0.012): ON',
    'tab3.fogToggleOff': 'ELECTRO-VOLUMETRIC FOG (0.012): OFF',

    // Tab 05: .WEBM Exporter
    'tab4.helper': 'Zero-server-cost ($0.00) WebGL canvas video recorder. Captures a full 6-second 60 FPS fly-through from Zone 01 (Z = +10m) to Zone 04 (Z = -8m) encoded with VP9 at 3.0 Mbps (~2MB output).',
    'exporter.kicker': 'CLIENT-SIDE WEBCODECS / MEDIARECORDER',
    'exporter.readyReadout': 'VP9 · 3.0 Mbps · 60 FPS (~2MB .WEBM)',
    'exporter.recReadout': '[RECORDING: {pct}%] // 60 FPS',
    'exporter.mainBtnReady': '[EXPORT AUTO-FLY CLIP (.WEBM)]',
    'exporter.mainBtnRec': '[RECORDING: {pct}%] // 60 FPS (CLICK TO STOP & SAVE)',
    'exporter.statusReady': 'READY · VP9 CODEC (3.0 Mbps) · 60 FPS · 6.0s AUTO-FLY (~2MB)',
    'exporter.statusRecording': 'RECORDING AUTO-FLY VIDEO... PLEASE KEEP WINDOW ACTIVE',
    'exporter.statusSaved': 'EXPORT COMPLETE! .WEBM FILE DOWNLOADED AUTOMATICALLY',

    // Bottom HUD & Timeline
    'bottom.hideTimeline': '▾ Hide Timeline Controls',
    'bottom.showTimeline': '▴ Show Timeline Controls',
    'bottom.manualModeBtn': 'MODE: MANUAL SLIDER',
    'bottom.autoModeBtn': 'CRUISE: AUTO-FLY [ACTIVE]',
    'bottom.returnEscBtn': '[ESC // RETURN TO TUNNEL]',
    'bottom.zDepth': 'Z-TUNNEL DEPTH',
    'bottom.bloomBranches': 'BLOOM ALL 3D BRANCHES',
    'bottom.collapseBranches': 'COLLAPSE 3D BRANCHES',

    // Quick Directory Tree
    'quicktree.header': '▾ HUD DIRECTORY QUICK-SELECT (CLICK TO ZOOM)',
    'quicktree.headerCollapsed': '▸ HUD DIRECTORY QUICK-SELECT (CLICK TO ZOOM)',
    'quicktree.unfocusBtn': '[ESC // UN-FOCUS]',

    // 3D Hologram Inspector Card
    'card.toggleBranch': 'Toggle Branch',
    'card.returnTunnel': 'ESC // Tunnel',
    'card.bloomBranch': 'Bloom Branch',
    'card.collapseBranch': 'Collapse Branch',
    'card.pulseTendril': 'Pulse Tendril',
    'card.pathPrefix': 'PATH:',
    'card.layerPrefix': 'LAYER:',
    'card.colorPrefix': 'COLOR:',
    'card.zodContract': 'ZOD CONTRACT:',
    'card.dirBadge': 'DIRECTORY',
    'card.fileBadge': 'FILE',

    // Zones
    'zone.0.name': 'UI Glass Screen',
    'zone.0.summary': '4-Screen Surface UI Glass Viewport & Sequential Image Swapper',
    'zone.1.name': 'Exploded Components',
    'zone.1.summary': '3D Monolith, Remotion 60FPS & Banner Studio Exploded Matrix',
    'zone.2.name': '3D Directory Tree',
    'zone.2.summary': 'Interactive Digital Line-Branching Tree & Zod Validation Gate',
    'zone.3.name': 'AI Core Horizon',
    'zone.3.summary': 'Dify.ai Cloud Brain, n8n Orchestrator & Binary Galaxy Sky Dome',

    // Language switcher
    'lang.vi': 'VI',
    'lang.en': 'EN',
    'lang.switchTooltip': 'Switch Language [English - Vietnamese]',
  },
} as const;

export type TranslationKey = keyof typeof TRANSLATIONS.en;
