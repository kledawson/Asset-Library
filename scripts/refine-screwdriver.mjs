import fs from 'node:fs/promises';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';
const b=await fs.readFile('public/models/editor-sources/workshop-screwdriver.glb');
const {scene}=await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');
const mats={};scene.traverse(o=>{if(o.isMesh){mats[o.name]=o.material.clone();mats[o.name].side=THREE.DoubleSide;mats[o.name].transparent=false;mats[o.name].opacity=1;}});
for(const [name,color,roughness,metalness] of [['teal',0x357e79,.75,0],['navy',0x344653,.65,.25],['brass',0xdba243,.48,.35],['steel',0x899398,.34,.72],['steelEdge',0xb4bcc0,.26,.8]])mats[name]=new THREE.MeshStandardMaterial({name,color:new THREE.Color(color).convertSRGBToLinear(),roughness,metalness,side:THREE.DoubleSide});
const group=new THREE.Group();group.name='Workshop Screwdriver';
function add(geo,mat,name,y){const o=new THREE.Mesh(geo,mats[mat]);o.name=name;o.position.set(-.51,y,-.079);group.add(o);return o;}
// Preserve the established sculpted profile; rotate instead of reflecting its normals.
const profile=[[0,0],[.008,0],[.022,.005],[.032,.022],[.035,.042],[.029,.061],[.027,.09],[.033,.12],[.037,.15],[.033,.177],[.023,.195],[.009,.2],[0,.2]].map(([r,y])=>new THREE.Vector2(r,y));
add(new THREE.LatheGeometry(profile,32),'teal','Teal Handle',.99).rotation.x=Math.PI;
add(new THREE.CylinderGeometry(.021,.021,.006,24),'navy','Flush End Cap',.99);
add(new THREE.CylinderGeometry(.019,.019,.009,24),'brass','Brass Ferrule',.79);
add(new THREE.CylinderGeometry(.008,.008,.166,24),'steel','Steel Shaft',.712);
// Two perpendicular flat blades with a rounded shoulder and a squared driving edge.
const levels=[[.638,.0078,.0078],[.633,.009,.004],[.625,.012,.0024],[.613,.010,.0018],[.607,.004,.001],[.603,.0007,.00035]];
const points=[];
for(const [y,r,t] of levels){
 const cross=[[r,t],[t,t],[t,r],[-t,r],[-t,t],[-r,t],[-r,-t],[-t,-t],[-t,-r],[t,-r],[t,-t],[r,-t]];
 for(const [x,z] of cross)points.push(x,y,z);
}
const idx=[],n=12;
for(let row=0;row<levels.length-1;row++)for(let i=0;i<n;i++){const a=row*n+i,b=row*n+(i+1)%n;idx.push(a,b,b+n,a,b+n,a+n);}
// Seal the end faces with center fans; retain the concave cross profile.
const top=points.length/3;points.push(0,levels[0][0],0);const end=points.length/3;points.push(0,levels.at(-1)[0],0);
for(let i=0;i<n;i++){idx.push(top,(i+1)%n,i);const last=(levels.length-1)*n;idx.push(end,last+i,last+(i+1)%n);}
const tip=new THREE.BufferGeometry();tip.setAttribute('position',new THREE.Float32BufferAttribute(points,3));tip.setIndex(idx);tip.computeVertexNormals();
// Flat facet normals keep each blade face distinct rather than rounding the cross.
const faceted=tip.toNonIndexed();faceted.computeVertexNormals();
const groove=new THREE.MeshStandardMaterial({name:'Tip Groove Steel',color:new THREE.Color(0x424d55).convertSRGBToLinear(),roughness:.6,metalness:.5,side:THREE.DoubleSide});
faceted.clearGroups();for(let i=0;i<faceted.attributes.position.count;i+=3){const section=Math.floor(i/6)%12;faceted.addGroup(i,3,i<288 && [0,1,3,4,6,7,9,10].includes(section)?1:0);}
// Pack the two finishes into two draw groups rather than one group per triangle.
const ordered=new THREE.BufferGeometry(),positions=[],normals=[];let start=0;
for(const materialIndex of [0,1]){const first=positions.length/3;for(const group of faceted.groups.filter(g=>g.materialIndex===materialIndex))for(let k=group.start;k<group.start+group.count;k++){positions.push(faceted.attributes.position.getX(k),faceted.attributes.position.getY(k),faceted.attributes.position.getZ(k));normals.push(faceted.attributes.normal.getX(k),faceted.attributes.normal.getY(k),faceted.attributes.normal.getZ(k));}ordered.addGroup(first,positions.length/3-first,materialIndex);}
ordered.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));ordered.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
const blade=add(ordered,'steelEdge','Crossed Flat Blades',0);blade.material=[mats.steelEdge,groove];
class Reader{readAsArrayBuffer(b){b.arrayBuffer().then(r=>{this.result=r;this.onloadend?.();});}readAsDataURL(b){b.arrayBuffer().then(r=>{this.result=`data:${b.type};base64,${Buffer.from(r).toString('base64')}`;this.onloadend?.();});}}
globalThis.FileReader=Reader;
await fs.mkdir('.asset-candidates',{recursive:true});const out=await new GLTFExporter().parseAsync(group,{binary:true});await fs.writeFile('.asset-candidates/workshop-screwdriver.glb',Buffer.from(out));console.log('Clean screwdriver candidate generated');


