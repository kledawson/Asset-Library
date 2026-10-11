import fs from 'node:fs/promises';
import * as T from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
const bytes=await fs.readFile('public/models/editor-sources/workshop-hammer.glb');
const {scene}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
scene.traverse(mesh=>{
 if(!mesh.isMesh || mesh.material.name!=='steelInset')return;
 const shape=new T.Shape();shape.moveTo(.413,.9555);
 shape.quadraticCurveTo(.403,.9555,.403,.9455);shape.lineTo(.403,.9045);
 shape.quadraticCurveTo(.403,.8945,.413,.8945);shape.lineTo(.470,.8945);
 shape.bezierCurveTo(.490,.8945,.505,.914,.521,.918);shape.lineTo(.521,.932);
 shape.bezierCurveTo(.505,.936,.490,.9555,.470,.9555);shape.closePath();
 let geo=new T.ExtrudeGeometry(shape,{depth:.051,bevelEnabled:true,bevelSize:.009,bevelThickness:.010,bevelSegments:5,curveSegments:20});
 const p=geo.attributes.position;
 for(let i=0;i<p.count;i++){
  const taper=T.MathUtils.smoothstep(p.getX(i),.478,.526);
  p.setZ(i,.0255+(p.getZ(i)-.0255)*(1-.45*taper));
 }
 geo.deleteAttribute('normal');geo.deleteAttribute('uv');geo=mergeVertices(geo);geo.computeVertexNormals();
 mesh.geometry=geo;mesh.position.set(0,0,-.0905);mesh.rotation.set(0,0,0);mesh.scale.set(1,1,1);
});
class Reader{readAsArrayBuffer(b){b.arrayBuffer().then(r=>{this.result=r;this.onloadend?.();});}readAsDataURL(b){b.arrayBuffer().then(r=>{this.result=`data:${b.type};base64,${Buffer.from(r).toString('base64')}`;this.onloadend?.();});}}
globalThis.FileReader=Reader;
await fs.writeFile('.asset-candidates/workshop-hammer-clean-neck.glb',Buffer.from(await new GLTFExporter().parseAsync(scene,{binary:true})));
