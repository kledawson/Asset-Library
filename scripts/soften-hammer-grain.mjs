import fs from 'node:fs/promises';
import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
const bytes=await fs.readFile('.asset-candidates/workshop-hammer-claw-grain.glb');
const {scene}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const meshes=[];scene.traverse(o=>{if(o.isMesh)meshes.push(o);});
const wood=meshes.find(o=>o.material.name==='timber').material;
for(const mesh of meshes){
 const name=mesh.name.replaceAll('_',' '),number=Number(name.match(/ (\d+)$/)?.[1]);
 if((name.startsWith('Wood Grain')&&![2,4,7].includes(number))||
    (name.startsWith('Side Wood')&&![2,5].includes(number))||name.startsWith('Wood Knot')){
  mesh.removeFromParent();continue;
 }
 if(name.startsWith('Wood Grain')||name.startsWith('Side Wood')){
  mesh.material=mesh.material.clone();mesh.material.color.lerp(wood.color,.65);
 }
}
class Reader{readAsArrayBuffer(b){b.arrayBuffer().then(r=>{this.result=r;this.onloadend?.();});}readAsDataURL(b){b.arrayBuffer().then(r=>{this.result=`data:${b.type};base64,${Buffer.from(r).toString('base64')}`;this.onloadend?.();});}}
globalThis.FileReader=Reader;
await fs.writeFile('.asset-candidates/workshop-hammer-softened.glb',Buffer.from(await new GLTFExporter().parseAsync(scene,{binary:true})));
console.log('Simplified low-contrast grain and compact curved claw ready.');
