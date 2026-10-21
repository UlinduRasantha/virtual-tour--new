export const FIXED_STEP = 1 / 60;
export function movementVector(x, z, yaw, speed, dt = FIXED_STEP) {
  const length = Math.max(1, Math.hypot(x, z));
  return { x: (x * Math.cos(yaw) - z * Math.sin(yaw)) / length * speed * dt, y: 0, z: (-x * Math.sin(yaw) - z * Math.cos(yaw)) / length * speed * dt };
}
export function halfExtents(size) { return size.map(n => n / 2); }
export function spawnIntersects(player, collider) {
  if (!player.spawn) return false;
  const [x, y, z] = player.spawn, [cx, cy, cz] = collider.center, [hx, hy, hz] = collider.halfExtents;
  return Math.abs(x - cx) < hx + player.radius && Math.abs(z - cz) < hz + player.radius && Math.abs(y - cy) < hy + player.capsuleHalfHeight + player.radius;
}
