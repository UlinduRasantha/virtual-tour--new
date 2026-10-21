# Verification and release checklist

Run `npm run lint`, `npm test`, `npm run build`, then `npm run test:e2e`. Chrome and Edge must be installed for the included browser projects. Unit tests include real Rapier WASM simulation rather than mocked collision responses.

## Repeatable walkthrough

- [ ] Welcome states that this is a demo until real mode is explicitly chosen.
- [ ] Enter captures mouse from a user gesture. W/S and A/D match the view; diagonals are no faster.
- [ ] Mouse rotates without translating. Looking up/down doesn't affect walking speed.
- [ ] All walls and large furniture block; doorway is traversable; corners slide without tunneling.
- [ ] Escape pauses. Blur, hidden tab and pointer release clear held keys. Resume doesn't resume stale movement.
- [ ] Reset restores both position and heading without clipping. Text fields/dialogs don't move the player.
- [ ] Aim at a nearby marker, click, verify movement pauses and focus goes into info dialog. Walls and distance prevent reticle interaction.
- [ ] Locations, Help, Reset, Resume and Exit are keyboard-accessible; Tab stays inside modal.
- [ ] Coarse-pointer / drag fallback works with two simultaneous touches. Canceling touch or backgrounding stops movement.
- [ ] No horizontal overflow at 390 × 844; buttons remain finger-sized; reduced quality and reduced motion behave.
- [ ] Missing GLB, malformed GLB, bad textures, WebGL disabled and slow loading have usable errors/retry paths.

## Real-office acceptance (pending scan)

- [ ] Compare one independently measured wall and each doorway with exported geometry; verify Y-up and floor Y=0.
- [ ] Verify every real collider and the approved spawn/heading. Obtain user confirmation that layout/furniture match.
- [ ] Verify labels and approved hotspot descriptions. No map until supplied and calibrated against two known locations.
- [ ] Record file size, mesh/triangle counts, texture sizes, draw calls, memory and measured FPS on a representative laptop and physical phone.
- [ ] Test real devices and recent Firefox/Safari as well as Chrome/Edge. Check mobile thermal/load behavior.
- [ ] Privacy review: no confidential textures/screens/documents/people/restricted rooms; explicit publish approval recorded.
- [ ] Production directory contains approved optimized exports only. Deploy only dist over HTTPS.

Automated Chromium Escape behavior can differ from the physical key: the smoke test also uses document.exitPointerLock and checks the resulting pause state. A manual physical Escape check remains required. Automated mobile checks are viewport/drag simulations, not physical-device performance certification.

## Automated verification — 2026-10-14

- PASS: ESLint and production Vite build.
- PASS: 11 Vitest tests across UI, config validation, input lifecycle, missing assets, normalized movement and actual Rapier collision simulation.
- PASS: 8 Playwright checks across installed Chrome and Edge: mouse capture/look, WASD through doorway to blocking wall, Escape/unlock-pause, reset/resume, missing scan recovery, narrow-screen drag controls and Locations, synthetic GLB bounds with calibration gate, reticle click releasing capture and focusing the info dialog.
- Desktop and 390 × 844 screenshots visually reviewed. Synthetic GLB is supplied by test routing only and is not a deployable office model.
- npm audit at dependency installation: 0 vulnerabilities.
- Build warning: the Three.js/Rapier bundle is approximately 3.47 MB minified / 1.18 MB gzip before real assets. It builds successfully; room/device profiling and further splitting remain future optimization work.
- Not verified: actual scan fidelity/materials/scale, real collider routes, physical Escape key behavior outside headless automation, Safari/Firefox, physical mobile multitouch and device FPS. No deployment or real asset approval has occurred.

## Sample GLB walkthrough integration — 2026-10-14

The default route now opens the image-inspired sample GLB. `?mode=demo` retains the original procedural test room; `?mode=real` retains the real scan calibration gate.

- PASS: 15 unit/physics tests, including the sample spawn, desk/chair/window collisions, a continuous entrance-to-doorway-to-vestibule route, and preserving fresh movement input on mouse capture.
- PASS: 6 sample browser checks across Chrome and Edge: wall collision, the open doorway in both directions, mouse look, pause/resume/reset, reticle hotspot selection/focus, touch movement/look, and all four location descriptions.
- Sample collision count: 38. The sample scene is separate from the unconfigured real office.
- Physical phone testing and real-office fidelity remain pending; browser touch checks simulate touch-style drag controls on a narrow viewport.
