import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import entrance from '../docs/house/entrance-calibration.json';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color('#d5d9dd');
const camera = new THREE.PerspectiveCamera(45, 1, 0.02, 500);
const controls = new OrbitControls(camera, renderer.domElement);
const status = document.querySelector('#status');
let model, bounds;
function view(top = false) {
  if (!bounds) return;
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  const distance = Math.max(size.x / camera.aspect, size.z, size.y) / (2 * Math.tan(Math.PI / 8)) * 1.25;
  camera.up.set(0, 1, 0);
  camera.position.copy(center).add(top ? new THREE.Vector3(0, distance, 0.001) : new THREE.Vector3(distance * 0.65, distance * 0.8, distance * 0.65));
  controls.target.copy(center);
  controls.update();
}
async function load(data) {
  status.textContent = 'Loading scan…';
  document.querySelector('#entrance').disabled = true;
  document.querySelector('#calibration').textContent = '';
  try {
    const gltf = await new GLTFLoader().parseAsync(data, '');
    if (model) {
      scene.remove(model);
      model.traverse(o => { if (o.isMesh) { o.geometry.dispose(); for (const m of [].concat(o.material)) { m.map?.dispose(); m.dispose(); } } });
    }
    model = gltf.scene;
    model.traverse(o => {
      if (!o.isMesh) return;
      // The source is untouched. Unlit materials show the captured colors even
      // when an exporter omits metallicFactor (glTF defaults to metal).
      const convert = m => {
        const preview = new THREE.MeshBasicMaterial({ map: m.map, color: m.color, side: THREE.DoubleSide });
        m.dispose();
        return preview;
      };
      o.material = Array.isArray(o.material) ? o.material.map(convert) : convert(o.material);
    });
    scene.add(model);
    bounds = new THREE.Box3().setFromObject(model);
    view();
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', data)), b => b.toString(16).padStart(2, '0')).join('');
    if (hash === entrance.sourceSha256) {
      document.querySelector('#entrance').disabled = false;
      document.querySelector('#calibration').textContent = 'Main entrance: narrow doorway in the white wall. Your 1 m reference measures approximately 0.90 raw units (provisional scale ×1.108). Geometry is displayed unchanged. Doorway artifacts and an approximately 20 cm threshold rise need review before walking.';
    }
    status.textContent = 'Scan loaded · original textures · unverified model units';
  } catch (error) { status.textContent = `Could not load scan: ${error.message}`; throw error; }
}
document.querySelector('#file').addEventListener('change', async event => {
  const file = event.target.files[0];
  if (file) await load(await file.arrayBuffer());
});
document.querySelector('#top').onclick = () => view(true);
document.querySelector('#angle').onclick = () => view(false);
document.querySelector('#entrance').onclick = () => {
  camera.position.fromArray(entrance.inspectionCameraRaw);
  controls.target.fromArray(entrance.inspectionTargetRaw);
  controls.update();
};
function resize() { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); }
addEventListener('resize', resize); resize();
renderer.setAnimationLoop(() => renderer.render(scene, camera));

// Local authoring diagnostics; this tools page is not a production entry point.
if (import.meta.env.DEV) window.__scan = {
  slice(level) {
    renderer.localClippingEnabled = true;
    model.traverse(o => { if (o.isMesh) for (const m of [].concat(o.material)) { m.clippingPlanes = [new THREE.Plane(new THREE.Vector3(0, -1, 0), level)]; m.needsUpdate = true; } });
  },
  view(position, target) {
    camera.position.fromArray(position); controls.target.fromArray(target); controls.update();
    renderer.render(scene, camera);
  },
  pick(x, y) {
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(x / innerWidth * 2 - 1, 1 - y / innerHeight * 2), camera);
    return ray.intersectObject(model, true).slice(0, 5).map(hit => ({ point: hit.point.toArray(), normal: hit.face.normal.toArray(), distance: hit.distance }));
  },
  ray(origin, direction) {
    return new THREE.Raycaster(new THREE.Vector3(...origin), new THREE.Vector3(...direction).normalize()).intersectObject(model, true).slice(0, 12).map(hit => ({ point: hit.point.toArray(), normal: hit.face.normal.toArray(), distance: hit.distance }));
  },
};
