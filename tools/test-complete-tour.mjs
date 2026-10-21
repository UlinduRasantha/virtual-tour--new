import RAPIER from '@dimforge/rapier3d-compat';
import { readFileSync } from 'fs';

await RAPIER.init();

const scan = JSON.parse(readFileSync('docs/house/house-colliders.json'));
const world = new RAPIER.World({ x: 0, y: 0, z: 0 });
const fixed = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());

for (const c of scan.colliders) {
  world.createCollider(RAPIER.ColliderDesc.cuboid(...c.halfExtents).setTranslation(...c.center), fixed);
}

function simulateMultiSegment(name, waypoints) {
  console.log(`\n========================================`);
  console.log(`TEST: ${name}`);
  console.log(`========================================`);
  const body = world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(...waypoints[0]));
  const shape = world.createCollider(RAPIER.ColliderDesc.capsule(0.58, 0.22), body);
  const controller = world.createCharacterController(0.02);
  controller.setSlideEnabled(true);
  controller.setMaxSlopeClimbAngle(Math.PI / 3);
  controller.enableAutostep(0.28, 0.01, false);
  controller.enableSnapToGround(0.5);
  world.step();

  let allReached = true;
  for (let i = 1; i < waypoints.length; i++) {
    const target = waypoints[i];
    let reached = false;
    let stuckCount = 0;

    for (let s = 0; s < 180; s++) {
      const pos = body.translation();
      const dx = target[0] - pos.x, dz = target[2] - pos.z;
      const distXZ = Math.hypot(dx, dz);
      if (distXZ < 0.20 && Math.abs(target[1] - pos.y) < 0.40) {
        reached = true;
        break;
      }
      const speed = 0.04;
      const moveX = (dx / (distXZ || 1)) * Math.min(distXZ, speed);
      const moveZ = (dz / (distXZ || 1)) * Math.min(distXZ, speed);
      
      controller.computeColliderMovement(shape, { x: moveX, y: -0.01, z: moveZ });
      const m = controller.computedMovement();
      body.setNextKinematicTranslation({
        x: pos.x + m.x,
        y: pos.y + m.y,
        z: pos.z + m.z
      });
      world.step();

      if (Math.hypot(m.x, m.z) < 0.005) {
        stuckCount++;
        if (stuckCount > 25) {
          console.log(`  [X] STUCK at [${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)}] moving towards waypoint ${i}: [${target.join(', ')}]`);
          allReached = false;
          break;
        }
      } else {
        stuckCount = 0;
      }
    }
    const currentPos = body.translation();
    if (!reached) {
      console.log(`  [X] FAILED segment ${i}: ended at [${currentPos.x.toFixed(2)}, ${currentPos.y.toFixed(2)}, ${currentPos.z.toFixed(2)}], target [${target.join(', ')}]`);
      allReached = false;
      break;
    } else {
      console.log(`  [OK] Waypoint ${i} reached: [${currentPos.x.toFixed(2)}, ${currentPos.y.toFixed(2)}, ${currentPos.z.toFixed(2)}]`);
    }
  }

  world.removeRigidBody(body);
  console.log(`Conclusion: ${allReached ? 'PASS - NO STICKING' : 'FAIL - STUCK'}`);
  return allReached;
}

// 1. Full ascent: Main floor living room -> Hallway -> Up stairs flight 1A -> Landing 1 -> Flight 1B -> Floor 3 landing -> Bedroom
const pass1 = simulateMultiSegment('Main Floor Living to Floor 3 Bedroom', [
  [1.50, 0.85, 0.50],
  [1.50, 0.85, 1.80],
  [-0.20, 0.85, 1.80],
  [-0.20, 0.85, 3.125],
  [1.15, 2.30, 3.125],
  [1.50, 2.30, 3.60],
  [1.15, 2.30, 4.075],
  [-0.25, 3.80, 4.075],
  [-0.25, 3.80, 5.50]
]);

// 2. Full descent: Floor 3 Bedroom -> Landing -> Down Flight 1B -> Landing 1 -> Down Flight 1A -> Main floor
const pass2 = simulateMultiSegment('Floor 3 Bedroom descent to Main Floor', [
  [-0.25, 3.80, 5.50],
  [-0.25, 3.80, 4.075],
  [1.15, 2.30, 4.075],
  [1.50, 2.30, 3.60],
  [1.15, 2.30, 3.125],
  [-0.20, 0.85, 3.125],
  [-0.20, 0.85, 1.80],
  [1.50, 0.85, 1.80],
  [1.50, 0.85, 0.50]
]);

// 3. Full descent to basement: Main floor -> Down Flight 2A -> Basement Landing 2 -> Down Flight 2B -> Basement
const pass3 = simulateMultiSegment('Main Floor to Basement', [
  [-0.20, 0.85, 1.80],
  [-0.20, 0.85, 4.075],
  [1.15, -0.40, 4.075],
  [1.50, -0.40, 3.60],
  [1.15, -0.40, 3.125],
  [-0.25, -1.65, 3.125],
  [-0.50, -1.65, 2.50],
  [-1.10, -1.65, 2.50]
]);

// 4. Basement ascent back to Main floor: Basement -> Up Flight 2B -> Basement Landing 2 -> Up Flight 2A -> Main floor
const pass4 = simulateMultiSegment('Basement ascent back to Main Floor', [
  [-1.10, -1.65, 2.50],
  [-0.50, -1.65, 2.50],
  [-0.25, -1.65, 3.125],
  [1.15, -0.40, 3.125],
  [1.50, -0.40, 3.60],
  [1.15, -0.40, 4.075],
  [-0.20, 0.85, 4.075],
  [-0.20, 0.85, 1.80]
]);

console.log(`\nALL TOURS PASS: ${pass1 && pass2 && pass3 && pass4}`);
if (!pass1 || !pass2 || !pass3 || !pass4) process.exit(1);
