import fs from 'node:fs/promises';
import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
const bytes=await fs.readFile('public/models/editor-sources/workshop-hammer.glb');
const {scene}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
scene.updateMatrixWorld(true);
const meshes=[];scene.traverse(o=>{if(o.isMesh)meshes.push(o);});
for(const mesh of meshes){
 const bounds=new T.Box3().setFromObject(mesh);
 if(mesh.material.name==='coral' && bounds.min.y>.9){mesh.removeFromParent();continue;}
 if(mesh.name==='steel'){
  const g=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry,p=g.attributes.position,n=g.attributes.normal,ps=[],ns=[];
  for(let i=0;i<p.count;i+=3){
   const center=new T.Vector3();for(let j=0;j<3;j++)center.add(new T.Vector3(p.getX(i+j),p.getY(i+j),p.getZ(i+j)).applyMatrix4(mesh.matrixWorld));center.divideScalar(3);
   if(center.x>.435&&center.x<.505&&center.y>.92&&center.y<.93)continue;
   for(let j=0;j<3;j++){ps.push(p.getX(i+j),p.getY(i+j),p.getZ(i+j));ns.push(n.getX(i+j),n.getY(i+j),n.getZ(i+j));}
  }
  const cleaned=new T.BufferGeometry();cleaned.setAttribute('position',new T.Float32BufferAttribute(ps,3));cleaned.setAttribute('normal',new T.Float32BufferAttribute(ns,3));mesh.geometry=cleaned;
 }
 if(mesh.material.name==='steelInset'){mesh.material=mesh.material.clone();mesh.material.metalness=.72;mesh.material.roughness=.43;}
}
const polished=new T.MeshStandardMaterial({name:'Machined Steel',color:0xa0a8a7,metalness:.8,roughness:.3});
const dark=new T.MeshStandardMaterial({name:'Recessed Steel',color:0x444c4c,metalness:.65,roughness:.48});
function ring(name,radius,tube,x,material){const mesh=new T.Mesh(new T.TorusGeometry(radius,tube,6,48),material);mesh.name=name;mesh.rotation.y=Math.PI/2;mesh.position.set(x,.925,-.065);scene.add(mesh);}
ring('Polished Striking Rim',.0458,.0011,.575,polished);
ring('Machined Face Groove',.038,.00045,.5747,dark);
ring('Striking Neck Collar',.039,.001,.528,polished);
const socket=new T.Mesh(new RoundedBoxGeometry(.045,.009,.042,3,.002),dark);socket.name='Handle Socket';socket.position.set(.46,.882,-.065);scene.add(socket);
class Reader{readAsArrayBuffer(b){b.arrayBuffer().then(r=>{this.result=r;this.onloadend?.();});}readAsDataURL(b){b.arrayBuffer().then(r=>{this.result=`data:${b.type};base64,${Buffer.from(r).toString('base64')}`;this.onloadend?.();});}}
globalThis.FileReader=Reader;
await fs.writeFile('.asset-candidates/workshop-hammer-detailed.glb',Buffer.from(await new GLTFExporter().parseAsync(scene,{binary:true})));
console.log('Clean side faces and restrained machined metal details generated.');
