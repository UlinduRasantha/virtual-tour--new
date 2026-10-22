import { useState } from 'react';

function Chevron({ open }) {
  return (
    <svg className={open ? 'floor-chevron open' : 'floor-chevron'} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function FloorMenu({ floors, hotspots, onGoTo }) {
  const [openFloor, setOpenFloor] = useState(floors[1]?.id ?? floors[0]?.id);
  const [collapsed, setCollapsed] = useState(() => window.matchMedia?.('(max-width: 650px)').matches || false);

  return (
    <aside className={collapsed ? 'floor-menu collapsed' : 'floor-menu'} aria-label="Floors">
      <button
        type="button"
        className="floor-menu-toggle"
        aria-expanded={!collapsed}
        onClick={() => setCollapsed(v => !v)}
      >
        Floors <Chevron open={!collapsed} />
      </button>

      {!collapsed && (
        <ul className="floor-list">
          {floors.map(floor => {
            const items = hotspots.filter(h => h.floor === floor.id);
            const open = openFloor === floor.id;
            const listId = `floor-${floor.id}-locations`;
            return (
              <li key={floor.id} className="floor-entry">
                <button
                  type="button"
                  className="floor-row"
                  aria-expanded={open}
                  aria-controls={listId}
                  onClick={() => setOpenFloor(open ? null : floor.id)}
                >
                  <span>{floor.label}</span>
                  {items.length > 0 && <Chevron open={open} />}
                </button>
                {open && items.length > 0 && (
                  <ul id={listId} className="floor-locations">
                    {items.map(item => (
                      <li key={item.id}>
                        <button type="button" className="floor-location" onClick={() => onGoTo(item)}>
                          {item.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
