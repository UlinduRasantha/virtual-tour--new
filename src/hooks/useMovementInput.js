import { useEffect, useRef } from 'react';
export const isTextInput = node => node?.matches?.('input, textarea, select, [contenteditable="true"]');
export default function useMovementInput(active, touch) {
  const keys = useRef(new Set());
  useEffect(() => {
    const clear = () => { keys.current.clear(); touch.current.x = 0; touch.current.z = 0; };
    const lockChange = () => { if (!document.pointerLockElement) clear(); };
    const down = e => {
      if (!active || isTextInput(e.target)) return;
      if (['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) { e.preventDefault(); keys.current.add(e.code); }
    };
    const up = e => keys.current.delete(e.code);
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    window.addEventListener('blur', clear); document.addEventListener('visibilitychange', clear); document.addEventListener('pointerlockchange', lockChange);
    return () => { clear(); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', clear); document.removeEventListener('visibilitychange', clear); document.removeEventListener('pointerlockchange', lockChange); };
  }, [active, touch]);
  return keys;
}
