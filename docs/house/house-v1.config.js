import calibration from './entrance-calibration.json';
const scale = calibration.metersPerRawUnit;
const origin = [4.8801263742656875, calibration.insideFloorYRaw, 3.859677455561786];
export const housePoint = p => p.map((v, i) => (v - origin[i]) * scale);
const box = (id, min, max) => ({ id, type: 'box', center: housePoint(min.map((v, i) => (v + max[i]) / 2)), halfExtents: min.map((v, i) => (max[i] - v) * scale / 2) });
// Bounded entrance-room DEMO. Wall positions were probed against this scan;
// furniture proxies are conservative and adjacent rooms are out of scope.
export const HOUSE = {
  title: 'House scan demo', sceneMode: 'house', unit: 'meters', modelUrl: '/models/house.glb',
  transform: { scale, origin },
  doorwayCleanup: { min: [4.44, -1.43, 2.4], max: [5.32, 0.50, 4.3] },
  player: { spawn: [0, 0.85 - calibration.estimatedFloorRiseMeters, 1.05], initialYaw: 0, eyeOffsetY: 0.75, radius: 0.3, capsuleHalfHeight: 0.5, speed: 2.2, grounded: true, stepHeight: 0.25 },
  colliders: [
    box('house-floor', [4.27, -1.66, -3.6], [8.58, -1.4538223037701248, 3.86]),
    box('house-outside-floor', [4.1, -1.85, 3.86], [8.58, -1.633416548123866, 5.5]),
    box('house-west-wall', [4.22, -1.45, -3.6], [4.37, 1.6, 3.65]),
    box('house-east-wall', [8.5, -1.45, -3.6], [8.65, 1.6, 5.5]),
    box('house-back-wall', [4.22, -1.45, -3.7], [8.65, 1.6, -3.55]),
    box('house-door-left', [4.1, -1.63, 3.65], [4.429, 1.6, 3.99]),
    box('house-door-right', [5.331, -1.63, 3.65], [8.65, 1.6, 3.99]),
    box('house-door-lintel', [4.429, 0.5, 3.65], [5.331, 1.6, 3.99]),
    box('house-demo-outside-limit', [4.1, -1.85, 5.5], [8.65, 1.6, 5.65]),
    box('house-demo-west-limit', [4.0, -1.85, 3.99], [4.15, 1.6, 5.65]),
    box('house-left-counter', [4.37, -1.45, -3.5], [5.25, -0.35, -0.7]),
    box('house-fridge-freezer', [7.0, -1.45, -3.55], [8.5, 0.75, -2.5]),
    box('house-table-chairs', [6.7, -1.45, -1.7], [8.5, -0.15, 3.5]),
  ],
  hotspots: [
    { id: 'house-entrance', title: 'Main entrance', position: housePoint([4.88, 0.0, 3.3]), maxInteractDistance: 2.5, description: 'The narrow doorway in the white wall is your confirmed main entrance. Its supplied width is 1 meter. This demo clears scan artifacts from the opening and supports the approximately 20 cm threshold step.' },
    { id: 'house-room', title: 'Entrance room', position: housePoint([5.9, 0.0, -1.3]), maxInteractDistance: 2.5, description: 'This is the room captured behind the main entrance. The demo uses simplified wall and furniture collisions. Adjacent rooms and the wider exterior are outside this demo’s walking area.' },
  ], rooms: [], floorplan: null,
};
