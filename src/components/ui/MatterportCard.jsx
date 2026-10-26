import { useEffect, useState } from 'react';

export default function MatterportCard({ hotspot, onClose }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!hotspot) return null;

  const handleShare = async (e) => {
    e.stopPropagation();
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // fallback
    }
  };

  return (
    <div
      className="mp-card-scrim"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="mp-card-title"
    >
      <div className="mp-card-wrapper" onClick={(e) => e.stopPropagation()}>
        <article className="mp-card">
          {/* 1. Header Media / Showcase Photo */}
          <div className="mp-card-media">
            <img
              src={hotspot.image || '/images/hotspots/living_room.jpg'}
              alt={hotspot.title}
              className="mp-card-img"
              loading="lazy"
            />
            <div className="mp-card-media-overlay" />

            {/* Action buttons on top of image */}
            <div className="mp-card-actions">
              <button
                type="button"
                className="mp-action-btn"
                onClick={handleShare}
                title={copied ? 'Link copied!' : 'Share point of interest'}
                aria-label="Share"
              >
                {copied ? (
                  <span className="mp-copied-indicator">✓</span>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                )}
              </button>

              <button
                type="button"
                className="mp-action-btn"
                title="Fullscreen view"
                aria-label="View photo"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(hotspot.image || '/images/hotspots/living_room.jpg', '_blank');
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h6v6" />
                  <path d="M9 21H3v-6" />
                  <path d="M21 3l-7 7" />
                  <path d="M3 21l7-7" />
                </svg>
              </button>

              <button
                type="button"
                className="mp-action-btn mp-close-btn"
                onClick={onClose}
                title="Close (Esc)"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Matterport pagination indicators */}
            <div className="mp-card-dots" aria-hidden="true">
              <span className="mp-dot active" />
              <span className="mp-dot" />
              <span className="mp-dot" />
            </div>
          </div>

          {/* 2. Content Body */}
          <div className="mp-card-body">
            <div className="mp-card-meta">
              <span
                className="mp-card-category"
                style={{ color: hotspot.color || 'var(--accent)' }}
              >
                ● {hotspot.category || 'FEATURED POINT'}
              </span>
              {copied && <span className="mp-copy-notice">Link copied to clipboard!</span>}
            </div>

            <h1 id="mp-card-title" className="mp-card-title">{hotspot.title}</h1>
            {hotspot.subtitle && <p className="mp-card-subtitle">{hotspot.subtitle}</p>}

            <p className="mp-card-desc">{hotspot.description}</p>

            <div className="mp-card-footer">
              <button
                type="button"
                className="primary mp-resume-btn"
                onClick={onClose}
              >
                Resume tour
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
