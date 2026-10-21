import scan from '../../docs/house/house-colliders.json';
import { houseHotspots } from '../data/hotspots.js';

export const HOUSE = {
  title: 'Virtual Tour — House Walkthrough',
  sceneMode: 'house',
  unit: 'meters',
  modelUrl: '/models/My whole frickin house.glb',
  inspectionOnly: false,
  transform: { scale: 1, origin: [0, scan.floorY, 0] },
  doorwayCleanup: null,
  player: {
    spawn: [1.5, 0.85, 0.5],
    initialYaw: 0,
    eyeOffsetY: 0.75,
    radius: 0.22,
    capsuleHalfHeight: 0.58,
    speed: 2.4,
    grounded: true,
    stepHeight: 0.28
  },
  colliders: scan.colliders,
  hotspots: houseHotspots,
  rooms: [],
  floorplan: null,
};
