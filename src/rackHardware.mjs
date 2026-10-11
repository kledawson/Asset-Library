import { Vector3, Matrix4 } from 'three';

// Seat the mounting hardware against the board. Work in rack coordinates so
// merged frame meshes and exported editor meshes use the same adjustment.
export function seatRackHardware(scene) {
  scene.updateMatrixWorld(true);
  const meshes=[];
  scene.traverse(node=>{if(node.isMesh&&['navy','brass','darkWood'].includes(node.material.name))meshes.push(node);});
  const point=new Vector3();
  const corners=[[-.66,.37],[.66,.37],[-.66,1.15],[.66,1.15]];
  for(const [x,y] of corners){
    const matches=p=>Math.abs(p.x-x)<.05&&Math.abs(p.y-y)<.052&&p.z>-.19&&p.z<-.09;
    let rear=Infinity;
    for(const mesh of meshes.filter(node=>node.material.name==='navy')){
      const p=mesh.geometry.attributes.position;
      for(let i=0;i<p.count;i++){point.fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);if(matches(point))rear=Math.min(rear,point.z);}
    }
    const shift=Math.min(0,-.142-rear);
    if(!Number.isFinite(shift)||Math.abs(shift)<1e-6)continue;
    for(const mesh of meshes){
      mesh.geometry=mesh.geometry.clone();const p=mesh.geometry.attributes.position,inverse=new Matrix4().copy(mesh.matrixWorld).invert();
      for(let i=0;i<p.count;i++){point.fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);if(matches(point)){point.z+=shift;point.applyMatrix4(inverse);p.setXYZ(i,point.x,point.y,point.z);}}
      p.needsUpdate=true;mesh.geometry.computeBoundingBox();mesh.geometry.computeBoundingSphere();
    }
  }
  for(const x of [-.51,-.27,.13,.47]){
    let rear=Infinity;
    for(const mesh of meshes.filter(node=>node.material.name==='navy')){
      const p=mesh.geometry.attributes.position;
      for(let i=0;i<p.count;i++){point.fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);if(Math.abs(point.x-x)<.009&&point.y>1.048&&point.y<1.06)rear=Math.min(rear,point.z);}
    }
    const shift=Math.min(0,-.146-rear);
    if(!Number.isFinite(shift)||Math.abs(shift)<1e-6)continue;
    for(const mesh of meshes.filter(node=>node.material.name==='navy')){
      mesh.geometry=mesh.geometry.clone();const p=mesh.geometry.attributes.position,inverse=new Matrix4().copy(mesh.matrixWorld).invert();
      for(let i=0;i<p.count;i++){
        point.fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);
        if(Math.abs(point.x-x)<.009&&point.y>1.002&&point.y<1.06&&point.z>-.18&&point.z<-.04){
          point.z+=shift*Math.max(0,Math.min(1,(point.y-1.025)/.023));point.applyMatrix4(inverse);p.setXYZ(i,point.x,point.y,point.z);
        }
      }
      p.needsUpdate=true;mesh.geometry.computeVertexNormals();mesh.geometry.computeBoundingBox();mesh.geometry.computeBoundingSphere();
    }
  }
  return scene;
}
