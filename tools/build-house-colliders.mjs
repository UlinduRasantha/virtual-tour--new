import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const input = 'public/models/My whole frickin house.glb';
const bytes = await readFile(input);

// Parse GLB
const jsonLen = bytes.readUInt32LE(12);
const gltf = JSON.parse(bytes.subarray(20, 20 + jsonLen).toString('utf8'));
const bin = bytes.subarray(20 + jsonLen + 8);

function accessor(idx) {
  const acc = gltf.accessors[idx];
  const bv = gltf.bufferViews[acc.bufferView];
  const base = (bv.byteOffset || 0) + (acc.byteOffset || 0);
  const is32 = acc.componentType === 5125;
  const is16 = acc.componentType === 5123;
  const isF = acc.componentType === 5126;
  const stride = bv.byteStride || (isF ? (acc.type === 'VEC3' ? 12 : 4) : (is32 ? 4 : (is16 ? 2 : 1)));
  return {
    count: acc.count,
    get: (i, c = 0) => {
      const off = base + i * stride + c * 4;
      return isF ? bin.readFloatLE(off) : (is32 ? bin.readUInt32LE(off) : (is16 ? bin.readUInt16LE(off) : bin.readUInt8(off)));
    }
  };
}

// Coordinate grid: 8cm cells
const cell = 0.08;
const minX = -6.00, maxX = 6.00;
const minZ = -11.00, maxZ = 11.00;
const countX = Math.ceil((maxX - minX) / cell);
const countZ = Math.ceil((maxZ - minZ) / cell);

function clip(poly, axis, val, keepGreater) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const inA = keepGreater ? a[axis] >= val : a[axis] <= val;
    const inB = keepGreater ? b[axis] >= val : b[axis] <= val;
    if (inA) out.push(a);
    if (inA !== inB) {
      const t = (val - a[axis]) / (b[axis] - a[axis]);
      out.push(a.map((v, idx) => v + t * (b[idx] - v)));
    }
  }
  return out;
}

function raster(poly, grid) {
  if (poly.length < 3) return;
  const xs = poly.map(p => p[0]), zs = poly.map(p => p[2]);
  const i0 = Math.max(0, Math.floor((Math.min(...xs) - minX) / cell));
  const i1 = Math.min(countX - 1, Math.floor((Math.max(...xs) - minX) / cell));
  const k0 = Math.max(0, Math.floor((Math.min(...zs) - minZ) / cell));
  const k1 = Math.min(countZ - 1, Math.floor((Math.max(...zs) - minZ) / cell));

  for (let z = k0; z <= k1; z++) {
    for (let x = i0; x <= i1; x++) {
      let p = clip(poly, 0, minX + x * cell, true);
      p = clip(p, 0, minX + (x + 1) * cell, false);
      p = clip(p, 2, minZ + z * cell, true);
      p = clip(p, 2, minZ + (z + 1) * cell, false);
      if (p.length) grid[z * countX + x] = 1;
    }
  }
}

// 3 Floor Configurations
// CRITICAL: wallMinY is placed at waist height (+0.55m above floor) to avoid picking up
// floor thresholds, carpet edges, door sills, and step risers that create artificial hallway barriers!
const floorConfigs = [
  {
    name: 'floor1_basement',
    floorY: -2.50,
    wallMinY: -1.95, // 0.55m above basement floor
    wallMaxY: -0.75,
    wallCenterY: -1.35,
    wallHalfH: 1.15, // covers Y in [-2.50, -0.20]
    stairCutout: { minX: -0.70, maxX: 1.95, minZ: 2.60, maxZ: 4.65 }
  },
  {
    name: 'floor2_main',
    floorY: 0.00,
    wallMinY: 0.55,  // 0.55m above main floor (avoids floor sills/baseboards)
    wallMaxY: 1.75,
    wallCenterY: 1.10,
    wallHalfH: 1.10, // covers Y in [0.00, 2.20]
    stairCutout: { minX: -0.70, maxX: 1.95, minZ: 2.60, maxZ: 4.65 }
  },
  {
    name: 'floor3_upper',
    floorY: 2.95,
    wallMinY: 3.50,  // 0.55m above upper floor
    wallMaxY: 4.65,
    wallCenterY: 4.05,
    wallHalfH: 1.10, // covers Y in [2.95, 5.15]
    stairCutout: { minX: -0.70, maxX: 1.95, minZ: 2.60, maxZ: 4.65 }
  }
];

const colliders = [];

// ==========================================
// 1. FLOOR SLABS (With exact stair shaft cutout)
// Shaft cutout: X in [0.00, 1.85], Z in [2.65, 4.55]
// ==========================================

// --- FLOOR 1 (BASEMENT) FLOOR SLAB ---
colliders.push({
  id: 'house-floor-1-slab',
  type: 'box',
  center: [0, -2.60, 0],
  halfExtents: [10, 0.10, 12]
});

// --- FLOOR 2 (MAIN FLOOR) SLABS ---
colliders.push(
  { id: 'house-floor-2-south', type: 'box', center: [0, -0.10, -3.675], halfExtents: [10, 0.10, 6.325] },
  { id: 'house-floor-2-north', type: 'box', center: [0, -0.10, 7.275], halfExtents: [10, 0.10, 2.725] },
  { id: 'house-floor-2-west', type: 'box', center: [-5.00, -0.10, 3.60], halfExtents: [5.00, 0.10, 0.95] },
  { id: 'house-floor-2-east', type: 'box', center: [5.925, -0.10, 3.60], halfExtents: [4.075, 0.10, 0.95] }
);

// --- FLOOR 3 (UPPER FLOOR) SLABS ---
colliders.push(
  { id: 'house-floor-3-south', type: 'box', center: [0, 2.85, -3.675], halfExtents: [10, 0.10, 6.325] },
  { id: 'house-floor-3-north', type: 'box', center: [0, 2.85, 7.275], halfExtents: [10, 0.10, 2.725] },
  { id: 'house-floor-3-west', type: 'box', center: [-5.00, 2.85, 3.60], halfExtents: [5.00, 0.10, 0.95] },
  { id: 'house-floor-3-east', type: 'box', center: [5.925, 2.85, 3.60], halfExtents: [4.075, 0.10, 0.95] }
);

// ==========================================
// 2. REAL SWITCHBACK STAIRCASE COLLIDERS
// Shaft: X in [0.00, 1.85], Z in [2.65, 4.55]
// Steps span X in [0.00, 1.30] (10 steps of 0.13m)
// Turning landing spans X in [1.30, 1.85] (0.55m turning bay)
// South run: Z=3.125 (halfWidth 0.425), North run: Z=4.075 (halfWidth 0.425)
// ==========================================

const numSteps = 10;
const startX = 0.00, endX = 1.30;
const stepDx = (endX - startX) / numSteps; // 0.13m tread depth
const stepThickness = 0.22;
const stepHalfH = stepThickness / 2;

// --- FLIGHT 1A: Main Floor (Y=0.00) -> Mid-Landing (Y=1.45) ---
// Climbing +X along SOUTH run (Z=3.125)
const dy1A = 1.45 / numSteps;
for (let i = 0; i < numSteps; i++) {
  const x = startX + (i + 0.5) * stepDx;
  const topY = (i + 1) * dy1A;
  colliders.push({
    id: `house-stair-up-1A-${i + 1}`,
    type: 'box',
    center: [x, topY - stepHalfH, 3.125],
    halfExtents: [stepDx / 2, stepHalfH, 0.425]
  });
}

// --- UPPER MID-LANDING 1 (Y=1.45) ---
// Spans both South and North runs at the East end of the shaft: X in [1.30, 1.85], Z in [2.65, 4.55]
colliders.push({
  id: 'house-stair-landing-1',
  type: 'box',
  center: [1.575, 1.45 - stepHalfH, 3.60],
  halfExtents: [0.275, stepHalfH, 0.95]
});

// --- FLIGHT 1B: Mid-Landing (Y=1.45) -> Floor 3 (Y=2.95) ---
// Climbing -X along NORTH run (Z=4.075) up to Floor 3
const dy1B = 1.50 / numSteps;
for (let i = 0; i < numSteps; i++) {
  const x = endX - (i + 0.5) * stepDx;
  const topY = 1.45 + (i + 1) * dy1B;
  colliders.push({
    id: `house-stair-up-1B-${i + 1}`,
    type: 'box',
    center: [x, topY - stepHalfH, 4.075],
    halfExtents: [stepDx / 2, stepHalfH, 0.425]
  });
}

// --- FLIGHT 2A: Main Floor (Y=0.00) -> Basement Landing (Y=-1.25) ---
// Descending +X along NORTH run (Z=4.075) down to Basement Landing
const dy2A = 1.25 / numSteps;
for (let i = 0; i < numSteps; i++) {
  const x = startX + (i + 0.5) * stepDx;
  const topY = -(i + 1) * dy2A;
  const boxH = topY - (-2.60);
  colliders.push({
    id: `house-stair-down-2A-${i + 1}`,
    type: 'box',
    center: [x, -2.60 + boxH / 2, 4.075],
    halfExtents: [stepDx / 2, boxH / 2, 0.425]
  });
}

// --- BASEMENT MID-LANDING 2 (Y=-1.25) ---
// Spans both runs at East end: X in [1.30, 1.85], Z in [2.65, 4.55]
const landing2H = -1.25 - (-2.60);
colliders.push({
  id: 'house-stair-landing-2',
  type: 'box',
  center: [1.575, -2.60 + landing2H / 2, 3.60],
  halfExtents: [0.275, landing2H / 2, 0.95]
});

// --- FLIGHT 2B: Basement Landing (Y=-1.25) -> Basement Floor (Y=-2.50) ---
// Descending -X along SOUTH run (Z=3.125) down to Basement Floor
const dy2B = 1.25 / numSteps;
for (let i = 0; i < numSteps; i++) {
  const x = endX - (i + 0.5) * stepDx;
  const topY = -1.25 - (i + 1) * dy2B;
  const boxH = topY - (-2.60);
  colliders.push({
    id: `house-stair-down-2B-${i + 1}`,
    type: 'box',
    center: [x, -2.60 + boxH / 2, 3.125],
    halfExtents: [stepDx / 2, boxH / 2, 0.425]
  });
}

// --- CENTRAL DIVIDER HANDRAIL (between North & South runs at Z=3.60, stops at X=1.25 for turning space) ---
colliders.push({
  id: 'house-stair-divider',
  type: 'box',
  center: [0.625, 0.50, 3.60],
  halfExtents: [0.625, 2.70, 0.04]
});

// --- STAIR ENCLOSURE WALLS (start at X=0.20 so hallway circulation is unobstructed) ---
colliders.push(
  { id: 'house-stair-east-wall', type: 'box', center: [1.88, 0.50, 3.60], halfExtents: [0.06, 2.70, 0.95] },
  { id: 'house-stair-south-wall', type: 'box', center: [1.025, 0.50, 2.65], halfExtents: [0.825, 2.70, 0.06] },
  { id: 'house-stair-north-wall', type: 'box', center: [1.025, 0.50, 4.55], halfExtents: [0.825, 2.70, 0.06] }
);

// --- FLOOR 3 GUARD RAILING (stops player on upper floor from falling into South flight) ---
colliders.push({
  id: 'house-floor-3-stair-guard',
  type: 'box',
  center: [0.00, 3.50, 3.125],
  halfExtents: [0.05, 0.55, 0.45]
});

// --- BASEMENT PARTITION (closes off underside of Flight 2A on North run at Basement level) ---
colliders.push({
  id: 'house-basement-stair-partition',
  type: 'box',
  center: [0.00, -1.90, 4.075],
  halfExtents: [0.05, 0.65, 0.45]
});

// ==========================================
// 3. RASTERIZE ACTUAL VERTICAL WALLS FOR ALL 3 FLOORS
// ==========================================
for (const fc of floorConfigs) {
  const occupied = new Uint8Array(countX * countZ);

  for (const mesh of gltf.meshes) {
    for (const primitive of mesh.primitives) {
      const positions = accessor(primitive.attributes.POSITION);
      const indices = accessor(primitive.indices);
      for (let i = 0; i < indices.count; i += 3) {
        const tri = [0, 1, 2].map(n => [
          positions.get(indices.get(i + n), 0),
          positions.get(indices.get(i + n), 1) + 1.48, // normalized Y
          positions.get(indices.get(i + n), 2)
        ]);
        const e1 = [tri[1][0] - tri[0][0], tri[1][1] - tri[0][1], tri[1][2] - tri[0][2]];
        const e2 = [tri[2][0] - tri[0][0], tri[2][1] - tri[0][1], tri[2][2] - tri[0][2]];
        const nx = e1[1]*e2[2] - e1[2]*e2[1], ny = e1[2]*e2[0] - e1[0]*e2[2], nz = e1[0]*e2[1] - e1[1]*e2[0];
        const len = Math.hypot(nx, ny, nz);
        // Only vertical wall triangles (|ny / len| < 0.40)
        if (len > 1e-4 && Math.abs(ny / len) < 0.40) {
          raster(clip(clip(tri, 1, fc.wallMinY, true), 1, fc.wallMaxY, false), occupied);
        }
      }
    }
  }

  // Clear stair shaft circulation space on this floor
  for (let z = 0; z < countZ; z++) {
    for (let x = 0; x < countX; x++) {
      const wx = minX + (x + 0.5) * cell, wz = minZ + (z + 0.5) * cell;
      if (wx >= fc.stairCutout.minX && wx <= fc.stairCutout.maxX && wz >= fc.stairCutout.minZ && wz <= fc.stairCutout.maxZ) {
        occupied[z * countX + x] = 0;
      }
    }
  }

  // Greedy merge wall boxes (filter out single isolated 8cm noise cells)
  const blocked = new Uint8Array(occupied);
  let cCount = 0;
  for (let z = 0; z < countZ; z++) {
    for (let x = 0; x < countX; x++) {
      if (!blocked[z * countX + x]) continue;
      let width = 1, depth = 1;
      while (x + width < countX && blocked[z * countX + x + width]) width++;
      while (z + depth < countZ && Array.from({ length: width }, (_, n) => blocked[(z + depth) * countX + x + n]).every(Boolean)) depth++;
      for (let dz = 0; dz < depth; dz++) blocked.fill(0, (z + dz) * countX + x, (z + dz) * countX + x + width);
      
      // Filter out isolated 1x1 noise crumbs
      if (width === 1 && depth === 1) continue;

      colliders.push({
        id: `${fc.name}-wall-${++cCount}`,
        type: 'box',
        center: [minX + (x + width / 2) * cell, fc.wallCenterY, minZ + (z + depth / 2) * cell],
        halfExtents: [width * cell / 2, fc.wallHalfH, depth * cell / 2]
      });
    }
  }

  // Outer boundary walls to prevent falling off exterior scan bounds
  colliders.push(
    { id: `${fc.name}-bound-south`, type: 'box', center: [0, fc.wallCenterY, -10.50], halfExtents: [6.00, fc.wallHalfH, 0.20] },
    { id: `${fc.name}-bound-north`, type: 'box', center: [0, fc.wallCenterY, 10.50], halfExtents: [6.00, fc.wallHalfH, 0.20] },
    { id: `${fc.name}-bound-west`, type: 'box', center: [-5.80, fc.wallCenterY, 0.00], halfExtents: [0.20, fc.wallHalfH, 10.50] },
    { id: `${fc.name}-bound-east`, type: 'box', center: [5.80, fc.wallCenterY, 0.00], halfExtents: [0.20, fc.wallHalfH, 10.50] }
  );

  console.log(`${fc.name}: generated ${cCount} wall colliders + 4 perimeter boundaries.`);
}

const result = {
  source: 'My whole frickin house.glb',
  sha256: createHash('sha256').update(bytes).digest('hex'),
  floorY: -1.48,
  cellSize: cell,
  colliders
};

await writeFile('docs/house/house-colliders.json', JSON.stringify(result, null, 2) + '\n');
console.log(`\nSuccessfully generated ${colliders.length} accurate multi-floor colliders.`);
