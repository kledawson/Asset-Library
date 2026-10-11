import {createPortal,useFrame} from '@react-three/fiber';
import {useMemo,useEffect} from 'react';
import {Box3,Box3Helper,Matrix4} from 'three';
export default function SelectionBounds({ object, context = false }) {
  const { helper, box, inverse, matrix, meshBox } = useMemo(() => {
    const box = new Box3();
    const helper = new Box3Helper(box, '#397d78');
    helper.raycast = () => null;
    helper.material.transparent = true;
    return { helper, box, inverse: new Matrix4(), matrix: new Matrix4(), meshBox: new Box3() };
  }, []);
  useFrame(() => {
    object.updateWorldMatrix(true, true);
    inverse.copy(object.matrixWorld).invert();
    box.makeEmpty();
    object.traverseVisible(mesh => {
      if (!mesh.isMesh) return;
      if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
      matrix.multiplyMatrices(inverse, mesh.matrixWorld);
      box.union(meshBox.copy(mesh.geometry.boundingBox).applyMatrix4(matrix));
    });
    helper.visible = !box.isEmpty();
    helper.material.opacity = context ? 0.3 : 1;
  });
  useEffect(() => () => { helper.geometry.dispose(); helper.material.dispose(); }, [helper]);
  return createPortal(<primitive object={helper} dispose={null} />, object);
}

