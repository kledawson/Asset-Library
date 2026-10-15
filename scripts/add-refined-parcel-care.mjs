import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import * as T from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { roundedPath } from './parcel-geometry.mjs';

globalThis.FileReader=class { readAsArrayBuffer(blob) { blob.arrayBuffer().then(value=>{this.result=value;this.onloadend?.();}); } };
const folder='.asset-candidates/parcels/refined-care';
await fs.mkdir(folder,{recursive:true});
const font=new FontLoader().parse(JSON.parse(await fs.readFile('node_modules/three/examples/fonts/helvetiker_bold.typeface.json','utf8')));
const material=(name,color)=>new T.MeshStandardMaterial({name,color:new T.Color(color).convertSRGBToLinear(),roughness:.94,metalness:0,side:T.DoubleSide});
const dark=material('Parcel_Care_Dark_Brown','#382b24'),teal=material('Parcel_Care_Deep_Teal','#31858c'),gold=material('Parcel_Care_Golden_Yellow','#dfad27'),cream=material('Parcel_Care_Warm_Paper','#f6eedb'),white=material('Parcel_Care_White_Parcel_Tape','#fff5dc');
const form=points=>{const p=new T.Shape();p.moveTo(...points[0]);for(const v of points.slice(1))p.lineTo(...v);p.closePath();return p;};
function piece(g,name,s,mat,z=.0007){const m=new T.Mesh(new T.ShapeGeometry(s,12),mat);m.name='Parcel_Care_'+name;m.position.z=z;g.add(m);return m;}
function line(g,name,points,width,mat,z=.0009){const c=new T.CatmullRomCurve3(points.map(([x,y])=>new T.Vector3(x,y,z)));const m=new T.Mesh(new T.TubeGeometry(c,Math.max(16,points.length*5),width/2,6,false),mat);m.name='Parcel_Care_'+name;g.add(m);return m;}
function words(g,name,value,width,y,mat,z=.001){const geo=new T.ShapeGeometry(font.generateShapes(value,.01),4);geo.computeBoundingBox();const box=geo.boundingBox,scale=width/(box.max.x-box.min.x);geo.translate(-(box.min.x+box.max.x)/2,-box.min.y,0);geo.scale(scale,scale,1);const m=new T.Mesh(geo,mat);m.name='Parcel_Care_'+name;m.position.set(0,y,z);g.add(m);}
function clipped(w,h,c){return form([[-w/2+c,-h/2],[w/2-c,-h/2],[w/2,-h/2+c],[w/2,h/2-c],[w/2-c,h/2],[-w/2+c,h/2],[-w/2,h/2-c],[-w/2,-h/2+c]]);}
function dryD3(){
  const g=new T.Group();g.name='Parcel_Care_D3_Keep_Dry';
  piece(g,'D3_Paper',clipped(.056,.064,.0043),cream,.0005);
  for(const [i,w,h,c,weight]of [[0,.052,.060,.0039,.001],[1,.048,.056,.0035,.00055]])
    line(g,'D3_Teal_Border_'+i,clipped(w,h,c).getPoints(3).map(v=>[v.x,v.y]),weight,teal,.0009);
  const canopy=new T.Shape();canopy.moveTo(-.016,.004);canopy.bezierCurveTo(-.013,.026,.013,.026,.016,.004);canopy.quadraticCurveTo(.010,.008,.005,.003);canopy.quadraticCurveTo(0,.008,-.005,.003);canopy.quadraticCurveTo(-.010,.008,-.016,.004);canopy.closePath();
  piece(g,'D3_Umbrella_Canopy',canopy,teal,.001);
  line(g,'D3_Umbrella_Outline',canopy.getPoints(15).map(p=>[p.x,p.y]),.0012,dark,.0012);
  line(g,'D3_Umbrella_Handle',[[0,.005],[0,-.009],[-.001,-.013],[-.004,-.014],[-.006,-.011]],.00155,dark,.0013);
  for(const [i,x,y]of [[0,-.012,.023],[1,0,.026],[2,.012,.023]]){
    const d=new T.Shape();d.moveTo(x,y+.004);d.bezierCurveTo(x-.004,y-.002,x-.003,y-.005,x,y-.005);d.bezierCurveTo(x+.003,y-.005,x+.004,y-.002,x,y+.004);d.closePath();piece(g,'D3_Raindrop_'+i,d,teal,.0011);
  }
  words(g,'D3_Keep_Dry_Text','KEEP DRY',.039,-.024,dark);
  return g;
}
function handleH3(){
  const g=new T.Group();g.name='Parcel_Care_H3_Handle_With_Care';
  piece(g,'H3_Paper',roundedPath(T.Shape,.058,.066,.006),cream,.0005);
  line(g,'H3_Gold_Border',roundedPath(T.Shape,.052,.060,.005).getPoints(14).map(v=>[v.x,v.y]),.00115,gold,.0009);
  // The two hands cradle the parcel, matching the compact H3 artwork.
  const left=form([[-.021,.013],[-.018,.014],[-.017,.000],[-.009,-.006],[-.009,-.012],[-.015,-.012],[-.023,-.004],[-.024,.001],[-.024,.013]]);
  piece(g,'H3_Left_Hand',left,dark,.001);
  const right=form([[.021,.013],[.018,.014],[.017,.000],[.009,-.006],[.009,-.012],[.015,-.012],[.023,-.004],[.024,.001],[.024,.013]]);piece(g,'H3_Right_Hand',right,dark,.001);
  line(g,'H3_Left_Thumb',[[-.017,.003],[-.012,-.002],[-.010,-.003]],.0018,dark,.0011);
  line(g,'H3_Right_Thumb',[[.017,.003],[.012,-.002],[.010,-.003]],.0018,dark,.0011);
  piece(g,'H3_Box',form([[-.011,.014],[0,.020],[.011,.014],[.011,.001],[0,-.005],[-.011,.001]]),gold,.0012);
  line(g,'H3_Box_Center',[[0,.020],[0,-.005]],.0008,white,.0013);
  line(g,'H3_Box_Top',[[ -.011,.014],[0,.008],[.011,.014]],.0008,white,.0013);
  for(const x of [-.010,0,.010])line(g,'H3_Ray_'+x,[[x,.025],[x*.8,.029]],.0016,gold,.0011);
  words(g,'H3_Handle_Text','HANDLE',.032,-.020,dark);
  words(g,'H3_With_Care_Text','WITH CARE',.042,-.029,dark);
  return g;
}
for(const size of ['small','large'])for(const color of ['teal','yellow']){
  const id=`play-parcel-${size}`,name=`${id}-${color}.glb`,key=`${id}:${color}`;
  const b=await fs.readFile('public/models/'+name),{scene}=await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');
  let carton;const old=[];scene.traverse(n=>{if(n.name==='Parcel_Carton')carton=n;if(n.name.startsWith('Parcel_Care_'))old.push(n);});
  if(!carton)throw Error('Missing carton: '+name);
  old.forEach(n=>n.removeFromParent());scene.updateMatrixWorld(true);carton.geometry.computeBoundingBox();
  const stamp=color==='teal'?dryD3():handleH3();
  const small=size==='small';
  const scale=color==='teal'?(small?.79:1):(small?.74:1.13);
  const box=carton.geometry.boundingBox;
  const offset=color==='teal'
    ? new T.Vector3(box.max.x+.0002,small?.012:-.030,small?.043:.044)
    : new T.Vector3(small?.044:0,small?.007:.002,box.min.z-.0002);
  const rotation=new T.Matrix4().makeRotationY(color==='teal'?Math.PI/2:Math.PI);
  rotation.multiply(new T.Matrix4().makeRotationZ((color==='teal'?(small?2:-4):(small?7:-5))*Math.PI/180));
  const placement=scene.matrixWorld.clone().invert().multiply(carton.matrixWorld).multiply(new T.Matrix4().makeTranslation(...offset.toArray())).multiply(rotation).multiply(new T.Matrix4().makeScale(scale,scale,scale));
  for(const mesh of [...stamp.children]){mesh.updateMatrix();mesh.applyMatrix4(placement);mesh.userData={assetGroup:id,careStamp:color==='teal'?'D3 Keep Dry':'H3 Handle With Care'};scene.add(mesh);}
  const candidate=path.resolve(folder,name);await fs.writeFile(candidate,Buffer.from(await new GLTFExporter().parseAsync(scene,{binary:true})));
  execFileSync(process.execPath,['scripts/stage-asset.cjs',key,candidate]);
  console.log(`${key}: ${color==='teal'?'D3 on care-label side':'H3 on bare back cardboard'}`);
}
