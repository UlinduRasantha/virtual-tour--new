import { fireEvent, renderHook, cleanup } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import useMovementInput from '../hooks/useMovementInput.js';
afterEach(cleanup);
test('clears held movement on blur, visibility, unlock, pause, and ignores text focus', () => {
  const touch = { current: { x: 0, z: 0 } };
  const { result, rerender } = renderHook(({ active }) => useMovementInput(active, touch), { initialProps: { active: true } });
  for (const event of ['blur', 'visibilitychange', 'pointerlockchange']) {
    fireEvent.keyDown(window, { code: 'KeyW' }); expect(result.current.current.has('KeyW')).toBe(true);
    fireEvent(event === 'blur' ? window : document, new Event(event)); expect(result.current.current.size).toBe(0);
  }
  fireEvent.keyDown(window, { code: 'KeyW' }); rerender({ active: false }); expect(result.current.current.size).toBe(0);
  rerender({ active: true }); const input = document.createElement('input'); document.body.append(input);
  fireEvent.keyDown(input, { code: 'KeyW' }); expect(result.current.current.size).toBe(0); input.remove();
});
test('acquiring pointer lock does not clear a newly held movement key', () => {
  const touch = { current: { x: 0, z: 0 } };
  const { result } = renderHook(() => useMovementInput(true, touch));
  fireEvent.keyDown(window, { code: 'KeyW' });
  Object.defineProperty(document, 'pointerLockElement', { configurable: true, value: document.body });
  try {
    fireEvent(document, new Event('pointerlockchange'));
    expect(result.current.current.has('KeyW')).toBe(true);
  } finally { delete document.pointerLockElement; }
  fireEvent(document, new Event('pointerlockchange'));
  expect(result.current.current.size).toBe(0);
});
