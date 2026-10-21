import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { AdditiveBlending, DoubleSide, Euler, Matrix3, Vector2, Vector3 } from 'three';

// Floor configurations:
// - Basement floor: Y ~ -2.50 (valid floor range: [-2.65, -2.25])
// - Main floor: Y ~ 0.00 (valid floor range: [-0.20, +0.22])
// - Upper floor: Y ~ 2.95 (valid floor range: [+2.75, +3.20])
// - Switchback stair shaft: X in [-0.20, 2.05], Z in [2.40, 4.80], Y in [-2.65, 3.20]
function isFloorElevation(x, y, z) {
  // Stair shaft allows smooth climbing across all floors
  if (x >= -0.20 && x <= 2.05 && z >= 2.40 && z <= 4.80) {
    return y >= -2.65 && y <= 3.20;
  }
  // Basement floor surface
  if (y >= -2.65 && y <= -2.25) return true;
  // Main floor surface
  if (y >= -0.20 && y <= 0.22) return true;
  // Upper floor surface
  if (y >= 2.75 && y <= 3.20) return true;

  // Anything else (tables, counters, desks, sofa cushions, window sills, shelves) is NOT a floor
  return false;
}

function findWalkableHit(screenX, screenY, gl, camera, scene, raycaster, normalMatrix) {
  const rect = gl.domElement.getBoundingClientRect();
  const mouse = new Vector2(
    ((screenX - rect.left) / rect.width) * 2 - 1,
    -((screenY - rect.top) / rect.height) * 2 + 1
  );
  raycaster.setFromCamera(mouse, camera);

  const hits = raycaster.intersectObjects(scene.children, true);
  // Find the first solid mesh in direct line of sight
  const first = hits.find(h =>
    h.object?.isMesh &&
    !h.object.userData?.hotspot &&
    !h.object.userData?.isMarker &&
    !h.object.userData?.debug &&
    h.face
  );

  if (!first) return null;

  normalMatrix.getNormalMatrix(first.object.matrixWorld);
  const norm = first.face.normal.clone().applyNormalMatrix(normalMatrix).normalize();

  // ONLY walkable floor or stair surfaces:
  // 1. Surface normal must point UPWARDS (norm.y >= 0.70). Reject all walls (norm.y ~ 0) and steep surfaces.
  // 2. The surface must be below camera eye height.
  // 3. The elevation must match actual house floors or stairs (rejects tables, counters, sills, shelves).
  // 4. Must be on the current floor or stair flight (prevents clicking through floor slabs to other floors).
  if (norm.y < 0.70) return null;
  if (first.point.y >= camera.position.y - 0.20) return null;
  if (!isFloorElevation(first.point.x, first.point.y, first.point.z)) return null;

  const currentFloorY = camera.position.y - 1.60;
  const inStairs = first.point.x >= -0.20 && first.point.x <= 2.05 && first.point.z >= 2.40 && first.point.z <= 4.80;
  if (!inStairs && Math.abs(first.point.y - currentFloorY) > 1.0) {
    return null;
  }

  return first;
}

export default function ClickToMove({ active, target, onTarget, onClearTarget, navMode }) {
  const { camera, scene, gl, raycaster } = useThree();
  const [hoverPos, setHoverPos] = useState(null);
  const [hovered, setHovered] = useState(false);

  const isDown = useRef(false);
  const didDrag = useRef(false);
  const dragEndTime = useRef(0);
  const downButton = useRef(0);
  const movedInPointerUp = useRef(false);
  const downPos = useRef({ x: 0, y: 0, time: 0 });
  const lastPos = useRef({ x: 0, y: 0 });
  const angles = useRef(new Euler(0, 0, 0, 'YXZ'));
  const ringRef = useRef();
  const beaconRef = useRef();
  const normalMatrix = useMemo(() => new Matrix3(), []);

  // Pointer event listeners on canvas when navMode === 'click' and active
  useEffect(() => {
    if (!active || navMode !== 'click') {
      gl.domElement.style.cursor = '';
      return;
    }

    const onPointerDown = (e) => {
      const button = e.button ?? 0;
      if (button !== 0 && button !== 2) return;
      isDown.current = true;
      didDrag.current = false;
      movedInPointerUp.current = false;
      downButton.current = button;
      downPos.current = { x: e.clientX, y: e.clientY, time: performance.now() };
      lastPos.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e) => {
      // 1. Drag mouse to look around
      if (isDown.current) {
        const dx = e.clientX - lastPos.current.x;
        const dy = e.clientY - lastPos.current.y;
        const totalDist = Math.hypot(e.clientX - downPos.current.x, e.clientY - downPos.current.y);

        // Drag threshold: engage look-around mode if moved > 6px
        if (!didDrag.current && totalDist > 6) {
          didDrag.current = true;
        }

        if (didDrag.current) {
          angles.current.setFromQuaternion(camera.quaternion, 'YXZ');
          angles.current.y -= dx * 0.003;
          angles.current.x = Math.max(-1.4, Math.min(1.4, angles.current.x - dy * 0.003));
          angles.current.z = 0;
          camera.quaternion.setFromEuler(angles.current);
          gl.domElement.style.cursor = 'grabbing';
          setHovered(false);
        }
        lastPos.current = { x: e.clientX, y: e.clientY };
        return;
      }

      // 2. Hover raycast to show walkable reticle
      const hit = findWalkableHit(e.clientX, e.clientY, gl, camera, scene, raycaster, normalMatrix);
      if (hit) {
        setHoverPos([hit.point.x, hit.point.y + 0.02, hit.point.z]);
        setHovered(true);
        gl.domElement.style.cursor = 'pointer';
      } else {
        setHovered(false);
        gl.domElement.style.cursor = 'grab';
      }
    };

    const lastMoveTime = { current: 0 };
    const triggerMove = (clientX, clientY) => {
      const now = performance.now();
      if (now - lastMoveTime.current < 250) return;

      // If click directly targeted a hotspot pin, do not set walk target
      const rect = gl.domElement.getBoundingClientRect();
      const mouse = new Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(scene.children, true);
      const hitHotspot = hits.find(h => h.object?.userData?.hotspot);
      if (hitHotspot && (!hits[0] || hitHotspot.distance <= hits[0].distance + 0.3)) {
        return;
      }

      const hit = findWalkableHit(clientX, clientY, gl, camera, scene, raycaster, normalMatrix);
      if (hit) {
        lastMoveTime.current = now;
        onTarget({ x: hit.point.x, y: hit.point.y, z: hit.point.z });
      }
    };

    const onPointerUp = (e) => {
      if (!isDown.current) return;
      isDown.current = false;

      const elapsed = performance.now() - downPos.current.time;
      const totalDist = Math.hypot(e.clientX - downPos.current.x, e.clientY - downPos.current.y);
      const wasDrag = didDrag.current || totalDist > 8 || elapsed >= 600;

      if (wasDrag) {
        // User was looking around / dragging: record completion time to suppress trailing click
        dragEndTime.current = performance.now();
      } else if (downButton.current === 0) {
        // Clean click (not a drag): smoothly move camera to clicked floor location
        movedInPointerUp.current = true;
        triggerMove(e.clientX, e.clientY);
      }

      gl.domElement.style.cursor = hovered ? 'pointer' : 'grab';
    };

    const onClick = (e) => {
      // If user was looking around / dragging, prevent movement and stop propagation
      if (didDrag.current || performance.now() - dragEndTime.current < 400) {
        e.stopPropagation?.();
        e.preventDefault?.();
        didDrag.current = false;
        movedInPointerUp.current = false;
        return;
      }

      // Prevent duplicate trigger if already fired in pointerup
      if (movedInPointerUp.current) {
        movedInPointerUp.current = false;
        return;
      }

      // Fallback for synthetic click events without prior drag
      triggerMove(e.clientX, e.clientY);
    };

    const onPointerLeave = () => {
      if (!isDown.current) {
        setHovered(false);
        gl.domElement.style.cursor = '';
      }
    };

    const el = gl.domElement;
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('click', onClick, true);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointerleave', onPointerLeave);

    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('click', onClick, true);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointerleave', onPointerLeave);
      el.style.cursor = '';
    };
  }, [active, navMode, camera, scene, gl, raycaster, normalMatrix, hovered, onTarget]);

  // Pulse animation on the hover reticle and active beacon
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ringRef.current) {
      const pulse = 1 + Math.sin(t * 5) * 0.08;
      ringRef.current.scale.set(pulse, pulse, pulse);
      ringRef.current.rotation.z = t * 0.8;
    }
    if (beaconRef.current) {
      const bPulse = 1 + Math.sin(t * 6) * 0.12;
      beaconRef.current.scale.set(bPulse, bPulse, bPulse);
    }
  });

  if (!active || navMode !== 'click') return null;

  return (
    <group userData={{ isMarker: true }}>
      {/* 1. Ground Hover Reticle */}
      {hovered && hoverPos && (
        <group position={hoverPos} rotation={[-Math.PI / 2, 0, 0]} userData={{ isMarker: true }}>
          {/* Inner dot */}
          <mesh userData={{ isMarker: true }}>
            <circleGeometry args={[0.04, 24]} />
            <meshBasicMaterial color="#38bdf8" side={DoubleSide} />
          </mesh>

          {/* Animated pulsing outer ring */}
          <group ref={ringRef} userData={{ isMarker: true }}>
            <mesh userData={{ isMarker: true }}>
              <ringGeometry args={[0.18, 0.23, 36]} />
              <meshBasicMaterial color="#38bdf8" opacity={0.85} transparent side={DoubleSide} />
            </mesh>
            <mesh userData={{ isMarker: true }}>
              <ringGeometry args={[0.29, 0.31, 36]} />
              <meshBasicMaterial color="#7dd3fc" opacity={0.4} transparent side={DoubleSide} />
            </mesh>
          </group>
        </group>
      )}

      {/* 2. Destination Beacon (Active navigation target) */}
      {target && (
        <group position={[target.x, target.y + 0.02, target.z]} userData={{ isMarker: true }}>
          {/* Flat ground target rings */}
          <group rotation={[-Math.PI / 2, 0, 0]} ref={beaconRef} userData={{ isMarker: true }}>
            <mesh userData={{ isMarker: true }}>
              <circleGeometry args={[0.06, 24]} />
              <meshBasicMaterial color="#0284c7" side={DoubleSide} />
            </mesh>
            <mesh userData={{ isMarker: true }}>
              <ringGeometry args={[0.16, 0.22, 36]} />
              <meshBasicMaterial color="#38bdf8" opacity={0.9} transparent side={DoubleSide} />
            </mesh>
            <mesh userData={{ isMarker: true }}>
              <ringGeometry args={[0.28, 0.32, 36]} />
              <meshBasicMaterial color="#0ea5e9" opacity={0.5} transparent side={DoubleSide} />
            </mesh>
          </group>

          {/* Vertical glowing beacon column */}
          <mesh position={[0, 0.30, 0]} userData={{ isMarker: true }}>
            <cylinderGeometry args={[0.015, 0.12, 0.60, 24, 1, true]} />
            <meshBasicMaterial
              color="#38bdf8"
              opacity={0.35}
              transparent
              side={DoubleSide}
              blending={AdditiveBlending}
              depthWrite={false}
            />
          </mesh>

          {/* Beacon tip floating orb */}
          <mesh position={[0, 0.62, 0]} userData={{ isMarker: true }}>
            <sphereGeometry args={[0.035, 16, 16]} />
            <meshBasicMaterial color="#7dd3fc" />
          </mesh>
        </group>
      )}
    </group>
  );
}
