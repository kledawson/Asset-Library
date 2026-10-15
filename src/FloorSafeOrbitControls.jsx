import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

export default function FloorSafeOrbitControls(props) {
  const ref = useRef();
  const { camera } = useThree();
  useFrame(() => {
    const controls = ref.current;
    if (!controls) return;
    // Allow underside inspection, but keep the camera's near plane above the floor.
    const clearance = Math.max(.025, camera.near * 2);
    if (camera.position.y < clearance) {
      camera.position.y = clearance;
      camera.lookAt(controls.target);
    }
    const radius = camera.position.distanceTo(controls.target);
    const ratio = (clearance - controls.target.y) / Math.max(radius, .0001);
    controls.maxPolarAngle = Math.acos(Math.max(-.9999, Math.min(.9999, ratio)));
  });
  return <OrbitControls ref={ref} makeDefault {...props} />;
}
