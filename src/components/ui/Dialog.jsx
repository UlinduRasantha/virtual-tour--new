import { useEffect, useRef } from 'react';
export default function Dialog({ title, children, onEscape, className = '' }) {
  const panel = useRef();
  useEffect(() => {
    const previous = document.activeElement;
    const element = panel.current;
    element.querySelector('button')?.focus();
    const key = e => {
      if (e.key === 'Escape') { e.preventDefault(); onEscape?.(); }
      if (e.key !== 'Tab') return;
      const buttons = [...element.querySelectorAll('button:not(:disabled), a[href], input, select, [tabindex="0"]')];
      if (!buttons.length) { e.preventDefault(); return; }
      const first = buttons[0], last = buttons.at(-1);
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    element.addEventListener('keydown', key);
    return () => { element.removeEventListener('keydown', key); if (previous?.isConnected) previous.focus(); };
  }, [onEscape]);
  return <div className="scrim"><section ref={panel} className={`dialog ${className}`} role="dialog" aria-modal="true" aria-labelledby="dialog-title"><h1 id="dialog-title">{title}</h1>{children}</section></div>;
}
