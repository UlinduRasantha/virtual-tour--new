import { useState } from 'react';
import { FLOORS, ALL_FLOORS } from '../../config/floors.config.js';

export default function TourMenu({
  viewMode = 'walkthrough',
  onChangeViewMode,
  activeFloorId = 'main',
  onSelectFloor,
  upsideAngle = 'angle',
  onChangeUpsideAngle,
  onEnterWalkthroughAtFloor
}) {
  const [collapsed, setCollapsed] = useState(false);

  const isUpside = viewMode === 'upside';
  const availableFloors = isUpside ? [ALL_FLOORS, ...FLOORS] : FLOORS;
  const currentFloor = isUpside && activeFloorId === 'all'
    ? ALL_FLOORS
    : (FLOORS.find(f => f.id === activeFloorId) || FLOORS[1]);

  return (
    <aside
      className={`tour-menu ${collapsed ? 'collapsed' : ''}`}
      aria-label="Floor and view mode controls"
    >
      {/* Top Header / Mode Switcher */}
      <div className="tour-menu-header">
        <div className="view-mode-toggle" role="tablist" aria-label="Tour View Modes">
          <button
            type="button"
            role="tab"
            aria-selected={!isUpside}
            className={`mode-toggle-btn ${!isUpside ? 'active' : ''}`}
            onClick={() => onChangeViewMode('walkthrough')}
            title="First-Person Walkthrough (WASD or Click-to-Move inside the house)"
          >
            <span className="mode-icon">🚶</span>
            <span className="mode-text">Walk</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={isUpside}
            className={`mode-toggle-btn ${isUpside ? 'active' : ''}`}
            onClick={() => onChangeViewMode('upside')}
            title="Upside View — Inspect the house structure from above with 3D Orbit controls"
          >
            <span className="mode-icon">🏠</span>
            <span className="mode-text">Upside View</span>
          </button>
        </div>

        <button
          type="button"
          className="menu-collapse-btn"
          onClick={() => setCollapsed(v => !v)}
          aria-expanded={!collapsed}
          title={collapsed ? 'Expand menu' : 'Collapse menu'}
        >
          {collapsed ? '▲' : '▼'}
        </button>
      </div>

      {!collapsed && (
        <div className="tour-menu-body">
          {/* Floor Switcher Section */}
          <div className="menu-section">
            <div className="menu-section-label">
              <span>FLOOR LEVEL</span>
              <span className="floor-badge">{currentFloor.badge}</span>
            </div>

            <div className="floor-selector-row" role="radiogroup" aria-label="Select Floor">
              {availableFloors.map(floor => {
                const isSelected = activeFloorId === floor.id;
                const subLabel = floor.id === 'all' ? 'All' : floor.name.replace(/\s*Floors?/i, '');
                return (
                  <button
                    key={floor.id}
                    type="button"
                    role="radio"
                    aria-label={floor.name}
                    aria-checked={isSelected}
                    className={`floor-btn ${isSelected ? 'active' : ''}`}
                    onClick={() => onSelectFloor(floor)}
                    title={`${floor.name} (${floor.description})`}
                  >
                    <span className="floor-num">{floor.shortLabel}</span>
                    <span className="floor-name-sub">{subLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Upside View Controls Toolbar */}
          {isUpside && (
            <div className="menu-section upside-controls">
              <div className="menu-section-label">
                <span>CAMERA ANGLE</span>
                <span className="mode-hint">DRAG TO ORBIT</span>
              </div>

              <div className="angle-selector-row">
                <button
                  type="button"
                  className={`angle-btn ${upsideAngle === 'top' ? 'active' : ''}`}
                  onClick={() => onChangeUpsideAngle('top')}
                  title="Overhead Plan View — Look directly straight down at the house structure"
                >
                  <span>📐</span> Top-Down
                </button>
                <button
                  type="button"
                  className={`angle-btn ${upsideAngle === 'angle' ? 'active' : ''}`}
                  onClick={() => onChangeUpsideAngle('angle')}
                  title="3D Perspective — Isometric dollhouse angle of the house structure"
                >
                  <span>🧊</span> 3D Angle
                </button>
              </div>

              <button
                type="button"
                className="jump-inside-btn"
                onClick={() => onEnterWalkthroughAtFloor(currentFloor)}
                title={`Enter first-person walkthrough on ${currentFloor.name}`}
              >
                <span>🚶 Step Inside {currentFloor.id === 'all' ? 'House' : currentFloor.name}</span>
                <span>→</span>
              </button>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
