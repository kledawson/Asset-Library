import fs from 'node:fs/promises';
import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
const bytes=await fs.readFile('public/models/editor-sources/workshop-hammer.glb');
const {scene}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const meshes=[];scene.traverse(o=>{if(o.isMesh)meshes.push(o);});
const wood=meshes.find(o=>o.material.name==='timber');
const oldClaw=meshes.find(o=>/^Claw[ _]/.test(o.name)||o.material.name==='Forged Claw Steel');
const metal=oldClaw.material.clone();metal.name='Forged Claw Steel';metal.roughness=.4;
const tip=metal.clone();tip.name='Ground Claw Tips';tip.color.multiplyScalar(1.12);tip.roughness=.27;
for(const mesh of meshes)if(/^Claw[ _]|^Side[ _]Wood/.test(mesh.name)||['Forged Claw Steel','Ground Claw Tips'].includes(mesh.material.name))mesh.removeFromParent();
const curve=new T.CubicBezierCurve3(new T.Vector3(.401,.946,0),new T.Vector3(.352,.955,0),new T.Vector3(.304,.924,0),new T.Vector3(.325,.890,0));
for(const side of [-1,1]){
 const vertices=[],indices=[],steps=40,N=8;
 for(let i=0;i<=steps;i++){
  const t=i/steps,p=curve.getPoint(t),v=curve.getTangent(t),normal=new T.Vector3(-v.y,v.x,0);
  const thickness=T.MathUtils.lerp(.025,.0025,Math.pow(t,1.55));
  const slot=.001+Math.pow(t,1.7)*.007;
  const width=(T.MathUtils.lerp(.060,.040,t)-slot)/2,half=width/2,h=thickness/2;
  const bevel=Math.min(.0017,h*.48),center=-.065+side*(slot/2+half);
  const section=[[-half+bevel,-h],[half-bevel,-h],[half,-h+bevel],[half,h-bevel],[half-bevel,h],[-half+bevel,h],[-half,h-bevel],[-half,-h+bevel]];
  for(const [z,k] of section)vertices.push(p.x+normal.x*k,p.y+normal.y*k,center+z);
 }
 const geo=new T.BufferGeometry();
 for(let i=0;i<steps;i++){
  const start=indices.length;
  for(let j=0;j<N;j++){const a=i*N+j,b=i*N+(j+1)%N,c=a+N,d=b+N;indices.push(a,c,b,b,c,d);}
 }
 const capStart=indices.length;
 for(let j=1;j<N-1;j++){indices.push(0,j,j+1);const end=steps*N;indices.push(end,end+j+1,end+j);}
 geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();
 const colors=[];for(let i=0;i<=steps;i++){const value=i>=steps-3?1:.90;for(let j=0;j<N;j++)colors.push(value,value,value);}
 geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));metal.vertexColors=true;
 const claw=new T.Mesh(geo,metal);claw.name=side<0?'Claw Front':'Claw Back';scene.add(claw);
}
// Trace the actual curved side surface so every grain strand touches the wood.
scene.updateMatrixWorld(true);
const grain=new T.MeshStandardMaterial({name:'Side Wood Grain',color:'#946936',roughness:.94});grain.color.convertSRGBToLinear();
const light=grain.clone();light.name='Side Wood Highlights';light.color.set('#c29458').convertSRGBToLinear();
const ray=new T.Raycaster();
for(const side of [-1,1])for(let strand=0;strand<7;strand++){
 const points=[];
 for(let j=0;j<=48;j++){
  const y=.599+j/48*.278;
  const z=-.077+strand*.004+.0007*Math.sin(y*47+strand*.73+side*1.2);
  ray.set(new T.Vector3(side>0?1:-1,y,z),new T.Vector3(-side,0,0));
  const hit=ray.intersectObject(wood,false)[0];if(hit)points.push(hit.point.clone().add(new T.Vector3(side*.00007,0,0)));
 }
 if(points.length<2)continue;
 const mesh=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),48,strand%3===0?.00024:.00018,4,false),strand%3===2?light:grain);
 mesh.name=`Side Wood ${side>0?'Right':'Left'} ${strand+1}`;scene.add(mesh);
}
class Reader{readAsArrayBuffer(b){b.arrayBuffer().then(r=>{this.result=r;this.onloadend?.();});}readAsDataURL(b){b.arrayBuffer().then(r=>{this.result=`data:${b.type};base64,${Buffer.from(r).toString('base64')}`;this.onloadend?.();});}}
globalThis.FileReader=Reader;
await fs.writeFile('.asset-candidates/workshop-hammer-claw-grain.glb',Buffer.from(await new GLTFExporter().parseAsync(scene,{binary:true})));
console.log('Ground claw tips, tighter nail slot, and fitted side grain generated.');
