# Asset manifest

## Replacement on 2026-10-15

Active asset: `/models/house2.glb`, 25,998,080 bytes, 10 meshes, raw bounds approximately 15.47 × 2.75 × 16.73 units. Different property and coordinate system: previous calibration, cleanup and collisions are disabled. Walking enabled on 2026-10-15 from visually checked raw X=-1, Z=0, floor Y=-1.168, facing -X. Scale remains provisional. Generated 4 cm occupancy collision proxies protect scanned obstacles and unsupported floor areas; the model itself is not edited. The previous `/models/house.glb` has been removed from public assets; its private original remains. Historical entries below describe the previous model. No public deployment performed.

| Asset | Version / date | Units / bounds | Size | Approval |
|---|---|---|---|---|
| Procedural Demo Office | prototype / 2026-10-14 | meters; floor 12 × 14; wall height 3.2 | Generated geometry, no scan file | Demo only, not an actual office |
| `/models/office.glb` | image-inspired sample / 2026-10-14 | assumed meters; interior 12 × 15 × 3.65; Y-up, floor Y=0 | ~4.1 MB; see `sample-office/office.config.json` | User-requested synthetic sample; NOT a real-office scan |
| `/models/real-office.glb` | NOT INSTALLED | TODO: MEASURE/VERIFY | Not available | NOT APPROVED |
| `/models/house.glb` | user installed / 2026-10-14 | same source as private house scan; provisional 1.10821 m/raw unit applied in HOUSE config | 23,305,236 bytes; original source preserved | User requested local house demo; public deployment not approved |
| Private house scan `10_14_2026.glb` | received / 2026-10-14; iPhone LiDAR | raw bounds ~19.49 × 3.83 × 12.16 model units; physical scale unverified | 23,305,236 bytes; 8 meshes; 347,848 triangles; 8 embedded JPEG textures | Received for inspection; NOT approved for publication; private copy in ignored `source-scans/house/` |

Before real mode: record scan date/device/app, source version, cleaned export version, origin anchor, measured wall endpoints and length, exported bounds, floor elevation, entrance capsule-center position, yaw, door clearances, texture sizes, file bytes, approved rooms, restrictions and who approved browser delivery. Link the private original by internal identifier, not a public URL.

The model inspector reports numeric bounds; this does not prove physical scale or correct orientation. Compare a known measurement and view the model. The 10–30 MB initial room target is provisional. The house scan now drives a locally requested demo; public deployment is not approved. Its user-installed public asset will be included in build output.

## Received house scan

The user's iPhone LiDAR house capture is preserved privately as `source-scans/house/10_14_2026-original.glb`. Its raw Y bounds are approximately -1.798 to +2.036. The bounding-box minimum is not a verified floor elevation; do not simply translate the minimum to zero. Identify the intended floor surface, compare a measured wall/door dimension, and confirm a starting location before authoring a house-specific walkthrough configuration. Existing office sample coordinates and hotspot descriptions do not apply to the house.

The user confirmed the **narrow doorway on the right, in the white wall**, as the main entrance and reported its width as **1.00 meter** on 2026-10-14. Browser raycasts against visually selected frame points measure approximately 0.90235 raw units, yielding a provisional uniform factor of 1.10821 meters/raw unit. See `house/entrance-calibration.json` for exact source points, source hash and reproducible camera/pixel coordinates. This is a visual estimate against a rough scan, not a survey-quality measurement; the original model remains unchanged.

Downward probes at raw [4.9, 0, 4.6] and [4.9, 0, 5] find exterior floor Y approximately -1.633; [4.9, 0, 3] finds an interior surface at -1.454, implying a roughly 20 cm rise after reference scaling. Distorted mesh surfaces span the opening. Do not enable flat-floor walking through these surfaces or flatten the threshold silently. Geometry cleanup, grounded stepping (or a verified same-level interior starting point) and measured collision proxies remain necessary. The saved entrance camera is for inspection only, not a validated capsule spawn.

Open `/tools/private-scan-inspector.html` on the local Vite server and choose the GLB for an orbitable local preview; the file is read in the browser and is not uploaded. This diagnostic view uses unlit, double-sided texture materials because the supplied materials omit metallic factors, giving a dark default PBR preview without an environment. It does not modify the source GLB or establish walkthrough calibration.

The Main entrance button becomes available only when the selected file's SHA-256 matches this scan. It shows a provisional 1.60 m eye-height view from outside the confirmed doorway, using the measured reference factor. Other files retain generic orbit inspection.

## House walkthrough demo

`?mode=house` is now the default locally requested demo. `house.glb` matches the source SHA above. The renderer clones geometry/materials, displays the captured textures unlit, and clears triangles intersecting the entrance passage box configured in `src/config/house.config.js`. This reversible runtime cleanup is only for the labeled demo; the stored file is unchanged and residual scan defects remain.

Ray probes located the entrance-room left/right/back surfaces near raw X=4.371, X=8.565 and Z=-3.602. Proxy boxes bound that room and a small exterior landing, block the adjoining rooms, and conservatively cover observed furniture. The 1 m entrance remains open. Two measured-level floors and a grounded character controller support the approximately 20 cm threshold in both directions. This route is tested; it does not certify the whole house or physical surveying accuracy.

Doorway fix (2026-10-15): the 4 cm collision grid and 0.22 m capsule radius preserve narrow openings (capsule height remains 1.60 m). Two inspected doorway exceptions in `docs/house/house2-doorways.json` prevent hanging scan fragments from creating full-height barriers, only where scanned floor exists. The garage, blue room, bedroom and right-hand office have bidirectional physics regression tests; adjacent wall blocking is also tested. Stored GLB geometry is unchanged.
