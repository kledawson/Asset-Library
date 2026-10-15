import * as T from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';
import fs from 'node:fs/promises';
const b=await fs.readFile('public/models/editor-sources/play-cube.glb');
const {scene}=await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');
const materials={};scene.traverse(n=>{if(n.isMesh)materials[n.material.name]=n.material;});
const coral=new T.MeshStandardMaterial({name:'Play_coral',color:new T.Color('#da7858').convertSRGBToLinear(),roughness:.76});
const group=new T.Group();group.name='Asset play-cube';group.userData.assetGroup='play-cube';
function mesh(name,geo,mat,pos,rot=[0,0,0]){const m=new T.Mesh(geo,mat);m.name=name;m.position.fromArray(pos);m.rotation.set(...rot);m.userData.assetGroup='play-cube';group.add(m);}
mesh('Cube_Wood',new RoundedBoxGeometry(.155,.155,.155,2,.008),materials.Play_wood,[0,.0775,0]);
for(const sign of [-1,1]){
 mesh('Cube_Yellow_Circle_'+(sign>0?'Front':'Back'),new T.CylinderGeometry(.032,.032,.002,32),materials.Play_gold,[0,.0775,sign*.0786],[Math.PI/2,0,0]);
 const shape=new T.Shape();shape.moveTo(-.032,-.0325);shape.lineTo(.032,-.0325);shape.lineTo(0,.0325);shape.closePath();
 mesh('Cube_Blue_Triangle_'+(sign>0?'Right':'Left'),new T.ExtrudeGeometry(shape,{depth:.002,bevelEnabled:false}),materials.Play_teal,[sign*.0776,.0775,0],[0,sign*Math.PI/2,0]);
 mesh('Cube_Coral_Square_'+(sign>0?'Top':'Bottom'),new RoundedBoxGeometry(.061,.002,.061,2,.0005),coral,[0,sign>0?.1561:-.0011,0]);
}
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();});}};
await fs.mkdir('.asset-candidates/play-props',{recursive:true});
await fs.writeFile('.asset-candidates/play-props/play-cube-six-faces.glb',Buffer.from(await new GLTFExporter().parseAsync(group,{binary:true})));
console.log('Created clean cube candidate: centered circles, triangles and coral squares on all six faces.');
