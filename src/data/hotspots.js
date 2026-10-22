export const houseHotspots = [
  {
    id: 'house-living-room',
    title: 'Main Living Space',
    subtitle: 'Dramatic & Functional Living Area',
    category: 'Living Room',
    icon: 'home',
    color: '#16a34a', // Emerald green badge like in Image 2
    image: '/images/hotspots/living_room.jpg',
    position: [1.8, 1.25, 0.5],
    stemHeight: 0.28,
    maxInteractDistance: 3.5,
    teleport: { position: [1.5, 0.85, 0.5], yaw: -Math.PI / 2 },
    description: 'The spacious main living area of the house, featuring high ceilings, craftsman wood trim, natural lighting, and open interior space. Walk freely using WASD and mouse look.'
  },
  {
    id: 'house-entryway',
    title: 'Central Hallway & Foyer',
    subtitle: 'Craftsman Architectural Passage',
    category: 'Architecture',
    icon: 'tree',
    color: '#16a34a', // Green tree tag like on the table in Image 2
    image: '/images/hotspots/hallway.jpg',
    position: [0.2, 1.25, 0.5],
    stemHeight: 0.28,
    maxInteractDistance: 3.5,
    teleport: { position: [0.35, 0.85, 0.5], yaw: 0 },
    description: 'Central connection hallway connecting the main living area, private quarters, and entry passage with rich timber wainscoting and warm ambient lighting.'
  },
  {
    id: 'house-kitchen',
    title: 'Kitchen & Dining Space',
    subtitle: 'Culinary & Dining Zone',
    category: 'Dining & Kitchen',
    icon: 'kitchen',
    color: '#0284c7',
    image: '/images/hotspots/kitchen.jpg',
    position: [1.5, 1.25, -1.8],
    stemHeight: 0.28,
    maxInteractDistance: 3.5,
    teleport: { position: [1.2, 0.85, -1.2], yaw: Math.PI },
    description: 'The dining and culinary zone adjoining the main hall, featuring custom wooden cabinetry, butcher-block dining table, and natural window sunlight.'
  },
  {
    id: 'house-stairs',
    title: 'Craftsman Staircase',
    subtitle: 'Switchback Multi-Level Access',
    category: 'Stairwell',
    icon: 'stairs',
    color: '#8b5cf6',
    image: '/images/hotspots/stairs.jpg',
    position: [-0.45, 0.95, 3.2],
    stemHeight: 0.28,
    maxInteractDistance: 3.5,
    teleport: { position: [0.2, 0.85, 2.0], yaw: 0 },
    description: 'Central wooden stairwell providing switchback passage between all floors: climb the ascending flight to the upper floor, or descend the lower flight to the basement.'
  },
  {
    id: 'house-upper-floor',
    title: 'Upper Floor Landing',
    subtitle: 'Private Living Quarters',
    category: 'Upper Level',
    icon: 'home',
    color: '#0284c7',
    image: '/images/hotspots/stairs.jpg',
    position: [-0.45, 3.8, 4.1],
    stemHeight: 0.28,
    maxInteractDistance: 3.5,
    teleport: { position: [-0.05, 3.80, 4.5], yaw: Math.PI },
    description: 'Top landing of the staircase opening onto the second floor living quarters, bedrooms, and elevated viewpoints.'
  },
  {
    id: 'house-lower-floor',
    title: 'Lower Level / Basement',
    subtitle: 'Storage & Work Space',
    category: 'Basement',
    icon: 'info',
    color: '#64748b',
    image: '/images/hotspots/hallway.jpg',
    position: [-0.45, -1.65, 3.2],
    stemHeight: 0.28,
    maxInteractDistance: 3.5,
    teleport: { position: [0.2, -1.65, 2.0], yaw: Math.PI },
    description: 'Bottom landing of the staircase opening onto the basement rooms, laundry space, and storage area.'
  }
];
