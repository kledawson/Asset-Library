// Pocket Post first shapes. Generates candidates only; never replaces approved exports.
import * as T from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import fs from 'node:fs/promises';
import { embedPostTextures, preparePostUV, archivePostTextures } from './pocket-post-textures.mjs';

const palette={wood:'#ce934d',edge:'#e0ae68',grain:'#b57d3f',dark:'#263b4c',rubber:'#242e34',gold:'#d19a37',steel:'#8b9696',cream:'#f1dfb8',cloth:'#e4d3ad',seam:'#baa17a',coral:'#df663f',teal:'#225e68',roof:'#2b7881',deepTeal:'#173f49'};
const mats=Object.fromEntries(Object.entries(palette).map(([name,color])=>[name,new T.MeshStandardMaterial({name:'Post_'+name,color:new T.Color(color).convertSRGBToLinear(),roughness:['gold','steel'].includes(name)?.48:.79,metalness:['gold','steel'].includes(name)?.35:0,side:name==='cloth'?T.DoubleSide:T.FrontSide})]));
for(const name of ['teal','roof','dark','coral','deepTeal'])mats[name].roughness=.52;
const font=await fs.readFile('node_modules/three/examples/fonts/helvetiker_regular.typeface.json','utf8').then(s=>new FontLoader().parse(JSON.parse(s)));
function prop(id){const g=new T.Group();g.name='Asset mail-'+id;g.userData.assetGroup='mail-'+id;return g;}
function part(g,name,geo,mat,pos=[0,0,0],rot=[0,0,0],collider=false){if(mat==='wood'||mat==='cloth')preparePostUV(geo,mat);const m=new T.Mesh(geo,mats[mat]);m.name=name;m.position.fromArray(pos);m.rotation.set(...rot);m.userData={assetGroup:g.userData.assetGroup,...(collider?{mailCollider:'box'}:{})};g.add(m);return m;}
function box(g,name,size,mat,pos,rot=[0,0,0],r=.003,collider=false){return part(g,name,new RoundedBoxGeometry(...size,2,Math.min(r,...size.map(v=>v/3))),mat,pos,rot,collider);}
function cyl(g,name,r,h,mat,pos,rot=[0,0,0]){return part(g,name,new T.CylinderGeometry(r,r,h,28),mat,pos,rot);}
function rod(g,name,a,b,r,mat){const start=new T.Vector3(...a),end=new T.Vector3(...b);const m=cyl(g,name,r,start.distanceTo(end),mat,start.clone().add(end).multiplyScalar(.5).toArray());m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),end.sub(start).normalize());return m;}
function tube(g,name,points,r,mat,closed=false){return part(g,name,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)),closed),Math.max(24,points.length*4),r,8,closed),mat);}
function text(g,name,value,size,mat,pos){const geo=new TextGeometry(value,{font,size,height:.0007,curveSegments:3,bevelEnabled:false});geo.computeBoundingBox();geo.translate(-geo.boundingBox.max.x/2,-size*.35,0);return part(g,name,geo,mat,pos);}
function ring(g,name,outer,inner,depth,mat,pos,rot=[0,0,0]){const s=new T.Shape();s.absarc(0,0,outer,0,Math.PI*2,false);const h=new T.Path();h.absarc(0,0,inner,0,Math.PI*2,true);s.holes.push(h);const geo=new T.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:32});geo.translate(0,0,-depth/2);return part(g,name,geo,mat,pos,rot);}
function envelope(g,prefix,pos,w=.055,h=.034){const [x,y,z]=pos;box(g,prefix+'_Badge',[w,h,.002],'cream',pos,undefined,.002);const a=[x-w*.40,y+h*.29,z+.0015],b=[x,y-h*.06,z+.0015],c=[x+w*.40,y+h*.29,z+.0015];rod(g,prefix+'_Fold_Left',a,b,.0008,'deepTeal');rod(g,prefix+'_Fold_Right',b,c,.0008,'deepTeal');}

function archShape(radius,wall){const s=new T.Shape();s.moveTo(-radius,0);s.lineTo(radius,0);s.lineTo(radius,wall);s.absarc(0,wall,radius,0,Math.PI,false);s.lineTo(-radius,0);return s;}
function mailbox(){const g=prop('mailbox'),r=.145,wall=.175,depth=.31;
  box(g,'Mailbox_Wood_Base',[.33,.028,.34],'wood',[0,.014,0],undefined,.005,true);
  for(const x of [-r,r])box(g,'Mailbox_Side_'+x,[.014,wall,depth],'teal',[x,.035+wall/2,0],undefined,.002,true);
  const vertices=[],indices=[],segments=48;
  for(let layer=0;layer<2;layer++)for(let z=0;z<2;z++)for(let i=0;i<=segments;i++){const a=i/segments*Math.PI,rr=r+.007-layer*.014;vertices.push(rr*Math.cos(a),.035+wall+rr*Math.sin(a),(z-.5)*depth);}
  const row=segments+1;for(let layer=0;layer<2;layer++)for(let i=0;i<segments;i++){const a=layer*row*2+i,b=a+1,c=a+row,d=c+1;indices.push(...(layer?[a,c,b,b,c,d]:[a,b,c,b,d,c]));}
  for(const z of [0,1])for(let i=0;i<segments;i++){const a=z*row+i,b=a+1,c=a+row*2,d=c+1;indices.push(...(z?[a,c,b,b,c,d]:[a,b,c,b,d,c]));}
  const roof=new T.BufferGeometry();roof.setAttribute('position',new T.Float32BufferAttribute(vertices,3));roof.setIndex(indices);roof.computeVertexNormals();part(g,'Mailbox_Smooth_Roof',roof,'roof');
  // Collision strips live as metadata on the roof, keeping its opening hollow.
  g.getObjectByName('Mailbox_Smooth_Roof').userData.mailCollider='arch';
  for(const z of [-.105,-.035,.035,.105]){const points=[];for(let i=0;i<=48;i++){const a=i/48*Math.PI;points.push([.1524*Math.cos(a),.210+.1524*Math.sin(a),z]);}tube(g,'Mailbox_Roof_Seam_'+z,points,.00055,'deepTeal');}
  const back=new T.ExtrudeGeometry(archShape(r,wall),{depth:.012,bevelEnabled:false,curveSegments:24});part(g,'Mailbox_Back',back,'dark',[0,.035,-depth/2-.002],undefined,true);
  box(g,'Mailbox_Interior_Floor',[.285,.012,.31],'deepTeal',[0,.036,0],undefined,.002,true);
  for(const z of [-.163,.164]){const points=[[-r,.035,z],[-r,.035+wall,z]];for(let i=1;i<=24;i++){const a=Math.PI-i*Math.PI/24;points.push([r*Math.cos(a),.035+wall+r*Math.sin(a),z]);}points.push([r,.035,z]);tube(g,'Mailbox_Cream_Arch_'+z,points,.009,'cream');}
  box(g,'Mailbox_Loading_Door_Rim',[.305,.017,.165],'cream',[0,.022,.238],[.16,0,0],.003,true);
  box(g,'Mailbox_Loading_Door_Inset',[.276,.005,.143],'teal',[0,.032,.238],[.16,0,0],.002);
  cyl(g,'Mailbox_Door_Pull',.010,.005,'gold',[0,.028,.295]);
  box(g,'Mailbox_Flag_Stem',[.010,.224,.016],'coral',[.163,.284,.035],undefined,.003);
  box(g,'Mailbox_Flag_Panel',[.014,.060,.080],'coral',[.164,.383,.065],undefined,.004);
  cyl(g,'Mailbox_Flag_Pivot',.017,.012,'gold',[.163,.178,.035],[0,0,Math.PI/2]);
  for(const x of [-.146,.146])for(const z of [-.139,.133]){box(g,'Mailbox_Corner_Bracket_'+x+'_'+z,[.029,.034,.030],'wood',[x,.028,z]);cyl(g,'Mailbox_Corner_Button_'+x+'_'+z,.005,.003,'gold',[x,.029,z+Math.sign(z)*.017],[Math.PI/2,0,0]);}
  for(const x of [-.146,.146])for(const z of [-.108,.012,.119])cyl(g,'Mailbox_Side_Rivet_'+x+'_'+z,.004,.004,'gold',[x+Math.sign(x)*.009,.058,z],[0,0,Math.PI/2]);
  for(const x of [-.087,.087])rod(g,'Mailbox_Door_Groove_'+x,[x,.041,.177],[x,.020,.297],.0007,'deepTeal');
  rod(g,'Mailbox_Door_Hinge',[-.143,.040,.158],[.143,.040,.158],.005,'gold');
  return g;
}
function trolley(){const g=prop('hand-truck');
  for(const x of [-.072,.072]){rod(g,'Trolley_Frame_'+x,[x,.038,.012],[x,.323,-.041],.009,'teal');tube(g,'Trolley_Handle_Bend_'+x,[[x,.31,-.039],[x,.36,-.05],[x,.382,-.077],[x,.377,-.108]],.009,'teal');rod(g,'Trolley_Coral_Grip_'+x,[x,.379,-.081],[x,.374,-.124],.012,'coral');}
  for(const y of [.08,.18,.29])rod(g,'Trolley_Crossbar_'+y,[-.072,y,.018-y*.18],[.072,y,.018-y*.18],.007,'deepTeal');
  rod(g,'Trolley_Axle',[-.118,.048,-.024],[.118,.048,-.024],.008,'steel');
  for(const x of [-.105,.105]){part(g,'Trolley_Rubber_Tire_'+x,new T.TorusGeometry(.034,.013,12,36),'rubber',[x,.047,-.024],[0,Math.PI/2,0]);cyl(g,'Trolley_Wheel_Core_'+x,.034,.022,'dark',[x,.047,-.024],[0,0,Math.PI/2]);cyl(g,'Trolley_Brass_Hub_'+x,.023,.030,'gold',[x,.047,-.024],[0,0,Math.PI/2]);cyl(g,'Trolley_Axle_Cap_'+x,.008,.034,'dark',[x,.047,-.024],[0,0,Math.PI/2]);}
  box(g,'Trolley_Loading_Toe',[.20,.015,.145],'deepTeal',[0,.020,.063],undefined,.004);
  for(const x of [-.062,.062])box(g,'Trolley_Deck_Skid_'+x,[.018,.004,.11],'teal',[x,.029,.065],undefined,.001);
  for(const x of [-.075,.075])cyl(g,'Trolley_Deck_Bolt_'+x,.004,.003,'gold',[x,.030,.112]);
  return g;
}
function scale(){const g=prop('scale');
  box(g,'Scale_Base',[.194,.030,.158],'dark',[0,.029,0],undefined,.007);
  for(const x of [-.073,.073])for(const z of [-.055,.055])cyl(g,'Scale_Rubber_Foot_'+x+'_'+z,.016,.015,'rubber',[x,.008,z]);
  const s=new T.Shape();s.moveTo(-.078,.044);s.lineTo(.078,.044);s.lineTo(.049,.207);s.quadraticCurveTo(0,.229,-.049,.207);s.closePath();const geo=new T.ExtrudeGeometry(s,{depth:.092,bevelEnabled:true,bevelSize:.005,bevelThickness:.004,bevelSegments:2,curveSegments:12});geo.translate(0,0,-.046);part(g,'Scale_Cast_Body',geo,'dark');
  cyl(g,'Scale_Dial_Rim',.073,.014,'gold',[0,.125,.062],[Math.PI/2,0,0]);cyl(g,'Scale_Dial_Face',.066,.016,'cream',[0,.125,.064],[Math.PI/2,0,0]);
  for(let i=0;i<25;i++){const a=-Math.PI*.76+i*Math.PI*1.52/24,x=Math.sin(a)*.055,y=.125+Math.cos(a)*.055;box(g,'Scale_Dial_Tick_'+i,[i%4===0?.0021:.0011,i%4===0?.009:.005,.001],'dark',[x,y,.073],[0,0,-a],.0002);}
  for(const [value,a] of [['0',-1.95],['1',-.67],['2',.67],['3',1.95]])text(g,'Scale_Dial_Number_'+value,value,.011,'dark',[Math.sin(a)*.043,.125+Math.cos(a)*.043,.074]);
  const pointerShape=new T.Shape();pointerShape.moveTo(-.004,-.009);pointerShape.lineTo(.004,-.009);pointerShape.lineTo(.002,.052);pointerShape.lineTo(0,.060);pointerShape.lineTo(-.002,.052);pointerShape.closePath();part(g,'Scale_Coral_Pointer',new T.ExtrudeGeometry(pointerShape,{depth:.002,bevelEnabled:false}),'coral',[0,.125,.075],[0,0,-.7]);cyl(g,'Scale_Pointer_Hub',.008,.005,'gold',[0,.125,.078],[Math.PI/2,0,0]);
  text(g,'Scale_Unit','kg',.008,'dark',[0,.102,.075]);
  cyl(g,'Scale_Tray_Post',.022,.032,'gold',[0,.228,0]);
  box(g,'Scale_Tray_Edge',[.235,.014,.185],'gold',[0,.247,0],undefined,.005);
  for(let i=0;i<5;i++)box(g,'Scale_Platform_Plank_'+i,[.045,.014,.181],'wood',[(i-2)*.046,.258,0],undefined,.002);
  for(const x of [-.073,.073])for(const z of [-.055,.055])cyl(g,'Scale_Base_Bolt_'+x+'_'+z,.005,.004,'gold',[x,.046,z]);
  cyl(g,'Scale_Calibration_Knob',.012,.012,'gold',[-.063,.203,.033],[Math.PI/2,0,0]);
  return g;
}
function tape(){const g=prop('tape-dispenser');
  box(g,'Tape_Weighted_Base',[.168,.019,.078],'dark',[0,.012,0],undefined,.005);
  for(const z of [-.031,.031]){const s=new T.Shape();s.moveTo(-.078,.023);s.lineTo(.077,.023);s.lineTo(.077,.048);s.lineTo(.035,.045);s.lineTo(-.008,.098);s.quadraticCurveTo(-.054,.116,-.073,.069);s.closePath();const geo=new T.ExtrudeGeometry(s,{depth:.010,bevelEnabled:true,bevelSize:.0015,bevelThickness:.0015,bevelSegments:2});geo.translate(0,0,-.005);part(g,'Tape_Coral_Cheek_'+z,geo,'coral',[0,0,z]);}
  ring(g,'Tape_Cream_Roll',.039,.021,.044,'cream',[-.034,.068,0]);ring(g,'Tape_Cardboard_Core',.021,.016,.046,'wood',[-.034,.068,0]);cyl(g,'Tape_Brass_Spindle',.010,.078,'gold',[-.034,.068,0],[Math.PI/2,0,0]);
  box(g,'Tape_Exposed_Strip',[.075,.0015,.039],'cream',[.021,.069,0],[0,0,-.29],.0002);
  box(g,'Tape_Cutter_Bar',[.012,.006,.067],'steel',[.068,.051,0],undefined,.0007);
  for(let i=0;i<10;i++){const s=new T.Shape();s.moveTo(0,0);s.lineTo(.004,.003);s.lineTo(.008,0);s.closePath();const geo=new T.ExtrudeGeometry(s,{depth:.002,bevelEnabled:false});part(g,'Tape_Cutter_Tooth_'+i,geo,'steel',[.073,.051,-.034+i*.007],[0,Math.PI/2,0]);}
  return g;
}
function sackSurface(){const points=[],indices=[],n=64,rows=24;
  const radius=t=>.102+.023*Math.sin(Math.PI*t)-.027*Math.exp(-Math.pow((t-.82)/.14,2))+.016*Math.pow(t,6);
  for(let inside=0;inside<2;inside++)for(let j=0;j<=rows;j++){const t=j/rows;for(let i=0;i<=n;i++){const a=i/n*Math.PI*2,fold=(.0025+.0045*t)*Math.sin(a*10+t*2)+.002*Math.sin(a*15-t*4),r=radius(t)+fold-inside*.0045;points.push(r*Math.cos(a)+.010*t*t,.009+t*.231+.007*Math.sin(a*3+.6)*Math.pow(t,4),r*Math.sin(a)*.91);}}
  const row=n+1,count=(rows+1)*row;
  for(let inside=0;inside<2;inside++)for(let j=0;j<rows;j++)for(let i=0;i<n;i++){const a=inside*count+j*row+i,b=a+1,c=a+row,d=c+1;indices.push(...(inside?[a,b,c,b,d,c]:[a,c,b,b,c,d]));}
  for(let i=0;i<n;i++){const a=rows*row+i,b=a+1,c=a+count,d=b+count;indices.push(a,b,c,b,d,c);}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(points,3));geo.setIndex(indices);geo.computeVertexNormals();return {geo,radius};
}
function sack(){const g=prop('sack'),{geo,radius}=sackSurface();part(g,'Mail_Sack_Fabric',geo,'cloth');
  cyl(g,'Mail_Sack_Inner_Base',.099,.009,'cloth',[0,.010,0]);
  const rim=[],cord=[];for(let i=0;i<64;i++){const a=i/64*Math.PI*2,rr=radius(1)+.007*Math.sin(a*10+2)+.002*Math.sin(a*15-4);rim.push([rr*Math.cos(a)+.010,.240+.007*Math.sin(a*3+.6),rr*Math.sin(a)*.91]);const t=.83,r=radius(t)+.014+.005*Math.sin(a*10+t*2);cord.push([r*Math.cos(a)+.010*t*t,.009+t*.231,r*Math.sin(a)*.91]);}
  tube(g,'Mail_Sack_Rolled_Rim',rim,.0095,'cloth',true);tube(g,'Mail_Sack_Drawcord',cord,.0035,'teal',true);
  tube(g,'Mail_Sack_Cord_Left',[[.002,.202,.091],[-.010,.178,.116],[-.020,.133,.117]],.0035,'teal');tube(g,'Mail_Sack_Cord_Right',[[.012,.202,.091],[.026,.17,.116],[.029,.144,.117]],.0035,'teal');
  for(const [i,x,y] of [[0,-.020,.130],[1,.029,.141]])part(g,'Mail_Sack_Cord_Tip_'+i,new T.SphereGeometry(.007,16,12),'gold',[x,y,.117]);
  part(g,'Mail_Sack_Cord_Knot',new T.SphereGeometry(.007,16,12),'teal',[.008,.20,.097]);
  for(const a of [0,Math.PI]){const points=[];for(let j=0;j<=24;j++){const t=j/24,r=radius(t)+.003;points.push([r*Math.cos(a)+.010*t*t,.01+t*.226,r*Math.sin(a)*.91]);}tube(g,'Mail_Sack_Side_Seam_'+a,points,.001,'seam');}
  return g;
}
function bin(){const g=prop('dispatch-bin');
  box(g,'Dispatch_Bin_Subfloor',[.31,.012,.228],'wood',[0,.006,0],undefined,.003,true);
  for(let i=0;i<5;i++)box(g,'Dispatch_Bin_Floor_Plank_'+i,[.0588,.007,.216],'wood',[(i-2)*.0598,.014,0],undefined,.001);
  box(g,'Dispatch_Bin_Back',[.31,.115,.012],'wood',[0,.066,-.108],undefined,.003,true);
  for(const x of [-.15,.15]){const s=new T.Shape();s.moveTo(-.108,.018);s.lineTo(.108,.018);s.lineTo(.108,.057);s.lineTo(-.108,.124);s.closePath();const geo=new T.ExtrudeGeometry(s,{depth:.012,bevelEnabled:true,bevelSize:.001,bevelThickness:.001,bevelSegments:1});const m=part(g,'Dispatch_Bin_Sloped_Side_'+x,geo,'wood',[x,0,0],[0,-Math.PI/2,0],true);m.geometry.translate(0,0,-.006);}
  box(g,'Dispatch_Bin_Low_Front',[.31,.036,.012],'wood',[0,.033,.108],undefined,.002,true);
  box(g,'Dispatch_Bin_Post_Plaque',[.098,.028,.003],'cream',[0,.037,.116],undefined,.002);text(g,'Dispatch_Bin_OUT','OUT',.016,'deepTeal',[0,.037,.118]);
  for(const x of [-.144,.144]){box(g,'Dispatch_Bin_Corner_Plate_'+x,[.025,.036,.004],'gold',[x,.032,.116],undefined,.002);cyl(g,'Dispatch_Bin_Brass_Rivet_'+x,.0045,.003,'edge',[x,.035,.120],[Math.PI/2,0,0]);}
  envelope(g,'Dispatch_Bin_Envelope',[0,.096,-.100],.059,.031);
  return g;
}

const props={mailbox:mailbox(),'hand-truck':trolley(),scale:scale(),'tape-dispenser':tape(),sack:sack(),'dispatch-bin':bin()};
const loose={mailbox:[0,0,-.19,0],'hand-truck':[.32,0,-.17,-.15],scale:[-.34,0,-.12,.12],'tape-dispenser':[-.35,.018,.23,.08],sack:[.34,0,.27,-.18],'dispatch-bin':[-.35,0,.23,.08]};
const organized={mailbox:[-.38,0,-.25,0],'hand-truck':[0,0,-.25,0],sack:[.35,0,-.25,0],scale:[-.38,0,.25,0],'tape-dispenser':[0,0,.25,0],'dispatch-bin':[.35,0,.25,0]};
function set(poses,name){const g=new T.Group();g.name=name;for(const [id,pose] of Object.entries(poses)){const p=props[id].clone(true);p.position.fromArray(pose.slice(0,3));p.rotation.y=pose[3];g.add(p);}return g;}
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();});}};
const folder='.asset-candidates/mail-package';await fs.mkdir(folder,{recursive:true});
const entries=[['pocket-post:default',set(loose,'Pocket Post Compact Drop')],['pocket-post:organized',set(organized,'Pocket Post Organized')],...Object.entries(props).map(([id,model])=>['mail-'+id+':default',model])];
const manifest=[];for(const [key,model] of entries){model.updateMatrixWorld(true);const name=key.startsWith('pocket-post:')?(key.endsWith(':organized')?'pocket-post-organized.glb':'pocket-post.glb'):key.split(':')[0]+'.glb';const buffer=embedPostTextures(Buffer.from(await new GLTFExporter().parseAsync(model,{binary:true})));await fs.writeFile(folder+'/'+name,buffer);let triangles=0,meshes=0;model.traverse(m=>{if(m.isMesh){meshes++;triangles+=(m.geometry.index?.count||m.geometry.attributes.position.count)/3;}});manifest.push({key,name,bytes:buffer.length,meshes,triangles});}
await fs.writeFile(folder+'/manifest.json',JSON.stringify({createdAt:new Date().toISOString(),package:'Pocket Post',layout:'Compact Drop',parcels:'Not created or migrated',entries:manifest},null,2)+'\n');console.log(JSON.stringify(manifest,null,2));
await archivePostTextures();
