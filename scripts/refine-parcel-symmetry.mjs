import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import * as T from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { roundedPath, cutSide } from './parcel-geometry.mjs';

globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();});}};
const roots=[process.cwd(),'C:/Users/dawso/OneDrive/Desktop/portfolio'],folder='.asset-candidates/parcels/symmetric-wraps-side-labels';
await fs.mkdir(folder,{recursive:true});
async function load(file){const b=await fs.readFile(file);return (await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'')).scene;}
function recessBack(geometry,side,depth){
  const g=geometry.index?geometry.toNonIndexed():geometry.clone(),p=g.attributes.position,n=g.attributes.normal,positions=[],normals=[],half=side/2;
  const emit=poly=>{for(let i=1;i<poly.length-1;i++)for(const v of [poly[0],poly[i],poly[i+1]]){positions.push(...v.p);normals.push(...v.n);}};
  const split=(poly,axis,sign)=>{const inside=[],outside=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],da=half-sign*a.p[axis],db=half-sign*b.p[axis];(da>=0?inside:outside).push(a);if((da>=0)!==(db>=0)){const t=da/(da-db),v={p:a.p.map((x,k)=>x+(b.p[k]-x)*t),n:a.n.map((x,k)=>x+(b.n[k]-x)*t)};inside.push(v);outside.push(v);}}return{inside,outside};};
  for(let i=0;i<p.count;i+=3){let poly=[0,1,2].map(k=>({p:[p.getX(i+k),p.getY(i+k),p.getZ(i+k)],n:[n.getX(i+k),n.getY(i+k),n.getZ(i+k)]}));
    if(poly.every(v=>v.n[2]<-.999)){for(const [axis,sign]of [[0,1],[0,-1],[1,1],[1,-1]]){if(!poly.length)break;const clipped=split(poly,axis,sign);emit(clipped.outside);poly=clipped.inside;}emit(poly.map(v=>({...v,p:[v.p[0],v.p[1],v.p[2]+depth]})));}else emit(poly);
  }
  const result=new T.BufferGeometry();result.setAttribute('position',new T.Float32BufferAttribute(positions,3));result.setAttribute('normal',new T.Float32BufferAttribute(normals,3));return result;
}
for(const size of ['small','large'])for(const color of ['coral','yellow','teal']){
  const id=`play-parcel-${size}`,name=`${id}-${color}.glb`,key=`${id}:${color}`,scene=await load('public/models/'+name);
  let carton,tape;const meshes=[];scene.traverse(n=>{if(n.isMesh){meshes.push(n);if(n.name==='Parcel_Carton')carton=n;if(n.name.startsWith('Parcel_Tape'))tape??=n.material;}});
  if(!carton||!tape)throw Error('Missing parcel parts');scene.updateMatrixWorld(true);
  carton.geometry.computeBoundingBox();const box=carton.geometry.boundingBox.clone(),dimensions=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());
  const attach=(mesh,name,transform)=>{mesh.name=name;mesh.userData.assetGroup=id;mesh.applyMatrix4(scene.matrixWorld.clone().invert().multiply(carton.matrixWorld).multiply(transform));scene.add(mesh);};
  if(size==='small'){
    if(!meshes.some(n=>n.name.startsWith('Parcel_Recess_Back_Wall'))){
      carton.geometry=recessBack(carton.geometry,Math.min(dimensions.x,dimensions.y)*.79,.0014);
      for(const wall of meshes.filter(n=>n.name.startsWith('Parcel_Recess_Wall'))){const back=wall.clone();back.name=wall.name.replace('Parcel_Recess_Wall','Parcel_Recess_Back_Wall');back.applyMatrix4(new T.Matrix4().makeScale(1,1,-1));scene.add(back);}
    }
    meshes.filter(n=>n.name.startsWith('Parcel_Tape')).forEach(n=>n.removeFromParent());
    const yz=roundedPath(T.Shape,dimensions.z+.002,dimensions.y+.002,.008);yz.holes.push(roundedPath(T.Path,dimensions.z+.0004,dimensions.y+.0004,.0072));
    const firstWidth=dimensions.x*.19;
    attach(new T.Mesh(new T.ExtrudeGeometry(yz,{depth:firstWidth,bevelEnabled:false,curveSegments:5}),tape),'Parcel_Tape_Continuous_Front_Back',new T.Matrix4().makeTranslation(-firstWidth/2,0,0).multiply(new T.Matrix4().makeRotationY(Math.PI/2)));
    const xy=roundedPath(T.Shape,dimensions.x+.003,dimensions.y+.003,.0085);xy.holes.push(roundedPath(T.Path,dimensions.x+.0014,dimensions.y+.0014,.0077));
    const secondWidth=dimensions.z*.16;
    attach(new T.Mesh(new T.ExtrudeGeometry(xy,{depth:secondWidth,bevelEnabled:false,curveSegments:5}),tape),'Parcel_Tape_Continuous_Left_Right',new T.Matrix4().makeTranslation(0,0,-secondWidth/2));
  }else{
    // Replace the recessed front with a continuous rounded carton, keeping side slots.
    carton.geometry=new RoundedBoxGeometry(dimensions.x,dimensions.y,dimensions.z,2,.007);carton.geometry.translate(...center.toArray());
    const slot=roundedPath(T.Shape,.084,.024,.012),points=slot.getPoints(8);if(points[0].distanceTo(points[points.length-1])<1e-8)points.pop();if(T.ShapeUtils.isClockWise(points))points.reverse();
    for(const sign of [1,-1])carton.geometry=cutSide(carton.geometry,points,.044,sign);
    meshes.filter(n=>n.name.startsWith('Parcel_Up_Arrows')).forEach(n=>{n.position.y-=.008;});
    meshes.filter(n=>n.name.startsWith('Parcel_Recess_')||n.name==='Parcel_Paper_Label'||n.name.startsWith('Parcel_Label_')).forEach(n=>n.removeFromParent());
    const previous=await load(`.asset-backups/${id}-${color}/editor-source.glb`);let label,symbol;
    previous.traverse(n=>{if(n.name==='Parcel_Paper_Label')label=n;if(/^Parcel_Label_(Square|Circle|Triangle)$/.test(n.name))symbol=n;});
    if(!label||!symbol)throw Error('Saved label missing: '+color);
    for(const [source,offset]of [[label,.0012],[symbol,.0023]]){
      const mesh=source.clone();mesh.geometry=source.geometry.clone();mesh.geometry.computeBoundingBox();mesh.geometry.translate(...mesh.geometry.boundingBox.getCenter(new T.Vector3()).negate().toArray());
      mesh.position.set(0,0,0);mesh.rotation.set(0,0,0);mesh.scale.set(1,1,1);mesh.updateMatrix();
      attach(mesh,source.name,new T.Matrix4().makeTranslation(box.min.x-offset,-.058,.055).multiply(new T.Matrix4().makeRotationY(-Math.PI/2)));
    }
  }
  const candidate=path.resolve(folder,name);await fs.writeFile(candidate,Buffer.from(await new GLTFExporter().parseAsync(scene,{binary:true})));
  for(const root of roots)execFileSync(process.execPath,[path.join(root,'scripts/stage-asset.cjs'),key,candidate],{cwd:root});
  console.log(`${size} ${color}: ${size==='small'?'symmetric recesses and seamless cross wraps':'flat front and restored -X shape label'}`);
}
