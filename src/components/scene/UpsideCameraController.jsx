import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { Vector3 } from 'three';

export default function UpsideCameraController({
  active,
  angle = 'angle',
  targetY = 1.0,
  controlsRef
}) {
  const { camera } = useThree();
  const wasActive = useRef(false);

  useEffect(() => {
    if (!active) {
      if (wasActive.current) {
        camera.up.set(0, 1, 0);
        camera.updateProjectionMatrix();
        wasActive.current = false;
      }
      return;
    }

    wasActive.current = true;
    const target = new Vector3(0.5, targetY, 1.5);

    if (angle === 'top') {
      // Orthogonal-style plan view: look straight down from the ceiling
      camera.up.set(0, 0, -1);
      camera.position.set(0.5, Math.max(16, targetY + 14), 1.501);
      camera.lookAt(target);
    } else {
      // 3D perspective / dollhouse structural angle
      camera.up.set(0, 1, 0);
      camera.position.set(9.5, targetY + 11.5, 11.5);
      camera.lookAt(target);
    }

    camera.updateProjectionMatrix();

    if (controlsRef?.current) {
      controlsRef.current.target.copy(target);
      controlsRef.current.update();
    }
  }, [active, angle, targetY, camera, controlsRef]);

  return null;
}
