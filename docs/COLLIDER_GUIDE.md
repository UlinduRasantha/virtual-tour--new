# Measured collision proxies

Edit only OFFICE in `src/config/office.config.js` for the real scan. DEMO coordinates have no relationship to the physical office.

1. Export metric geometry with Y-up and floor surface at Y=0. Record an origin shared across rooms.
2. Measure each floor, wall, closed door, counter and large furniture footprint. Use `{ id, type: 'box', center: [x,y,z], halfExtents: [width/2,height/2,depth/2] }`. Sizes must be finite and positive; IDs unique. Current proxies are axis aligned. Rotate/align in Blender or add a vetted rotated-proxy implementation if actual walls require it; do not pretend axis-aligned boxes fit diagonals.
3. Keep the floor top at 0 (negative center Y and half-height of equal magnitude). The capsule half-height plus radius determines its bottom, and camera Y is capsule-center Y plus eyeOffsetY. Default radius .30, half-height .50, center .85 and eye offset .75 describe controller dimensions, not a measured entrance.
4. A doorway needs left/right/top sections. Never span an open doorway with one solid wall. Check that opening width exceeds the .60 m capsule diameter plus .02 m controller margin on both sides, and overhead clearance covers the full capsule.
5. Set safe measured spawn and yaw; validator rejects overlap with boxes. This conservative AABB test is an initial gate, not a full route proof.
6. Open `?mode=real&debug=colliders`. Inspect floor grid, axes, capsule, wall and furniture proxies against the actual GLB. Walk into each boundary, approach doorways straight and obliquely, walk along corners, and reset repeatedly.
7. Validate approved hotspots against actual locations and sight lines. The first visible mesh along the reticle ray must be the marker; distance alone is insufficient. Locations is a text alternative, not a teleport.

Static Rapier cuboids and a kinematic capsule use a 60 Hz fixed step. The controller computes permitted displacement and slides along obstacles. Height is held constant for this single-floor milestone. No gravity, steps, slopes or stairs are promised. Close floor edges with verified boundaries. Do not attach the entire raw scan as a giant trimesh. Dedicated COL_* mesh conversion remains a later milestone.
