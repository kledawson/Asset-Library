import fs from 'node:fs/promises';
import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
const bytes=await fs.readFile('public/models/editor-sources/workshop-hammer.glb');
const {scene}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const meshes=[];scene.traverse(o=>{if(o.isMesh)meshes.push(o);});

const oldClaw=meshes.find(o=>/^Claw[ _]/.test(o.name)||o.material.name==='Forged Claw Steel');
const metal=oldClaw.material.clone();metal.name='Forged Claw Steel';metal.roughness=.4;
const tip=metal.clone();tip.name='Ground Claw Tips';tip.color.multiplyScalar(1.12);tip.roughness=.27;
for(const mesh of meshes)if(/^Claw[ _]/.test(mesh.name)||['Forged Claw Steel','Ground Claw Tips'].includes(mesh.material.name))mesh.removeFromParent();
const curve=new T.CubicBezierCurve3(new T.Vector3(.401,.942,0),new T.Vector3(.369,.950,0),new T.Vector3(.329,.943,0),new T.Vector3(.312,.907,0));
for(const side of [-1,1]){
 const vertices=[],indices=[],steps=40,N=8;
 for(let i=0;i<=steps;i++){
  const t=i/steps,p=curve.getPoint(t),v=curve.getTangent(t),normal=new T.Vector3(-v.y,v.x,0);
  const thickness=T.MathUtils.lerp(.022,.002,Math.pow(t,1.55));
  const slot=.0004 + T.MathUtils.smoothstep(t,.36,1)*.0065;
  const width=(T.MathUtils.lerp(.059,.038,Math.pow(t,1.45))-slot)/2,half=width/2,h=thickness/2;
  const bevel=Math.min(.0013,h*.42),center=-.065+side*(slot/2+half);
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
class Reader{readAsArrayBuffer(b){b.arrayBuffer().then(r=>{this.result=r;this.onloadend?.();});}readAsDataURL(b){b.arrayBuffer().then(r=>{this.result=`data:${b.type};base64,${Buffer.from(r).toString('base64')}`;this.onloadend?.();});}}
globalThis.FileReader=Reader;
await fs.writeFile('.asset-candidates/workshop-hammer-balanced-claw.glb',Buffer.from(await new GLTFExporter().parseAsync(scene,{binary:true})));
console.log('Refined tapered nail-pulling claw generated.');
