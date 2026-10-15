import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import * as T from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();});}};
async function load(name){const b=await fs.readFile('public/models/'+name);return (await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'')).scene;}
const mark=n=>n.name.startsWith('Parcel_Recycling_')||n.name.startsWith('Parcel_Bottom_');
for(const color of ['coral','yellow','teal']){
  const small=await load(`play-parcel-small-${color}.glb`),large=await load(`play-parcel-large-${color}.glb`);let smallCarton,largeCarton;const marks=[],remove=[];
  small.traverse(n=>{if(n.name==='Parcel_Carton')smallCarton=n;if(n.isMesh&&mark(n))marks.push(n);});large.traverse(n=>{if(n.name==='Parcel_Carton')largeCarton=n;if(mark(n))remove.push(n);});remove.forEach(n=>n.removeFromParent());
  small.updateMatrixWorld(true);large.updateMatrixWorld(true);smallCarton.geometry.computeBoundingBox();largeCarton.geometry.computeBoundingBox();const s=smallCarton.geometry.boundingBox,l=largeCarton.geometry.boundingBox;
  const transform=large.matrixWorld.clone().invert().multiply(largeCarton.matrixWorld).multiply(new T.Matrix4().makeTranslation(l.min.x-s.min.x,l.min.y-s.min.y,l.max.z-s.max.z)).multiply(smallCarton.matrixWorld.clone().invert());
  for(const original of marks){const mesh=original.clone();mesh.matrixAutoUpdate=true;transform.clone().multiply(original.matrixWorld).decompose(mesh.position,mesh.quaternion,mesh.scale);mesh.userData={...original.userData,assetGroup:'play-parcel-large'};large.add(mesh);}
  if(marks.length!==11)throw Error('Unexpected small parcel logo cluster');
  const candidate=path.resolve(`.asset-candidates/parcels/recycling/play-parcel-large-${color}.glb`);await fs.writeFile(candidate,Buffer.from(await new GLTFExporter().parseAsync(large,{binary:true})));execFileSync(process.execPath,['scripts/stage-asset.cjs',`play-parcel-large:${color}`,candidate]);console.log('Copied approved bottom logo cluster to large '+color);
}
