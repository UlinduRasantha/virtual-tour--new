# Image-inspired sample office

`public/models/office.glb` is a standalone GLB 2.0 sample built from the supplied office image's visible design cues. It is **not a LiDAR scan, a measured reconstruction, or the user's actual office**. Hidden surfaces and dimensions are artist-authored assumptions.

Included: pale timber flooring, shared ash workbenches, black steel frames, curved two-tone shell chairs and wire bases, window worktop, monitors/keyboards, full-height glazing with blinds, hanging linear luminaires, rear shelves/books, muted lounge seating and plants. The exterior trees are deliberately stylized sample scenery.

- Assumed interior: 12 m wide × 15 m deep × 3.65 m high; Y-up; floor Y=0.
- Embedded procedural textures; no reference image or external texture URLs are needed.
- Approx. 4.1 MB, 50k triangles. See `office.config.json` for exact export metrics and bounds. Bounds include outside greenery and the small doorway vestibule, so they exceed the interior dimensions.
- Named groups and ordinary PBR materials; no Draco/Meshopt decoder required.
- Luminaire surfaces are emissive; scene illumination/shadows are provided by the viewer. The model does not include baked photoreal lighting.
- Sample collision proxies and the starting point are in `office.config.json`, consumed by `src/config/sample-office.config.js`. The sample walkthrough uses these proxies; the real OFFICE config remains uncalibrated.

## Preview / regenerate

Run `npm run dev`, then open the localhost URL. The default page is the first-person sample walkthrough (`/?mode=sample`) with WASD, mouse look, collisions, pause/resume, reset, four hotspots and touch controls. H opens Help; L opens Locations. The back-left doorway opens into a small vestibule. The original simple demo remains available at `/?mode=demo`.

For asset inspection only, open `/tools/sample-office-preview.html` through the same server. This separate viewer supports orbit/pan/zoom and includes a link into the walkthrough.

With Vite running at localhost:5173, run `node tools/export-sample-office.mjs`. This uses installed Edge via Playwright, exports the model, reloads the exported GLB with GLTFLoader, reports metrics, and captures the PNG previews. `SAMPLE_PREVIEW_URL` can point to a different local Vite port. The generated file can also be imported into Blender with File → Import → glTF 2.0.

The real-office configuration remains reserved for an approved real scan. Do not rename this sample to `real-office.glb` or mark the real OFFICE config calibrated. The sample uses the reusable GLB renderer while keeping its own visible label, player configuration, collision proxies and hotspot descriptions.

## Verification

The exported binary was reloaded by Three.js GLTFLoader without browser errors, and the resulting interior renders were visually inspected. The file has embedded image buffer views and no external image/buffer URLs. Original reference photography was not copied into public assets.
