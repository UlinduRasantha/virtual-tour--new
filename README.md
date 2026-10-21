# House Virtual Tour — 3D Interactive Walkthrough

An interactive, first-person 3D Virtual Tour web application built with **React 19**, **Three.js** (`@react-three/fiber`, `@react-three/drei`), and **Rapier Physics** (`@react-three/rapier`).

The tour loads the high-fidelity 3D house scan: **`public/models/My whole frickin house.glb`**.

---

## What This Project Is

This application is an architectural 3D walkthrough experience that allows users to step inside and freely explore scanned interior environments with realistic first-person physics, collision detection, and mobile touch support.

### Key Capabilities:
- **First-Person Walking & Mouse Look**: WASD / Arrow keys for natural kinematic movement and smooth pointer-lock mouse look.
- **Full Multi-Floor Staircase Navigation**: Physical steps and open stair corridors allowing seamless walking between the Main Living Floor, Upper Floor, and Lower Level/Basement.
- **Physics & Collision Detection**: Rapier 3D character controller with capsule collider, ground snapping (`0.5m`), autostep (`0.28m`), and bounding box colliders preventing walking through scanned walls.
- **Mobile & Tablet Touch Controls**: Dual-stick touch overlay (left joystick for motion, right touch surface for looking around).
- **Interactive Points of Interest (Hotspots)**: 3D interactive markers highlighting key spaces (Living Space, Central Hallway, Kitchen & Dining, Staircase Access, Upper Landing, Lower Level).
- **Responsive HUD**: Pause, Resume, Reset to entrance, Help overlay, and Reduced Graphics toggle for lower-end devices.

---

## Project Structure

```text
├── public/
│   ├── models/
│   │   ├── My whole frickin house.glb   # Main 3D virtual tour asset (42.8 MB)
│   │   └── README.md
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── App.jsx                      # Main UI state machine (Loading, Welcome, Exploring, Paused, Help, Locations)
│   │   └── App.css                      # Modern dark-mode styling, glassmorphism HUD, responsive layouts
│   ├── components/
│   │   ├── scene/
│   │   │   ├── TourCanvas.jsx           # Canvas setup, lighting, Rapier physics world, camera controls
│   │   │   ├── HouseModel.jsx           # Optimized GLTF loader with unlit textured materials & bounding calculation
│   │   │   ├── PlayerController.jsx     # Rapier kinematic character controller with WASD/mouse/touch integration
│   │   │   ├── OfficeColliders.jsx      # Physics colliders protecting scanned walls and boundary areas
│   │   │   └── Hotspots.jsx             # 3D interactive location markers with proximity detection
│   │   └── ui/
│   │       ├── Dialog.jsx               # Accessible modal overlay (Welcome, Help, Locations, Info)
│   │       ├── TouchControls.jsx        # Dual-pad virtual joystick for mobile/touch devices
│   │       └── ErrorBoundary.jsx        # Graceful WebGL / asset failure recovery
│   ├── config/
│   │   └── house.config.js              # Active tour config: model path, spawn coordinates, speed, colliders
│   ├── data/
│   │   └── hotspots.js                  # Points of interest and descriptions
│   ├── hooks/
│   │   └── useMovementInput.js          # Input management for keyboard and touch
│   ├── utils/
│   │   ├── geometryUtils.js             # Vector math, movement heading rotation, bounds checks
│   │   ├── inspectAsset.js              # GLB header validation and size inspection
│   │   ├── tourState.js                 # State transitions reducer
│   │   └── validateOfficeConfig.js      # Spatial and asset configuration validator
│   ├── tests/                           # Vitest unit & physics integration test suite
│   ├── main.jsx                         # React entry point
│   └── index.html                       # HTML shell and metadata
├── tools/
│   └── build-house-colliders.mjs        # Multi-floor occupancy-grid & stair collider generator
└── vite.config.js                       # Vite bundler configuration
```

---

## Active Model & Staircase Calibration

- **Model**: `public/models/My whole frickin house.glb` (42,806,372 bytes, 12 meshes, unlit photorealistic textures).
- **Spawn Position**: `[1.5, 0.85, 0.5]` (Center of the spacious main living area with >1.25m clearance from all obstacles).
- **Floor Heights**:
  - **Main Floor**: Normalized at $Y = 0.0$ (eye height $1.60\,\text{m}$).
  - **Upper Floor**: $Y = +2.40\,\text{m}$ (eye height $4.00\,\text{m}$).
  - **Lower Level / Basement**: $Y = -2.47\,\text{m}$ (eye height $-0.87\,\text{m}$).
- **Staircase Circulation**:
  - Located off the Central Hallway at $Z \approx 2.0\,\text{m}$.
  - **Left Flight** ($X \in [-0.80, -0.10]$): 14 physical steps climbing up to the Upper Floor.
  - **Right Flight** ($X \in [0.00, 0.70]$): 14 physical steps descending to the Lower Level / Basement.
  - Supported by Rapier `autostep(0.28m)` and ground snapping (`0.5m`) for fluid, natural ascending and descending without snagging.
- **Collision Proxies**: 565 collision proxies generated from scan geometry (`docs/house/house-colliders.json`).

---

## Getting Started

### Prerequisites
- Node.js 22.x
- npm

### Development
```bash
npm run dev
```
Open `http://127.0.0.1:5173` in your browser.

### Controls
| Input | Action |
| --- | --- |
| **W / A / S / D** or **Arrow Keys** | Walk forward / left / backward / right |
| **Mouse Move** | Look around (Pointer Lock) |
| **Escape** | Pause tour / release mouse capture |
| **H** or **?** | Open Help dialog |
| **L** | Open Locations list |
| **Reset button (↺)** | Return to main living area spawn point |
| **Touchscreen** | Left pad moves, right pad looks, tap Inspect to open hotspot |

### Commands
- `npm test`: Run all unit and physics integration tests (Vitest).
- `npm run build`: Build the production static distribution bundle in `dist/`.
- `npm run preview`: Preview the production build locally.
- `npm run lint`: Run ESLint code quality checks.
