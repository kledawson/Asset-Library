import fs from 'node:fs/promises';
import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
const bytes=await fs.readFile('public/models/editor-sources/workshop-hammer.glb');
const {scene}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
scene.updateMatrixWorld(true);
scene.traverse(mesh=>{
 if(!mesh.isMesh)return;
 if(/^Handle[ _]Socket$/.test(mesh.name))mesh.position.y=.884;
 if(mesh.material.name==='steelInset'){
  let geo=new RoundedBoxGeometry(.127,.078,.069,5,.012);
  const p=geo.attributes.position;
  for(let i=0;i<p.count;i++){
   const x=p.getX(i),front=T.MathUtils.smoothstep(x,.008,.0635),rear=1-T.MathUtils.smoothstep(x,-.0635,-.026);
   p.setY(i,p.getY(i)*(1-.16*front-.055*rear));
   p.setZ(i,p.getZ(i)*(1-.13*front));
  }
  geo.deleteAttribute('normal');geo.deleteAttribute('uv');geo=mergeVertices(geo);geo.computeVertexNormals();
  mesh.geometry=geo;mesh.position.set(.462,.925,-.065);mesh.rotation.set(0,0,0);mesh.scale.set(1,1,1);
  mesh.material=mesh.material.clone();mesh.material.color.set('#596165').convertSRGBToLinear();mesh.material.metalness=.60;mesh.material.roughness=.46;
 }
 if(mesh.name==='steel'){
  // Remove the obsolete claw-root plate that protruded above the inset's rear edge.
  const g=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry,p=g.attributes.position,n=g.attributes.normal,ps=[],ns=[];
  for(let i=0;i<p.count;i+=3){
   const points=[0,1,2].map(j=>new T.Vector3(p.getX(i+j),p.getY(i+j),p.getZ(i+j)).applyMatrix4(mesh.matrixWorld));
   if(points.some(v=>v.x<.51))continue;
   for(let j=0;j<3;j++){ps.push(p.getX(i+j),p.getY(i+j),p.getZ(i+j));ns.push(n.getX(i+j),n.getY(i+j),n.getZ(i+j));}
  }
  const clean=new T.BufferGeometry();clean.setAttribute('position',new T.Float32BufferAttribute(ps,3));clean.setAttribute('normal',new T.Float32BufferAttribute(ns,3));mesh.geometry=clean;
 }
});
class Reader{readAsArrayBuffer(b){b.arrayBuffer().then(r=>{this.result=r;this.onloadend?.();});}readAsDataURL(b){b.arrayBuffer().then(r=>{this.result=`data:${b.type};base64,${Buffer.from(r).toString('base64')}`;this.onloadend?.();});}}
globalThis.FileReader=Reader;
await fs.writeFile('.asset-candidates/workshop-hammer-inset.glb',Buffer.from(await new GLTFExporter().parseAsync(scene,{binary:true})));
console.log('Smooth forged inset and clean rear claw junction generated.');
