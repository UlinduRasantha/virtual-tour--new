import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { useGLTF, useProgress } from '@react-three/drei';
import TourCanvas from '../components/scene/TourCanvas.jsx';
import Dialog from '../components/ui/Dialog.jsx';
import MatterportCard from '../components/ui/MatterportCard.jsx';
import TouchControls from '../components/ui/TouchControls.jsx';
import FloorMenu from '../components/ui/FloorMenu.jsx';
import ErrorBoundary from '../components/ui/ErrorBoundary.jsx';
import { HOUSE } from '../config/house.config.js';
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

  const controls = useRef();
  const target = useRef();
  const telemetry = useRef({});
  const touch = useRef({ x: 0, z: 0, lookX: 0, lookY: 0 });
  const { progress } = useProgress();

  const active = state === 'exploring';
  const debug = new URLSearchParams(location.search).get('debug') === 'colliders';

  const ready = useCallback(() => dispatch({ type: 'READY' }), []);
  const lock = useCallback(() => { setNotice(''); dispatch({ type: 'ENTER' }); }, []);
  const unlock = useCallback(() => dispatch({ type: 'PAUSE' }), []);
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

  const goToLocation = useCallback((item) => {
    const target = item.teleport || {
      position: [
        item.position[0],
        item.position[1] >= 2.5 ? 3.80 : (item.position[1] <= -0.5 ? -1.65 : 0.85),
        item.position[2]
      ],
      yaw: 0
    };
    setTeleportTarget({ ...target, timestamp: Date.now() });
    enter();
    setNotice(`📍 Arrived at ${item.title}`);
  }, [enter]);

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
      if (!active || e.target?.matches?.('input, textarea, select, [contenteditable="true"]')) return;
      if (e.code === 'Escape') leave('PAUSE');
      if (e.code === 'KeyH' || e.key === '?') leave('HELP');
      if (e.code === 'KeyL') leave('LOCATIONS');
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [active, leave]);

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
            />
          )}
        </ErrorBoundary>
      </div>

      <header className="hud" inert={!active} aria-hidden={!active}>
        <div className="brand">
          <span className="brand-mark">◩</span>
          <div>
            <strong>HOUSE<span className="brand-slash"> / </span>EXPLORER</strong>
            <small>VIRTUAL WALKTHROUGH</small>
          </div>
        </div>
        <nav aria-label="Tour controls">
          <button
            type="button"
            className="nav-mode-btn nav-mode-display"
            disabled
            aria-disabled="true"
            title={`Active exploration mode: ${navMode === 'wasd' ? 'WASD Walkthrough' : 'Click-to-Move'} (chosen before entering)`}
          >
            {navMode === 'wasd' ? '🕹️ WASD Mode' : '🎯 Click-to-Move'}
          </button>
          <button onClick={() => leave('LOCATIONS')}>Locations</button>
          <button onClick={() => leave('HELP')}>Help <kbd>?</kbd></button>
          <button onClick={reset} aria-label="Reset to entrance">↺ <span>Reset</span></button>
          <button onClick={() => leave('PAUSE')}>Pause</button>
        </nav>
      </header>

      <div className="demo-label">
        <span /> HOUSE VIRTUAL TOUR — 3D Walkthrough
      </div>

      {(active || state === 'paused') && config.floors?.length > 0 && (
        <FloorMenu floors={config.floors} hotspots={config.hotspots} onGoTo={goToLocation} />
      )}

      {active && (
        <>
          {navMode === 'wasd' && !coarse && <div className="crosshair" aria-hidden="true">+</div>}
          <div className="bottom-hud">
            <div>
              {navMode === 'wasd' ? (
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
              <kbd>ESC</kbd> Pause
              <kbd>H</kbd> Help
              <kbd>L</kbd> Locations
            </div>
            <span>House Virtual Tour <span className="live-dot">●</span></span>
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

          <div className="controls-grid">
            {navMode === 'wasd' ? (
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
            <span>Enter House {navMode === 'wasd' ? '(WASD Walkthrough)' : '(Click-to-Move)'}</span>
            <span>↗</span>
          </button>
          <div className="welcome-links">
            <button onClick={() => setCoarse(v => !v)}>
              {coarse ? 'Use keyboard + mouse' : 'Use touch / drag controls'}
            </button>
          </div>
          <div className="welcome-foot">
            <span>●</span> House Virtual Tour · High-fidelity 3D Walkthrough
            <span className="foot-right">DESKTOP + TOUCH</span>
          </div>
        </Dialog>
      )}

      {['paused', 'help'].includes(state) && (
        <Dialog title={state === 'help' ? 'Make yourself at home.' : 'Take a moment.'} onEscape={welcome}>
          <p>
            {state === 'help'
              ? (navMode === 'wasd'
                ? 'WASD or arrow keys to walk. Mouse to look. Click a blue marker within range to inspect. Escape pauses.'
                : 'Click or tap on the floor/stairs to walk there. Drag the mouse to look around. Escape pauses.')
              : 'Your place is saved. Resume whenever you’re ready.'}
          </p>
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

      {state === 'locations' && (
        <Dialog title="House Locations" onEscape={welcome}>
          <p className="muted">Points of interest in the house:</p>
          <div className="locations-list">
            {config.hotspots.map(item => (
              <div className="location-row" key={item.id}>
                <button
                  type="button"
                  className="location-item"
                  onClick={() => select(item)}
                  title={`View details for ${item.title}`}
                >
                  <div className="location-item-info">
                    <span className="location-title">{item.title}</span>
                    {item.category && <span className="location-category">{item.category}</span>}
                  </div>
                  <span className="location-readmore">Read more →</span>
                </button>
                <button
                  type="button"
                  className="location-go-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    goToLocation(item);
                  }}
                  title={`Go directly to ${item.title}`}
                >
                  <span className="location-go-icon">📍</span>
                  <span>Go to location</span>
                </button>
              </div>
            ))}
          </div>
          {!config.hotspots.length && <p>No locations configured.</p>}
          <button className="primary" onClick={enter}>Resume tour</button>
        </Dialog>
      )}

      {state === 'info' && selected && (
        <MatterportCard
          hotspot={selected}
          onClose={enter}
          onLocations={() => leave('LOCATIONS')}
          onGoTo={goToLocation}
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

      {notice && (
        <div className="notice" role="status">
          {notice}
          <button aria-label="Dismiss message" onClick={() => setNotice('')}>×</button>
        </div>
      )}
    </main>
  );
}
