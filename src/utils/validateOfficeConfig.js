import { spawnIntersects } from './geometryUtils.js';

const vector = v => Array.isArray(v) && v.length === 3 && v.every(Number.isFinite);

export function validateOfficeConfig(config) {
  const errors = [];
  if (!['demo', 'sample', 'house', 'real'].includes(config.sceneMode)) errors.push('Choose demo, sample, house or real scene mode.');
  if (config.unit !== 'meters') errors.push('World units must be meters.');
  if (['sample', 'house', 'real'].includes(config.sceneMode)) {
    if (!/^\/models\/[\w\s./-]+\.glb$/i.test(config.modelUrl || '') || config.modelUrl.includes('..')) {
      errors.push('Provide an approved /models/*.glb asset path.');
    }
    if (!config.colliders?.length) errors.push('Floor, wall and furniture colliders are required.');
  }
  if (config.sceneMode === 'real') {
    if (!config.approved) errors.push('Confirm the optimized asset is approved for browser delivery.');
    if (!config.calibrated) errors.push('TODO: MEASURE/VERIFY scale, floor, spawn, heading and collision proxies.');
    if (!config.colliders?.length) errors.push('Measured floor, wall and furniture colliders are required.');
  }
  const p = config.player || {};
  if (!vector(p.spawn) || !Number.isFinite(p.initialYaw)) errors.push('Configure a finite, measured spawn and yaw.');
  for (const key of ['radius', 'capsuleHalfHeight', 'eyeOffsetY', 'speed']) {
    if (!Number.isFinite(p[key]) || p[key] <= 0) errors.push(`Player ${key} must be positive.`);
  }
  const ids = new Set();
  for (const item of [...(config.colliders || []), ...(config.hotspots || [])]) {
    if (!item.id || ids.has(item.id)) errors.push('Collider and hotspot IDs must be unique.');
    ids.add(item.id);
  }
  for (const c of config.colliders || []) {
    if (c.type !== 'box' || !vector(c.center) || !vector(c.halfExtents) || c.halfExtents.some(n => n <= 0)) {
      errors.push(`Invalid collider: ${c.id}.`);
    } else if (vector(p.spawn) && spawnIntersects(p, c)) {
      errors.push(`Spawn intersects ${c.id}.`);
    }
  }
  for (const h of config.hotspots || []) {
    if (!vector(h.position) || !h.title || !Number.isFinite(h.maxInteractDistance) || h.maxInteractDistance <= 0) {
      errors.push(`Invalid hotspot: ${h.id}.`);
    }
  }
  return errors;
}
