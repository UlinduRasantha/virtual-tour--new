# Capture workflow — Polycam and Scaniverse

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



## Documentation check — 2026-10-14

The current Polycam export reference lists glTF/OBJ mesh export options depending on capture mode and plan. Do not assume a direct GLB export is available: preserve the complete glTF/OBJ texture dependencies and convert in Blender. The Scaniverse Quickstart distinguishes the New Site/cloud workflow from Classic local single-scan capture. Review data-sharing permissions before the user uploads captures to any scanning service; this project performs no such upload. Links above are vendor references; recheck account-specific export options during capture.
