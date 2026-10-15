import * as T from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { buildFlushRamp } from './flush-play-ramp.mjs';
import fs from 'node:fs/promises';

const colors = { wood:'#d6aa70', edge:'#e4bd84', grain:'#b98a55', dark:'#344552', rubber:'#293943', gold:'#dda644', steel:'#737b7c', cream:'#efe6d2', coral:'#da7858', orange:'#de995e', teal:'#458d92', yellow:'#edba4b', seam:'#d29a38', parcel:'#cfa36d', parcelSide:'#c19159' };
const materials = Object.fromEntries(Object.entries(colors).map(([name,color])=>[name,new T.MeshStandardMaterial({name:'Play_'+name,color:new T.Color(color).convertSRGBToLinear(),roughness:['gold','steel'].includes(name)?.48:.76,metalness:['gold','steel'].includes(name)?.35:0})]));
function part(group,name,geometry,material,position=[0,0,0],rotation=[0,0,0]){const mesh=new T.Mesh(geometry,materials[material]);mesh.name=name;mesh.position.fromArray(position);mesh.rotation.set(...rotation);mesh.userData.assetGroup=group.userData.assetGroup;group.add(mesh);return mesh;}
function box(group,name,size,mat,pos,rot=[0,0,0],radius=.004){return part(group,name,new RoundedBoxGeometry(...size,2,Math.min(radius,...size.map(v=>v/3))),mat,pos,rot);}
function cylinder(group,name,radius,height,mat,pos,rot=[0,0,0]){return part(group,name,new T.CylinderGeometry(radius,radius,height,24),mat,pos,rot);}
function triangle(width,height,depth=.002){const s=new T.Shape();s.moveTo(-width/2,-height/2);s.lineTo(width/2,-height/2);s.lineTo(0,height/2);s.closePath();return new T.ExtrudeGeometry(s,{depth,bevelEnabled:false});}
function prop(id){const group=new T.Group();group.name='Asset '+id;group.userData.assetGroup=id;return group;}
function grain(group,name,width,height,z){for(let i=0;i<5;i++){const x=-width*.34+i*width*.17;box(group,name+'_'+(i+1),[.00065,height*(.43+(i%3)*.1),.0005],'grain',[x,height*.48,z],[0,0,.025*(i%2?1:-1)],.0001);}}

function parcel(id,size,tape){const g=prop(id),[w,h,d]=size;
  box(g,'Parcel_Carton',size,'parcel',[0,h/2,0],undefined,.007);
  box(g,'Parcel_Lid_Seam',[w*.9,.0008,.0007],'parcelSide',[0,h+.0003,0],undefined,.0001);
  box(g,'Parcel_Tape_Top_Length',[w*.19,.0017,d+.002],tape,[0,h+.001,0],undefined,.0004);
  box(g,'Parcel_Tape_Top_Cross',[w+.002,.0017,d*.16],tape,[0,h+.0018,0],undefined,.0004);
  for(const z of [-d/2,d/2])box(g,'Parcel_Tape_Front_Back_'+z,[w*.19,h,.0017],tape,[0,h/2,z+Math.sign(z)*.001],undefined,.0004);
  for(const x of [-w/2,w/2])box(g,'Parcel_Tape_Sides_'+x,[.0017,h,d*.16],tape,[x+Math.sign(x)*.001,h/2,0],undefined,.0004);
  box(g,'Parcel_Paper_Label',[w*.26,h*.25,.0018],'cream',[w*.27,h*.29,d/2+.0015],undefined,.002);
  part(g,'Parcel_Label_Mountain',triangle(w*.12,h*.11,.0008),'dark',[w*.27,h*.29,d/2+.0026]);
  for(const x of [-w*.4,w*.4])box(g,'Parcel_Fold_'+x,[.0005,h*.75,.0005],'parcelSide',[x,h*.5,d/2+.0003],undefined,.0001);
  return g;
}
function cube(){const g=prop('play-cube');box(g,'Cube_Wood',[.155,.155,.155],'wood',[0,.0775,0],undefined,.008);cylinder(g,'Cube_Gold_Disk',.032,.002,'gold',[0,.078,.0788],[Math.PI/2,0,0]);part(g,'Cube_Teal_Triangle',triangle(.064,.065),'teal',[.0788,.078,0],[0,Math.PI/2,0]);grain(g,'Cube_Fine_Grain',.155,.155,.0778);return g;}
function colorBlock(id,size,color){const g=prop(id),[w,h,d]=size;box(g,'Block_Painted_Body',size,color,[0,h/2,0],undefined,.005);box(g,'Block_Wood_End',[w-.004,h-.004,.0017],'edge',[0,h/2,d/2+.001],undefined,.003);grain(g,'Block_End_Grain',w,h,d/2+.002);return g;}
function wedge(){const g=prop('play-wedge'),shape=new T.Shape();shape.moveTo(-.09,0);shape.lineTo(.09,0);shape.lineTo(-.09,.13);shape.closePath();const geo=new T.ExtrudeGeometry(shape,{depth:.075,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.002,bevelThickness:.002});geo.translate(0,.002,-.0375);part(g,'Wedge_Teal_Body',geo,'teal');return g;}
function ball(){const g=prop('play-ball');part(g,'Ball_Yellow_Surface',new T.SphereGeometry(.09,32,24),'yellow',[0,.09,0]);for(const [i,rot] of [[0,[Math.PI/2,0,0]],[1,[0,0,0]],[2,[0,Math.PI/2,0]]])part(g,'Ball_Subtle_Seam_'+i,new T.TorusGeometry(.0901,.0008,6,64),'seam',[0,.09,0],rot);return g;}
const props={ramp:buildFlushRamp(), 'parcel-large':parcel('play-parcel-large',[.20,.185,.19],'coral'), 'parcel-small':parcel('play-parcel-small',[.145,.135,.14],'gold'), cube:cube(), 'coral-block':colorBlock('play-coral-block',[.052,.073,.185],'coral'), 'orange-block':colorBlock('play-orange-block',[.046,.127,.104],'orange'), wedge:wedge(), ball:ball()};
const poses={ramp:[-.115,0,-.075], 'parcel-large':[.23,0,-.145], 'parcel-small':[.20,0,.105], cube:[.035,0,.245], 'coral-block':[-.307,0,-.055], 'orange-block':[.297,0,.273], wedge:[.198,0,.286], ball:[-.185,0,.265]};
const assembly=new T.Group();assembly.name='Play Props';for(const [id,model] of Object.entries(props)){const instance=model.clone(true);instance.position.fromArray(poses[id]);if(id==='orange-block')instance.rotation.y=-.16;assembly.add(instance);}
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();});}};
await fs.mkdir('public/models/editor-sources',{recursive:true});await fs.mkdir('.asset-candidates/play-props',{recursive:true});
const outputs=[];
for(const [id,model] of [['props',assembly],...Object.entries(props)]){
  const name='play-'+id+'.glb', bytes=Buffer.from(await new GLTFExporter().parseAsync(model,{binary:true}));
  const destination='public/models/'+name;
  if(await fs.stat(destination).then(()=>true,()=>false))throw Error('Preserve existing model; stage a revised candidate instead: '+destination);
  await fs.writeFile('.asset-candidates/play-props/'+name,bytes);await fs.writeFile(destination,bytes);await fs.writeFile('public/models/editor-sources/'+name,bytes);
  outputs.push({file:name,bytes:bytes.length});
}
console.log(JSON.stringify(outputs));
