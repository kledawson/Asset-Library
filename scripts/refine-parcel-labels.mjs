import fs from 'node:fs/promises';
import * as T from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
globalThis.FileReader=class{readAsArrayBuffer(b){b.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();});}};
const roots=[process.cwd(),'C:/Users/dawso/OneDrive/Desktop/portfolio'];
function recess(geometry,side,depth){
 const g=geometry.index?geometry.toNonIndexed():geometry.clone(),p=g.attributes.position,n=g.attributes.normal,positions=[],normals=[];const half=side/2;
 const emit=poly=>{for(let i=1;i<poly.length-1;i++)for(const v of [poly[0],poly[i],poly[i+1]]){positions.push(...v.p);normals.push(...v.n);}};
 const split=(poly,axis,sign)=>{const inside=[],outside=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],da=half-sign*a.p[axis],db=half-sign*b.p[axis];(da>=0?inside:outside).push(a);if((da>=0)!==(db>=0)){const t=da/(da-db),v={p:a.p.map((x,k)=>x+(b.p[k]-x)*t),n:a.n.map((x,k)=>x+(b.n[k]-x)*t)};inside.push(v);outside.push(v);}}return{inside,outside};};
 for(let i=0;i<p.count;i+=3){let poly=[0,1,2].map(k=>({p:[p.getX(i+k),p.getY(i+k),p.getZ(i+k)],n:[n.getX(i+k),n.getY(i+k),n.getZ(i+k)]}));if(poly.every(v=>v.n[2]>.999)){for(const [axis,sign]of [[0,1],[0,-1],[1,1],[1,-1]]){if(!poly.length)break;const clipped=split(poly,axis,sign);emit(clipped.outside);poly=clipped.inside;}emit(poly.map(v=>({...v,p:[v.p[0],v.p[1],v.p[2]-depth]})));}else emit(poly);}
 const result=new T.BufferGeometry();result.setAttribute('position',new T.Float32BufferAttribute(positions,3));result.setAttribute('normal',new T.Float32BufferAttribute(normals,3));return result;
}
for(const size of ['small','large'])for(const color of ['coral','yellow','teal']){
 const key='play-parcel-'+size+':'+color,name=key.replace(':','-')+'.glb';const bytes=await fs.readFile(roots[1]+'/public/models/editor-sources/'+name);const {scene}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');let carton;const folds=[];
 scene.traverse(node=>{if(!node.isMesh)return;if(node.name==='Parcel_Carton')carton=node;if(node.name.startsWith('Parcel_Fold_'))folds.push(node);if(/^Parcel_Label_(Square|Circle|Triangle)$/.test(node.name)){node.geometry=node.geometry.clone();node.geometry.scale(.8,.8,1);}});folds.forEach(n=>n.removeFromParent());
 carton.geometry.computeBoundingBox();const dimensions=carton.geometry.boundingBox.getSize(new T.Vector3()),side=Math.min(dimensions.x,dimensions.y)*.79,depth=.0014;
 carton.geometry=recess(carton.geometry,side,depth);
 // Four short walls join the recessed face to the original surface.
 for(const [i,position,rotation]of [[0,[0,side/2,dimensions.z/2-depth/2],[Math.PI/2,0,0]],[1,[0,-side/2,dimensions.z/2-depth/2],[-Math.PI/2,0,0]],[2,[side/2,0,dimensions.z/2-depth/2],[0,-Math.PI/2,Math.PI/2]],[3,[-side/2,0,dimensions.z/2-depth/2],[0,Math.PI/2,Math.PI/2]]]){const wall=new T.Mesh(new T.PlaneGeometry(side,depth),carton.material.clone());wall.material.side=T.DoubleSide;wall.name='Parcel_Recess_Wall_'+i;wall.position.fromArray(position).add(carton.position);wall.rotation.set(...rotation);wall.userData.assetGroup='play-parcel-'+size;scene.add(wall);}
 const candidate=path.resolve('.asset-candidates/parcels',name);await fs.writeFile(candidate,Buffer.from(await new GLTFExporter().parseAsync(scene,{binary:true})));for(const root of roots)execFileSync(process.execPath,[path.join(root,'scripts/stage-asset.cjs'),key,candidate],{cwd:root});
}
console.log('Six smaller black labels and shallow square recesses staged.');
