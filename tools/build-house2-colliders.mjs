import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const bytes = await readFile('public/models/house2.glb');
const doorways = JSON.parse(await readFile('docs/house/house2-doorways.json', 'utf8'));
if (createHash('sha256').update(bytes).digest('hex') !== doorways.sha256) throw new Error('Doorway overrides belong to a different scan. Reinspect before regenerating.');
const jsonSize = bytes.readUInt32LE(12), gltf = JSON.parse(bytes.subarray(20, 20 + jsonSize));
const binary = bytes.subarray(28 + jsonSize);
if (gltf.nodes.some(n => n.matrix || n.translation || n.rotation || n.scale)) throw new Error('Bake node transforms before generating collision proxies.');
function accessor(index) {
  const a = gltf.accessors[index], v = gltf.bufferViews[a.bufferView];
  const width = a.componentType === 5123 ? 2 : 4, components = a.type === 'VEC3' ? 3 : 1;
  return { count: a.count, get(i, c = 0) {
    const offset = (v.byteOffset || 0) + (a.byteOffset || 0) + i * (v.byteStride || width * components) + c * width;
    return a.componentType === 5126 ? binary.readFloatLE(offset) : width === 2 ? binary.readUInt16LE(offset) : binary.readUInt32LE(offset);
  } };
}
// Conservative 4 cm occupancy proxies from the scan. Floor/ceiling triangles
// are excluded from obstacles; unsupported cells block exits into missing scan.
const cell = 0.04, min = -8.64, count = 432, floorY = -1.168;
const occupied = new Uint8Array(count * count), supported = new Uint8Array(count * count);
function clip(poly, axis, value, positive) {
  const result = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const insideA = positive ? a[axis] >= value : a[axis] <= value;
    const insideB = positive ? b[axis] >= value : b[axis] <= value;
    if (insideA) result.push(a);
    if (insideA !== insideB) { const t = (value - a[axis]) / (b[axis] - a[axis]); result.push(a.map((v, k) => v + t * (b[k] - v))); }
  }
  return result;
}
function raster(poly, grid) {
  if (!poly.length) return;
  const low = axis => Math.max(0, Math.floor((Math.min(...poly.map(p => p[axis])) - min) / cell));
  const high = axis => Math.min(count - 1, Math.floor((Math.max(...poly.map(p => p[axis])) - min) / cell));
  for (let z = low(2); z <= high(2); z++) for (let x = low(0); x <= high(0); x++) {
    if (grid[z * count + x]) continue;
    let p = clip(poly, 0, min + x * cell, true);
    p = clip(p, 0, min + (x + 1) * cell, false);
    p = clip(p, 2, min + z * cell, true);
    p = clip(p, 2, min + (z + 1) * cell, false);
    if (p.length) grid[z * count + x] = 1;
  }
}
for (const mesh of gltf.meshes) for (const primitive of mesh.primitives) {
  const positions = accessor(primitive.attributes.POSITION), indices = accessor(primitive.indices);
  for (let i = 0; i < indices.count; i += 3) {
    const tri = [0, 1, 2].map(n => [0, 1, 2].map(c => positions.get(indices.get(i + n), c)));
    raster(clip(clip(tri, 1, floorY + 0.22, true), 1, floorY + 1.65, false), occupied);
    const ys = tri.map(p => p[1]);
    if (Math.max(...ys) < floorY + 0.15 && Math.min(...ys) > floorY - 0.2) raster(tri, supported);
  }
}
// Clear only inspected doorway cells with actual scanned floor support.
// Missing-floor barriers and the surrounding jambs/walls remain intact.
for (const door of doorways.collisionClearances) {
  for (let z = 0; z < count; z++) for (let x = 0; x < count; x++) {
    const px = min + (x + 0.5) * cell, pz = min + (z + 0.5) * cell;
    if (px > door.min[0] && px < door.max[0] && pz > door.min[1] && pz < door.max[1] && supported[z * count + x]) occupied[z * count + x] = 0;
  }
}
const blocked = occupied.map((v, i) => v || !supported[i] ? 1 : 0);
const colliders = [{ id: 'house2-floor', type: 'box', center: [0, -0.1, 0], halfExtents: [8.64, 0.1, 8.64] }];
for (let z = 0; z < count; z++) for (let x = 0; x < count; x++) {
  if (!blocked[z * count + x]) continue;
  let width = 1, depth = 1;
  while (x + width < count && blocked[z * count + x + width]) width++;
  while (z + depth < count && Array.from({ length: width }, (_, n) => blocked[(z + depth) * count + x + n]).every(Boolean)) depth++;
  for (let dz = 0; dz < depth; dz++) blocked.fill(0, (z + dz) * count + x, (z + dz) * count + x + width);
  colliders.push({ id: `house2-scan-${colliders.length}`, type: 'box', center: [min + (x + width / 2) * cell, 0.9, min + (z + depth / 2) * cell], halfExtents: [width * cell / 2, 0.9, depth * cell / 2] });
}
const result = { source: 'house2.glb', sha256: createHash('sha256').update(bytes).digest('hex'), floorY, cellSize: cell, scaleVerified: false, colliders };
await writeFile('docs/house/house2-colliders.json', JSON.stringify(result, null, 2) + '\n');
console.log(`${colliders.length} collision proxies written; grid ${count} × ${count}.`);
