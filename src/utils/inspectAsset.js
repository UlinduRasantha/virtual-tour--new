export async function inspectAsset(url, signal) {
  const response = await fetch(url, { signal, cache: 'no-cache' });
  if (!response.ok) throw new Error(`GLB unavailable (HTTP ${response.status}). Put the approved export at public${url}.`);
  const data = await response.arrayBuffer();
  const view = new DataView(data);
  if (data.byteLength < 20 || view.getUint32(0, true) !== 0x46546c67 || view.getUint32(4, true) !== 2 || view.getUint32(8, true) !== data.byteLength) throw new Error('Not a valid GLB 2.0 file. The server may have returned an HTML page for a missing asset. Export glTF Binary from Blender.');
  return { bytes: data.byteLength, megabytes: (data.byteLength / 1024 / 1024).toFixed(2) };
}
