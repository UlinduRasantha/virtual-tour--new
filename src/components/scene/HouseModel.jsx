import { useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { Box3, DoubleSide, MeshBasicMaterial, Vector3 } from 'three';

export default function HouseModel({ config, onBounds, inspect }) {
  const { camera } = useThree();
  const { scene } = useGLTF(config.modelUrl, false, false);

  const model = useMemo(() => {
    const copy = scene.clone(true);
    const { min, max } = config.doorwayCleanup || {};

    copy.traverse(o => {
      if (!o.isMesh) return;
      const source = o.geometry, positions = source.attributes.position, indices = source.index;

      if (min && max) {
        const keep = [];
        const count = indices?.count ?? positions.count;
        for (let i = 0; i < count; i += 3) {
          const ids = [0, 1, 2].map(n => indices ? indices.getX(i + n) : i + n);
          const overlaps = ids.some(id => {
            const p = [positions.getX(id), positions.getY(id), positions.getZ(id)];
            return p.every((v, axis) => v > min[axis] && v < max[axis]);
          });
          if (!overlaps) keep.push(...ids);
        }
        o.geometry = source.clone();
        o.geometry.setIndex(keep);
      }

      const convert = m => new MeshBasicMaterial({ map: m.map, color: m.color, side: DoubleSide });
      o.material = Array.isArray(o.material) ? o.material.map(convert) : convert(o.material);
    });

    copy.scale.setScalar(config.transform.scale);
    copy.position.fromArray(config.transform.origin.map(v => -v * config.transform.scale));
    copy.updateMatrixWorld(true);
    return copy;
  }, [scene, config]);

  useEffect(() => {
    const box = new Box3().setFromObject(model);
    let meshes = 0, triangles = 0;
    model.traverse(o => {
      if (o.isMesh) {
        meshes++;
        triangles += o.geometry.index ? o.geometry.index.count / 3 : o.geometry.attributes.position.count / 3;
      }
    });
    if (onBounds) {
      onBounds({
        min: box.min.toArray(),
        max: box.max.toArray(),
        size: box.getSize(new Vector3()).toArray(),
        meshes,
        triangles
      });
    }
    return () => model.traverse(o => {
      if (o.isMesh) {
        o.geometry.dispose();
        [].concat(o.material).forEach(m => m.dispose());
      }
    });
  }, [model, onBounds]);

  useEffect(() => {
    if (!inspect) return;
    const box = new Box3().setFromObject(model), center = box.getCenter(new Vector3());
    const distance = Math.max(...box.getSize(new Vector3()).toArray()) * 0.9;
    camera.position.copy(center).add(new Vector3(distance, distance * 0.8, distance));
    camera.lookAt(center);
    camera.updateProjectionMatrix();
  }, [model, camera, inspect]);

  return <primitive object={model} dispose={null} />;
}
