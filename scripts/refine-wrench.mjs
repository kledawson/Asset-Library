import fs from 'node:fs/promises';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';
const bytes=await fs.readFile('public/models/editor-sources/workshop-wrench.glb');
const {scene}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const middle=-0.089;
const inner=new THREE.MeshStandardMaterial({name:'Dark inner steel',color:0x111416,roughness:0.7,metalness:0.25,side:THREE.DoubleSide});
for(const part of [...scene.children]) {
  if(!part.isMesh) continue;
  part.material.side=THREE.DoubleSide;
  if(part.name==='steelInset'||part.name==='steelEdge') {
    const source=part.geometry.index?part.geometry.toNonIndexed():part.geometry;
    const pos=source.attributes.position, norms=source.attributes.normal;
    const positions=[],normals=[];
    for(let i=0;i<pos.count;i+=3) {
      if([0,1,2].some(j=>pos.getZ(i+j)<middle))continue;
      for(const back of [false,true])for(const j of back?[2,1,0]:[0,1,2]) {
        const k=i+j;positions.push(pos.getX(k),pos.getY(k),back?2*middle-pos.getZ(k):pos.getZ(k));
        normals.push(norms.getX(k),norms.getY(k),back?-norms.getZ(k):norms.getZ(k));
      }
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));part.geometry=geo;
  }
  if(part.name==='steel') {
    const geo=part.geometry.index?part.geometry.toNonIndexed():part.geometry;geo.clearGroups();
    const p=geo.attributes.position,n=geo.attributes.normal;
    for(let i=0;i<p.count;i+=3){
      const x=(p.getX(i)+p.getX(i+1)+p.getX(i+2))/3,y=(p.getY(i)+p.getY(i+1)+p.getY(i+2))/3;
      const side=Math.abs(n.getZ(i))<0.75;
      const bore=Math.hypot(x+0.289,y-0.528)<0.034;
      const jaw=y>0.923&&x>-0.324&&x<-0.203;
      geo.addGroup(i,3,side&&(bore||jaw)?1:0);
    }
    part.geometry=geo;part.material=[part.material,inner];
  }
}
// Remove the rejected jaw ribs from any previous draft.
scene.traverse(o=>{if(o.isMesh && /Jaw[ _]relief/.test(o.name))o.visible=false;});
function world(x,y,z){return new THREE.Vector3(-0.27+x*Math.cos(-.09)-y*Math.sin(-.09),.74+x*Math.sin(-.09)+y*Math.cos(-.09),z);}
// Replace only the handle inset with closed, equally raised relief on both faces.
const oldInset=scene.getObjectByName('steelInset');
let priorPad;scene.traverse(o=>{if(o.isMesh && /Handle[ _]relief[ _]front/.test(o.name))priorPad=o.material;});
const insetMaterial=(oldInset?.material || priorPad || new THREE.MeshStandardMaterial({color:0x333b40})).clone();
insetMaterial.side=THREE.DoubleSide;insetMaterial.color.set(0x57636b).convertSRGBToLinear();insetMaterial.metalness=.55;insetMaterial.roughness=.48;
if(oldInset)oldInset.removeFromParent();
const replaced=[];scene.traverse(o=>{if(/Handle[ _]relief|Solid[ _]inner[ _]bore/.test(o.name))replaced.push(o);});for(const o of replaced)o.removeFromParent();
const shape=new THREE.Shape();shape.moveTo(-.009,-.152);shape.quadraticCurveTo(-.015,-.03,-.009,.075);shape.quadraticCurveTo(0,.088,.009,.075);shape.quadraticCurveTo(.015,-.03,.009,-.152);shape.quadraticCurveTo(0,-.164,-.009,-.152);shape.closePath();
for(const back of [false,true]){
 const g=new THREE.ExtrudeGeometry(shape,{depth:.003,bevelEnabled:true,bevelThickness:.0008,bevelSize:.0008,bevelSegments:3,curveSegments:20});
 const m=new THREE.Mesh(g,insetMaterial);m.name=back?'Handle relief back':'Handle relief front';
 m.position.set(-.27,.74,back?-.100:-.078);m.rotation.z=-.09;
 m.scale.set(.94,.97,back?-1:1);scene.add(m);
}
// A continuous black lining closes the box-end bore walls while leaving its opening clear.
const wall=[];
for(let i=0;i<24;i++){
 const point=k=>{const a=-k/24*Math.PI*2,r=k%2?.026:.03;return [Math.cos(a)*r,-.213+Math.sin(a)*r];};
 const a=point(i),b=point((i+1)%24);
 const q=[world(...a,-.1035),world(...b,-.1035),world(...b,-.0745),world(...a,-.0745)];
 for(const k of [0,1,2,0,2,3])wall.push(...q[k].toArray());
}
const wallGeo=new THREE.BufferGeometry();wallGeo.setAttribute('position',new THREE.Float32BufferAttribute(wall,3));wallGeo.computeVertexNormals();const lining=new THREE.Mesh(wallGeo,inner);lining.name='Solid inner bore walls';scene.add(lining);
class Reader{readAsArrayBuffer(b){b.arrayBuffer().then(r=>{this.result=r;this.onloadend?.();});}readAsDataURL(b){b.arrayBuffer().then(r=>{this.result=`data:${b.type};base64,${Buffer.from(r).toString('base64')}`;this.onloadend?.();});}}
globalThis.FileReader=Reader;
await fs.mkdir('.asset-candidates',{recursive:true});const result=await new GLTFExporter().parseAsync(scene,{binary:true});await fs.writeFile('.asset-candidates/workshop-wrench.glb',Buffer.from(result));console.log('Wrench candidate generated');
