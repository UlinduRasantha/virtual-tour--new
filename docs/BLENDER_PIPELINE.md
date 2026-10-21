# Blender pipeline

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


