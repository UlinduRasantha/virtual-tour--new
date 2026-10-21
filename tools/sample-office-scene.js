import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Artist-authored sample dimensions. None are measurements of a physical office.
export function buildSampleOffice() {
  let seed = 417;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const root = new T.Group();
  root.name = 'SAMPLE_Office_ImageInspired_NotAScan';
  root.userData = { source: 'Single supplied office reference image', kind: 'Fictional image-inspired sample, not a scan or measured reconstruction', units: 'meters', upAxis: 'Y', roomWidth: 12, roomDepth: 15, ceilingHeight: 3.65 };
  const colliders = [];
  const mats = {};
  const material = (name, color, options = {}) => {
    const result = new T.MeshStandardMaterial({ color, roughness: 0.8, ...options });
    result.name = name; mats[name] = result; return result;
  };
  const charcoal = material('Charcoal powder-coated steel', '#252927', { roughness: 0.48, metalness: 0.45 });
  const chrome = material('Brushed chair wire', '#82847e', { roughness: 0.32, metalness: 0.85 });
  const plaster = material('Warm white plaster', '#e1ddd1');
  const beige = material('Molded warm ivory shell', '#c3b49a', { roughness: 0.55 });
  const upholstery = material('Charcoal chair upholstery', '#292f2d');
  const teal = material('Muted sage upholstery', '#6c9085');
  const ochre = material('Ochre upholstery', '#b19a70');
  const ceramic = material('Ivory ceramic', '#e8e3d7', { roughness: 0.48 });
  const soil = material('Potting soil', '#423a29');
  const leaf = material('Indoor foliage', '#426644');
  const leafLight = material('Leaf highlights', '#6d8052');
  const diffuser = material('Warm LED diffuser', '#fff4da', { emissive: '#fff1ce', emissiveIntensity: 2.5, roughness: 0.5 });
  const screen = material('Dark monitor glass', '#1e2428', { roughness: 0.26, metalness: 0.12 });
  const silver = material('Warm silver computer cases', '#b4b7b3', { roughness: 0.43, metalness: 0.65 });
  const paper = material('Unmarked paper', '#e1dfd6');
  const glass = material('Light neutral window glass', '#cfe1df', { transparent: true, opacity: 0.09, roughness: 0.1, metalness: 0.1, side: T.DoubleSide, depthWrite: false });

  function texture(name, floor = false) {
    const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = floor ? '#c2b5a0' : '#9b8d76'; ctx.fillRect(0, 0, 1024, 1024);
    for (let p = 0; p < (floor ? 12 : 5); p++) {
      const width = 1024 / (floor ? 12 : 5), x = p * width;
      const light = 50 + random() * 9 + (floor ? 13 : 0);
      ctx.fillStyle = `hsl(36 15% ${light}%)`; ctx.fillRect(x, 0, width, 1024);
      for (let g = 0; g < 100; g++) {
        const start = x + random() * width;
        ctx.strokeStyle = `rgba(60,43,24,${random() * 0.1})`; ctx.lineWidth = 0.5 + random();
        ctx.beginPath(); ctx.moveTo(start, 0); ctx.bezierCurveTo(start + 5, 340, start - 5, 680, start + 1, 1024); ctx.stroke();
      }
      ctx.fillStyle = '#51453444'; ctx.fillRect(x, 0, floor ? 1 : 2, 1024);
      if (floor) { const y = (p % 3) * 341; ctx.fillRect(x, y, width, 1.5); }
    }
    const tex = new T.CanvasTexture(canvas); tex.name = name; tex.colorSpace = T.SRGBColorSpace;
    tex.wrapS = tex.wrapT = T.RepeatWrapping; if (floor) tex.repeat.set(2, 3); tex.anisotropy = 8;
    return tex;
  }
  const wood = material('Natural ash desktop', '#eee9de', { map: texture('Embedded desktop wood grain'), roughness: 0.62 });
  const floor = material('Pale timber plank flooring', '#f5eee2', { map: texture('Embedded flooring texture', true) });
  const walnut = material('Warm shelving wood', '#a49173');
  const branches = material('Plant stems', '#6c5940');

  const group = (name, parent = root) => { const g = new T.Group(); g.name = name; parent.add(g); return g; };
  const mesh = (geo, mat, pos, parent, name) => {
    const m = new T.Mesh(geo, mat); m.name = name || mat.name;
    m.position.set(...pos); m.castShadow = !mat.transparent; m.receiveShadow = true; parent.add(m); return m;
  };
  const box = (size, pos, mat, parent = root, name) => mesh(new T.BoxGeometry(...size), mat, pos, parent, name);
  const cylinder = (r1, r2, h, pos, mat, parent = root, segments = 12) => mesh(new T.CylinderGeometry(r1, r2, h, segments), mat, pos, parent);
  function rod(a, b, radius, mat, parent) {
    const p = new T.Vector3(...a), q = new T.Vector3(...b), d = q.clone().sub(p);
    const result = cylinder(radius, radius, d.length(), p.add(q).multiplyScalar(0.5).toArray(), mat, parent, 6);
    result.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); return result;
  }
  const proxy = (id, center, size) => colliders.push({ id, type: 'box', center, halfExtents: size.map(n => n / 2) });
  const room = group('Architecture');
  box([12, 0.16, 15], [0, -0.08, 0], floor, room, 'Floor_Y0'); proxy('sample-floor', [0, -0.08, 0], [12, 0.16, 15]);
  box([12.2, 0.15, 15.2], [0, 3.725, 0], plaster, room, 'Ceiling');
  box([0.18, 3.65, 15], [6, 1.825, 0], plaster, room, 'Right wall'); proxy('sample-east', [6, 1.825, 0], [0.18, 3.65, 15]);
  box([12, 3.65, 0.18], [0, 1.825, 7.5], plaster, room, 'Rear camera wall'); proxy('sample-south', [0, 1.825, 7.5], [12, 3.65, 0.18]);
  // One sample doorway in the back-left wall. It is not a surveyed real doorway.
  box([1.4, 3.65, 0.18], [-5.3, 1.825, -7.5], plaster, room);
  box([9.2, 3.65, 0.18], [1.4, 1.825, -7.5], plaster, room);
  box([1.4, 1.05, 0.18], [-3.9, 3.125, -7.5], plaster, room);
  proxy('sample-north-left', [-5.3, 1.825, -7.5], [1.4, 3.65, 0.18]);
  proxy('sample-north-right', [1.4, 1.825, -7.5], [9.2, 3.65, 0.18]);
  proxy('sample-door-lintel', [-3.9, 3.125, -7.5], [1.4, 1.05, 0.18]);
  // Short vestibule closes the demonstration floor envelope beyond the open door.
  box([1.6, 0.16, 1.4], [-3.9, -0.08, -8.15], floor, room);
  box([1.6, 2.8, 0.16], [-3.9, 1.4, -8.8], plaster, room);
  proxy('sample-vestibule-floor', [-3.9, -0.08, -8.15], [1.6, 0.16, 1.4]);
  proxy('sample-vestibule-back', [-3.9, 1.4, -8.8], [1.6, 2.8, 0.16]);
  for (const x of [-4.7, -3.1]) { box([0.16, 2.8, 1.4], [x, 1.4, -8.1], plaster, room); proxy(`sample-vestibule-${x}`, [x, 1.4, -8.1], [0.16, 2.8, 1.4]); }
  for (const y of [0.13, 3.44]) box([0.2, 0.13, 15], [-5.98, y, 0], charcoal, room);
  box([12, 0.07, 0.045], [0, 0.055, -7.38], walnut, room);
  box([0.045, 0.07, 15], [5.88, 0.055, 0], walnut, room);
  box([12, 0.25, 0.25], [0, 3.35, -5.2], charcoal, room);

  const windows = group('Full_height_windows_and_blinds');
  proxy('sample-west-glazing', [-6, 1.825, 0], [0.14, 3.65, 15]);
  for (let i = 0; i < 10; i++) {
    const z = -6.75 + i * 1.5;
    box([0.025, 3.17, 1.44], [-6, 1.81, z], glass, windows, 'Glazing');
    box([0.12, 3.4, 0.06], [-5.93, 1.75, z - 0.75], charcoal, windows, 'Window mullion');
    box([0.12, 0.05, 1.5], [-5.93, 1.05, z], charcoal, windows);
    box([0.12, 0.05, 1.5], [-5.93, 2.35, z], charcoal, windows);
    for (let s = 0; s < 21; s++) {
      const slat = box([0.09, 0.014, 1.44], [-5.79, 2.4 + s * 0.047, z], charcoal, windows, 'Venetian blind slat'); slat.rotation.z = -0.25;
    }
    for (const dz of [-0.52, 0.52]) rod([-5.75, 2.36, z + dz], [-5.75, 3.4, z + dz], 0.004, chrome, windows);
  }
  // A broad structural column breaks the long window rhythm, as in the reference.
  box([0.42, 3.65, 0.5], [-5.55, 1.825, -2.15], plaster, room); proxy('sample-window-column', [-5.55, 1.825, -2.15], [0.42, 3.65, 0.5]);

  function plant(x, y, z, scale = 1, parent = root) {
    const p = group('Plant', parent); p.position.set(x, y, z); p.scale.setScalar(scale);
    cylinder(0.15, 0.11, 0.23, [0, 0.115, 0], ceramic, p, 16);
    cylinder(0.135, 0.135, 0.009, [0, 0.233, 0], soil, p, 16);
    for (let i = 0; i < 9; i++) {
      const a = i * 2.4, h = 0.34 + random() * 0.21;
      const end = [Math.cos(a) * 0.18, h, Math.sin(a) * 0.18];
      rod([0, 0.23, 0], end, 0.006, branches, p);
      const l = mesh(new T.SphereGeometry(1, 8, 6), i % 2 ? leaf : leafLight, end, p);
      l.scale.set(0.055, 0.16, 0.045); l.rotation.set(Math.sin(a) * 0.8, a, Math.cos(a) * 0.9);
    }
  }
  function chair(x, z, yaw, parent) {
    const g = group('Molded_chair', parent); g.position.set(x, 0, z); g.rotation.y = yaw;
    const seat = mesh(new T.SphereGeometry(1, 20, 12), beige, [0, 0.47, 0], g); seat.scale.set(0.28, 0.055, 0.26);
    const cushion = mesh(new T.SphereGeometry(1, 20, 10), upholstery, [0, 0.495, -0.01], g); cushion.scale.set(0.26, 0.04, 0.23);
    // Curved molded shell, not an upright rectangular placeholder.
    function back(v0, v1, mat) {
      const positions = [], indices = [];
      for (let j = 0; j <= 8; j++) for (let i = 0; i <= 16; i++) {
        const u = i / 8 - 1, v = v0 + (v1 - v0) * j / 8;
        positions.push(u * (0.26 - 0.018 * v), 0.51 + 0.39 * v - 0.035 * u * u * v, 0.20 + 0.06 * v - 0.10 * u * u);
        if (i < 16 && j < 8) { const n = j * 17 + i; indices.push(n, n + 17, n + 1, n + 1, n + 17, n + 18); }
      }
      const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(positions, 3)); geo.setIndex(indices); geo.computeVertexNormals();
      mesh(geo, mat, [0, 0, 0], g, 'Curved chair back');
    }
    const outer = beige.clone(); outer.side = T.DoubleSide; outer.name = 'Ivory lower shell';
    const inner = upholstery.clone(); inner.side = T.DoubleSide; inner.name = 'Charcoal upper shell';
    back(0, 0.24, outer); back(0.24, 1, inner);
    for (const xx of [-1, 1]) for (const zz of [-1, 1]) {
      rod([xx * 0.17, 0.43, zz * 0.14], [xx * 0.27, 0.035, zz * 0.28], 0.012, chrome, g);
      cylinder(0.022, 0.022, 0.025, [xx * 0.27, 0.017, zz * 0.28], charcoal, g, 8);
      rod([xx * 0.24, 0.08, zz * 0.24], [-xx * 0.17, 0.38, zz * 0.14], 0.005, charcoal, g);
    }
    const sideways = Math.abs(Math.sin(yaw)) > 0.5;
    proxy(`sample-chair-${colliders.length}`, [x, 0.45, z], sideways ? [0.62, 0.9, 0.56] : [0.56, 0.9, 0.62]);
  }
  function monitor(x, z, yaw, parent) {
    const m = group('Desktop_monitor', parent); m.position.set(x, 0.795, z); m.rotation.y = yaw;
    box([0.31, 0.022, 0.22], [0, 0.012, 0], silver, m);
    box([0.06, 0.18, 0.055], [0, 0.10, 0.04], silver, m);
    box([0.60, 0.38, 0.042], [0, 0.32, 0.04], silver, m);
    box([0.56, 0.33, 0.005], [0, 0.335, -0.184 + 0.2], screen, m);
    box([0.4, 0.018, 0.13], [0, 0.01, -0.27], silver, m, 'Keyboard');
    for (let r = 0; r < 4; r++) box([0.35, 0.004, 0.012], [0, 0.023, -0.32 + r * 0.028], charcoal, m);
  }
  function desk(x, z, width, chairs, monitors = true) {
    const d = group(`Shared_ash_workbench_${x}_${z}`); d.position.set(x, 0, z);
    for (const dz of [-0.4, 0.4]) box([width, 0.055, 0.78], [0, 0.7675, dz], wood, d, 'Timber desktop');
    for (const dx of [-width / 2 + 0.12, width / 2 - 0.12]) {
      for (const dz of [-0.64, 0.64]) box([0.055, 0.74, 0.055], [dx, 0.37, dz], charcoal, d);
      box([0.055, 0.055, 1.33], [dx, 0.035, 0], charcoal, d);
      box([0.055, 0.055, 1.4], [dx, 0.72, 0], charcoal, d);
    }
    box([width - 0.18, 0.07, 0.065], [0, 0.70, 0], charcoal, d, 'Cable beam');
    proxy(`sample-desk-${x}-${z}`, [x, 0.4, z], [width, 0.8, 1.6]);
    for (let i = 0; i < chairs; i++) {
      const dx = (i - (chairs - 1) / 2) * (width / chairs);
      for (const side of [-1, 1]) chair(x + dx, z + side * 1.18, side === 1 ? 0 : Math.PI, root);
      if (monitors && i !== 1) monitor(dx, i % 2 ? -0.15 : 0.15, i % 2 ? Math.PI : 0, d);
      if (i % 2 === 0) {
        box([0.25, 0.018, 0.33], [dx + 0.38, 0.805, 0.41], paper, d, 'Closed notebook');
        cylinder(0.041, 0.038, 0.075, [dx - 0.30, 0.83, -0.4], ceramic, d, 14);
      }
    }
    plant(0, 0.798, 0, 0.48, d);
  }
  desk(0.5, -3.1, 4.8, 3);
  desk(0.5, 0.6, 4.8, 3);
  desk(-1.3, 4.4, 4.0, 2, false);
  // Slim window-side worktop with two seats.
  const windowDesk = group('Window_worktop');
  box([1.15, 0.05, 2.8], [-4.65, 0.77, 0.2], wood, windowDesk);
  for (const z of [-1, 1.4]) for (const x of [-5.12, -4.17]) box([0.045, 0.75, 0.045], [x, 0.375, z], charcoal, windowDesk);
  proxy('sample-window-desk', [-4.65, 0.4, 0.2], [1.15, 0.8, 2.8]);
  chair(-3.75, -0.5, -Math.PI / 2, root); chair(-3.75, 0.85, -Math.PI / 2, root);

  const shelving = group('Rear_wall_open_shelving');
  box([7.9, 1.65, 0.28], [1.5, 0.825, -7.12], walnut, shelving, 'Timber lower wall');
  for (const y of [1.65, 2.35, 3.02]) box([7.9, 0.045, 0.35], [1.5, y, -7.05], walnut, shelving);
  for (let i = 0; i < 9; i++) box([0.038, 1.36, 0.34], [-2.45 + i * 0.985, 2.34, -7.05], charcoal, shelving);
  for (let i = 0; i < 7; i++) {
    if (i % 3 === 0) { plant(-2 + i, 1.68, -7.01, 0.6, shelving); continue; }
    for (let b = 0; b < 6; b++) {
      const m = [paper, charcoal, beige, teal][(i + b) % 4];
      box([0.065, 0.25 + random() * 0.13, 0.21], [-2 + i + b * 0.078, 1.84, -7], m, shelving, 'Unmarked book');
    }
  }
  for (const x of [-0.5, 2.1, 4.2]) {
    box([0.3, 0.4, 0.035], [x, 2.575, -7.0], charcoal, shelving, 'Frame');
    box([0.25, 0.35, 0.008], [x, 2.575, -6.977], paper, shelving);
  }
  proxy('sample-shelving', [1.5, 1.5, -7.05], [7.9, 3, 0.4]);
  const lounge = group('Rear_corner_lounge');
  for (let i = 0; i < 3; i++) {
    const x = 2.5 + i * 0.72, mat = i === 2 ? ochre : teal;
    box([0.7, 0.30, 0.76], [x, 0.37, -5.94], mat, lounge);
    const back = box([0.7, 0.5, 0.18], [x, 0.68, -6.3], mat, lounge); back.rotation.x = -0.08;
    for (const xx of [-0.26, 0.26]) for (const zz of [-0.25, 0.25]) cylinder(0.015, 0.015, 0.2, [x + xx, 0.1, -5.94 + zz], charcoal, lounge, 8);
  }
  proxy('sample-sofa', [3.22, 0.45, -6.05], [2.2, 0.9, 1]);
  plant(5.1, 0, -5.7, 2.5); proxy('sample-large-planter', [5.1, 0.7, -5.7], [0.8, 1.4, 0.8]);
  plant(-5.1, 0, -5.8, 2);
  proxy('sample-window-planter', [-5.1, 0.5, -5.8], [0.6, 1, 0.6]);

  const lights = group('Suspended_linear_luminaires');
  for (const z of [-3.1, 0.6, 4.4]) {
    const x = z === 4.4 ? -1.3 : 0.5, width = z === 4.4 ? 4.2 : 5.0;
    box([width, 0.075, 0.3], [x, 2.83, z], charcoal, lights);
    box([width - 0.1, 0.018, 0.24], [x, 2.786, z], diffuser, lights);
    box([width, 0.035, 0.06], [x, 2.83, z + 0.18], walnut, lights);
    for (const dx of [-width / 2 + 0.24, width / 2 - 0.24]) {
      rod([x + dx, 2.87, z], [x + dx, 3.64, z], 0.006, charcoal, lights);
      cylinder(0.04, 0.04, 0.03, [x + dx, 3.63, z], charcoal, lights, 10);
    }
  }
  for (const z of [-5.3, -1.5, 2.3, 6.1]) {
    box([0.7, 0.07, 0.27], [2.2, 3.59, z], charcoal, lights);
    box([0.65, 0.012, 0.22], [2.2, 3.548, z], diffuser, lights);
  }

  const outside = group('Optional_stylized_exterior_greenery');
  const outdoorLeaf = [material('Exterior green 1', '#7b8c64'), material('Exterior green 2', '#a4ae88'), material('Exterior green 3', '#617953')];
  box([6, 0.1, 20], [-9.1, -0.2, 0], outdoorLeaf[1], outside);
  for (let i = 0; i < 16; i++) {
    const x = -8.2 - random() * 2, z = -8 + i * 1.1;
    cylinder(0.06, 0.11, 2.8, [x, 1.2, z], branches, outside, 7);
    for (let c = 0; c < 4; c++) {
      const crown = mesh(new T.IcosahedronGeometry(0.7 + random() * 0.35, 1), outdoorLeaf[c % 3], [x + (random() - 0.5), 1.7 + random() * 1.4, z + (random() - 0.5)], outside);
      crown.scale.set(1, 0.9, 1.1);
    }
  }
  // Merge repeated meshes within each named group by material to reduce draw calls.
  root.updateMatrixWorld(true);
  function mergeGroup(parent) {
    for (const child of [...parent.children]) if (child.isGroup) mergeGroup(child);
    const batches = new Map();
    for (const child of parent.children) {
      if (!child.isMesh || child.material.transparent) continue;
      const key = child.material.uuid;
      if (!batches.has(key)) batches.set(key, []); batches.get(key).push(child);
    }
    for (const meshes of batches.values()) {
      if (meshes.length < 2) continue;
      const geometries = meshes.map(m => { const g = m.geometry.clone(); g.applyMatrix4(m.matrix); return g.index ? g.toNonIndexed() : g; });
      // Different primitive types may have different attributes; standardize to position/normal/uv.
      for (const g of geometries) {
        for (const key of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(key)) g.deleteAttribute(key);
        if (!g.attributes.uv) g.setAttribute('uv', new T.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
      }
      const merged = mergeGeometries(geometries);
      if (merged) { const m = mesh(merged, meshes[0].material, [0, 0, 0], parent, meshes[0].material.name); for (const old of meshes) { parent.remove(old); old.geometry.dispose(); } m.castShadow = true; }
      geometries.forEach(g => g.dispose());
    }
  }
  mergeGroup(root);
  root.userData.collisionProxyCount = colliders.length;
  return { root, colliders };
}
