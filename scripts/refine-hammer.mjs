import fs from 'node:fs/promises';import * as T from 'three';import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';
const b=await fs.readFile('public/models/editor-sources/workshop-hammer.glb');const {scene}=await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');let metal;
scene.traverse(o=>{if(o.isMesh&&o.name==='steel'){metal=o.material.clone();const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry,p=g.attributes.position,n=g.attributes.normal,ps=[],ns=[];for(let i=0;i<p.count;i+=3){if(Math.min(p.getX(i),p.getX(i+1),p.getX(i+2))<.394)continue;for(let j=0;j<3;j++){ps.push(p.getX(i+j),p.getY(i+j),p.getZ(i+j));ns.push(n.getX(i+j),n.getY(i+j),n.getZ(i+j));}}const clean=new T.BufferGeometry();clean.setAttribute('position',new T.Float32BufferAttribute(ps,3));clean.setAttribute('normal',new T.Float32BufferAttribute(ns,3));o.geometry=clean;}});
const oldClaws=[];scene.traverse(o=>{if(/^Claw[ _]/.test(o.name))oldClaws.push(o);});for(const o of oldClaws)o.removeFromParent();
// Two smoothly swept claw tines with a visible nail slot and tapered tips.
for(const side of [-1,1]){
 const shape=new T.Shape();shape.moveTo(.395,.958);shape.bezierCurveTo(.356,.968,.316,.954,.308,.923);shape.bezierCurveTo(.300,.895,.319,.877,.343,.873);shape.lineTo(.353,.881);shape.bezierCurveTo(.329,.890,.321,.904,.326,.922);shape.bezierCurveTo(.332,.940,.359,.941,.395,.936);shape.closePath();
 const geo=new T.ExtrudeGeometry(shape,{depth:.019,bevelEnabled:true,bevelThickness:.0012,bevelSize:.0012,bevelSegments:3,curveSegments:24});
 // Narrow the thickness toward the end of each tine.
 const pos=geo.attributes.position;for(let i=0;i<pos.count;i++){const y=pos.getY(i),t=T.MathUtils.clamp((y-.875)/.06,0,1);pos.setZ(i,(pos.getZ(i)-.0095)*(.4+.6*t));}geo.computeVertexNormals();
 const tine=new T.Mesh(geo,metal);tine.position.z=-.065+side*.016;tine.name=side<0?'Claw Left':'Claw Right';scene.add(tine);
}
class Reader{readAsArrayBuffer(b){b.arrayBuffer().then(r=>{this.result=r;this.onloadend?.();});}readAsDataURL(b){b.arrayBuffer().then(r=>{this.result=`data:${b.type};base64,${Buffer.from(r).toString('base64')}`;this.onloadend?.();});}}globalThis.FileReader=Reader;
const out=await new GLTFExporter().parseAsync(scene,{binary:true});await fs.writeFile('.asset-candidates/workshop-hammer.glb',Buffer.from(out));

