import { describe, test, expect } from 'vitest';
import { HOUSE } from '../config/house.config.js';
import { validateOfficeConfig } from '../utils/validateOfficeConfig.js';
import { halfExtents, movementVector } from '../utils/geometryUtils.js';
import { tourReducer } from '../utils/tourState.js';

describe('spatial configuration', () => {
  test('main house configuration is valid and matches My whole frickin house.glb', () => {
    expect(HOUSE.modelUrl).toBe('/models/My whole frickin house.glb');
    expect(HOUSE.sceneMode).toBe('house');
    expect(HOUSE.colliders.length).toBeGreaterThan(10);
    expect(validateOfficeConfig(HOUSE)).toEqual([]);
  });

  test('normalizes diagonals and rotates movement with heading', () => {
    const forward = movementVector(0, 1, 0, 2.7), diagonal = movementVector(1, 1, 0, 2.7);
    expect(forward.z).toBeCloseTo(-0.045);
    expect(Math.hypot(diagonal.x, diagonal.z)).toBeCloseTo(0.045);
    expect(movementVector(0, 1, Math.PI / 2, 2.7).x).toBeCloseTo(-0.045);
    expect(halfExtents([2, 4, 6])).toEqual([1, 2, 3]);
  });

  test('tour state transitions work properly', () => {
    expect(tourReducer('exploring', { type: 'PAUSE' })).toBe('paused');
    expect(tourReducer('info', { type: 'PAUSE' })).toBe('info');
    expect(tourReducer('loading', { type: 'ENTER' })).toBe('loading');
    expect(tourReducer('paused', { type: 'ENTER' })).toBe('exploring');
  });
});
