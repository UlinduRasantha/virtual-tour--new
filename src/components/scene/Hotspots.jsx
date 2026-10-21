import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { DoubleSide, Raycaster, Vector2, Vector3 } from 'three';
import { getHotspotIconTexture, getHotspotLabelTexture } from '../../utils/hotspotIcons.js';

function HotspotPin({ item, index, isHovered, camera }) {
  const badgeRef = useRef();
  const haloRef = useRef();
  const stemHeight = item.stemHeight || 0.28;

  const iconTexture = useMemo(
    () => getHotspotIconTexture(item.icon, item.color || '#16a34a'),
    [item.icon, item.color]
  );

  const labelTexture = useMemo(
    () => getHotspotLabelTexture(item.title),
    [item.title]
  );

  useFrame(({ clock }) => {
    // 1. Billboard orientation: always face camera directly
    if (badgeRef.current) {
      badgeRef.current.quaternion.copy(camera.quaternion);
      const targetScale = isHovered ? 1.18 : 1.0;
      badgeRef.current.scale.lerp(new Vector3(targetScale, targetScale, targetScale), 0.2);
    }

    // 2. Continuous Matterport pulsing outer halo ring
    if (haloRef.current) {
      const t = clock.getElapsedTime();
      const pulse = 1 + ((Math.sin(t * 3.5 + index * 1.5) + 1) / 2) * 0.28;
      haloRef.current.scale.set(pulse, pulse, 1);
      if (haloRef.current.material) {
        haloRef.current.material.opacity = isHovered ? 0.7 : 0.42 * (1 - (pulse - 1) / 0.28);
      }
    }
  });

  return (
    <group position={item.position} userData={{ hotspot: item }}>
      {/* A. Vertical Anchor Stem (Leader Line) pointing down to surface */}
      <mesh position={[0, -stemHeight / 2, 0]}>
        <cylinderGeometry args={[0.0025, 0.0025, stemHeight, 8]} />
        <meshBasicMaterial color="#ffffff" opacity={0.75} transparent />
      </mesh>

      {/* Surface Base Anchor Ring & Dot */}
      <mesh position={[0, -stemHeight, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.024, 16]} />
        <meshBasicMaterial color="#ffffff" opacity={0.85} transparent side={DoubleSide} />
      </mesh>
      <mesh position={[0, -stemHeight, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.032, 0.048, 24]} />
        <meshBasicMaterial color={item.color || '#16a34a'} opacity={0.7} transparent side={DoubleSide} />
      </mesh>

      {/* B. Floating Billboard Badge */}
      <group ref={badgeRef}>
        {/* Pulsing Outer Halo Ring */}
        <mesh ref={haloRef}>
          <ringGeometry args={[0.105, 0.138, 36]} />
          <meshBasicMaterial
            color="#ffffff"
            opacity={0.4}
            transparent
            side={DoubleSide}
            depthWrite={false}
          />
        </mesh>

        {/* Circular Face with Matterport Icon */}
        <mesh userData={{ hotspot: item }}>
          <planeGeometry args={[0.20, 0.20]} />
          <meshBasicMaterial
            map={iconTexture || undefined}
            color={iconTexture ? '#ffffff' : (item.color || '#16a34a')}
            transparent
            side={DoubleSide}
            depthWrite={false}
          />
        </mesh>

        {/* Invisible generous raycast hit sphere for easy clicking */}
        <mesh userData={{ hotspot: item }}>
          <sphereGeometry args={[0.16, 12, 8]} />
          <meshBasicMaterial visible={false} />
        </mesh>

        {/* C. Hover Title Pill Label */}
        {isHovered && labelTexture && (
          <mesh position={[0, 0.17, 0]}>
            <planeGeometry args={[0.42, 0.105]} />
            <meshBasicMaterial
              map={labelTexture}
              transparent
              side={DoubleSide}
              depthWrite={false}
            />
          </mesh>
        )}
      </group>
    </group>
  );
}

export default function Hotspots({ items, active, onSelect, targetRef, navMode = 'wasd' }) {
  const { camera, scene, gl } = useThree();
  const ray = useMemo(() => new Raycaster(), []);
  const [hoveredId, setHoveredId] = useState(null);
  const downPos = useRef({ x: 0, y: 0 });
  const tick = useRef(0);

  // Check center-screen hotspot interaction for WASD mode
  useFrame((_, delta) => {
    tick.current += delta;
    if (tick.current < 0.08) return;
    tick.current = 0;

    if (!active) {
      if (targetRef) targetRef.current = null;
      if (hoveredId) setHoveredId(null);
      return;
    }

    if (navMode === 'wasd') {
      ray.setFromCamera(new Vector2(0, 0), camera);
      const hits = ray.intersectObjects(scene.children, true);
      const firstMesh = hits.find(hit => hit.object?.isMesh && !hit.object.userData?.debug);
      const hotspotObj = firstMesh?.object?.userData?.hotspot;

      if (hotspotObj && firstMesh.distance <= (hotspotObj.maxInteractDistance || 3.5)) {
        if (targetRef) targetRef.current = hotspotObj;
        setHoveredId(hotspotObj.id);
      } else {
        if (targetRef) targetRef.current = null;
        setHoveredId(null);
      }
    }
  });

  // Pointer and Click events on canvas for Click-to-Move and WASD direct clicking
  useEffect(() => {
    if (!active) return;

    const el = gl.domElement;

    const onPointerDown = (e) => {
      if (e.button !== 0) return;
      downPos.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e) => {
      if (navMode !== 'click') return;

      const rect = el.getBoundingClientRect();
      const mouse = new Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      ray.setFromCamera(mouse, camera);
      const hits = ray.intersectObjects(scene.children, true);
      const hit = hits.find(h => h.object?.userData?.hotspot);

      if (hit && hit.distance <= (hit.object.userData.hotspot.maxInteractDistance || 4.5)) {
        const h = hit.object.userData.hotspot;
        setHoveredId(h.id);
        el.style.cursor = 'pointer';
      } else {
        setHoveredId(prev => (prev ? null : prev));
      }
    };

    const onClick = (e) => {
      if (!active || e.button !== 0) return;
      const totalDist = Math.hypot(e.clientX - downPos.current.x, e.clientY - downPos.current.y);
      if (totalDist > 8) return; // ignore drags

      // 1. Click-to-Move: raycast directly from click coordinates
      const rect = el.getBoundingClientRect();
      const mouse = new Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      ray.setFromCamera(mouse, camera);
      const hits = ray.intersectObjects(scene.children, true);
      const hit = hits.find(h => h.object?.userData?.hotspot);

      if (hit && hit.distance <= (hit.object.userData.hotspot.maxInteractDistance || 4.5)) {
        onSelect(hit.object.userData.hotspot);
        return;
      }

      // 2. WASD crosshair mode fallback
      if (targetRef?.current) {
        onSelect(targetRef.current);
      }
    };

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('click', onClick);

    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('click', onClick);
    };
  }, [active, navMode, camera, scene, gl, ray, onSelect, targetRef]);

  return (
    <group userData={{ isHotspotGroup: true }}>
      {items.map((h, i) => (
        <HotspotPin
          key={h.id}
          item={h}
          index={i}
          isHovered={hoveredId === h.id}
          camera={camera}
        />
      ))}
    </group>
  );
}
