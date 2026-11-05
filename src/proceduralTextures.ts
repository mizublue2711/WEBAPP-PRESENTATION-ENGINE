import * as THREE from 'three';
import {
  ExplodedComponentSpec,
  ScreenSlotConfig,
  ThemePalette,
} from './types';

/**
 * Renders an individual Screen Slot texture for Zone 01 Surface UI Glass Screens (Slots 0..3).
 * Displays the loaded screenshot (or custom uploaded image) for that screen slot with
 * crisp 1px Swiss Grid framing, top telemetry bar, and bottom caption strip.
 */
export function createZone01ScreenSlotTexture(
  options: {
    slot: ScreenSlotConfig;
    globalTitle: string;
    globalSubtitle: string;
    customHtml: string;
    imageElement?: HTMLImageElement | null;
    isSelectedSlot?: boolean;
  },
  palette: ThemePalette,
  maxAnisotropy = 4
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 640;
  const ctx = canvas.getContext('2d')!;

  const { slot, imageElement, isSelectedSlot } = options;

  // Deep Midnight background
  ctx.fillStyle = '#050508';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle 1px Swiss grid background
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= canvas.width; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= canvas.height; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Draw the screenshot or uploaded image in the main viewport area
  const imgX = 14;
  const imgY = 58;
  const imgW = canvas.width - 28;
  const imgH = canvas.height - 134;

  if (imageElement && imageElement.complete && imageElement.naturalWidth > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(imgX, imgY, imgW, imgH);
    ctx.clip();

    // Draw top/hero portion of the tall screenshot with cover-top alignment
    const srcW = imageElement.naturalWidth;
    const srcH = imageElement.naturalHeight;
    const targetAspect = imgW / imgH;
    const cropH = Math.min(srcH, srcW / targetAspect);
    // For Slot 3 (Deploy section), crop lower part of the page; for Slots 0,1,2 crop top playground area
    const srcY =
      slot.slotIndex === 3 && srcH > cropH * 1.35
        ? Math.floor((srcH - cropH) * 0.68)
        : 0;

    ctx.drawImage(
      imageElement,
      0,
      srcY,
      srcW,
      cropH,
      imgX,
      imgY,
      imgW,
      imgH
    );

    // Subtle vignette scrim at bottom of image for legibility
    const grad = ctx.createLinearGradient(0, imgY + imgH - 90, 0, imgY + imgH);
    grad.addColorStop(0, 'rgba(5, 5, 8, 0)');
    grad.addColorStop(1, 'rgba(5, 5, 8, 0.85)');
    ctx.fillStyle = grad;
    ctx.fillRect(imgX, imgY + imgH - 90, imgW, 90);
    ctx.restore();
  } else {
    // Procedural fallback while image loads
    ctx.fillStyle = 'rgba(15, 17, 26, 0.92)';
    ctx.fillRect(imgX, imgY, imgW, imgH);
    ctx.fillStyle = slot.accentCss;
    ctx.font = '700 28px "JetBrains Mono", monospace';
    ctx.fillText(slot.nodeTitle, 42, 160);
    ctx.fillStyle = '#94A3B8';
    ctx.font = '400 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(slot.subtitle, 42, 205);
  }

  // Top Header Strip
  ctx.fillStyle = 'rgba(9, 9, 18, 0.96)';
  ctx.fillRect(8, 8, canvas.width - 16, 48);
  ctx.strokeStyle = slot.accentCss;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(8, 8, canvas.width - 16, 48);

  ctx.fillStyle = slot.accentCss;
  ctx.font = '700 18px "JetBrains Mono", monospace';
  ctx.fillText(
    `SCREEN 0${slot.slotIndex + 1} // ${slot.badge}`,
    24,
    38
  );

  ctx.fillStyle = isSelectedSlot ? '#10B981' : '#94A3B8';
  ctx.font = '600 16px "JetBrains Mono", monospace';
  ctx.textAlign = 'right';
  ctx.fillText(
    isSelectedSlot
      ? '[ACTIVE SWAP TARGET · READY]'
      : 'ARTIFICIALCRAFT.SPACE // 60 FPS',
    canvas.width - 24,
    38
  );
  ctx.textAlign = 'left';

  // Bottom Telemetry & Title Strip
  const botY = canvas.height - 72;
  ctx.fillStyle = 'rgba(9, 9, 18, 0.96)';
  ctx.fillRect(8, botY, canvas.width - 16, 64);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.strokeRect(8, botY, canvas.width - 16, 64);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 20px "JetBrains Mono", monospace';
  ctx.fillText(slot.nodeTitle.slice(0, 44), 24, botY + 27);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '400 15px "JetBrains Mono", monospace';
  ctx.fillText(slot.subtitle.slice(0, 68), 24, botY + 50);

  // Outer 1px Swiss Frame
  ctx.strokeStyle = isSelectedSlot ? '#00E5FF' : palette.primaryCss;
  ctx.lineWidth = isSelectedSlot ? 4 : 2;
  ctx.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Generates a crisp procedural texture for Zone 02 Exploded Page & Component Matrix modules,
 * embedding the corresponding screen slot's live image preview on the right half!
 */
export function createExplodedComponentTexture(
  spec: ExplodedComponentSpec,
  palette: ThemePalette,
  maxAnisotropy = 4,
  imageElement?: HTMLImageElement | null
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 896;
  canvas.height = 480;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = 'rgba(8, 9, 15, 0.96)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const hexCss =
    '#' + spec.accentHex.toString(16).padStart(6, '0').toUpperCase();

  // Swiss grid background
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= canvas.width; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= canvas.height; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Border
  ctx.strokeStyle = hexCss;
  ctx.lineWidth = 3;
  ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);

  // Header strip
  ctx.fillStyle = 'rgba(20, 21, 28, 0.96)';
  ctx.fillRect(7, 7, canvas.width - 14, 54);

  ctx.fillStyle = hexCss;
  ctx.font = '700 18px "JetBrains Mono", monospace';
  ctx.fillText(`${spec.badge} · ${spec.fpsTarget}`, 24, 40);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '500 16px "JetBrains Mono", monospace';
  ctx.textAlign = 'right';
  ctx.fillText(spec.filePath, canvas.width - 24, 40);
  ctx.textAlign = 'left';

  // Left Column: Title, Description & Code Preview
  const leftW = 460;
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 26px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(spec.title, 24, 102);

  ctx.fillStyle = '#CBD5E1';
  ctx.font = '400 16px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(spec.description.slice(0, 52), 24, 134);

  // Code box
  ctx.fillStyle = 'rgba(5, 5, 8, 0.94)';
  ctx.fillRect(24, 154, leftW, 240);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(24, 154, leftW, 240);

  ctx.fillStyle = palette.primaryCss;
  ctx.font = '400 15px "JetBrains Mono", monospace';
  const codeLines = spec.codePreview.split('\n');
  codeLines.forEach((line, idx) => {
    ctx.fillText(line.slice(0, 44), 38, 192 + idx * 30);
  });

  // Right Column: Live Screenshot Preview Frame
  const prevX = 502;
  const prevY = 78;
  const prevW = canvas.width - prevX - 22;
  const prevH = 316;

  ctx.fillStyle = '#050508';
  ctx.fillRect(prevX, prevY, prevW, prevH);

  if (imageElement && imageElement.complete && imageElement.naturalWidth > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(prevX, prevY, prevW, prevH);
    ctx.clip();
    const srcW = imageElement.naturalWidth;
    const srcH = imageElement.naturalHeight;
    const cropH = Math.min(srcH, srcW / (prevW / prevH));
    const srcY =
      spec.screenSlotIndex === 3 && srcH > cropH * 1.3
        ? Math.floor((srcH - cropH) * 0.68)
        : 0;
    ctx.drawImage(
      imageElement,
      0,
      srcY,
      srcW,
      cropH,
      prevX,
      prevY,
      prevW,
      prevH
    );
    ctx.restore();
  }

  ctx.strokeStyle = hexCss;
  ctx.lineWidth = 2;
  ctx.strokeRect(prevX, prevY, prevW, prevH);

  // Bottom Metrics Bar
  ctx.fillStyle = '#E2E8F0';
  ctx.font = '600 17px "JetBrains Mono", monospace';
  ctx.fillText(
    `RENDER: ${spec.metrics.renderMs}  ·  AST NODES: ${spec.metrics.astNodes}  ·  MEM: ${spec.metrics.memoryKb} KB  ·  SCREEN SLOT 0${
      spec.screenSlotIndex + 1
    }`,
    24,
    442
  );

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Generates a compact label plate texture for 3D Directory Tree nodes in Zone 03,
 * honoring the node's `colorHex` (#00E5FF, #10B981, #5322FF) and `layer` (foreground / midground).
 */
export function createNodeLabelTexture(
  name: string,
  kind: 'folder' | 'file',
  tokens: number,
  expanded: boolean,
  palette: ThemePalette,
  maxAnisotropy = 4,
  customColorHex?: string,
  layerName?: string
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 144;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = kind === 'folder' ? '#14151E' : '#0A0B12';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const strokeColor =
    customColorHex ||
    (kind === 'folder'
      ? expanded
        ? palette.primaryCss
        : palette.secondaryCss
      : palette.accentCss);

  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

  ctx.fillStyle = strokeColor;
  ctx.font = '700 18px "JetBrains Mono", monospace';
  const layerBadge = (layerName || 'midground').toUpperCase();
  const tagText =
    kind === 'folder'
      ? expanded
        ? `[DIR · ${layerBadge}]`
        : `[DIR · CLICK TO BRANCH]`
      : `[FILE · ${layerBadge}]`;
  ctx.fillText(tagText, 22, 42);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '600 18px "JetBrains Mono", monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`~${tokens} TOKENS`, canvas.width - 22, 42);
  ctx.textAlign = 'left';

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 30px "JetBrains Mono", monospace';
  ctx.fillText(name.slice(0, 25), 22, 102);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Creates a procedural metallic/brushed bump & roughness map for Titanium #18181E monoliths.
 */
export function createTitaniumRoughnessTexture(): THREE.DataTexture {
  const size = 128;
  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    const y = Math.floor(i / size);
    const streak = ((y * 17) % 29) + ((i * 7) % 19);
    const val = 40 + (streak % 38);
    data[i * 4] = val;
    data[i * 4 + 1] = val;
    data[i * 4 + 2] = val;
    data[i * 4 + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Creates a procedural fine-grain architectural concrete & 1px micro-drainage groove texture
 * for the Indoor Cleanroom concrete piers and Outdoor Courtyard Obsidian floor (#09090B).
 */
export function createObsidianConcreteFloorTexture(
  maxAnisotropy = 4
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#09090B';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle architectural concrete micro-speckle
  for (let i = 0; i < 3200; i++) {
    const x = (i * 73) % 512;
    const y = (i * 137) % 512;
    const b = 12 + (i % 14);
    ctx.fillStyle = `rgb(${b}, ${b}, ${b + 3})`;
    ctx.fillRect(x, y, 2, 2);
  }

  // 1px Swiss Grid micro-drainage channels
  ctx.strokeStyle = '#181822';
  ctx.lineWidth = 2;
  for (let g = 0; g <= 512; g += 128) {
    ctx.beginPath();
    ctx.moveTo(g, 0);
    ctx.lineTo(g, 512);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, g);
    ctx.lineTo(512, g);
    ctx.stroke();
  }

  // Subtle cyan reflective micro-joint intersection ticks
  ctx.fillStyle = 'rgba(0, 229, 255, 0.32)';
  for (let gx = 0; gx <= 512; gx += 128) {
    for (let gy = 0; gy <= 512; gy += 128) {
      ctx.fillRect(gx - 3, gy - 1, 6, 2);
      ctx.fillRect(gx - 1, gy - 3, 2, 6);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(14, 18);
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates a 2x2 glyph atlas texture ('0', '1', '+', '::') for the Deep Midnight 01:00 AM
 * Binary Galaxy Matrix particles in the Sky Dome.
 */
export function createBinaryMatrixAtlasTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 256, 256);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 84px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const glyphs = [
    ['0', 64, 64],
    ['1', 192, 64],
    ['+', 64, 192],
    ['1', 192, 192],
  ] as const;

  for (const [char, x, y] of glyphs) {
    ctx.fillText(char, x, y);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Creates a banner plaque texture for Zone headers and AI Core Monoliths.
 */
export function createMonolithBannerTexture(
  title: string,
  subtitle: string,
  accentCss: string,
  maxAnisotropy = 4
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 192;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = 'rgba(9, 9, 18, 0.95)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = accentCss;
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

  ctx.fillStyle = accentCss;
  ctx.font = '700 34px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(title, canvas.width / 2, 82);

  ctx.fillStyle = '#CBD5E1';
  ctx.font = '500 22px "JetBrains Mono", monospace';
  ctx.fillText(subtitle, canvas.width / 2, 138);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  return texture;
}
