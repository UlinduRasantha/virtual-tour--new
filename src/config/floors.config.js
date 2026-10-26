export const FLOORS = [
  {
    id: 'upper',
    number: '2',
    name: 'Upper Floor',
    shortLabel: '2F',
    badge: 'Level 2 · Upper Level',
    spawn: [-0.05, 3.80, 4.5],
    yaw: Math.PI,
    yMin: 2.2,
    yMax: 6.0,
    targetY: 3.5,
    clipHeight: 5.2,
    description: 'Second floor bedrooms, landing & private quarters'
  },
  {
    id: 'main',
    number: '1',
    name: 'Main Floor',
    shortLabel: '1F',
    badge: 'Level 1 · Ground Floor',
    spawn: [1.5, 0.85, 0.5],
    yaw: -Math.PI / 2,
    yMin: -0.5,
    yMax: 2.2,
    targetY: 0.85,
    clipHeight: 2.35,
    description: 'Spacious living room, dining space, kitchen & hallway'
  },
  {
    id: 'basement',
    number: 'B',
    name: 'Basement',
    shortLabel: 'B',
    badge: 'Level 0 · Lower Level',
    spawn: [0.2, -1.65, 2.0],
    yaw: Math.PI,
    yMin: -4.0,
    yMax: -0.5,
    targetY: -1.65,
    clipHeight: -0.2,
    description: 'Lower level workshop, storage & laundry area'
  }
];

export const ALL_FLOORS = {
  id: 'all',
  number: 'All',
  name: 'All Floors',
  shortLabel: 'All',
  badge: 'Entire Structure',
  targetY: 1.0,
  clipHeight: null,
  description: 'Full house 3D structure across all floors'
};

export function getFloorByElevation(y) {
  if (typeof y !== 'number' || Number.isNaN(y)) return FLOORS[1]; // default main floor
  if (y > 2.2) return FLOORS[0]; // upper floor
  if (y < -0.5) return FLOORS[2]; // basement
  return FLOORS[1]; // main floor
}

export function getFloorById(id) {
  if (id === 'all') return ALL_FLOORS;
  return FLOORS.find(f => f.id === id) || FLOORS[1];
}
