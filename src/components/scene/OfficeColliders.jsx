import { CuboidCollider, RigidBody } from '@react-three/rapier';
export default function OfficeColliders({ colliders }) {
  return <RigidBody type="fixed" colliders={false}>{colliders.map(c => <CuboidCollider key={c.id} position={c.center} args={c.halfExtents} />)}</RigidBody>;
}
