import { CanvasTexture, LinearFilter, LinearMipmapLinearFilter } from 'three';

const textureCache = new Map();

/**
 * Creates a high-resolution, anti-aliased circular Matterport-style hotspot icon texture.
 * Outer white ring, solid colored circular background, and centered white vector glyph.
 */
export function getHotspotIconTexture(iconType = 'info', bgColor = '#16a34a') {
  if (typeof document === 'undefined') return null;

  const cacheKey = `${iconType}-${bgColor}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey);
  }

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext?.('2d');
  if (!ctx) return null;

  const cx = 128;
  const cy = 128;
  const radius = 100;

  ctx.clearRect(0, 0, 256, 256);

  // 1. Outer crisp white ring
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 8, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  // 2. Main solid colored circular disc
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = bgColor;
  ctx.fill();

  // 3. Subtle inner border for depth
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 2, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 4;
  ctx.stroke();

  // 4. Center icon (drawn in crisp white)
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#ffffff';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (iconType === 'tree' || iconType === 'plant') {
    // Stylized pine tree icon (matching the Matterport tag in image 2)
    // Trunk
    ctx.fillRect(123, 160, 10, 24);

    // Tree foliage tiers
    ctx.beginPath();
    ctx.moveTo(128, 72);
    ctx.lineTo(152, 104);
    ctx.lineTo(142, 104);
    ctx.lineTo(160, 134);
    ctx.lineTo(148, 134);
    ctx.lineTo(168, 162);
    ctx.lineTo(88, 162);
    ctx.lineTo(108, 134);
    ctx.lineTo(96, 134);
    ctx.lineTo(114, 104);
    ctx.lineTo(104, 104);
    ctx.closePath();
    ctx.fill();
  } else if (iconType === 'home' || iconType === 'house') {
    // Stylized house icon with heart / warm home interior (matching image 2 fireplace)
    ctx.beginPath();
    ctx.moveTo(128, 68);
    ctx.lineTo(180, 114);
    ctx.lineTo(166, 114);
    ctx.lineTo(166, 176);
    ctx.lineTo(90, 176);
    ctx.lineTo(90, 114);
    ctx.lineTo(76, 114);
    ctx.closePath();
    ctx.fill();

    // Center heart cut-out
    ctx.save();
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    const hx = 128, hy = 142;
    ctx.moveTo(hx, hy + 18);
    ctx.bezierCurveTo(hx - 18, hy + 6, hx - 18, hy - 12, hx, hy - 4);
    ctx.bezierCurveTo(hx + 18, hy - 12, hx + 18, hy + 6, hx, hy + 18);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  } else if (iconType === 'kitchen') {
    // Dining / kitchen icon
    ctx.lineWidth = 6;
    // Knife
    ctx.beginPath();
    ctx.moveTo(150, 78);
    ctx.lineTo(150, 178);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(146, 96, 13, -Math.PI / 2, Math.PI / 2);
    ctx.fill();

    // Fork
    ctx.beginPath();
    ctx.moveTo(106, 122);
    ctx.lineTo(106, 178);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(96, 78);
    ctx.lineTo(96, 114);
    ctx.lineTo(116, 114);
    ctx.lineTo(116, 78);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(106, 78);
    ctx.lineTo(106, 114);
    ctx.stroke();
  } else if (iconType === 'stairs') {
    // Stepped staircase icon
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(85, 174);
    ctx.lineTo(106, 174);
    ctx.lineTo(106, 144);
    ctx.lineTo(128, 144);
    ctx.lineTo(128, 114);
    ctx.lineTo(150, 114);
    ctx.lineTo(150, 84);
    ctx.lineTo(171, 84);
    ctx.stroke();
  } else {
    // Information 'i' icon
    ctx.beginPath();
    ctx.arc(128, 88, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(117, 116, 22, 60, 6);
    } else {
      ctx.rect(117, 116, 22, 60);
    }
    ctx.fill();
  }

  const texture = new CanvasTexture(canvas);
  texture.minFilter = LinearMipmapLinearFilter;
  texture.magFilter = LinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;

  textureCache.set(cacheKey, texture);
  return texture;
}

const labelCache = new Map();

/**
 * Creates a floating hover label pill texture displaying the hotspot title.
 */
export function getHotspotLabelTexture(title) {
  if (typeof document === 'undefined') return null;
  if (labelCache.has(title)) return labelCache.get(title);

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext?.('2d');
  if (!ctx) return null;

  ctx.clearRect(0, 0, 512, 128);

  ctx.font = 'bold 34px Inter, "Segoe UI", Arial, sans-serif';
  const textWidth = ctx.measureText(title).width;
  const pillWidth = Math.min(490, Math.max(140, textWidth + 50));
  const pillHeight = 64;
  const px = (512 - pillWidth) / 2;
  const py = (128 - pillHeight) / 2;

  ctx.save();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(px, py, pillWidth, pillHeight, 32);
  } else {
    ctx.rect(px, py, pillWidth, pillHeight);
  }
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, 256, 64);
  ctx.restore();

  const texture = new CanvasTexture(canvas);
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.needsUpdate = true;
  labelCache.set(title, texture);
  return texture;
}
