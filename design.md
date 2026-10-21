# REAL OFFICE — LiDAR-to-Web 3D Virtual Tour

> **Codex implementation specification**  
> **Status:** Ready for staged implementation; awaiting the user's real scan assets  
> **Project:** Faithful browser-based virtual tour of an **existing physical office**  
> **Primary experience:** Desktop free movement using **W/A/S/D + mouse look**  
> **Source-of-truth assets:** iPhone/iPad LiDAR scans captured in **Polycam or Scaniverse**, cleaned and exported from **Blender**  
> **Frontend:** React + Vite (JavaScript/JSX), Three.js, React Three Fiber, Drei, React Three Rapier  
> **Default scope:** A single-floor reception-room proof of concept, extensible to a multi-room office

---

## 0. Codex: read this first

Build an interactive walkthrough of the **user's real office**, not a fictional office or a redesigned concept. This file is both the product specification and the implementation plan.

**Non-negotiable rules**

1. **Inspect the existing repository and assets first.** If a Vite/React codebase already exists, adapt it instead of destroying it. If empty, scaffold a new project.
2. **Real-world fidelity is the primary requirement.** Preserve actual walls, room connections, furniture placement, existing brand elements, and materials where represented by the scanned asset. Do not invent offices, change layouts, or place fake furniture in *real-office mode*.
3. **Do not pretend assets exist.** The actual office scan has not yet been provided. Build a **clearly labeled development/demo mode** so the app runs before a scan is available; do not call the demo the real office. Add a real-asset import path and validation UI.
4. **Never guess real coordinates.** Player spawn, colliders, rooms, floorplan mapping, and hotspots must be defined in a readable configuration and verified against the imported real model. Use placeholders marked `TODO: MEASURE/VERIFY` until the real assets are available.
5. **Keep raw scans private.** `source-scans/`, confidential photographs, editable Blender source, and original scan exports should not be automatically deployed to `public/`. Use approved/sanitized, optimized files only.
6. Develop in phases, with a working build at the end of each phase. Do not skip functional navigation/collisions to add cinematic features.
7. All geometry uses **meters**. Blender is Z-up during authoring; Three.js/Rapier are **Y-up** after glTF export. Do not apply ad hoc rotations or scales in random components.
8. Pointer-lock controls are desktop-oriented. Implement a usable mobile fallback rather than relying on pointer lock on touchscreens.
9. Keep movement/camera updates out of React state each frame; use physics hooks, refs, and scene configuration. Use real React state for menus and selected hotspots.
10. Run lint, tests, and production build when available, and fix errors. Report genuinely untested features and missing assets.

**Definition of done for Phase 1:** `npm install && npm run dev` opens a clearly marked **Demo Office** with a functional first-person controller, a basic collision environment, welcome/enter/escape-resume UI, reset, and instructions. `npm run build` works. The application is prepared to accept the first real reception GLB without architectural refactoring.

**Definition of done for a real-office MVP:** User-provided `real-office.glb` (or room-specific GLBs) loads correctly; scale/orientation is checked; the player starts at a safe location; WASD + mouse-look work; the player cannot penetrate the real floor, walls, closed doors, or large furniture; doorways remain traversable; valid office hotspots work; the interface truthfully describes the actual rooms; the 3D assets are optimized and permission-cleared.

---

## 1. Product vision and guiding principles

Create a digital twin-style, **visually faithful first-person tour** that lets remote visitors explore the user's actual office from a browser.

### Audiences

- Prospective clients, partners, and visitors who want to see the real workspace.
- Team members showing specific office areas during a presentation.
- Desktop visitors seeking free movement.
- Mobile visitors who need touch-friendly navigation or guided navigation.

### Product goals

- Capture the real office's rooms, floors, walls, meeting areas, desks, reception, and other approved features.
- Make navigation intuitive even for someone who has never used a 3D website.
- Show accurate labels and information on real rooms/approved objects.
- Load as quickly as practical on normal consumer laptops.
- Support adding more rooms without rewriting the entire app.

### Explicit non-goals for the MVP

- No VR headset mode, multiplayer, voice chat, backend CMS, user accounts, payments, or AI-generated office reconstruction.
- No automatic promise of millimeter-accurate geometry: consumer LiDAR scans require measurement and cleanup.
- No fabricated room map from vague descriptions.
- No public display of private desks/screens/documents or restricted rooms.
- No physically accurate staircase movement in the single-floor MVP. Add step/gravity support as a separate milestone if necessary.

---

## 2. Inputs and acceptance dependencies

**Known:** User has access to an iPhone or iPad with LiDAR, wants Polycam/Scaniverse capture, Blender cleanup, and a React website navigated with WASD + mouse.

**Still to be supplied / confirmed when available:**

| Input | Required for | Expected format | Handling |
|---|---|---|---|
| First scanned reception room | Real-room MVP | `.glb`, `.gltf` with dependencies, or `.obj` + textures | Import/inspect; preserve original privately |
| Additional rooms and corridors | Whole-office mode | One or more meshes/GLBs | Align using actual measurements and overlap |
| Reference floor plan | Minimap and room alignment | PNG, SVG, PDF, or dimensioned drawing | Optional until user provides it |
| At least one verified wall measurement | Scale validation | Meters, e.g. known wall length | Compare with Blender bounding dimensions |
| Approved visitor entrance and heading | Camera/player spawn | World-space position and yaw | Store in `office.config.js` |
| Restricted areas / privacy approvals | Publishing | User-provided restrictions | Filter before public build |
| Company name, logo, colors | Branded UI | SVG/PNG, colors | Default to neutral placeholders until given |
| Real room labels/descriptions | Hotspots and navigation | JSON/JS config | Don't invent or assume |

### Asset rule

- A mesh is needed for the initial browser walkthrough. Gaussian splats can be added as a later visual layer, but do not make splat rendering the only required approach for this MVP; collisions and mesh cleanup are easier with triangle meshes.
- Raw Polycam/Scaniverse captures, camera images, and original processing results stay in an **ignored** `source-scans/` directory outside the public distribution.
- Publish only an **approved optimized export** (`public/models/real-office.glb`) or authenticated protected asset delivery if the tour is private.

---

## 3. Capture workflow — Polycam and Scaniverse

This capture guide belongs in `docs/CAPTURE_GUIDE.md` as part of the repo. It describes work the user performs physically; **Codex cannot scan the office itself**.

### 3.1 Before capture

1. Obtain permission from building management and any people whose areas will be shown.
2. Remove or blur private documents, employee information, identifiable visitors, sensitive computer screens, access-control details, and security-sensitive areas.
3. Tidy the room; keep furniture and doors stationary while scanning.
4. Turn on even lighting and avoid very strong glare, glass reflections, or rapidly moving shadows.
5. Charge device; keep adequate free storage; disable notifications where possible.
6. Sketch reception, corridors, and rooms. Measure at least one known wall and door width with a tape/laser device.
7. Begin with **one reception room**. Expand to the rest only when the prototype works.

### 3.2 Polycam path (preferred simple first scan)

1. Open Polycam on a compatible LiDAR-equipped iPhone/iPad.
2. Start a new **Space** capture; enable floorplan output if supported and useful.
3. Start near one wall/corner and move slowly around the perimeter.
4. Point the device at floor, corners, walls, ceiling boundaries, furniture, and door openings. Ensure overlapping views.
5. Make an additional pass around furniture; capture the entire doorway and a little of the adjoining area for later alignment.
6. Review coverage, recover missing patches, then finish and process the scan.
7. Crop irrelevant exterior fragments and review floor/door geometry.
8. Export a mesh: **GLB if the plan offers it; otherwise glTF or OBJ with all required textures**. Availability and pricing change; check the app's current export menu.
9. Record the real measurements, scan date, device, app version, covered areas, and privacy approval in `source-scans/scan-manifest.md`.
10. Move the export to `source-scans/reception-original.*`, not directly to the deployable `public/` directory.

Polycam official documentation:
- https://learn.poly.cam/hc/en-us/articles/36655587097620-How-to-Use-Space-Mode-LiDAR-Devices
- https://learn.poly.cam/hc/en-us/articles/27756102599572-What-File-Types-Can-Polycam-Export
- https://learn.poly.cam/hc/en-us/articles/42497420365716-How-to-Optimize-Your-Captures-in-Blender

### 3.3 Scaniverse alternate path

1. Open Scaniverse and select or create a Site for the office.
2. Capture the reception as a mobile scan, using slow movement and views that overlap.
3. For adjacent rooms/corridors, take additional scans with good overlap at thresholds and doors.
4. Review, upload, and confirm scans pass the app's quality checks.
5. Use **Generate Assets** and select **Mesh** (not only Splat).
6. Download the available offline-authoring mesh, ideally **GLB**, from Scaniverse's asset details/web experience.
7. Store raw and generated exports privately and note which version will be cleaned in Blender.
8. Expect some features/credits to vary by account and workflow. Do not hard-code current pricing or assume every user has every export option.

Scaniverse official documentation:
- https://www.nianticspatial.com/docs/scaniverse/quickstart/
- https://www.nianticspatial.com/docs/scaniverse/techniques/
- https://www.nianticspatial.com/docs/nsdk/how-to/vps/tooling/manage_test_scans/

### 3.4 Capture-quality checklist

- [ ] All required walls, floor areas, ceiling boundaries, and door frames are covered.
- [ ] Major furniture has enough coverage to appear recognizable.
- [ ] Rooms connect through genuinely captured doorways.
- [ ] No people or sensitive content remains in publishable textures.
- [ ] No unexplained missing or warped sections in primary walking routes.
- [ ] At least one independent room measurement is recorded for scale validation.
- [ ] Exports contain mesh **and textures** (or documented reason for missing textures).

---

## 4. Blender reconstruction and asset-production requirements

Create `docs/BLENDER_PIPELINE.md` and, if useful, `tools/` scripts that **assist** validation; do not claim Blender can be operated without access to the files and application.

### 4.1 Import and backup

1. Keep untouched `source-scans/<room>-original.*` backups.
2. In Blender, import `.glb/.gltf` via **File → Import → glTF 2.0**, or OBJ with its texture dependencies.
3. Save `source-scans/blender/real-office.blend` (ignored from git by default, unless owner explicitly approves storing it in the repository).
4. Duplicate imported geometry before destructive cleanup.
5. Review source textures and verify material compatibility in Material Preview.

### 4.2 World-space conventions

| Setting | Requirement |
|---|---|
| Unit system | Metric, one world unit = one meter |
| Physical floor | Exactly y=0 in the exported Three.js space for first single-floor level |
| Blender up axis | Z-up while authoring |
| Three.js / Rapier up axis | Y-up after glTF export |
| Camera eye height | Default ~1.60 m; configurable |
| Camera starting point | Measured, unobstructed entrance point; configured, not guessed |
| Model origin | Stable documented anchor, preferably reception entrance or designated drawing origin |
| Scale | Verify against recorded room/wall dimension; no mysterious `scale={0.01}` fixes |

**Important:** Blender-to-glTF export handles the standard up-axis transform. Validate the resulting GLB in the website before adjusting rotations. Never rotate the camera/controller to compensate for a badly oriented asset.

### 4.3 Cleanup and repair

- Delete floating islands, scanning artifacts, and duplicate geometry.
- Level or remodel uneven floor meshes if the scan makes walking rough.
- Repair missing/warped walls and door frames.
- Keep real door openings clear; never cap the doorway with collision proxies.
- Replace poor or excessively complex representations of ordinary walls/floors with clean simple meshes **while preserving authentic appearance**.
- Preserve furniture arrangement and approved branding as represented by the real office.
- Handle glass, mirrors, shiny monitors, windows, and low-feature walls with manual reconstruction when scanning is unreliable.
- Decimate dense surfaces selectively; review texture stretch and silhouette after each pass.
- Use Principled BSDF-compatible materials and package textures in export.
- Separate structural geometry from visual furniture when it helps collider authoring.

### 4.4 Multi-room alignment

- If multiple scans are captured separately, import into one Blender file and align from **real measurements, doorway overlap, and consistent floor elevation**.
- Verify room-to-room scale and connectivity visually and numerically.
- Merge only as needed; separate room assets are allowed for lazy loading.
- Maintain a stable global coordinate system and a documented origin; do not assign arbitrary offsets in React.

### 4.5 Collision-authoring plan

**Recommended:** use simple box/capsule proxy colliders in `office.config.js` at measured coordinates for floors, structural walls, doors, counters, desks, and inaccessible sections.

**Alternative:** author dedicated invisible low-poly collider meshes in Blender, named `COL_Floor`, `COL_Wall_*`, `COL_Desk_*`, etc., then implement a vetted loader that converts only those meshes to Rapier collider shapes. This is Phase 3+, not required for first reception prototype.

Never use the entire raw scan as one giant trimesh collider without profiling and checking door openings, slivers, self-intersections, and floor behavior.

### 4.6 Export quality gate

1. Export `.glb` (**glTF Binary**) to `assets-approved/real-office.glb` or per-room equivalents.
2. Inspect the resulting GLB in a standalone viewer and in React.
3. Validate that the 3D model has the intended orientation, scale, materials, openings and textures.
4. Confirm that private material has been redacted from textures.
5. Optimize/compress model as appropriate, then copy the **approved web asset** to `public/models/real-office.glb`.
6. Record asset version, file size, coordinate origin and scan date in `docs/ASSET_MANIFEST.md`.

---

## 5. Technology stack

| Layer | Technology | Why |
|---|---|---|
| App | React 19 + Vite | Fast standalone frontend |
| Code | JavaScript/JSX with ESLint | Match existing React implementation path; no TypeScript migration required |
| Renderer | Three.js + `@react-three/fiber` v9 | Real-time browser rendering |
| Helpers | `@react-three/drei` | `useGLTF`, `PointerLockControls`, `Html`, `useProgress` |
| Physics | `@react-three/rapier` v2 | Static colliders and kinematic character movement |
| Styling | CSS Modules or regular CSS with variables | Simple, maintainable HUD and responsive overlays |
| Asset authoring | Blender | Correct scanned meshes; build collision proxies |
| Optional animation | GSAP | Guided intro, camera transitions; not necessary for MVP |
| Testing | Vitest + React Testing Library; Playwright for end-to-end | UI unit tests plus browser interaction smoke tests |
| Hosting | Static deployment (Vercel/Netlify or equivalent) | HTTPS and CDN for optimized assets |

Choose mutually compatible versions and commit a lockfile. Check package docs before implementing APIs, especially physics character controller and pointer-lock selectors. Avoid unnecessary dependencies.

### Bootstrap if repository is empty

```bash
npm create vite@latest . -- --template react
npm install
npm install three @react-three/fiber@^9 @react-three/drei @react-three/rapier@^2
npm install -D eslint vitest @testing-library/react @testing-library/jest-dom jsdom
npm run dev
```

Scripts should include `dev`, `build`, `preview`, `lint`, and `test`. Add Playwright when setting up browser tests.

---

## 6. Information architecture and UX

### Screens/states

1. **Loading:** centered company/office title, loading status/progress and accessible failure/retry UI.
2. **Welcome:** authentic office cover image if supplied; otherwise a neutral illustration/gradient clearly marked placeholder; **Enter Office**; short controls explainer.
3. **Explore:** full-viewport 3D scene; compact HUD and centered crosshair; in-world hotspots.
4. **Info overlay:** selected real room or approved point of interest, description, media/link when provided; close/back to tour.
5. **Pause/help:** shown when pointer lock releases; **Resume**, **Reset**, **Controls**, and **Exit**.
6. **Mobile navigation:** touch joystick + drag-to-look or waypoint/tap-to-move; no forced pointer lock.
7. **No scan installed:** explicit “Demo Office / Awaiting office scan” indicator. Do not label demo as the real office.

### Desktop navigation

| Action | Behavior |
|---|---|
| W / Arrow Up (optional) | Forward relative to horizontal camera direction |
| S / Arrow Down (optional) | Backward |
| A / Arrow Left (optional) | Strafe left |
| D / Arrow Right (optional) | Strafe right |
| Mouse movement | Look horizontally and vertically under pointer lock |
| Click when aiming at hotspot | Select hotspot if in interaction distance |
| Escape | Unlock pointer; open pause/help state |
| Resume button | Reacquire pointer lock via user gesture |
| Reset button | Return to configured entrance/spawn |
| Touch controls | On-screen joystick + touch-look or waypoint fallback |

**Movement feel:** normal walk speed 2.5–3 m/s; normalize diagonals; horizontal movement ignores camera pitch; avoid jitter and motion sickness; no automatic camera roll or constant camera bobbing. Provide reduced-motion support.

### Visual design

Real architecture is the visual centerpiece; the UI should not obscure it.

- Default interface: charcoal/navy surfaces (`#0F172A`), off-white text (`#F8FAFC`), restrained sky-blue accent (`#38BDF8`). Replace with actual office branding when supplied.
- Small glass-like overlays, readable contrast, light borders, minimal decorative effects.
- HUD: logo/name top-left, Help/Map/Reset top-right, subtle controls lower-left, crosshair centered, appropriate room label lower-right.
- Use legible system fonts; avoid large text covering the scene.
- Information cards must support keyboard navigation, a visible close button, and Escape-to-close behavior without accidental scene movement.
- Minimap MUST use a real or measured floor plan. If not provided, omit it rather than inventing a map.

---

## 7. Repository structure

```text
real-office-tour/
├── design.md
├── README.md
├── .gitignore
├── .env.example
├── docs/
│   ├── CAPTURE_GUIDE.md
│   ├── BLENDER_PIPELINE.md
│   ├── ASSET_MANIFEST.md
│   ├── COLLIDER_GUIDE.md
│   └── TEST_CHECKLIST.md
├── source-scans/                 # PRIVATE / GIT-IGNORED; never deployed
│   ├── scan-manifest.md
│   ├── reception-original.glb
│   └── blender/real-office.blend
├── assets-approved/              # Optional staged publish-ready models
├── public/
│   ├── models/
│   │   ├── real-office.glb      # Added only after verified approval
│   │   └── demo/               # Low-poly development room, optional
│   ├── images/                  # Approved office/floor-plan images only
│   └── branding/
├── src/
│   ├── app/
│   │   ├── App.jsx
│   │   └── App.css
│   ├── components/
│   │   ├── scene/
│   │   │   ├── TourCanvas.jsx
│   │   │   ├── RealOfficeModel.jsx
│   │   │   ├── DemoOffice.jsx
│   │   │   ├── OfficeColliders.jsx
│   │   │   ├── PlayerController.jsx
│   │   │   ├── OfficeLighting.jsx
│   │   │   └── Hotspots.jsx
│   │   ├── ui/
│   │   │   ├── WelcomeOverlay.jsx
│   │   │   ├── PauseMenu.jsx
│   │   │   ├── HUD.jsx
│   │   │   ├── InfoPanel.jsx
│   │   │   ├── FloorplanMap.jsx
│   │   │   ├── LoadingScreen.jsx
│   │   │   ├── ErrorFallback.jsx
│   │   │   └── TouchControls.jsx
│   │   └── shared/
│   ├── hooks/
│   │   ├── useMovementInput.js
│   │   ├── usePointerLockState.js
│   │   └── useMediaPreferences.js
│   ├── config/
│   │   ├── office.config.js
│   │   └── theme.js
│   ├── data/
│   │   └── hotspots.js
│   ├── utils/
│   │   ├── validateOfficeConfig.js
│   │   └── geometryUtils.js
│   ├── tests/
│   ├── main.jsx
│   └── index.css
├── package.json
└── vite.config.js
```

`.gitignore` must exclude `source-scans/`, original scans, `.blend` backups, sensitive exports, temporary renders, and `.env.local`. **Do not ignore `design.md`**, the approved GLB, or public documentation unless user directs otherwise.

---

## 8. Data and spatial configuration

Store project-specific coordinates in `src/config/office.config.js` and validated room/hotspot data in `src/data/` so changes to the office do not require editing movement logic.

**Sample shape (placeholder values only):**

```js
export const OFFICE = {
  title: "Real Office Virtual Tour", // TODO: real brand name
  sceneMode: "demo",                 // "demo" | "real"; real requires actual asset
  modelUrl: "/models/real-office.glb",
  unit: "meters",
  // All values below are illustrative and MUST be verified against the GLB.
  player: {
    spawn: [0, 0.85, 3],           // physics body's center, NOT camera eye
    initialYaw: Math.PI,
    eyeOffsetY: 0.75,
    radius: 0.32,
    capsuleHalfHeight: 0.45,
    speed: 2.7,
    interactionDistance: 2.5,
  },
  rooms: [],  // user-approved labels and actual coordinates
  colliders: [], // only verified physical geometry
  floorplan: null, // real image + documented world-to-map transform when available
};
```

Example collider shape for a wall **only after measuring**:

```js
{
  id: "wall-reception-west",
  type: "box",
  center: [-4.0, 1.5, 0],
  halfExtents: [0.10, 1.5, 3.5],
}
```

Example hotspot schema:

```js
{
  id: "reception-desk",
  roomId: "reception",
  title: "Reception",        // only if room exists
  description: "...",        // user-approved copy
  position: [1.2, 1.6, -2.1],
  maxInteractDistance: 2.5,
  media: [],
}
```

### Validation

- Refuse to quietly enable `sceneMode: "real"` when the model is unavailable; show a visible install/setup error or explicit demo toggle.
- Validate finite numeric coordinates, unique IDs, valid collider extents and valid asset paths.
- Display model bounds in a development inspector to help check real-world scale.
- Offer optional debug mode for visualizing collider boxes, player capsule, floor plane, spawn and hotspot positions.
- Any world-to-floorplan map transform must be calibrated with at least two known locations and tested against the real floor plan.

---

## 9. 3D rendering requirements

### Real model loader

- `RealOfficeModel.jsx`: load user-approved `.glb` using `useGLTF()`; material rendering faithful to the scan.
- Use `<Suspense>` and a progress overlay (`useProgress`) for loading.
- Show actionable errors on 404, malformed GLB, texture failure, unsupported graphics context.
- Ensure model `dispose`/caching behavior is correct; avoid refetching on overlay changes.
- Default visual hierarchy: captured office geometry, calibrated ambient/environment lighting, minimal extra effects.
- Do not put large artificial lighting/color grading over real textures if it materially changes the office's appearance.
- Room splitting/lazy loading is optional later for large offices; preserve shared world transform.

### Demo mode

Create simple walls, floor, a doorway, and static obstacles from procedural boxes, with an explicit persistent **“DEMO — not your real office”** indicator. Keep this separate from real-scene logic. Use it solely for implementing movement/physics/UI before real scan assets are supplied.

### Camera

- Use `PerspectiveCamera` with FOV ~65–75 and appropriate clipping planes.
- Camera attaches logically to the player body, not a free-floating OrbitControls camera.
- Mouse look changes yaw/pitch; clamp vertical pitch as needed.
- Do not mix `OrbitControls` into the active first-person tour.
- Avoid camera clipping into walls by keeping the player capsule/colliders properly calibrated.

---

## 10. Movement and collision design

### Physics body

- Use `@react-three/rapier` static `RigidBody type="fixed"` for walls/floors/obstacles.
- Use a kinematic player body (`type="kinematicPosition"`) with a capsule collider; configure its center/height consistently.
- Create a Rapier kinematic character controller via `useRapier().world.createCharacterController(...)`, compute permitted movement against the player collider, and move the body by the controller's computed displacement.
- Perform physics displacement in a **fixed physics step** (`useBeforePhysicsStep`) and camera follow in `useFrame`; do not add movement twice using both loops.
- Input must be ignored when the tour is paused, pointer lock is released, a dialog is open, or a text field has focus.
- Always clear held key states on window blur, pointer-lock release, unmount and visibility changes.
- Disable ordinary keyboard arrow scrolling and text selection only when the movement surface is active.

### Horizontal movement math

1. Obtain the world camera forward vector.
2. Set `forward.y = 0` and normalize.
3. Obtain right vector perpendicular to world-up.
4. Translate active W/S/A/D keys into a normalized direction (no faster diagonals).
5. Multiply by configured meters/second × fixed delta.
6. Call `computeColliderMovement` and apply the allowed translation to the kinematic body.
7. Keep player on the flat reference floor for the first-floor MVP; do not claim ramps/stairs work until a grounded/gravity controller is implemented.

### Physical fidelity rules

- Walls block movement. **Door openings are walkable** and must not be covered by a full-wall collider.
- Floors support walking; avoid snagging on raw scanned triangles by using a clean flat floor collision proxy.
- Desk/cabinet collision boxes follow furniture footprints closely enough that the user cannot visibly walk through them.
- Restrict traversal into off-limits areas with truthful physical geometry/invisible barriers, clearly explained as appropriate.
- Add development overlays toggled via query parameter (e.g. `?debug=colliders`) to show where colliders actually are.
- Configure reset position and orientation to a safe spawn where the capsule is not inside any collider.
- Use an explicit state machine for `loading -> welcome -> exploring -> paused/info -> exploring` to avoid pointer-lock/input conflicts.

### Troubleshooting checklist

- Player falls or rises unexpectedly: check physics gravity, floor center and capsule center.
- Player walks through walls: verify physical collider setup and correct rigid body type; inspect collider offsets.
- Player cannot pass a doorway: split wall collider into left/right/top sections around the opening.
- Player faces the wrong direction at spawn: calibrate heading after GLB import.
- Player moves backward on W: confirm normalized camera forward and world-axis convention.
- Camera jitters: check competing updates, physics step and `setNextKinematicTranslation`.
- Map does not match model: verify GLB scale, origin and calibrated map transform.

---

## 11. Hotspots, waypoints, and floor plan

### Hotspots

- Attach only to actual approved locations: reception desk, meeting room, branded exhibit, company history display, etc.
- Use a small, visually distinct marker that does not obscure the environment.
- Click/center-reticle interaction must honor `maxInteractDistance` to prevent activation through a wall or across rooms.
- On selection, pause movement and release pointer lock **before** showing a focusable info card. Clicking Resume must use a user gesture to regain pointer lock.
- Content comes from `src/data/hotspots.js`, not fabricated content.
- All hotspots have keyboard-accessible equivalents in an optional Locations list.

### Waypoints (secondary)

- Add quick navigation to rooms after the multi-room scan and exact positions are available.
- If teleporting, validate landing point, collision clearances and room authorization.
- Avoid cinematic transitions that drag the camera through walls.

### Minimap

- The minimap feature must remain hidden until the user supplies a real floor plan or a measured plan derived from the scan.
- Store calibration (`worldOrigin`, `pixelOrigin`, `pixelsPerMeter`, orientation) with the floorplan asset.
- Show the visitor's real position and heading; no invented rooms.

---

## 12. Performance and asset budgets

**Targets, not guarantees:**

- Desktop: aim for 50–60 FPS on a representative midrange laptop with WebGL available.
- Mobile fallback: aim for smooth touch controls and acceptable stability, ideally 30 FPS on supported devices.
- Set Canvas DPR range around `[1, 1.5]` initially, and offer a reduced-quality mode.
- Start with a **single reception-room** optimized model; budget initial model payload as small as reasonable, with a *working target* near 10–30 MB if visual fidelity permits. Larger offices may require streaming/lazy loading.
- Limit real-time shadows, transparent layers, material variety and draw calls.
- Simplify scanned meshes and resize oversized textures; use glTF mesh/texture compression when supported by the loading pipeline.
- Add asset size reporting and a basic loading/progress screen.
- Provide a fallback message if WebGL is unavailable or initialization fails.
- Keep raw scan photos and unused source files out of the production bundle.

**Do not blindly enable Draco/Meshopt/KTX2 unless the exporter and loader pipeline are verified end-to-end.** Test the actual compressed file in the deployed build.

---

## 13. Accessibility, mobile, privacy, and security

### Accessibility

- Every HTML control is keyboard-accessible, labeled, and focus-visible.
- Welcome, help and information overlays use focus management and accessible dialog semantics.
- Provide a clear Controls screen and a non-motion-heavy navigation alternative.
- Respect `prefers-reduced-motion` for camera animations and UI transitions.
- Avoid relying only on colors or glowing markers to communicate interactions.
- Enable a menu/list route to the main rooms for users who cannot use first-person movement.

### Mobile

- Detect coarse pointer and show touch controls instead of relying on Pointer Lock.
- Implement either (A) virtual move joystick + drag-to-look, or (B) high-quality tap-to-waypoint tour as MVP fallback.
- Keep hotspots and menus finger-sized; test real devices for input and frame rate.
- Disable unsupported effects on low-power devices gracefully.

### Privacy and security

- Assume GLBs and textures deployed under `public/` are **publicly downloadable**, even if hidden by an overlay. Do not deploy confidential data there.
- Require explicit user approval for publishing rooms, employee information, screens, floor plans and access-related details.
- If the actual office requires private viewing, plan authenticated asset delivery rather than relying on obscurity or a JavaScript-only password gate.
- Do not silently upload office source scans to third-party services during build/development.
- Never store secrets in client environment variables. No analytics without an explicit privacy decision.

---

## 14. Implementation milestones for Codex

### Phase 0 — Inspect and initialize

**Tasks**
- Check repository tree, installed packages, current UI and asset folders.
- Preserve existing working code and styling where useful.
- Scaffold React/Vite only if necessary; establish CSS tokens, lint/build scripts and minimal tests.
- Add `.gitignore` to prevent publication of private scan assets.
- Create documentation files from sections 3–4 and a clear asset manifest.

**Exit criteria**: `npm run dev`, `npm run build`, and lint work; project structure is clean.

### Phase 1 — Working demo and navigation

**Tasks**
- Add procedural demo room labeled as a demo.
- Implement 3D Canvas, camera, pointer lock and input state.
- Add kinematic player and physics-aware walls/furniture/floor.
- Add Welcome/Resume/Reset/Help UI and a center reticle.
- Handle desktop input, blur, pointer unlock and keyboard focus properly.
- Include collider debug visualization.

**Exit criteria**: WASD+mouse navigation works; the player cannot walk through test walls; doorway is traversable; Escape/Resume and Reset behave consistently.

### Phase 2 — Real-model import pathway

**Tasks**
- Implement `RealOfficeModel` using `useGLTF` with explicit real/demo choice.
- Support first real asset at `public/models/real-office.glb`.
- Provide loading/error states and a clear missing-asset/setup notice.
- Add a dev inspector for model bounds/orientation/scale.
- Add configurable spawn and initial yaw; document GLB verification.
- Include `docs/ASSET_MANIFEST.md` and `docs/BLENDER_PIPELINE.md`.

**Exit criteria**: Once the user supplies a reviewed GLB, the app renders it without using fake room props or silently switching to demo; the model shows correct orientation and scale.

### Phase 3 — Real colliders and rooms

**Tasks**
- Inspect GLB bounds and actual floor plan with user-provided reference dimensions.
- Author collision proxies for real floor, walls, door frames, large furniture; **do not assume the examples in this document are true**.
- Configure safe entrance and any approved room names and hotspots.
- Verify player path through each real doorway; test all boundaries.
- Add room segmentation if actual geometry/performance requires it.

**Exit criteria**: Manual walkthrough of the approved office areas passes all wall/door/furniture tests and the user confirms the layout reflects the real site.

### Phase 4 — Professional product UX

**Tasks**
- Incorporate supplied office logo/colors and real room details.
- Build hotspots and information panels with safe release/resume of pointer lock.
- Add a real floorplan minimap **only if source map and calibration are available**.
- Add room quick-navigation and touch-friendly fallback.
- Improve loading screen and graceful recovery from missing assets.

**Exit criteria**: Branded, polished tour with working interactions; no fabricated company claims or floorplan.

### Phase 5 — Optimization, tests, release

**Tasks**
- Profile GLB size, draw calls, frame rates, memory and device-specific bottlenecks.
- Simplify meshes/texture sizes, verify any compression and chunk-loading strategy.
- Add Vitest/RTL tests and a Playwright smoke test where feasible.
- Run test/lint/build commands and fix failures.
- Review privacy and asset authorization before deployment.
- Write `README.md` with setup, controls, scan processing, Blender export, deployment and known limitations.
- Deploy static site when the real office's publishable assets are approved.

**Exit criteria**: Tests and production build pass; model/texture privacy and GLB approval documented; key browsers tested; clearly stated limitations.

---

## 15. Test and acceptance checklist

### Functional walkthrough

- [ ] New visitor sees Welcome and clear Enter button.
- [ ] Pressing Enter acquires pointer lock on supported desktop browsers.
- [ ] W moves forward and S backward in camera direction.
- [ ] A/D strafe; diagonal speed is normalized.
- [ ] Mouse turns viewpoint without unintentionally translating the player.
- [ ] Floor and walls block player appropriately; no tunneling.
- [ ] A real doorway is traversable when physically open in the model.
- [ ] Furniture proxy collisions prevent visible clipping.
- [ ] Escape releases pointer lock and opens Resume UI.
- [ ] Opening hotspot releases pointer lock, prevents movement, and restores focus.
- [ ] Resume only reacquires pointer on an actual user click.
- [ ] Reset returns to a safe user-approved spawn location and heading.
- [ ] A missing GLB shows a clear error or explicitly labeled demo mode; no invented office.
- [ ] Model scale and camera eye height feel plausible relative to real furniture.
- [ ] Real room names, content and map align with user-provided data.
- [ ] Responsive layout works on narrow screens with a touch navigation solution.

### Engineering and production

- [ ] `npm run lint` passes.
- [ ] `npm run test` passes.
- [ ] `npm run build` passes.
- [ ] Dev mode has no repeating console errors or accidental physics resource leaks.
- [ ] All missing-asset, WebGL error, and slow-loading states are handled.
- [ ] Tested on recent Chrome and Edge; verify Firefox/Safari support where accessible.
- [ ] Performance measured on desktop and mobile, with known limitations documented.
- [ ] Original scans are not in `public/` or the committed repository.
- [ ] Production models contain no sensitive or unapproved office details.
- [ ] User approves the rooms to publish.

### Suggested automated tests

- Config validator rejects missing model in `real` mode, invalid spawn, invalid collider sizes and duplicate hotspot IDs.
- HUD/Welcome overlay renders correct state and control labels.
- Pause/resume state clears keys and restores controls after user interaction.
- Geometry utility correctly maps configured collision bounds into Rapier half-extents.
- Browser smoke test: page loads, Enter is visible, demo mode is labeled, UI navigation works, reset stays functional. (Do not rely solely on headless pointer-lock availability; supplement with manual test.)

---

## 16. Handoff documents Codex must produce

- `README.md` — startup commands, desktop/mobile controls, supported devices, mode selection, deployment.
- `docs/CAPTURE_GUIDE.md` — updated Polycam/Scaniverse physical capture checklist.
- `docs/BLENDER_PIPELINE.md` — scanned mesh import, alignment, cleanup, GLB export, optimization.
- `docs/ASSET_MANIFEST.md` — each office mesh, version, unit scale, bounds, approved/public status, file size.
- `docs/COLLIDER_GUIDE.md` — how to measure and place real-world collider proxies, debug overlays, doorway verification.
- `docs/TEST_CHECKLIST.md` — repeatable manual QA for real room alignment, collisions, navigation, mobile, privacy.
- `.env.example` if runtime mode flags are used; **do not put secrets there**.

---

## 17. Ready-to-paste Codex prompt

> Read `design.md` completely and implement the **REAL OFFICE — LiDAR-to-Web 3D Virtual Tour** specification in this repository. This is a faithful reconstruction of a physical office, not a fictional showroom. First inspect existing code and assets. Work in the phase order specified in Section 14. Build an immediately runnable, **clearly labeled demo mode** using basic geometry while no real scan is supplied. Implement React/Vite, React Three Fiber, Drei pointer-lock camera, Rapier collision-aware WASD controller, welcome/pause/resume UI, reset, loading/error states, and configurable real-office import using `/models/real-office.glb`. Keep scans out of public assets until approved. Prepare documentation for Polycam/Scaniverse capture, Blender GLB cleanup, coordinate calibration, and per-room collision proxy authoring. Never invent the real layout, measurements, room labels, or company branding. Validate via lint, tests and build, fix failures, and summarize what works plus exactly which user-supplied assets/measurements are needed to switch to real mode.

### After the first scanned GLB is supplied

> I have added my real office model at `public/models/real-office.glb`. Inspect its bounding dimensions, orientation, scale and materials; compare them against any recorded measurements in `docs/ASSET_MANIFEST.md`. Configure the actual entrance spawn, create appropriate floor/wall/furniture colliders from the observed model and supplied room data, and enable `sceneMode: "real"`. Do not replace or redesign the actual office. Use debug collision overlays, test movement through real doorways, maintain an accurate loading/error state, run lint/tests/build and report any measurements or manual Blender fixes still needed.

---

## 18. Official references

These are source links for checking current UI steps or APIs; third-party apps and exports may change.

- Polycam Space Mode: https://learn.poly.cam/hc/en-us/articles/36655587097620-How-to-Use-Space-Mode-LiDAR-Devices
- Polycam exports: https://learn.poly.cam/hc/en-us/articles/27756102599572-What-File-Types-Can-Polycam-Export
- Polycam + Blender: https://learn.poly.cam/hc/en-us/articles/42497420365716-How-to-Optimize-Your-Captures-in-Blender
- Scaniverse Quickstart: https://www.nianticspatial.com/docs/scaniverse/quickstart/
- Scaniverse scan techniques: https://www.nianticspatial.com/docs/scaniverse/techniques/
- Scaniverse Site meshes: https://www.nianticspatial.com/docs/nsdk/how-to/vps/tooling/manage_test_scans/
- React Three Fiber: https://r3f.docs.pmnd.rs/
- Drei: https://drei.docs.pmnd.rs/
- React Three Rapier: https://pmndrs.github.io/react-three-rapier/
- Rapier character controller: https://rapier.rs/docs/user_guides/javascript/character_controller/
- Blender glTF 2.0: https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf2.html

---

**Implementation priority:** Real asset privacy and fidelity → accurate scale and orientation → stable WASD/physics → UX → performance → multi-room extensions. A small, accurate, working reception tour is more valuable than a fictional full office.
