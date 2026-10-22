import { Suspense, useCallback, useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, PointerLockControls } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import OfficeColliders from './OfficeColliders.jsx';
import PlayerController from './PlayerController.jsx';
import ClickToMove from './ClickToMove.jsx';
import Hotspots from './Hotspots.jsx';
import HouseModel from './HouseModel.jsx';
import { FIXED_STEP } from '../../utils/geometryUtils.js';

function Ready({ onReady }) {
  useEffect(() => { onReady(); }, [onReady]);
  return null;
}

function MouseControls({ controls, onLock, onUnlock }) {
  const { gl } = useThree();
  return (
    <PointerLockControls
      ref={controls}
      domElement={gl.domElement}
      selector="#pointer-lock-manual-only"
      minPolarAngle={0.2}
      maxPolarAngle={Math.PI - 0.2}
      onLock={onLock}
      onUnlock={onUnlock}
    />
  );
}

export default function TourCanvas({
  config,
  active,
  coarse,
  touch,
  controls,
  onLock,
  onUnlock,
  onReady,
  resetVersion,
  onSelect,
  targetRef,
  telemetry,
  lowQuality,
  debug,
  inspect = false,
  onBounds,
  navMode = 'wasd',
  teleportTarget,
  onClearTeleport
}) {
  const [clickTarget, setClickTarget] = useState(null);

  const handleTarget = useCallback((newTarget) => {
    if (!newTarget) {
      setClickTarget(null);
      return;
    }
    setClickTarget(prev => {
      if (prev && Math.hypot(prev.x - newTarget.x, prev.y - newTarget.y, prev.z - newTarget.z) < 0.02) {
        return prev;
      }
      return newTarget;
    });
  }, []);

  const handleClearTarget = useCallback(() => {
    setClickTarget(null);
  }, []);

  useEffect(() => {
    setClickTarget(null);
  }, [resetVersion]);

  return (
    <Canvas
      shadows={!lowQuality}
      dpr={lowQuality ? 1 : [1, 1.5]}
      camera={{ fov: 70, near: 0.05, far: 200, position: [config.player.spawn[0], config.player.spawn[1] + config.player.eyeOffsetY, config.player.spawn[2]] }}
      gl={{ antialias: !lowQuality }}
      fallback={<p role="alert">WebGL is unavailable. Enable hardware acceleration or use another browser.</p>}
    >
      <color attach="background" args={['#111827']} />
      <hemisphereLight args={['#ffffff', '#8b8472', 1.8]} />
      <ambientLight intensity={0.4} />

      <Suspense fallback={null}>
        <Physics gravity={[0, 0, 0]} timeStep={FIXED_STEP} debug={debug}>
          <HouseModel config={config} onBounds={onBounds} inspect={inspect} />

          {!inspect && (
            <>
              <OfficeColliders colliders={config.colliders} />
              <PlayerController
                config={config}
                active={active}
                touch={touch}
                resetVersion={resetVersion}
                telemetry={telemetry}
                clickTarget={clickTarget}
                onClearTarget={handleClearTarget}
                navMode={navMode}
                teleportTarget={teleportTarget}
                onClearTeleport={onClearTeleport}
              />
              <ClickToMove
                active={active}
                target={clickTarget}
                onTarget={handleTarget}
                onClearTarget={handleClearTarget}
                navMode={navMode}
              />
              <Hotspots
                items={config.hotspots}
                active={active}
                onSelect={onSelect}
                targetRef={targetRef}
                navMode={navMode}
              />
            </>
          )}

          {debug && (
            <>
              <axesHelper args={[2]} />
              <gridHelper args={[20, 20, '#38bdf8', '#64748b']} />
            </>
          )}
          <Ready onReady={onReady} />
        </Physics>
      </Suspense>

      {navMode === 'wasd' && !coarse && !inspect && (
        <MouseControls controls={controls} onLock={onLock} onUnlock={onUnlock} />
      )}
      {inspect && <OrbitControls makeDefault />}
    </Canvas>
  );
}
