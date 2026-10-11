import fs from 'node:fs/promises';
import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
const bytes=await fs.readFile('public/models/editor-sources/workshop-hammer.glb');
const {scene}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const meshes=[];scene.traverse(o=>{if(o.isMesh)meshes.push(o);});
for(const mesh of meshes){
 if(/^Wood_Grain|^Wood_Knot|^Wood Grain|^Wood Knot/.test(mesh.name))mesh.removeFromParent();
 if(mesh.material.name==='timber'){mesh.material=mesh.material.clone();mesh.material.color.set('#b98648').convertSRGBToLinear();mesh.material.roughness=.86;mesh.material.metalness=0;}
 if(mesh.material.name==='steelInset'){
  // Rounded forged shoulders narrow smoothly into the striking neck.
  const shape=new T.Shape();shape.moveTo(.413,.9555);
  shape.quadraticCurveTo(.403,.9555,.403,.9455);shape.lineTo(.403,.9045);
  shape.quadraticCurveTo(.403,.8945,.413,.8945);shape.lineTo(.470,.8945);
  shape.bezierCurveTo(.490,.8945,.500,.902,.518,.907);shape.lineTo(.518,.943);
  shape.bezierCurveTo(.500,.948,.490,.9555,.470,.9555);shape.closePath();
  mesh.geometry=new T.ExtrudeGeometry(shape,{depth:.051,bevelEnabled:true,bevelSize:.009,bevelThickness:.010,bevelSegments:5,curveSegments:20});
  mesh.geometry.deleteAttribute('normal');mesh.geometry=mergeVertices(mesh.geometry);mesh.geometry.computeVertexNormals();
  mesh.position.set(0,0,-.0905);mesh.rotation.set(0,0,0);mesh.scale.set(1,1,1);
  mesh.material=mesh.material.clone();mesh.material.color.set('#485153').convertSRGBToLinear();mesh.material.metalness=.7;mesh.material.roughness=.48;
 }
}
const grain=new T.MeshStandardMaterial({name:'Warm Wood Grain',color:'#946936',roughness:.93});
const lightGrain=new T.MeshStandardMaterial({name:'Wood Grain Highlights',color:'#c29458',roughness:.91});
grain.color.convertSRGBToLinear();lightGrain.color.convertSRGBToLinear();
function line(name,points,radius,material){const curve=new T.CatmullRomCurve3(points);const mesh=new T.Mesh(new T.TubeGeometry(curve,32,radius,4,false),material);mesh.name=name;scene.add(mesh);}
for(const [side,z] of [['Front',-.0461],['Back',-.0839]]){
 for(let i=0;i<8;i++){
  const x=.446+i*.0038,points=[];
  for(let j=0;j<=24;j++){
   const y=.718+j/24*.160;
   const wave=.0009*Math.sin(y*38+i*.65)+.00035*Math.sin(y*107+i);
   const knotBulge=Math.exp(-Math.pow((y-.801)/.013,2))*.0024*(x<.46?-1:1);
   points.push(new T.Vector3(x+wave+knotBulge,y,z));
  }
  line(`Wood Grain ${side} ${i+1}`,points,i%3===0?.00030:.00024,i%3===2?lightGrain:grain);
 }
 for(let ring=0;ring<2;ring++){
  const points=[];for(let j=0;j<=48;j++){const a=j/48*Math.PI*2;points.push(new T.Vector3(.461+Math.cos(a)*(.0012+ring*.001),.801+Math.sin(a)*(.004+ring*.003),z));}
  line(`Wood Knot ${side} ${ring+1}`,points,.00017,grain);
 }
}
class Reader{readAsArrayBuffer(b){b.arrayBuffer().then(r=>{this.result=r;this.onloadend?.();});}readAsDataURL(b){b.arrayBuffer().then(r=>{this.result=`data:${b.type};base64,${Buffer.from(r).toString('base64')}`;this.onloadend?.();});}}
globalThis.FileReader=Reader;
await fs.writeFile('.asset-candidates/workshop-hammer-natural.glb',Buffer.from(await new GLTFExporter().parseAsync(scene,{binary:true})));
console.log('Wood grain and softer forged head candidate generated.');
