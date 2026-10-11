import { useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { BoxGeometry, Mesh, MeshBasicMaterial, PMREMGenerator } from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment';

export function useCogReflectionMap(enabled) {
  const gl = useThree(state => state.gl);
  const result = useMemo(() => {
    if (!enabled) return null;
    const generator = new PMREMGenerator(gl);
    const room = new RoomEnvironment();
    // These strips exist only inside the cog's reflection texture. They do not
    // illuminate the workshop or change any other object's material.
    for (const z of [-9,9]) for (const x of [5.3,6.8]) {
      const material = new MeshBasicMaterial();
      material.color.setScalar(8);
      const strip = new Mesh(new BoxGeometry(.55,5,.08),material);
      strip.position.set(x,2.5,z);
      room.add(strip);
    }
    const target = generator.fromScene(room);
    generator.dispose();
    room.dispose();
    return target;
  }, [enabled, gl]);
  useEffect(() => () => result?.dispose(), [result]);
  return result?.texture || null;
}

export function addCogReflection(material, texture) {
  if (!texture || !material?.isMeshStandardMaterial) return material;
  const reflective = material.clone();
  reflective.envMap = texture;
  reflective.envMapIntensity = .33;
  reflective.needsUpdate = true;
  return reflective;
}

export function isCogPart(node, modelKey) {
  if (modelKey === 'tool-cog:high') return true;
  if (modelKey !== 'tool-rack:final') return false;
  const materials = Array.isArray(node.material) ? node.material : [node.material];
  if (materials.some(material => material?.name === 'Brushed Brass Cog' || (material?.name === 'brass' && material.map && material.normalMap && material.metalness > .8))) return true;
  for (let parent=node.parent;parent;parent=parent.parent) {
    if (/^Asset[ _]cog$/i.test(parent.name)) return true;
  }
  return false;
}

