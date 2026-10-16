import { Box3, Euler, Quaternion, Vector3 } from 'three';

// Compound walls leave the container mouths open during an individual drop.
// These are rigid collision proxies; the sack's visible upper fabric can flex.
export function mailPreviewColliders(scene, key, offset) {
  if (!key.startsWith('mail-')) return [];
  if (key === 'mail-sack:default') {
    const boxes = [{ halfSize: [.096,.006,.086], center: [offset[0],offset[1]+.012,offset[2]], rotation:[0,0,0] }];
    for(let i=0;i<12;i++) {
      const angle=i*Math.PI/6;
      boxes.push({halfSize:[.029,.080,.005], center:[offset[0]+Math.sin(angle)*.107,offset[1]+.094,offset[2]+Math.cos(angle)*.096],rotation:[0,angle,0]});
    }
    return boxes;
  }
  const boxes=[];
  scene.updateMatrixWorld(true);
  scene.traverse(node=>{
    if(!node.isMesh)return;
    if(node.userData.mailCollider==='arch'){
      const quaternion=new Quaternion(),scale=new Vector3(),position=new Vector3();node.matrixWorld.decompose(position,quaternion,scale);
      for(let i=0;i<16;i++){const a=(i+.5)*Math.PI/16,center=new Vector3(.145*Math.cos(a),.210+.145*Math.sin(a),0).applyMatrix4(node.matrixWorld).add(new Vector3(...offset));const q=quaternion.clone().multiply(new Quaternion().setFromAxisAngle(new Vector3(0,0,1),a-Math.PI/2));const euler=new Euler().setFromQuaternion(q);boxes.push({halfSize:[.015,.007,.155].map((v,j)=>v*Math.abs(scale.getComponent(j))),center:center.toArray(),rotation:[euler.x,euler.y,euler.z]});}
      return;
    }
    if(node.userData.mailCollider!=='box')return;
    const bounds=node.geometry.boundingBox || (node.geometry.computeBoundingBox(),node.geometry.boundingBox);
    if(!bounds || bounds.isEmpty())return;
    const position=new Vector3(),quaternion=new Quaternion(),scale=new Vector3();
    node.matrixWorld.decompose(position,quaternion,scale);
    const size=new Box3(bounds.min.clone(),bounds.max.clone()).getSize(new Vector3()).multiply(scale).multiplyScalar(.5);
    const center=bounds.getCenter(new Vector3()).applyMatrix4(node.matrixWorld).add(new Vector3(...offset));
    const euler=new Euler().setFromQuaternion(quaternion);
    boxes.push({halfSize:size.toArray().map(v=>Math.max(.001,Math.abs(v))),center:center.toArray(),rotation:[euler.x,euler.y,euler.z]});
  });
  return boxes;
}
