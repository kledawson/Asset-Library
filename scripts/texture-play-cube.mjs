import * as T from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';
import fs from 'node:fs/promises';
const bytes=await fs.readFile('public/models/editor-sources/play-cube.glb');
const {scene}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const wood=scene.getObjectByName('Cube_Wood');
wood.material=wood.material.clone();
wood.material.color=new T.Color('#d9a56b').convertSRGBToLinear();
const grain=new T.MeshStandardMaterial({name:'Play_Cube_Subtle_Grain',color:new T.Color('#c89762').convertSRGBToLinear(),roughness:.88});
// Grain sits .00015 above the wood, below every colored applique.
const planes=[{name:'Front',normal:new T.Vector3(0,0,1),u:new T.Vector3(1,0,0),v:new T.Vector3(0,1,0)},
 {name:'Back',normal:new T.Vector3(0,0,-1),u:new T.Vector3(1,0,0),v:new T.Vector3(0,1,0)},
 {name:'Right',normal:new T.Vector3(1,0,0),u:new T.Vector3(0,0,1),v:new T.Vector3(0,1,0)},
 {name:'Left',normal:new T.Vector3(-1,0,0),u:new T.Vector3(0,0,1),v:new T.Vector3(0,1,0)},
 {name:'Top',normal:new T.Vector3(0,1,0),u:new T.Vector3(1,0,0),v:new T.Vector3(0,0,1)},
 {name:'Bottom',normal:new T.Vector3(0,-1,0),u:new T.Vector3(1,0,0),v:new T.Vector3(0,0,1)}];
const existing=[];scene.traverse(n=>{if(n.name.startsWith('Cube_Grain_'))existing.push(n);});existing.forEach(n=>n.removeFromParent());
let seed=41873;
const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
for(const face of planes){
 const count=6+Math.floor(random()*4),slant=(random()-.5)*.12;
 for(let i=0;i<count;i++){
 const across=-.056+i*.112/(count-1)+(random()-.5)*.008;
 const length=.026+random()*.055,shift=(random()-.5)*(.128-length);
 const phase=random()*Math.PI*2,frequency=1+random()*1.5,bend=.0003+random()*.0008;
 const points=[];for(let j=0;j<=10;j++){const t=j/10,along=shift+(t-.5)*length;
   const drift=Math.sin(t*Math.PI*frequency+phase)*bend+along*slant;
   points.push(new T.Vector3(0,.0775,0).addScaledVector(face.normal,.07765).addScaledVector(face.u,across+drift).addScaledVector(face.v,along));}
 const mesh=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),10,.00009+random()*.00004,4,false),grain);
 mesh.name=`Cube_Grain_${face.name}_${i+1}`;mesh.userData.assetGroup='play-cube';scene.add(mesh);
}
}
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();});}};
await fs.writeFile('.asset-candidates/play-props/play-cube-varied-grain.glb',Buffer.from(await new GLTFExporter().parseAsync(scene,{binary:true})));
console.log('Created six distinct grain patterns beneath the colored shapes.');
