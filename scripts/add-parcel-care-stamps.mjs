import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import * as T from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { roundedPath } from './parcel-geometry.mjs';
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();});}};
const folder='.asset-candidates/parcels/care-stamps';await fs.mkdir(folder,{recursive:true});
const font=new FontLoader().parse(JSON.parse(await fs.readFile('node_modules/three/examples/fonts/helvetiker_regular.typeface.json','utf8')));
const material=(name,color)=>new T.MeshStandardMaterial({name,color:new T.Color(color).convertSRGBToLinear(),roughness:.94,metalness:0});
const brown=material('Parcel_Care_Dark_Ink','#44362b'),teal=material('Parcel_Care_Teal_Ink','#458d92'),coral=material('Parcel_Care_Coral_Ink','#da7858'),cream=material('Parcel_Care_Cream_Paper','#efe6d2');
function shape(points){const p=new T.Shape();p.moveTo(...points[0]);for(const point of points.slice(1))p.lineTo(...point);p.closePath();return p;}
function piece(group,name,form,mat,z=.00012){const mesh=new T.Mesh(new T.ShapeGeometry(form,8),mat);mesh.name=name;mesh.position.z=z;group.add(mesh);return mesh;}
function line(group,name,points,width,mat,z=.00018){const curve=new T.CatmullRomCurve3(points.map(([x,y])=>new T.Vector3(x,y,z)));const mesh=new T.Mesh(new T.TubeGeometry(curve,Math.max(12,points.length*5),width/2,6,false),mat);mesh.name=name;group.add(mesh);return mesh;}
function text(group,name,value,width,y,mat,z=.00018){const geo=new T.ShapeGeometry(font.generateShapes(value,.008),4);geo.computeBoundingBox();const size=geo.boundingBox.getSize(new T.Vector3()),factor=width/size.x;geo.translate(-geo.boundingBox.getCenter(new T.Vector3()).x,-geo.boundingBox.min.y,0);geo.scale(factor,factor,1);const mesh=new T.Mesh(geo,mat);mesh.name=name;mesh.position.set(0,y,z);group.add(mesh);}
function keepDry(){
  const g=new T.Group(),canopy=new T.Shape();canopy.moveTo(-.024,.006);canopy.bezierCurveTo(-.019,.034,.019,.034,.024,.006);canopy.quadraticCurveTo(.016,.012,.008,.004);canopy.quadraticCurveTo(0,.011,-.008,.004);canopy.quadraticCurveTo(-.016,.012,-.024,.006);canopy.closePath();
  piece(g,'Parcel_Care_Umbrella_Canopy',canopy,teal);
  line(g,'Parcel_Care_Umbrella_Outline',canopy.getPoints(12).map(p=>[p.x,p.y]),.0013,brown,.00023);
  line(g,'Parcel_Care_Umbrella_Handle',[[0,.006],[0,-.008],[-.001,-.013],[-.005,-.015],[-.007,-.012]],.0014,brown);
  for(const [i,x,y]of [[0,-.015,.037],[1,0,.043],[2,.015,.037]]){const drop=new T.Shape();drop.moveTo(x,y+.004);drop.bezierCurveTo(x-.004,y-.003,x-.003,y-.006,x,y-.006);drop.bezierCurveTo(x+.003,y-.006,x+.004,y-.003,x,y+.004);drop.closePath();piece(g,'Parcel_Care_Raindrop_'+i,drop,teal);}
  const bounds=new T.Box3().setFromObject(g),center=bounds.getCenter(new T.Vector3()),dimensions=bounds.getSize(new T.Vector3()),factor=.0255/Math.max(dimensions.x,dimensions.y);
  for(const mesh of g.children){mesh.geometry.translate(-center.x,-center.y,0);mesh.geometry.scale(factor,factor,1);mesh.position.x*=factor;mesh.position.y*=factor;mesh.position.z+=.0007;}
  piece(g,'Parcel_Care_Keep_Dry_Paper',roundedPath(T.Shape,.032,.034,.003),cream,.0005);
  line(g,'Parcel_Care_Keep_Dry_Border',roundedPath(T.Shape,.028,.030,.0025).getPoints(10).map(p=>[p.x,p.y]),.0008,teal,.0008);
  return g;
}
function fragile(){
  const g=new T.Group();piece(g,'Parcel_Care_Fragile_Paper',roundedPath(T.Shape,.044,.051,.003),cream,.00065);
  line(g,'Parcel_Care_Fragile_Border',roundedPath(T.Shape,.040,.047,.0023).getPoints(6).map(p=>[p.x,p.y]),.00125,coral,.00082);
  piece(g,'Parcel_Care_Fragile_Glass',shape([[-.007,.016],[.007,.016],[.006,.006],[.004,.003],[.001,.001],[.001,-.006],[.006,-.007],[.006,-.009],[-.006,-.009],[-.006,-.007],[-.001,-.006],[-.001,.001],[-.004,.003],[-.006,.006]]),coral,.00083);
  for(const sign of [-1,1])for(const [i,y]of [[0,.001],[1,.006]])line(g,'Parcel_Care_Fragile_Ray_'+sign+'_'+i,[[sign*.010,y],[sign*.013,y+(i===0?-.002:.002)]],.0011,coral,.00085);
  text(g,'Parcel_Care_Fragile_Text','FRAGILE',.031,-.019,brown,.00085);return g;
}
for(const color of (process.argv.includes('--teal-only')?['teal']:['teal','coral']))for(const size of ['small','large']){
  const id=`play-parcel-${size}`,name=`${id}-${color}.glb`,key=`${id}:${color}`,bytes=await fs.readFile('public/models/'+name);
  const {scene}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');let carton;const old=[];
  scene.traverse(n=>{if(n.name==='Parcel_Carton')carton=n;if(n.name.startsWith('Parcel_Care_'))old.push(n);});old.forEach(n=>n.removeFromParent());if(!carton)throw Error('Missing carton');scene.updateMatrixWorld(true);carton.geometry.computeBoundingBox();
  const stamp=color==='teal'?keepDry():fragile(),center=new T.Box3().setFromObject(stamp).getCenter(new T.Vector3());center.z=0;stamp.children.forEach(n=>n.position.sub(center));
  const factor=(size==='small'?.75:1)*(color==='teal'?1.1:1),angle=(size==='small'?(color==='coral'?-3:2):(color==='coral'?4:-4))*Math.PI/180;
  const isTeal=color==='teal',box=carton.geometry.boundingBox;
  const x=isTeal?box.max.x+.00013:box.min.x-.00013;
  const y=isTeal?(size==='small'?.012:-.030):(size==='small'?.021:-.014);
  const z=isTeal?(size==='small'?.044:.045):(size==='small'?-.042:-.049);
  const placement=scene.matrixWorld.clone().invert().multiply(carton.matrixWorld).multiply(new T.Matrix4().makeTranslation(x,y,z)).multiply(new T.Matrix4().makeRotationY(isTeal?Math.PI/2:-Math.PI/2)).multiply(new T.Matrix4().makeRotationZ(angle)).multiply(new T.Matrix4().makeScale(factor,factor,factor));
  for(const mesh of [...stamp.children]){mesh.updateMatrix();mesh.applyMatrix4(placement);mesh.userData={assetGroup:id,careStamp:color==='teal'?'Keep Dry':'Fragile'};scene.add(mesh);}
  const candidate=path.resolve(folder,name);await fs.writeFile(candidate,Buffer.from(await new GLTFExporter().parseAsync(scene,{binary:true})));
  execFileSync(process.execPath,['scripts/stage-asset.cjs',key,candidate]);
  console.log(`${size} ${color}: ${isTeal?'compact symbol-only K7 patch on positive X':'repositioned F2 Fragile patch'}`);
}
