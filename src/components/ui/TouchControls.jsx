import { useRef } from 'react';
export default function TouchControls({ input, onInteract }) {
  const origin = useRef(null), look = useRef(null);
  const stop = () => { origin.current = null; input.current.x = 0; input.current.z = 0; };
  return <div className="touch-controls">
    <div className="joystick" role="group" aria-label="Drag to move" onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); origin.current = [e.clientX, e.clientY]; }} onPointerMove={e => { if (!origin.current) return; input.current.x = Math.max(-1, Math.min(1, (e.clientX - origin.current[0]) / 40)); input.current.z = Math.max(-1, Math.min(1, (origin.current[1] - e.clientY) / 40)); }} onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop}><span>↕<br />↔</span><small>MOVE</small></div>
    <div className="look-pad" role="group" aria-label="Drag to look" onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); look.current = [e.clientX, e.clientY]; }} onPointerMove={e => { if (!look.current) return; input.current.lookX += e.clientX - look.current[0]; input.current.lookY += e.clientY - look.current[1]; look.current = [e.clientX, e.clientY]; }} onPointerUp={() => { look.current = null; }} onPointerCancel={() => { look.current = null; }} onLostPointerCapture={() => { look.current = null; }}><span>Drag to look</span></div>
    <button className="touch-interact" onClick={onInteract}>Inspect</button>
  </div>;
}
