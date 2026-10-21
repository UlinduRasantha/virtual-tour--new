import { render, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ClickToMove from '../components/scene/ClickToMove.jsx';
import { PerspectiveCamera, Scene, Vector3, Mesh, PlaneGeometry, MeshBasicMaterial } from 'three';

vi.mock('@react-three/fiber', () => ({
  useThree: vi.fn(),
  useFrame: vi.fn()
}));

import { useThree } from '@react-three/fiber';

describe('ClickToMove drag vs click', () => {
  let domElement;
  let camera;
  let scene;
  let raycaster;
  let onTarget;
  let onClearTarget;

  beforeEach(() => {
    domElement = document.createElement('canvas');
    domElement.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 800,
      height: 600
    });
    document.body.appendChild(domElement);

    camera = new PerspectiveCamera(60, 800 / 600, 0.1, 100);
    camera.position.set(0, 1.6, 0);

    scene = new Scene();
    // Create a walkable floor mesh at y = 0
    const floorGeo = new PlaneGeometry(20, 20);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMesh = new Mesh(floorGeo, new MeshBasicMaterial());
    scene.add(floorMesh);

    raycaster = {
      setFromCamera: vi.fn(),
      intersectObjects: vi.fn().mockReturnValue([
        {
          object: floorMesh,
          point: new Vector3(0, 0, -2),
          face: { normal: new Vector3(0, 1, 0) }
        }
      ])
    };

    useThree.mockReturnValue({
      camera,
      scene,
      gl: { domElement },
      raycaster
    });

    onTarget = vi.fn();
    onClearTarget = vi.fn();
  });

  afterEach(() => {
    cleanup();
    domElement.remove();
    vi.clearAllMocks();
  });

  function dispatchPointer(target, type, props = {}) {
    const event = new Event(type, { bubbles: true, cancelable: true });
    Object.assign(event, {
      button: 0,
      clientX: 0,
      clientY: 0,
      ...props
    });
    target.dispatchEvent(event);
  }

  it('triggers movement on a clean click on the floor', () => {
    render(
      <ClickToMove
        active={true}
        navMode="click"
        target={null}
        onTarget={onTarget}
        onClearTarget={onClearTarget}
      />
    );

    // Clean click: pointerdown and pointerup without moving
    dispatchPointer(domElement, 'pointerdown', { button: 0, clientX: 400, clientY: 300 });
    dispatchPointer(window, 'pointerup', { button: 0, clientX: 400, clientY: 300 });
    dispatchPointer(domElement, 'click', { button: 0, clientX: 400, clientY: 300 });

    expect(onTarget).toHaveBeenCalledTimes(1);
    expect(onTarget).toHaveBeenCalledWith({ x: 0, y: 0, z: -2 });
  });

  it('prevents movement when user drags mouse to look around and then releases', () => {
    render(
      <ClickToMove
        active={true}
        navMode="click"
        target={null}
        onTarget={onTarget}
        onClearTarget={onClearTarget}
      />
    );

    // Drag to look around: pointerdown, move mouse > 6px, pointerup, click
    dispatchPointer(domElement, 'pointerdown', { button: 0, clientX: 400, clientY: 300 });
    dispatchPointer(window, 'pointermove', { clientX: 450, clientY: 320 });
    dispatchPointer(window, 'pointermove', { clientX: 500, clientY: 330 });
    dispatchPointer(window, 'pointerup', { button: 0, clientX: 500, clientY: 330 });
    dispatchPointer(domElement, 'click', { button: 0, clientX: 500, clientY: 330 });

    // Must NOT move player
    expect(onTarget).not.toHaveBeenCalled();
  });

  it('prevents movement on right-click drag or release', () => {
    render(
      <ClickToMove
        active={true}
        navMode="click"
        target={null}
        onTarget={onTarget}
        onClearTarget={onClearTarget}
      />
    );

    // Right-click drag
    dispatchPointer(domElement, 'pointerdown', { button: 2, clientX: 400, clientY: 300 });
    dispatchPointer(window, 'pointermove', { clientX: 450, clientY: 320 });
    dispatchPointer(window, 'pointerup', { button: 2, clientX: 450, clientY: 320 });

    expect(onTarget).not.toHaveBeenCalled();
  });
});
