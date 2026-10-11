import fs from 'node:fs/promises';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
class Reader{readAsArrayBuffer(b){b.arrayBuffer().then(r=>{this.result=r;this.onloadend?.();});}}
globalThis.FileReader=Reader;
const b=await fs.readFile('public/models/workshop-triangle.glb');const {scene}=await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');
const old=[];scene.traverse(n=>{if(n.isMesh&&n.material.name==='Stamped markings')old.push(n);});old.forEach(n=>n.removeFromParent());
const font={'0':['111','101','101','101','111'],'1':['010','110','010','010','111'],'2':['111','001','111','100','111'],'5':['111','100','111','001','111']};
const mat=new T.MeshBasicMaterial({name:'Aligned measurement numbers',color:'#293433'});
function stamp(text,x,y,z,back){const unit=.006/5,width=(text.length*4-1)*unit,group=new T.Group();group.name='Measurement '+text;for(let d=0;d<text.length;d++)for(let r=0;r<5;r++)for(let c=0;c<3;c++)if(font[text[d]][r][c]==='1'){const m=new T.Mesh(new T.PlaneGeometry(unit*1.02,unit*1.02),mat);m.position.set(x+(back?-1:1)*(-width/2+(d*4+c+.5)*unit),y+(2-r)*unit,z);if(back)m.rotation.y=Math.PI;group.add(m);}scene.add(group);}
for(const [z,back] of [[-.08035,false],[-.1055,true]]){
 [0,4,8,12].forEach((i,k)=>stamp(String(k*5),.019+i*.0175,.469,z,back));
 [0,4,8].forEach((i,k)=>stamp(String(k*5),.232,.478+i*.021,z,back));
 const nx=.24/Math.hypot(.3,.24),ny=-.3/Math.hypot(.3,.24);
 [0,5,10].forEach((i,k)=>{const t=.23+i*.054;stamp(String(k*5),-.035+t*.3+nx*.030,.44+t*.24+ny*.030,z,back);});
}
await fs.writeFile('.asset-candidates/workshop-triangle-aligned-numbers.glb',Buffer.from(await new GLTFExporter().parseAsync(scene,{binary:true})));
