// Synthetic fixture is served only by Playwright; never written to public/models.
export function glbFixture() {
  const vertices = new Float32Array([-1,0,-2, 1,0,-2, 0,3,2]);
  const json = { asset: { version: '2.0' }, scene: 0, scenes: [{ nodes: [0] }], nodes: [{ mesh: 0 }], meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }], buffers: [{ byteLength: vertices.byteLength }], bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: vertices.byteLength }], accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: 'VEC3', min: [-1,0,-2], max: [1,3,2] }] };
  let encoded = JSON.stringify(json); encoded += ' '.repeat((4 - encoded.length % 4) % 4);
  const jsonBytes = Buffer.from(encoded), binary = Buffer.from(vertices.buffer);
  const out = Buffer.alloc(12 + 8 + jsonBytes.length + 8 + binary.length);
  out.writeUInt32LE(0x46546c67, 0); out.writeUInt32LE(2, 4); out.writeUInt32LE(out.length, 8);
  out.writeUInt32LE(jsonBytes.length, 12); out.writeUInt32LE(0x4e4f534a, 16); jsonBytes.copy(out, 20);
  const offset = 20 + jsonBytes.length; out.writeUInt32LE(binary.length, offset); out.writeUInt32LE(0x004e4942, offset + 4); binary.copy(out, offset + 8);
  return out;
}
