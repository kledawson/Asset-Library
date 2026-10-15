import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import * as T from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();});}};
const folder='.asset-candidates/parcels/recycling';
await fs.mkdir(folder,{recursive:true});
const ink=new T.MeshStandardMaterial({name:'Parcel_Recycling_Dark_Ink',color:new T.Color('#44362b').convertSRGBToLinear(),roughness:.94,metalness:0});
// Follow the reference's folded ribbon silhouette: three arrowheads and
// three curved tails, with distinct gaps at the folds and an open center.
const outlines=[
  [['M',1207,681],['L',1232,639],['Q',1242,621,1254,629],['Q',1265,638,1276,657],['L',1252,709]],
  [['M',1255,622],['L',1296,622],['Q',1319,622,1331,646],['L',1348,673],['L',1367,646],['L',1344,697],['L',1288,693],['L',1305,681],['L',1278,637],['Q',1267,623,1255,622]],
  [['M',1326,722],['L',1372,694],['L',1397,738],['Q',1412,762,1386,773],['Q',1373,780,1358,772]],
  [['M',1398,772],['L',1374,815],['Q',1363,835,1337,835],['L',1306,835],['L',1322,852],['L',1290,806],['L',1319,761],['L',1318,779],['L',1363,780],['Q',1387,782,1398,772]],
  [['M',1275,778],['L',1275,829],['L',1227,829],['Q',1200,829,1202,806],['Q',1201,794,1218,778]],
  [['M',1198,809],['L',1169,766],['Q',1160,752,1170,733],['L',1187,708],['L',1168,709],['L',1224,705],['L',1248,754],['L',1230,745],['L',1206,783],['Q',1198,796,1198,809]],
];
const arrows=outlines.map(commands=>{const shape=new T.Shape();for(const [op,...p] of commands){if(op==='M')shape.moveTo(...p);else if(op==='L')shape.lineTo(...p);else shape.quadraticCurveTo(...p);}shape.closePath();return shape;});
await fs.writeFile(folder+'/symbol-review.json',JSON.stringify(arrows.map(shape=>shape.getPoints(20).map(p=>[p.x,p.y]))));
for(const size of (process.argv.includes('--small-only')?['small']:['small','large']))for(const color of ['coral','yellow','teal']){
  const id=`play-parcel-${size}`,name=`${id}-${color}.glb`,bytes=await fs.readFile('public/models/'+name);
  const {scene}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  let carton;const old=[];scene.traverse(n=>{if(n.name==='Parcel_Carton')carton=n;if(n.name.startsWith('Parcel_Recycling_'))old.push(n);});old.forEach(n=>n.removeFromParent());
  if(!carton)throw Error('Missing carton');scene.updateMatrixWorld(true);carton.geometry.computeBoundingBox();
  const box=carton.geometry.boundingBox,diameter=size==='small'?.0095:.025;
  const symbolBounds=new T.Box2();arrows.forEach(s=>s.getPoints(24).forEach(p=>symbolBounds.expandByPoint(p)));
  const symbolCenter=symbolBounds.getCenter(new T.Vector2()),symbolSize=symbolBounds.getSize(new T.Vector2());
  const factor=diameter/Math.max(symbolSize.x,symbolSize.y);
  const center=new T.Vector3(size==='small'?box.min.x+.005+symbolSize.x*factor/2:box.max.x-.0205,box.min.y-.00015,size==='small'?box.max.z-.005-symbolSize.y*factor/2:box.max.z-.020);
  const placement=scene.matrixWorld.clone().invert().multiply(carton.matrixWorld).multiply(new T.Matrix4().makeTranslation(...center.toArray())).multiply(new T.Matrix4().makeRotationX(Math.PI/2));
  for(let i=0;i<arrows.length;i++){
    const geometry=new T.ShapeGeometry(arrows[i],12);
    geometry.translate(-symbolCenter.x,-symbolCenter.y,0);geometry.scale(factor,-factor,1);
    // Mirroring the drawing's downward Y coordinates reverses triangle winding.
    const indices=geometry.index.array;for(let n=0;n<indices.length;n+=3){const swap=indices[n+1];indices[n+1]=indices[n+2];indices[n+2]=swap;}
    geometry.computeVertexNormals();
    const mesh=new T.Mesh(geometry,ink);mesh.name=`Parcel_Recycling_Arrow_${i}`;mesh.userData={assetGroup:id,recyclingMark:true};mesh.applyMatrix4(placement);scene.add(mesh);
  }
  const candidate=path.resolve(folder,name);await fs.writeFile(candidate,Buffer.from(await new GLTFExporter().parseAsync(scene,{binary:true})));
  execFileSync(process.execPath,['scripts/stage-asset.cjs',`${id}:${color}`,candidate]);
  console.log(`${size} ${color}: bottom corner recycling mark; remaining underside free`);
}
