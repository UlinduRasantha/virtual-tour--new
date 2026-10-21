import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { CapsuleCollider, RigidBody, useBeforePhysicsStep, useRapier } from '@react-three/rapier';
import { Euler, Vector3 } from 'three';
import useMovementInput, { isTextInput } from '../../hooks/useMovementInput.js';
import { movementVector } from '../../utils/geometryUtils.js';

export default function PlayerController({
  config,
  active,
  touch,
  resetVersion,
  telemetry,
  clickTarget,
  onClearTarget,
  navMode = 'wasd'
}) {
  const body = useRef(), collider = useRef(), controller = useRef();
  const { world } = useRapier();
  const { camera } = useThree();
  const keys = useMovementInput(active, touch);
  const forward = useRef(new Vector3());
  const angles = useRef(new Euler(0, 0, 0, 'YXZ'));
  const stuckFrames = useRef(0);
  const player = config.player;

  useEffect(() => {
    stuckFrames.current = 0;
    onClearTarget?.();
  }, [resetVersion, onClearTarget]);

  useEffect(() => {
    const motor = world.createCharacterController(0.02);
    motor.setSlideEnabled(true);
    motor.setMaxSlopeClimbAngle(Math.PI / 3);
    if (player.grounded) {
      motor.enableAutostep(player.stepHeight || 0.28, 0.01, false);
      motor.enableSnapToGround(0.5);
    } else {
      motor.disableAutostep();
      motor.disableSnapToGround();
    }
    controller.current = motor;
    return () => {
      controller.current = null;
      world.removeCharacterController(motor);
    };
  }, [world, player.grounded, player.stepHeight]);

  useEffect(() => {
    const [x, y, z] = player.spawn;
    stuckFrames.current = 0;
    body.current?.setTranslation({ x, y, z }, true);
    body.current?.setNextKinematicTranslation({ x, y, z });
    camera.position.set(x, y + player.eyeOffsetY, z);
    camera.rotation.set(0, player.initialYaw, 0, 'YXZ');
    touch.current.lookX = 0;
    touch.current.lookY = 0;
  }, [resetVersion, player, camera, touch]);

  useBeforePhysicsStep(() => {
    if (!body.current || !collider.current || !controller.current) return;
    const p = body.current.translation();
    if (!active || isTextInput(document.activeElement)) {
      body.current.setNextKinematicTranslation(p);
      return;
    }

    // WASD keyboard and touch-joystick movement is only active in 'wasd' mode
    const isWasdActive = navMode === 'wasd';
    const held = (...codes) => (isWasdActive && codes.some(code => keys.current.has(code))) ? 1 : 0;
    const x = isWasdActive ? (held('KeyD', 'ArrowRight') - held('KeyA', 'ArrowLeft') + touch.current.x) : 0;
    const z = isWasdActive ? (held('KeyW', 'ArrowUp') - held('KeyS', 'ArrowDown') + touch.current.z) : 0;

    if (x !== 0 || z !== 0) {
      if (clickTarget) onClearTarget?.();
      stuckFrames.current = 0;
      camera.getWorldDirection(forward.current);
      const yaw = Math.atan2(-forward.current.x, -forward.current.z);
      const desired = movementVector(x, z, yaw, player.speed);
      if (player.grounded) desired.y = -0.01;

      controller.current.computeColliderMovement(collider.current, desired);
      const move = controller.current.computedMovement();
      body.current.setNextKinematicTranslation({
        x: p.x + move.x,
        y: player.grounded ? p.y + move.y : player.spawn[1],
        z: p.z + move.z
      });
      return;
    }

    if (clickTarget) {
      const dx = clickTarget.x - p.x;
      const dz = clickTarget.z - p.z;
      const dist = Math.hypot(dx, dz);

      if (dist < 0.22) {
        onClearTarget?.();
        stuckFrames.current = 0;
        body.current.setNextKinematicTranslation(p);
        return;
      }

      // Smooth forward navigation velocity (4.5 m/s) with full wall collision
      const clickSpeed = 4.5;
      const moveDist = Math.min(dist, clickSpeed * (1 / 60));
      const desired = {
        x: (dx / dist) * moveDist,
        y: player.grounded ? -0.01 : 0,
        z: (dz / dist) * moveDist
      };

      // Elevation adaptation ONLY within the stair shaft for smooth stair climbing
      const inStairs = p.x >= -0.20 && p.x <= 2.05 && p.z >= 2.40 && p.z <= 4.80;
      if (inStairs) {
        const bodyHalfHeight = (player.capsuleHalfHeight || 0.58) + (player.radius || 0.22);
        const targetBodyY = clickTarget.y + bodyHalfHeight;
        const elevDiff = targetBodyY - p.y;
        if (elevDiff > 0.05) {
          desired.y = Math.min(elevDiff, 0.15);
        } else if (elevDiff < -0.05) {
          desired.y = Math.max(elevDiff, -0.20);
        }
      }

      // Enforce physical collision against all house colliders and walls
      controller.current.computeColliderMovement(collider.current, desired);
      const move = controller.current.computedMovement();

      // If blocked by a wall or obstacle along the path, stop cleanly at the wall
      const actualDist = Math.hypot(move.x, move.z);
      if (actualDist < 0.005 || actualDist < moveDist * 0.20) {
        stuckFrames.current++;
        if (stuckFrames.current > 12) {
          onClearTarget?.();
          stuckFrames.current = 0;
        }
      } else {
        stuckFrames.current = 0;
      }

      body.current.setNextKinematicTranslation({
        x: p.x + move.x,
        y: player.grounded ? p.y + move.y : player.spawn[1],
        z: p.z + move.z
      });
      return;
    }

    body.current.setNextKinematicTranslation(p);
  });

  useFrame(() => {
    if (!body.current) return;
    if (active && (touch.current.lookX || touch.current.lookY)) {
      angles.current.setFromQuaternion(camera.quaternion, 'YXZ');
      angles.current.y -= touch.current.lookX * 0.003;
      angles.current.x = Math.max(-1.4, Math.min(1.4, angles.current.x - touch.current.lookY * 0.003));
      angles.current.z = 0;
      camera.quaternion.setFromEuler(angles.current);
    }
    touch.current.lookX = 0;
    touch.current.lookY = 0;

    const p = body.current.translation();
    camera.position.set(p.x, p.y + player.eyeOffsetY, p.z);

    telemetry.current = {
      position: [p.x, p.y, p.z],
      yaw: camera.rotation.y,
      pitch: camera.rotation.x
    };
    if (typeof window !== 'undefined') {
      window.tourTelemetry = telemetry.current;
    }
  });

  return (
    <RigidBody ref={body} type="kinematicPosition" colliders={false} position={player.spawn} enabledRotations={[false, false, false]}>
      <CapsuleCollider ref={collider} args={[player.capsuleHalfHeight, player.radius]} />
    </RigidBody>
  );
}
