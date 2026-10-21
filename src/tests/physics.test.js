// @vitest-environment node
import { beforeAll, expect, test } from 'vitest';
import RAPIER from '@dimforge/rapier3d-compat';
import { HOUSE } from '../config/house.config.js';
import { movementVector } from '../utils/geometryUtils.js';

beforeAll(async () => {
  await RAPIER.init();
});

function walk(start, x, z, steps, config = HOUSE) {
  const world = new RAPIER.World({ x: 0, y: 0, z: 0 });
  const fixed = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
  for (const c of config.colliders) {
    world.createCollider(RAPIER.ColliderDesc.cuboid(...c.halfExtents).setTranslation(...c.center), fixed);
  }
  const body = world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(...start));
  const shape = world.createCollider(RAPIER.ColliderDesc.capsule(config.player.capsuleHalfHeight, config.player.radius), body);
  const controller = world.createCharacterController(0.02);
  controller.setSlideEnabled(true);
  controller.setMaxSlopeClimbAngle(Math.PI / 3);
  if (config.player.grounded) {
    controller.enableAutostep(config.player.stepHeight || 0.28, 0.01, false);
    controller.enableSnapToGround(0.5);
  }
  world.step();

  for (let i = 0; i < steps; i++) {
    const desired = movementVector(x, z, 0, config.player.speed);
    if (config.player.grounded) desired.y = -0.01;
    controller.computeColliderMovement(shape, desired);
    const p = body.translation(), m = controller.computedMovement();
    body.setNextKinematicTranslation({
      x: p.x + m.x,
      y: config.player.grounded ? p.y + m.y : start[1],
      z: p.z + m.z
    });
    world.step();
  }

  const result = { ...body.translation() };
  world.free();
  return result;
}

test('House player walks forward from spawn on Main Floor and stays grounded', () => {
  const moved = walk(HOUSE.player.spawn, 0, 1, 30);
  expect(moved.z).toBeLessThan(HOUSE.player.spawn[2]);
  expect(moved.y).toBeCloseTo(0.85, 1);
});

test('House player stops when colliding with Main Floor scan walls', () => {
  // Spawn is at [1.5, 0.85, 0.5]. Walking toward +X hits the right outer wall/window
  const stoppedEast = walk(HOUSE.player.spawn, 1, 0, 300);
  expect(stoppedEast.x).toBeGreaterThan(1.5);
  expect(stoppedEast.x).toBeLessThan(4.5);

  // Walking toward -X hits central walls/hallway dividers
  const stoppedWest = walk(HOUSE.player.spawn, -1, 0, 300);
  expect(stoppedWest.x).toBeLessThan(1.5);
  expect(stoppedWest.x).toBeGreaterThan(-4.5);
});

test('Lower floor (Basement) has proper collision stopping the player', () => {
  // Basement eye height is -2.50 + 0.85 = -1.65. Walking toward outer wall
  const stopped = walk([0.35, -1.65, 4.8], 1, 0, 200);
  // Must be blocked by basement wall colliders, cannot pass beyond 3.5m
  expect(stopped.x).toBeLessThan(3.5);
  expect(stopped.y).toBeCloseTo(-1.65, 1);
});

test('Upper floor (Floor 3) has proper collision stopping the player', () => {
  // Upper floor eye height is 2.95 + 0.85 = 3.80. Walking toward room wall
  const stopped = walk([-0.45, 3.80, 5.5], 1, 0, 200);
  // Must be blocked by upper wall colliders
  expect(stopped.x).toBeLessThan(2.0);
  expect(stopped.y).toBeCloseTo(3.80, 1);
});

test('Living room doorway is passable and connects to the central hall', () => {
  // Spawn is at [1.5, 0.85, 0.5]. Walking toward -X through the doorway
  const throughDoorway = walk(HOUSE.player.spawn, -1, 0, 50);
  expect(throughDoorway.x).toBeLessThan(0.5);
  expect(throughDoorway.y).toBeCloseTo(0.85, 1);
});

test('Stairs allow climbing up to the upper floor', () => {
  // Start near the entrance of the up-stairs flight: [-0.45, 0.85, 3.175]
  const movedUp = walk([-0.45, 0.85, 3.175], 1, 0, 40);
  expect(movedUp.x).toBeGreaterThan(-0.45);
  expect(movedUp.y).toBeGreaterThan(0.85);
});

test('Stairs allow descending down to the lower floor / basement', () => {
  // Start near the entrance of the down-stairs flight: [-0.45, 0.85, 4.125]
  const movedDown = walk([-0.45, 0.85, 4.125], 1, 0, 40);
  expect(movedDown.x).toBeGreaterThan(-0.45);
  expect(movedDown.y).toBeLessThan(0.85);
});
