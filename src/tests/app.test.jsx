import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { test, expect, vi, afterEach, beforeEach } from 'vitest';
import App from '../app/App.jsx';

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
    default: function MockCanvas({ onReady }) {
      useEffect(onReady, [onReady]);
      return <div>Scene mock</div>;
    }
  };
});

afterEach(cleanup);
beforeEach(() => history.replaceState(null, '', '/'));

test('labels house tour and offers entry', async () => {
  render(<App />);
  expect(await screen.findByRole('button', { name: /Enter House/ })).toBeInTheDocument();
  expect(screen.getByText(/HOUSE VIRTUAL TOUR/)).toBeInTheDocument();
});

test('touch entry, pause, locations and resume have explicit states', async () => {
  render(<App />);
  const enterBtn = await screen.findByRole('button', { name: /Enter House/ });
  fireEvent.click(screen.getByRole('button', { name: /Use touch/ }));
  fireEvent.click(enterBtn);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Locations' }));
  expect(screen.getByText(/Main Living Space/)).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /Main Living Space/ }));
  expect(screen.getByText(/spacious main living area/)).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Resume tour' }));
  fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
  expect(screen.getByRole('heading', { name: 'Take a moment.' })).toBeInTheDocument();
});

test('allows choosing navigation mode (WASD vs Click-to-Move) before entering', async () => {
  render(<App />);
  const wasdCard = await screen.findByRole('radio', { name: /WASD Walkthrough/ });
  const clickCard = screen.getByRole('radio', { name: /Click-to-Move/ });

  expect(wasdCard).toHaveAttribute('aria-checked', 'true');
  expect(clickCard).toHaveAttribute('aria-checked', 'false');

  // Select Click-to-Move before starting
  fireEvent.click(clickCard);
  expect(clickCard).toHaveAttribute('aria-checked', 'true');
  expect(wasdCard).toHaveAttribute('aria-checked', 'false');

  // Button reflects Click-to-Move mode and entering starts the tour directly without pointer lock
  const enterBtn = screen.getByRole('button', { name: /Enter House.*Click-to-Move/ });
  expect(enterBtn).toBeInTheDocument();
  fireEvent.click(enterBtn);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

  // In tour, top-right HUD displays active mode as a disabled/read-only indicator
  const modeDisplayBtn = screen.getByRole('button', { name: /Click-to-Move/ });
  expect(modeDisplayBtn).toBeInTheDocument();
  expect(modeDisplayBtn).toBeDisabled();
  expect(screen.getByText(/Click floor to walk/)).toBeInTheDocument();

  // Clicking it does not change explore mode while exploring
  fireEvent.click(modeDisplayBtn);
  expect(screen.getByRole('button', { name: /Click-to-Move/ })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /WASD Mode/ })).not.toBeInTheDocument();
  expect(screen.getByText(/Click floor to walk/)).toBeInTheDocument();
});

test('teleports directly to house locations when clicking Go to location', async () => {
  render(<App />);
  const enterBtn = await screen.findByRole('button', { name: /Enter House/ });
  fireEvent.click(screen.getByRole('button', { name: /Use touch/ }));
  fireEvent.click(enterBtn);

  fireEvent.click(screen.getByRole('button', { name: 'Locations' }));
  expect(screen.getByText('House Locations')).toBeInTheDocument();

  // Find all "Go to location" buttons
  const goButtons = screen.getAllByRole('button', { name: /Go to location/ });
  expect(goButtons.length).toBeGreaterThan(0);

  // Click the first "Go to location" button (Main Living Space)
  fireEvent.click(goButtons[0]);

  // Dialog closes, tour resumes, and arrival notice appears
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByText(/Arrived at Main Living Space/)).toBeInTheDocument();
});


