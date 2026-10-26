import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { test, expect, vi, afterEach, beforeEach } from 'vitest';
import App from '../app/App.jsx';
import { FLOORS, ALL_FLOORS, getFloorByElevation, getFloorById } from '../config/floors.config.js';

vi.mock('@react-three/drei', () => ({
  useProgress: () => ({ progress: 100 }),
  useGLTF: { clear: vi.fn() }
}));

vi.mock('../utils/inspectAsset.js', () => ({
  inspectAsset: vi.fn().mockResolvedValue({ bytes: 42806372, megabytes: '40.82' })
}));

vi.mock('../components/scene/TourCanvas.jsx', async () => {
  const { useEffect } = await import('react');
  return {
    default: function MockCanvas({ onReady, viewMode, selectedFloor, upsideAngle }) {
      useEffect(onReady, [onReady]);
      return (
        <div data-testid="mock-canvas">
          <span data-testid="canvas-viewmode">{viewMode}</span>
          <span data-testid="canvas-floor">{selectedFloor?.id}</span>
          <span data-testid="canvas-angle">{upsideAngle}</span>
        </div>
      );
    }
  };
});

afterEach(cleanup);
beforeEach(() => history.replaceState(null, '', '/'));

test('floors configuration correctly classifies elevations and IDs', () => {
  expect(getFloorByElevation(3.5).id).toBe('upper');
  expect(getFloorByElevation(0.85).id).toBe('main');
  expect(getFloorByElevation(-1.65).id).toBe('basement');

  expect(getFloorById('all').id).toBe('all');
  expect(getFloorById('upper').name).toBe('Upper Floor');
  expect(getFloorById('main').name).toBe('Main Floor');
  expect(getFloorById('basement').name).toBe('Basement');
});

test('small menu allows user to switch between floors in walkthrough mode', async () => {
  render(<App />);
  const enterBtn = await screen.findByRole('button', { name: /Enter House/ });
  fireEvent.click(screen.getByRole('button', { name: /Use touch/ }));
  fireEvent.click(enterBtn);

  // Menu is present
  const tourMenu = screen.getByRole('complementary', { name: /Floor and view mode controls/ });
  expect(tourMenu).toBeInTheDocument();

  // Floor buttons inside tour menu
  const upperFloorBtn = within(tourMenu).getByRole('radio', { name: /Upper Floor/ });
  const mainFloorBtn = within(tourMenu).getByRole('radio', { name: /Main Floor/ });
  const basementBtn = within(tourMenu).getByRole('radio', { name: /Basement/ });

  expect(upperFloorBtn).toBeInTheDocument();
  expect(mainFloorBtn).toBeInTheDocument();
  expect(basementBtn).toBeInTheDocument();

  // Main floor is initially active
  expect(mainFloorBtn).toHaveAttribute('aria-checked', 'true');

  // Switch to Upper Floor
  fireEvent.click(upperFloorBtn);
  expect(screen.getByText(/Teleported to Upper Floor/)).toBeInTheDocument();

  // Switch to Basement
  fireEvent.click(basementBtn);
  expect(screen.getByText(/Teleported to Basement/)).toBeInTheDocument();
});

test('allows user to switch to upside structure view and toggle angles', async () => {
  render(<App />);
  const enterBtn = await screen.findByRole('button', { name: /Enter House/ });
  fireEvent.click(screen.getByRole('button', { name: /Use touch/ }));
  fireEvent.click(enterBtn);

  // Click Upside View in the small menu
  const tourMenu = screen.getByRole('complementary', { name: /Floor and view mode controls/ });
  const upsideTab = within(tourMenu).getByRole('tab', { name: /Upside View/ });
  fireEvent.click(upsideTab);

  expect(screen.getByTestId('canvas-viewmode')).toHaveTextContent('upside');
  expect(screen.getByText(/Upside View — Drag mouse to orbit/)).toBeInTheDocument();

  // When in upside view, "All Floors" option is available in the tour menu
  const allFloorsBtn = within(tourMenu).getByRole('radio', { name: /All Floors/ });
  expect(allFloorsBtn).toBeInTheDocument();

  // Camera angle controls are displayed
  const topDownBtn = within(tourMenu).getByRole('button', { name: /Top-Down/ });
  const angleBtn = within(tourMenu).getByRole('button', { name: /3D Angle/ });
  expect(topDownBtn).toBeInTheDocument();
  expect(angleBtn).toBeInTheDocument();

  // Select Top-Down plan view
  fireEvent.click(topDownBtn);
  expect(screen.getByTestId('canvas-angle')).toHaveTextContent('top');

  // Select 3D perspective angle
  fireEvent.click(angleBtn);
  expect(screen.getByTestId('canvas-angle')).toHaveTextContent('angle');

  // Slicing/viewing specific floor from above
  const mainFloorBtn = within(tourMenu).getByRole('radio', { name: /Main Floor/ });
  fireEvent.click(mainFloorBtn);
  expect(screen.getByTestId('canvas-floor')).toHaveTextContent('main');
  expect(screen.getByText(/Viewing Main Floor structure from above/)).toBeInTheDocument();

  // Switch back to walkthrough mode
  const walkTab = within(tourMenu).getByRole('tab', { name: /Walk/ });
  fireEvent.click(walkTab);
  expect(screen.getByTestId('canvas-viewmode')).toHaveTextContent('walkthrough');
  expect(screen.getByText(/Walkthrough Mode/)).toBeInTheDocument();
});

test('allows switching view mode and floors via HUD navigation in main menu', async () => {
  render(<App />);
  const enterBtn = await screen.findByRole('button', { name: /Enter House/ });
  fireEvent.click(screen.getByRole('button', { name: /Use touch/ }));
  fireEvent.click(enterBtn);

  const hudUpsideBtn = screen.getByRole('button', { name: /🏠 Upside View/ });
  expect(hudUpsideBtn).toBeInTheDocument();

  // Switch view mode via header
  fireEvent.click(hudUpsideBtn);
  expect(screen.getByTestId('canvas-viewmode')).toHaveTextContent('upside');
  expect(screen.getByRole('button', { name: /🚶 Walkthrough/ })).toBeInTheDocument();

  // Header has floor menu
  const hudFloorMenu = screen.getByRole('radiogroup', { name: /Floor selector/ });
  expect(hudFloorMenu).toBeInTheDocument();

  const hudUpperBtn = within(hudFloorMenu).getByRole('radio', { name: /Upper Floor/ });
  fireEvent.click(hudUpperBtn);
  expect(screen.getByTestId('canvas-floor')).toHaveTextContent('upper');

  fireEvent.click(screen.getByRole('button', { name: /🚶 Walkthrough/ }));
  expect(screen.getByTestId('canvas-viewmode')).toHaveTextContent('walkthrough');
});

test('main welcome menu allows selecting starting floor and upside view mode directly', async () => {
  render(<App />);
  // Welcome dialog is displayed
  expect(await screen.findByRole('heading', { name: /A space to explore/ })).toBeInTheDocument();

  // View mode tabs in main menu
  const upsideTab = screen.getByRole('tab', { name: /Upside Structure View/ });
  expect(upsideTab).toBeInTheDocument();
  fireEvent.click(upsideTab);

  // Floor buttons in main menu
  const welcomeFloorMenu = screen.getByRole('radiogroup', { name: /Select Starting Floor/ });
  const upperFloorBtn = within(welcomeFloorMenu).getByRole('radio', { name: /Upper Floor/ });
  fireEvent.click(upperFloorBtn);

  // Primary button updates to upside view on Upper Floor
  const upsideEnterBtn = screen.getByRole('button', { name: /Look House Structure from Upside View/ });
  expect(upsideEnterBtn).toBeInTheDocument();
  fireEvent.click(upsideEnterBtn);

  // Canvas enters upside mode on upper floor
  expect(screen.getByTestId('canvas-viewmode')).toHaveTextContent('upside');
  expect(screen.getByTestId('canvas-floor')).toHaveTextContent('upper');
});

test('main welcome menu provides a direct one-click upside view shortcut', async () => {
  render(<App />);
  const shortcutBtn = await screen.findByRole('button', { name: /Or look at the house structure from the upside view/ });
  expect(shortcutBtn).toBeInTheDocument();
  fireEvent.click(shortcutBtn);

  expect(screen.getByTestId('canvas-viewmode')).toHaveTextContent('upside');
});

test('toggles view mode between walkthrough and upside view back and forth using the top button', async () => {
  render(<App />);
  const enterBtn = await screen.findByRole('button', { name: /Enter House/ });
  fireEvent.click(screen.getByRole('button', { name: /Use touch/ }));
  fireEvent.click(enterBtn);

  // Initially in walkthrough mode
  expect(screen.getByTestId('canvas-viewmode')).toHaveTextContent('walkthrough');

  // 1. Click top button to switch Walkthrough -> Upside View
  const hudTopBtn = screen.getByRole('button', { name: /🏠 Upside View/ });
  expect(hudTopBtn).toBeInTheDocument();
  fireEvent.click(hudTopBtn);

  expect(screen.getByTestId('canvas-viewmode')).toHaveTextContent('upside');
  expect(screen.getByRole('button', { name: /🚶 Walkthrough/ })).toBeInTheDocument();

  // 2. Click top button again to switch Upside View -> Walkthrough
  fireEvent.click(screen.getByRole('button', { name: /🚶 Walkthrough/ }));
  expect(screen.getByTestId('canvas-viewmode')).toHaveTextContent('walkthrough');
  expect(screen.getByRole('button', { name: /🏠 Upside View/ })).toBeInTheDocument();

  // 3. Click top button once more Walkthrough -> Upside View
  fireEvent.click(screen.getByRole('button', { name: /🏠 Upside View/ }));
  expect(screen.getByTestId('canvas-viewmode')).toHaveTextContent('upside');
});

test('toggles view mode between walkthrough and upside view using V keyboard shortcut', async () => {
  render(<App />);
  const enterBtn = await screen.findByRole('button', { name: /Enter House/ });
  fireEvent.click(screen.getByRole('button', { name: /Use touch/ }));
  fireEvent.click(enterBtn);

  expect(screen.getByTestId('canvas-viewmode')).toHaveTextContent('walkthrough');

  // Press V to toggle to Upside View
  fireEvent.keyDown(window, { code: 'KeyV' });
  expect(screen.getByTestId('canvas-viewmode')).toHaveTextContent('upside');

  // Press V again to toggle back to Walkthrough
  fireEvent.keyDown(window, { code: 'KeyV' });
  expect(screen.getByTestId('canvas-viewmode')).toHaveTextContent('walkthrough');
});

test('in the main menu, other in-tour controls (HUD, demo label) are hidden for a clean experience', async () => {
  render(<App />);
  // Welcome dialog is visible
  expect(await screen.findByRole('heading', { name: /A space to explore/ })).toBeInTheDocument();

  // In the main menu, other controls in the screen are hidden
  expect(screen.queryByRole('navigation', { name: /Tour controls/ })).not.toBeInTheDocument();
  expect(screen.queryByText(/HOUSE VIRTUAL TOUR —/)).not.toBeInTheDocument();

  // Selecting floors in main menu does not pop up in-tour notice
  const welcomeFloorMenu = screen.getByRole('radiogroup', { name: /Select Starting Floor/ });
  const basementBtn = within(welcomeFloorMenu).getByRole('radio', { name: /Basement/ });
  fireEvent.click(basementBtn);
  expect(screen.queryByRole('status')).not.toBeInTheDocument();

  // Entering the tour reveals the HUD tour controls
  const enterBtn = screen.getByRole('button', { name: /Enter House/ });
  fireEvent.click(screen.getByRole('button', { name: /Use touch/ }));
  fireEvent.click(enterBtn);
  expect(screen.getByRole('navigation', { name: /Tour controls/ })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /🏠 Upside View/ })).toBeInTheDocument();
});

