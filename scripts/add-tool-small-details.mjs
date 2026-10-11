import fs from 'node:fs/promises';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
class Reader{readAsArrayBuffer(b){b.arrayBuffer().then(r=>{this.result=r;this.onloadend?.();});}readAsDataURL(b){b.arrayBuffer().then(r=>{this.result=`data:${b.type};base64,${Buffer.from(r).toString('base64')}`;this.onloadend?.();});}}
globalThis.FileReader=Reader;
const font={'0':['111','101','101','101','111'],'1':['010','110','010','010','111'],'2':['111','001','111','100','111'],'5':['111','100','111','001','111']};
function stamp(scene,text,x,y,z,height,color){const unit=height/5,mat=new T.MeshBasicMaterial({name:'Stamped markings',color});const group=new T.Group();group.name=`Stamped ${text}`;const width=(text.length*4-1)*unit;for(let d=0;d<text.length;d++)for(let row=0;row<5;row++)for(let col=0;col<3;col++)if(font[text[d]][row][col]==='1'){const m=new T.Mesh(new T.BoxGeometry(unit*.82,unit*.82,.00018),mat);m.position.set(x-width/2+(d*4+col+.5)*unit,y+(2-row)*unit,z);group.add(m);}scene.add(group);}
await fs.mkdir('.asset-candidates',{recursive:true});
for(const kind of ['wrench','triangle']){
 const b=await fs.readFile(`public/models/workshop-${kind}.glb`);const {scene}=await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');
 const old=[];scene.traverse(n=>{if(/^Stamped /.test(n.name))old.push(n);});old.forEach(n=>n.removeFromParent());
 if(kind==='wrench'){scene.traverse(n=>{if(n.isMesh&&/^Handle_relief/.test(n.name)){n.material=n.material.clone();n.material.color.lerp(new T.Color('#586168'),.5);}});stamp(scene,'12',-.26,.835,-.0739,.016,'#394348');}
 else{stamp(scene,'5',.10,.477,-.0810,.0075,'#745536');stamp(scene,'10',.17,.477,-.0810,.0075,'#745536');stamp(scene,'15',.233,.477,-.0810,.0075,'#745536');}
 const output=await new GLTFExporter().parseAsync(scene,{binary:true});await fs.writeFile(`.asset-candidates/workshop-${kind}-small-details.glb`,Buffer.from(output));
}

