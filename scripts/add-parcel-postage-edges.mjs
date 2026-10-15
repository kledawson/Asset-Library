import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import * as T from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();});}};
const folder='.asset-candidates/parcels/postage-edges';await fs.mkdir(folder,{recursive:true});
function stamp(width,height,thickness,small){
  const shape=new T.Shape(),x=width/2,y=height/2,r=Math.min(width,height)*.045,c=r*.45;
  const horizontal=small?5:6,vertical=small?4:5;
  const xs=Array.from({length:horizontal},(_,i)=>-x+(i+1)*width/(horizontal+1));
  const ys=Array.from({length:vertical},(_,i)=>-y+(i+1)*height/(vertical+1));
  shape.moveTo(-x+c,-y);
  for(const u of xs){shape.lineTo(u-r,-y);shape.absarc(u,-y,r,Math.PI,0,true);}
  shape.lineTo(x-c,-y);shape.quadraticCurveTo(x,-y,x,-y+c);
  for(const v of ys){shape.lineTo(x,v-r);shape.absarc(x,v,r,-Math.PI/2,Math.PI/2,true);}
  shape.lineTo(x,y-c);shape.quadraticCurveTo(x,y,x-c,y);
  for(const u of xs.slice().reverse()){shape.lineTo(u+r,y);shape.absarc(u,y,r,0,Math.PI,true);}
  shape.lineTo(-x+c,y);shape.quadraticCurveTo(-x,y,-x,y-c);
  for(const v of ys.slice().reverse()){shape.lineTo(-x,v+r);shape.absarc(-x,v,r,Math.PI/2,-Math.PI/2,true);}
  shape.lineTo(-x,-y+c);shape.quadraticCurveTo(-x,-y,-x+c,-y);shape.closePath();
  const bevel=.00006;
  const g=new T.ExtrudeGeometry(shape,{depth:thickness-2*bevel,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelSegments:1,steps:1,curveSegments:4});
  g.computeBoundingBox();g.translate(...g.boundingBox.getCenter(new T.Vector3()).negate().toArray());return g;
}
for(const size of ['small','large'])for(const color of ['coral','yellow','teal']){
  const name=`play-parcel-${size}-${color}.glb`,key=`play-parcel-${size}:${color}`,bytes=await fs.readFile('public/models/'+name);
  const {scene}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');let label;
  scene.traverse(n=>{if(n.name==='Parcel_Paper_Label')label=n;});if(!label)throw Error('Missing label '+name);
  label.geometry.computeBoundingBox();const dimensions=label.geometry.boundingBox.getSize(new T.Vector3());
  label.geometry=stamp(dimensions.x,dimensions.y,dimensions.z,size==='small');label.userData.postageEdge=true;
  const candidate=path.resolve(folder,name);await fs.writeFile(candidate,Buffer.from(await new GLTFExporter().parseAsync(scene,{binary:true})));
  for(const root of [process.cwd(),'C:/Users/dawso/OneDrive/Desktop/portfolio'])execFileSync(process.execPath,[path.join(root,'scripts/stage-asset.cjs'),key,candidate],{cwd:root});
  console.log(size+' '+color+': scalloped cream label');
}
