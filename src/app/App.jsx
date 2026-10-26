import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { useGLTF, useProgress } from '@react-three/drei';
import TourCanvas from '../components/scene/TourCanvas.jsx';
import Dialog from '../components/ui/Dialog.jsx';
import MatterportCard from '../components/ui/MatterportCard.jsx';
import TouchControls from '../components/ui/TouchControls.jsx';
import ErrorBoundary from '../components/ui/ErrorBoundary.jsx';
import TourMenu from '../components/ui/TourMenu.jsx';
import { HOUSE } from '../config/house.config.js';
import { FLOORS, ALL_FLOORS, getFloorByElevation, getFloorById } from '../config/floors.config.js';
import { inspectAsset } from '../utils/inspectAsset.js';
import { tourReducer } from '../utils/tourState.js';

export default function App() {
  const config = HOUSE;
  const modelUrl = config.modelUrl;

  const [asset, setAsset] = useState(null);
  const [assetError, setAssetError] = useState('');
  const [bounds, setBounds] = useState(null);
  const [state, dispatch] = useReducer(tourReducer, 'loading');
  const [coarse, setCoarse] = useState(() => window.matchMedia?.('(pointer: coarse)').matches || false);
  const [resetVersion, setReset] = useState(0);
  const [retry, setRetry] = useState(0);
  const [lowQuality, setLowQuality] = useState(false);
  const [selected, setSelected] = useState(null);
  const [notice, setNotice] = useState('');
  const [sceneFailed, setSceneFailed] = useState(false);
  const [navMode, setNavMode] = useState('wasd');
  const [teleportTarget, setTeleportTarget] = useState(null);
  const handleClearTeleport = useCallback(() => setTeleportTarget(null), []);

  const [viewMode, setViewMode] = useState('walkthrough');
  const [upsideAngle, setUpsideAngle] = useState('angle');
  const [selectedUpsideFloorId, setSelectedUpsideFloorId] = useState('all');
  const [currentFloorId, setCurrentFloorId] = useState('main');

  const controls = useRef();
  const target = useRef();
  const telemetry = useRef({});
  const touch = useRef({ x: 0, z: 0, lookX: 0, lookY: 0 });
  const switchingViewModeRef = useRef(false);
  const { progress } = useProgress();

  const active = state === 'exploring';
  const debug = new URLSearchParams(location.search).get('debug') === 'colliders';

  const ready = useCallback(() => dispatch({ type: 'READY' }), []);
  const lock = useCallback(() => { setNotice(''); dispatch({ type: 'ENTER' }); }, []);
  const unlock = useCallback(() => {
    if (switchingViewModeRef.current || viewMode === 'upside') return;
    dispatch({ type: 'PAUSE' });
  }, [viewMode]);
  const leave = useCallback(type => {
    dispatch({ type });
    document.exitPointerLock?.();
    touch.current.x = 0;
    touch.current.z = 0;
  }, []);
  const welcome = useCallback(() => leave('EXIT'), [leave]);
  const select = useCallback(item => { setSelected(item); leave('INFO'); }, [leave]);

  useEffect(() => {
    if (!modelUrl) return;
    const abort = new AbortController();
    inspectAsset(modelUrl, abort.signal)
      .then(setAsset)
      .catch(error => {
        if (error.name !== 'AbortError') setAssetError(error.message);
      });
    return () => abort.abort();
  }, [modelUrl, retry]);

  useEffect(() => {
    if (import.meta.env.DEV) {
      window.__tour = { snapshot: () => ({ ...telemetry.current, state, target: target.current?.id }) };
      return () => { delete window.__tour; };
    }
  }, [state]);

  const enter = () => {
    if (viewMode === 'upside') {
      const f = getFloorById(selectedUpsideFloorId);
      if (f.id !== 'all') {
        setTeleportTarget({ position: f.spawn, yaw: f.yaw, timestamp: Date.now() });
      }
      lock();
      setNotice(`🏠 Viewing ${f.name} structure from above`);
      return;
    }

    const f = getFloorById(currentFloorId);
    if (f.id !== 'main') {
      setTeleportTarget({ position: f.spawn, yaw: f.yaw, timestamp: Date.now() });
    }

    if (coarse || navMode === 'click') {
      lock();
      return;
    }
    if (!controls.current) {
      setNotice('The scene is still initializing. Try again shortly.');
      return;
    }
    try {
      controls.current.lock();
    } catch {
      setNotice('Mouse capture is unavailable. Use touch / drag controls below.');
    }
  };

  // Track player elevation in walkthrough mode to automatically highlight the current floor
  useEffect(() => {
    if (viewMode !== 'walkthrough') return;
    const timer = setInterval(() => {
      const y = telemetry.current?.position?.[1];
      if (typeof y === 'number') {
        const detectedFloor = getFloorByElevation(y);
        if (detectedFloor.id !== currentFloorId) {
          setCurrentFloorId(detectedFloor.id);
        }
      }
    }, 300);
    return () => clearInterval(timer);
  }, [viewMode, currentFloorId]);

  const handleChangeViewMode = useCallback((mode) => {
    switchingViewModeRef.current = true;
    if (mode === 'upside') {
      document.exitPointerLock?.();
      setViewMode('upside');
      setNotice('🏠 Upside View — Drag mouse to orbit around the house structure, scroll to zoom.');
    } else {
      setViewMode('walkthrough');
      setNotice(navMode === 'wasd'
        ? '🚶 Walkthrough Mode — Explore inside the house (click scene or WASD to walk).'
        : '🚶 Walkthrough Mode — Click floor to walk, drag to look.');
      if (navMode === 'wasd' && !coarse && controls.current) {
        try {
          controls.current.lock();
        } catch (_) {}
      }
    }
    dispatch({ type: 'ENTER' });
    setTimeout(() => {
      switchingViewModeRef.current = false;
    }, 200);
  }, [navMode, coarse]);

  const handleSelectFloor = useCallback((floor) => {
    if (viewMode === 'upside') {
      setSelectedUpsideFloorId(floor.id);
      if (state !== 'welcome') {
        setNotice(`Viewing ${floor.name} structure from above`);
      }
    } else {
      if (floor.id === 'all') return;
      setCurrentFloorId(floor.id);
      setTeleportTarget({
        position: floor.spawn,
        yaw: floor.yaw,
        timestamp: Date.now()
      });
      if (state !== 'welcome') {
        setNotice(`📍 Teleported to ${floor.name}`);
      }
    }
  }, [viewMode, state]);

  const handleEnterWalkthroughAtFloor = useCallback((floor) => {
    switchingViewModeRef.current = true;
    const targetFloor = floor.id === 'all' ? FLOORS[1] : floor;
    setCurrentFloorId(targetFloor.id);
    setTeleportTarget({
      position: targetFloor.spawn,
      yaw: targetFloor.yaw,
      timestamp: Date.now()
    });
    setViewMode('walkthrough');
    dispatch({ type: 'ENTER' });
    setNotice(`📍 Stepped inside ${targetFloor.name}`);
    setTimeout(() => {
      switchingViewModeRef.current = false;
    }, 200);
  }, []);

  useEffect(() => {
    const fail = () => setNotice('Mouse capture was blocked. Open the tour in a browser tab, or use touch / drag controls.');
    const pause = () => { if (document.hidden || !document.hasFocus()) leave('PAUSE'); };
    document.addEventListener('pointerlockerror', fail);
    document.addEventListener('visibilitychange', pause);
    window.addEventListener('blur', pause);
    return () => {
      document.removeEventListener('pointerlockerror', fail);
      document.removeEventListener('visibilitychange', pause);
      window.removeEventListener('blur', pause);
    };
  }, [leave]);

  useEffect(() => {
    const key = e => {
      if (e.target?.matches?.('input, textarea, select, [contenteditable="true"]')) return;
      if (active) {
        if (e.code === 'Escape') leave('PAUSE');
        if (e.code === 'KeyH' || e.key === '?') leave('HELP');
      }
      if (['exploring', 'paused'].includes(state) && (e.code === 'KeyV' || e.code === 'KeyU')) {
        e.preventDefault();
        handleChangeViewMode(viewMode === 'walkthrough' ? 'upside' : 'walkthrough');
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [active, state, leave, viewMode, handleChangeViewMode]);

  const reset = () => {
    setReset(v => v + 1);
    setNotice('Returned to the main living area.');
  };

  const retryScene = () => {
    if (modelUrl) useGLTF.clear(modelUrl);
    setSceneFailed(false);
    setAsset(null);
    setAssetError('');
    dispatch({ type: 'LOAD' });
    setRetry(v => v + 1);
  };

  return (
    <main className={active ? 'app exploring' : 'app'}>
      <div className="scene">
        <ErrorBoundary key={`scene-${retry}`} onRetry={retryScene} onError={() => setSceneFailed(true)}>
          {asset && (
            <TourCanvas
              config={config}
              onBounds={setBounds}
              active={active}
              coarse={coarse}
              touch={touch}
              controls={controls}
              onLock={lock}
              onUnlock={unlock}
              onReady={ready}
              resetVersion={resetVersion}
              onSelect={select}
              targetRef={target}
              telemetry={telemetry}
              lowQuality={lowQuality}
              debug={debug}
              navMode={navMode}
              teleportTarget={teleportTarget}
              onClearTeleport={handleClearTeleport}
              viewMode={viewMode}
              upsideAngle={upsideAngle}
              selectedFloor={viewMode === 'upside' ? getFloorById(selectedUpsideFloorId) : getFloorById(currentFloorId)}
            />
          )}
        </ErrorBoundary>
      </div>

      {state !== 'welcome' && state !== 'loading' && (
        <header className="hud">
          <div className="brand">
            <span className="brand-mark">◩</span>
            <div>
              <strong>HOUSE<span className="brand-slash"> / </span>EXPLORER</strong>
              <small>VIRTUAL WALKTHROUGH</small>
            </div>
          </div>
          <nav aria-label="Tour controls">
            <div className="hud-floor-menu" role="radiogroup" aria-label="Floor selector">
              <span className="hud-floor-label">Floor:</span>
              {(viewMode === 'upside' ? [ALL_FLOORS, ...FLOORS] : FLOORS).map(f => {
                const isSel = (viewMode === 'upside' ? selectedUpsideFloorId : currentFloorId) === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    role="radio"
                    aria-label={f.name}
                    aria-checked={isSel}
                    className={`hud-floor-btn ${isSel ? 'active' : ''}`}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      document.exitPointerLock?.();
                    }}
                    onClick={() => {
                      handleSelectFloor(f);
                      if (['welcome', 'paused'].includes(state)) {
                        dispatch({ type: 'ENTER' });
                      }
                    }}
                    title={`Switch to ${f.name}`}
                  >
                    {f.shortLabel}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              className="upside-btn-nav"
              onPointerDown={(e) => {
                e.stopPropagation();
                document.exitPointerLock?.();
              }}
              onClick={(e) => {
                e.preventDefault();
                handleChangeViewMode(viewMode === 'walkthrough' ? 'upside' : 'walkthrough');
              }}
              title="Toggle between Walkthrough Mode and Upside Structure View (Keyboard: V)"
            >
              {viewMode === 'walkthrough' ? '🏠 Upside View' : '🚶 Walkthrough'} <kbd>V</kbd>
            </button>
            <button
              type="button"
              className="nav-mode-btn nav-mode-display"
              disabled
              aria-disabled="true"
              title={`Active exploration mode: ${navMode === 'wasd' ? 'WASD Walkthrough' : 'Click-to-Move'} (chosen before entering)`}
            >
              {navMode === 'wasd' ? '🕹️ WASD Mode' : '🎯 Click-to-Move'}
            </button>
            <button onClick={() => leave('HELP')}>Help <kbd>?</kbd></button>
            <button onClick={reset} aria-label="Reset to entrance">↺ <span>Reset</span></button>
            <button onClick={() => leave('PAUSE')}>Pause</button>
          </nav>
        </header>
      )}

      {state !== 'welcome' && state !== 'loading' && (
        <div className="demo-label">
          <span /> HOUSE VIRTUAL TOUR — {viewMode === 'upside' ? 'Upside Structure View' : '3D Walkthrough'}
        </div>
      )}

      {active && (
        <>
          <TourMenu
            viewMode={viewMode}
            onChangeViewMode={handleChangeViewMode}
            activeFloorId={viewMode === 'upside' ? selectedUpsideFloorId : currentFloorId}
            onSelectFloor={handleSelectFloor}
            upsideAngle={upsideAngle}
            onChangeUpsideAngle={setUpsideAngle}
            onEnterWalkthroughAtFloor={handleEnterWalkthroughAtFloor}
          />
          {navMode === 'wasd' && !coarse && viewMode === 'walkthrough' && <div className="crosshair" aria-hidden="true">+</div>}
          <div className="bottom-hud">
            <div>
              {viewMode === 'upside' ? (
                <>
                  <span className="nav-hud-icon">🏠</span>
                  <span>Left drag to orbit</span>
                  <span className="divider" />
                  <span>Right drag to pan</span>
                  <span className="divider" />
                  <span>Scroll to zoom</span>
                </>
              ) : navMode === 'wasd' ? (
                <>
                  <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>
                  <span>Move</span>
                  <span className="divider" />
                  Mouse to look
                </>
              ) : (
                <>
                  <span className="nav-hud-icon">🎯</span>
                  <span>Click floor to walk</span>
                  <span className="divider" />
                  <span>Drag mouse to look</span>
                </>
              )}
              <span className="divider" />
              <kbd>V</kbd> View
              <kbd>ESC</kbd> Pause
              <kbd>H</kbd> Help
            </div>
            <span>{viewMode === 'upside' ? 'House Structure View' : 'House Virtual Tour'} <span className="live-dot">●</span></span>
          </div>
          {coarse && <TouchControls input={touch} onInteract={() => target.current && select(target.current)} />}
        </>
      )}

      {state === 'loading' && !assetError && !sceneFailed && (
        <Dialog title="Preparing your walkthrough">
          <p>Loading 3D house model and collision geometry…</p>
          <progress max="100" value={progress || 5} />
          <p className="muted">First load may take a moment to unpack textures.</p>
          <button onClick={retryScene}>Retry loading</button>
        </Dialog>
      )}

      {assetError && (
        <Dialog title="House model could not load">
          <p role="alert">{assetError}</p>
          <p className="muted">Check the asset path and retry.</p>
          <button onClick={retryScene}>Retry GLB</button>
        </Dialog>
      )}

      {state === 'welcome' && (
        <Dialog title="A space to explore." className="welcome" onEscape={welcome}>
          <div className="eyebrow">INTERACTIVE WALKTHROUGH <span>3D TOUR</span></div>
          <p className="intro">Step inside. Look around.<br />Explore at your own pace.</p>
          <p className="muted">
            Choose how you would like to explore the house before stepping inside:
          </p>

          <div className="welcome-view-mode">
            <div className="nav-mode-label">SELECT VIEW MODE</div>
            <div className="view-mode-tabs" role="tablist" aria-label="Starting View Mode">
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === 'walkthrough'}
                className={`welcome-mode-tab ${viewMode === 'walkthrough' ? 'active' : ''}`}
                onClick={() => setViewMode('walkthrough')}
              >
                <span className="welcome-tab-icon">🚶</span>
                <div className="welcome-tab-text">
                  <strong>Inside Walkthrough</strong>
                  <small>First-person walking tour inside rooms</small>
                </div>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={viewMode === 'upside'}
                className={`welcome-mode-tab ${viewMode === 'upside' ? 'active' : ''}`}
                onClick={() => setViewMode('upside')}
              >
                <span className="welcome-tab-icon">🏠</span>
                <div className="welcome-tab-text">
                  <strong>Upside Structure View</strong>
                  <small>Inspect house structure from above (3D/Top-Down)</small>
                </div>
              </button>
            </div>
          </div>

          <div className="welcome-floor-selection">
            <div className="nav-mode-label">
              <span>SELECT STARTING FLOOR</span>
              <span className="welcome-floor-badge">
                {viewMode === 'upside' && selectedUpsideFloorId === 'all'
                  ? ALL_FLOORS.badge
                  : getFloorById(viewMode === 'upside' ? selectedUpsideFloorId : currentFloorId).badge}
              </span>
            </div>
            <div className="welcome-floor-options" role="radiogroup" aria-label="Select Starting Floor">
              {(viewMode === 'upside' ? [ALL_FLOORS, ...FLOORS] : FLOORS).map(f => {
                const isSel = (viewMode === 'upside' ? selectedUpsideFloorId : currentFloorId) === f.id;
                const subLabel = f.id === 'all' ? 'All' : f.name.replace(/\s*Floors?/i, '');
                return (
                  <button
                    key={f.id}
                    type="button"
                    role="radio"
                    aria-label={f.name}
                    aria-checked={isSel}
                    className={`welcome-floor-btn ${isSel ? 'active' : ''}`}
                    onClick={() => {
                      if (viewMode === 'upside') {
                        setSelectedUpsideFloorId(f.id);
                      } else {
                        setCurrentFloorId(f.id);
                      }
                    }}
                  >
                    <strong>{f.shortLabel}</strong>
                    <span>{subLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {viewMode === 'walkthrough' && (
            <div className="nav-mode-selection">
              <div className="nav-mode-label">SELECT EXPLORATION MODE</div>
              <div className="nav-mode-options" role="radiogroup" aria-label="Navigation Mode">
                <button
                  type="button"
                  role="radio"
                  aria-checked={navMode === 'wasd'}
                  className={`nav-mode-card ${navMode === 'wasd' ? 'active' : ''}`}
                  onClick={() => setNavMode('wasd')}
                >
                  <div className="nav-card-top">
                    <span className="nav-card-icon">🕹️</span>
                    <span className="nav-card-badge">{navMode === 'wasd' ? 'Selected' : 'Choose'}</span>
                  </div>
                  <strong className="nav-card-title">WASD Walkthrough</strong>
                  <span className="nav-card-desc">Keyboard keys to walk freely, mouse to look around in first person.</span>
                </button>

                <button
                  type="button"
                  role="radio"
                  aria-checked={navMode === 'click'}
                  className={`nav-mode-card ${navMode === 'click' ? 'active' : ''}`}
                  onClick={() => setNavMode('click')}
                >
                  <div className="nav-card-top">
                    <span className="nav-card-icon">🎯</span>
                    <span className="nav-card-badge">{navMode === 'click' ? 'Selected' : 'Choose'}</span>
                  </div>
                  <strong className="nav-card-title">Click-to-Move</strong>
                  <span className="nav-card-desc">Click any floor surface to walk there with beacon guidance. Drag to look.</span>
                </button>
              </div>
            </div>
          )}

          <div className="controls-grid">
            {viewMode === 'upside' ? (
              <>
                <div>
                  <span className="control-symbol" style={{ fontSize: '28px' }}>🔄</span>
                  <strong>Orbit Structure</strong>
                  <small>Left-drag mouse to rotate</small>
                </div>
                <div>
                  <span className="control-symbol">↔</span>
                  <strong>Pan across rooms</strong>
                  <small>Right-drag to pan</small>
                </div>
                <div>
                  <span className="control-symbol" style={{ fontSize: '24px' }}>🔍</span>
                  <strong>Zoom in / out</strong>
                  <small>Scroll wheel to zoom</small>
                </div>
              </>
            ) : navMode === 'wasd' ? (
              <>
                <div>
                  <span className="key-cluster"><kbd>W</kbd><br /><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></span>
                  <strong>Move naturally</strong>
                  <small>Walk with your keyboard</small>
                </div>
                <div>
                  <span className="control-symbol">↔</span>
                  <strong>Take a look</strong>
                  <small>Move your mouse to look</small>
                </div>
                <div>
                  <span className="control-symbol"><kbd>ESC</kbd></span>
                  <strong>Your own pace</strong>
                  <small>Pause whenever you like</small>
                </div>
              </>
            ) : (
              <>
                <div>
                  <span className="control-symbol" style={{ fontSize: '28px' }}>🎯</span>
                  <strong>Point & Click</strong>
                  <small>Click floors or stairs</small>
                </div>
                <div>
                  <span className="control-symbol">↔</span>
                  <strong>Drag to look</strong>
                  <small>Click & drag mouse to rotate</small>
                </div>
                <div>
                  <span className="control-symbol"><kbd>ESC</kbd></span>
                  <strong>Your own pace</strong>
                  <small>Pause whenever you like</small>
                </div>
              </>
            )}
          </div>

          <button className="primary enter" onClick={enter}>
            <span>
              {viewMode === 'upside'
                ? `Look House Structure from Upside View (${(selectedUpsideFloorId === 'all' ? ALL_FLOORS : getFloorById(selectedUpsideFloorId)).name})`
                : `Enter House ${navMode === 'wasd' ? '(WASD Walkthrough)' : '(Click-to-Move)'}`}
            </span>
            <span>↗</span>
          </button>

          {viewMode === 'walkthrough' && (
            <button
              type="button"
              className="welcome-upside-shortcut"
              onClick={() => {
                setViewMode('upside');
                const f = getFloorById(selectedUpsideFloorId);
                if (f.id !== 'all') {
                  setTeleportTarget({ position: f.spawn, yaw: f.yaw, timestamp: Date.now() });
                }
                lock();
                setNotice(`🏠 Viewing ${f.name} structure from above`);
              }}
            >
              <span>🏠 Or look at the house structure from the upside view</span>
              <span>→</span>
            </button>
          )}

          <div className="welcome-links">
            <button onClick={() => setCoarse(v => !v)}>
              {coarse ? 'Use keyboard + mouse' : 'Use touch / drag controls'}
            </button>
          </div>
          <div className="welcome-foot">
            <span>●</span> HOUSE VIRTUAL TOUR · High-fidelity 3D Walkthrough
            <span className="foot-right">DESKTOP + TOUCH</span>
          </div>
        </Dialog>
      )}

      {['paused', 'help'].includes(state) && (
        <Dialog title={state === 'help' ? 'Make yourself at home.' : 'Take a moment.'} onEscape={welcome}>
          <p>
            {state === 'help'
              ? (viewMode === 'upside'
                ? 'Left-drag to orbit around the house structure. Right-drag to pan. Scroll to zoom. Use floor buttons to slice floors. Escape resumes.'
                : navMode === 'wasd'
                  ? 'WASD or arrow keys to walk. Mouse to look. Click a blue marker within range to inspect. Escape pauses.'
                  : 'Click or tap on the floor/stairs to walk there. Drag the mouse to look around. Escape pauses.')
              : 'Your place is saved. Resume whenever you’re ready.'}
          </p>

          <div className="pause-mode-switch">
            <span className="pause-mode-label">View mode:</span>
            <div className="pause-mode-buttons">
              <button
                type="button"
                className={viewMode === 'walkthrough' ? 'active' : ''}
                onClick={() => handleChangeViewMode('walkthrough')}
              >
                🚶 Walkthrough
              </button>
              <button
                type="button"
                className={viewMode === 'upside' ? 'active' : ''}
                onClick={() => handleChangeViewMode('upside')}
              >
                🏠 Upside View
              </button>
            </div>
          </div>

          <div className="pause-mode-switch">
            <span className="pause-mode-label">Floor level:</span>
            <div className="pause-mode-buttons">
              {(viewMode === 'upside' ? [ALL_FLOORS, ...FLOORS] : FLOORS).map(f => {
                const isSel = (viewMode === 'upside' ? selectedUpsideFloorId : currentFloorId) === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    className={isSel ? 'active' : ''}
                    onClick={() => handleSelectFloor(f)}
                  >
                    {f.shortLabel}
                  </button>
                );
              })}
            </div>
          </div>

          {viewMode === 'walkthrough' && (
            <div className="pause-mode-switch">
              <span className="pause-mode-label">Exploration style:</span>
              <div className="pause-mode-buttons">
                <button
                  type="button"
                  className={navMode === 'wasd' ? 'active' : ''}
                  onClick={() => setNavMode('wasd')}
                >
                  🕹️ WASD Mode
                </button>
                <button
                  type="button"
                  className={navMode === 'click' ? 'active' : ''}
                  onClick={() => setNavMode('click')}
                >
                  🎯 Click-to-Move
                </button>
              </div>
            </div>
          )}

          <p className="muted">Touch: drag the left pad to move, the right pad to look, then tap Inspect.</p>
          <button className="primary" onClick={enter}>Resume tour →</button>
          <div className="button-row">
            <button onClick={reset}>Reset to entrance</button>
            <button onClick={() => leave('HELP')}>Controls</button>
            <button onClick={welcome}>Exit tour</button>
          </div>
          <label className="setting">
            <input type="checkbox" checked={lowQuality} onChange={e => setLowQuality(e.target.checked)} /> Reduced graphics quality
          </label>
        </Dialog>
      )}

      {state === 'info' && selected && (
        <MatterportCard
          hotspot={selected}
          onClose={enter}
        />
      )}

      {debug && bounds && (
        <aside className="inspector">
          <strong>GLB Inspector · meters / Y-up</strong>
          <p>Size X/Y/Z: {bounds.size.map(n => n.toFixed(2)).join(' / ')}</p>
          <p>Min: {bounds.min.map(n => n.toFixed(2)).join(' / ')}<br />Max: {bounds.max.map(n => n.toFixed(2)).join(' / ')}</p>
          <p>{asset?.megabytes} MB · {bounds.meshes} meshes · {bounds.triangles.toLocaleString()} triangles</p>
        </aside>
      )}

      {notice && state !== 'welcome' && (
        <div className="notice" role="status">
          {notice}
          <button aria-label="Dismiss message" onClick={() => setNotice('')}>×</button>
        </div>
      )}
    </main>
  );
}
