import fs from 'node:fs/promises';
import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
const bytes=await fs.readFile('public/models/editor-sources/workshop-hammer.glb');
const {scene}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
scene.updateMatrixWorld(true);
const pivot=new T.Vector3(.528,.925,-.065);
scene.traverse(mesh=>{
 if(!mesh.isMesh)return;
 if(mesh.name==='steel'){
  const g=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry;
  const p=g.attributes.position,kept=[];
  for(let i=0;i<p.count;i+=3){
   const points=[0,1,2].map(j=>new T.Vector3().fromBufferAttribute(p,i+j).applyMatrix4(mesh.matrixWorld));
   // The old claw mounting sheet is separate from the striking cylinder.
   if(points.some(v=>v.x<.51))continue;
   kept.push(i,i+1,i+2);
  }
  const clean=new T.BufferGeometry();
  for(const [name,attr] of Object.entries(g.attributes)){
   const values=[];for(const index of kept)for(let j=0;j<attr.itemSize;j++)values.push(attr.array[index*attr.itemSize+j]);
   clean.setAttribute(name,new T.BufferAttribute(new attr.array.constructor(values),attr.itemSize,attr.normalized));
  }
  mesh.geometry=clean;
 }
 if(['steel','steelEdge','Polished_Striking_Rim','Machined_Face_Groove','Striking_Neck_Collar'].includes(mesh.name)){
  const g=mesh.geometry.clone(),p=g.attributes.position,inverse=mesh.matrixWorld.clone().invert();
  for(let i=0;i<p.count;i++){
   const v=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld).sub(pivot).multiplyScalar(.96).add(pivot).applyMatrix4(inverse);
   p.setXYZ(i,v.x,v.y,v.z);
  }
  g.computeBoundingBox();g.computeBoundingSphere();mesh.geometry=g;
 }
});
class Reader{readAsArrayBuffer(b){b.arrayBuffer().then(r=>{this.result=r;this.onloadend?.();});}readAsDataURL(b){b.arrayBuffer().then(r=>{this.result=`data:${b.type};base64,${Buffer.from(r).toString('base64')}`;this.onloadend?.();});}}
globalThis.FileReader=Reader;
await fs.writeFile('.asset-candidates/workshop-hammer-smaller-steel.glb',Buffer.from(await new GLTFExporter().parseAsync(scene,{binary:true})));
