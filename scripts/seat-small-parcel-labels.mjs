import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import * as T from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();});}};
const folder='.asset-candidates/parcels/seated-small-labels';await fs.mkdir(folder,{recursive:true});
for(const color of ['coral','yellow','teal']){
  const name=`play-parcel-small-${color}.glb`,key=`play-parcel-small:${color}`,bytes=await fs.readFile('public/models/'+name);
  const {scene}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  let carton,label,symbol;scene.traverse(n=>{if(n.name==='Parcel_Carton')carton=n;if(n.name==='Parcel_Paper_Label')label=n;if(/^Parcel_Label_(Square|Circle|Triangle)$/.test(n.name))symbol=n;});
  if(!carton||!label||!symbol)throw Error('Missing label parts');scene.updateMatrixWorld(true);
  carton.geometry.computeBoundingBox();label.geometry.computeBoundingBox();
  const old=label.position.clone(),labelSize=label.geometry.boundingBox.getSize(new T.Vector3());
  const scale=.0305/labelSize.x;
  const seatedZ=carton.geometry.boundingBox.max.z-.0014+labelSize.z/2+.00015;
  const delta=new T.Vector3(.0345-old.x,0,seatedZ-old.z);
  for(const mesh of [label,symbol]){mesh.geometry=mesh.geometry.clone();mesh.geometry.scale(scale,scale,1);mesh.position.add(delta);}
  const candidate=path.resolve(folder,name);await fs.writeFile(candidate,Buffer.from(await new GLTFExporter().parseAsync(scene,{binary:true})));
  for(const root of [process.cwd(),'C:/Users/dawso/OneDrive/Desktop/portfolio'])execFileSync(process.execPath,[path.join(root,'scripts/stage-asset.cjs'),key,candidate],{cwd:root});
  console.log(color+': label seated inside recess, clear of frame and wrapping');
}
