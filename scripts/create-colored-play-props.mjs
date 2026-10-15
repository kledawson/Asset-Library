import fs from 'node:fs/promises';
import zlib from 'node:zlib';
import * as T from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
const palette={coral:'#da7858',yellow:'#dda644',teal:'#458d92',orange:'#de995e'};
const variants={'coral-block':['coral','yellow','teal'],'orange-block':['coral','orange','teal'],wedge:['coral','yellow','teal'],ball:['coral','yellow','teal']};
const folder='.asset-candidates/play-props/color-variants';await fs.mkdir(folder,{recursive:true});
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();});}};
function pack(j,bin){bin=Buffer.concat([bin,Buffer.alloc((4-bin.length%4)%4)]);j.buffers[0].byteLength=bin.length;let json=Buffer.from(JSON.stringify(j));json=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,32)]);const h=Buffer.alloc(20),bh=Buffer.alloc(8);h.write('glTF');h.writeUInt32LE(2,4);h.writeUInt32LE(28+json.length+bin.length,8);h.writeUInt32LE(json.length,12);h.writeUInt32LE(0x4e4f534a,16);bh.writeUInt32LE(bin.length);bh.writeUInt32LE(0x004e4942,4);return Buffer.concat([h,json,bh,bin]);}
function decode(bytes){const size=bytes.readUInt32LE(12);return [JSON.parse(bytes.subarray(20,20+size)),bytes.subarray(28+size)];}
function crc(data){let c=0xffffffff;for(const byte of data){c^=byte;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(c^0xffffffff)>>>0;}
function chunk(type,data){const tag=Buffer.from(type),b=Buffer.alloc(data.length+12);b.writeUInt32BE(data.length);tag.copy(b,4);data.copy(b,8);b.writeUInt32BE(crc(Buffer.concat([tag,data])),data.length+8);return b;}
function png(pixels,width,height){const h=Buffer.alloc(13);h.writeUInt32BE(width);h.writeUInt32BE(height,4);h[8]=8;h[9]=6;const rows=Buffer.alloc(height*(width*4+1));for(let y=0;y<height;y++)Buffer.from(pixels.buffer,y*width*4,width*4).copy(rows,y*(width*4+1)+1);return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',h),chunk('IDAT',zlib.deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]);}
function endGrain(seed){const tile=256,width=tile*2,height=tile,color=new Uint8Array(width*height*4),normal=new Uint8Array(color.length);
  function tone(u,v,face){
    const s=seed+face*5.17,cx=.20*Math.sin(s*2.3),cy=.18*Math.cos(s*1.7);
    const ux=u-cx,vy=(v-cy)*(.86+.26*Math.sin(s));
    const radius=Math.hypot(ux,vy);
    const angle=Math.atan2(vy,ux);
    const warp=.019*Math.sin(angle*3+s*.7)+.011*Math.sin(angle*6-s*1.3)+.006*Math.sin(u*11+v*7+s);
    const rings=(radius+warp)*(47+8*Math.sin(s*1.9));
    const latewood=Math.pow(Math.max(0,Math.cos(rings)),6);
    const broad=2.4*Math.sin(rings*.28+s);
    const pore=Math.pow(Math.max(0,Math.sin(u*173+v*37+s*13)*Math.sin(v*121-u*45+s*7)),12);
    const fine=.7*Math.sin(u*99+v*76+s*4)+.5*Math.sin(v*161-u*62+s*9);
    return -10.5*latewood+broad-2.8*pore+fine;
  }
  for(let face=0;face<2;face++)for(let y=0;y<tile;y++)for(let x=0;x<tile;x++){
    const u=x/(tile-1)-.5,v=.5-y/(tile-1),t=tone(u,v,face),at=(y*width+face*tile+x)*4;
    color.set([Math.round(219+t),Math.round(179+t*.86),Math.round(119+t*.68),255],at);
    const dx=(tone(u+.002,v,face)-tone(u-.002,v,face))*.006;
    const dy=(tone(u,v+.002,face)-tone(u,v-.002,face))*.006;
    const n=new T.Vector3(-dx,-dy,1).normalize();
    normal.set([Math.round((n.x*.5+.5)*255),Math.round((n.y*.5+.5)*255),Math.round((n.z*.5+.5)*255),255],at);
  }
  return [png(color,width,height),png(normal,width,height)];
}
function flatEndGeometry(w,h,d,horizontalEnds){
  const radius=.004,contour=[],steps=4;
  for(const [cx,cy,start] of [[w/2-radius,-h/2+radius,-Math.PI/2],[w/2-radius,h/2-radius,0],[-w/2+radius,h/2-radius,Math.PI/2],[-w/2+radius,-h/2+radius,Math.PI]]){
    for(let i=0;i<=steps;i++){const angle=start+i*Math.PI/(2*steps);contour.push([cx+radius*Math.cos(angle),cy+radius*Math.sin(angle)]);}
  }
  const groups=Array.from({length:6},()=>({position:[],normal:[],uv:[]}));
  function vertex(group,point,z,n,uv){group.position.push(point[0],point[1],z);group.normal.push(...n);group.uv.push(...uv);}
  function sideNormal(point){const ix=T.MathUtils.clamp(point[0],-w/2+radius,w/2-radius),iy=T.MathUtils.clamp(point[1],-h/2+radius,h/2-radius);return new T.Vector3(point[0]-ix,point[1]-iy,0).normalize().toArray();}
  for(let i=0;i<contour.length;i++){
    const a=contour[i],b=contour[(i+1)%contour.length],mid=[(a[0]+b[0])/2,(a[1]+b[1])/2];
    const side=Math.abs(mid[0]/w)>Math.abs(mid[1]/h)?(mid[0]<0?0:1):(mid[1]>0?2:3);
    const index=horizontalEnds?({0:0,1:1,2:4,3:5})[side]:side;
    const group=groups[index],na=sideNormal(a),nb=sideNormal(b);
    const ua=[a[0]/w+.5,a[1]/h+.5],ub=[b[0]/w+.5,b[1]/h+.5];
    for(const [p,z,n,uv] of [[a,-d/2,na,ua],[b,-d/2,nb,ub],[b,d/2,nb,ub],[a,-d/2,na,ua],[b,d/2,nb,ub],[a,d/2,na,ua]])vertex(group,p,z,n,uv);
  }
  for(let face=0;face<2;face++){
    const group=groups[horizontalEnds?2+face:4+face],z=face===0?d/2:-d/2,n=[0,0,face===0?1:-1];
    const uv=point=>[(face*256+1+(point[0]/w+.5)*254)/512,(1+(1-(point[1]/h+.5))*254)/256];
    for(let i=0;i<contour.length;i++){
      const a=contour[i],b=contour[(i+1)%contour.length],points=face===0?[[0,0],a,b]:[[0,0],b,a];
      for(const point of points)vertex(group,point,z,n,uv(point));
    }
  }
  const geometry=new T.BufferGeometry(),position=[],normal=[],uv=[];
  for(let i=0;i<groups.length;i++){const group=groups[i],start=position.length/3;position.push(...group.position);normal.push(...group.normal);uv.push(...group.uv);geometry.addGroup(start,group.position.length/3,i);}
  geometry.setAttribute('position',new T.Float32BufferAttribute(position,3));
  geometry.setAttribute('normal',new T.Float32BufferAttribute(normal,3));
  geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  // Three r145 needs an index for material groups to become distinct GLB primitives.
  geometry.setIndex(Array.from({length:position.length/3},(_,index)=>index));
  if(horizontalEnds)geometry.rotateX(Math.PI/2);
  return geometry;
}
async function block(id,color){const [w,h,d]=id==='coral-block'?[.052,.073,.185]:[.070,.132,.132];
  const horizontalEnds=id==='orange-block';
  // Rounded painted sides end at two genuinely planar wood faces.
  const geo=horizontalEnds?flatEndGeometry(w,d,h,true):flatEndGeometry(w,h,d,false);
  const paint=new T.MeshStandardMaterial({name:'Block_Paint_'+color,color:new T.Color(palette[color]).convertSRGBToLinear(),roughness:.76}),wood=new T.MeshStandardMaterial({name:'Block_End_Wood',color:0xffffff,roughness:.82});
  const mesh=new T.Mesh(geo,horizontalEnds?[paint,paint,wood,wood,paint,paint]:[paint,paint,paint,paint,wood,wood]);mesh.name='Block_Painted_Body';mesh.position.y=h/2;mesh.userData={assetGroup:'play-'+id,assetVariant:color,solidWoodEnds:true};
  const out=Buffer.from(await new GLTFExporter().parseAsync(mesh,{binary:true}));let [j,bin]=decode(out);j.images??=[];j.textures??=[];j.samplers??=[];const sampler=j.samplers.push({magFilter:9729,minFilter:9987,wrapS:33071,wrapT:33071})-1;
  // Explicit face nodes carry the item tag into the editor. All share this
  // solid body's vertex positions; there are no floating end-panel meshes.
  const bodyNode=j.nodes[0],primitives=j.meshes[bodyNode.mesh].primitives;
  const names=horizontalEnds?['Block_Painted_Body','Block_Paint_Left','Block_Wood_Top','Block_Wood_Bottom','Block_Paint_Front','Block_Paint_Back']:['Block_Painted_Body','Block_Paint_Left','Block_Paint_Top','Block_Paint_Bottom','Block_Wood_End_Front','Block_Wood_End_Back'];
  j.meshes=primitives.map((primitive,i)=>({name:names[i],primitives:[primitive]}));j.nodes=names.map((name,i)=>({...bodyNode,name,mesh:i}));j.scenes[0].nodes=names.map((_,i)=>i);
  const seed=(id==='coral-block'?2:13)+{coral:1,yellow:4,teal:8,orange:11}[color];
  const images=endGrain(seed);
  function embed(image){bin=Buffer.concat([bin,Buffer.alloc((4-bin.length%4)%4)]);const view=j.bufferViews.push({buffer:0,byteOffset:bin.length,byteLength:image.length})-1;bin=Buffer.concat([bin,image]);const source=j.images.push({bufferView:view,mimeType:'image/png'})-1;return j.textures.push({source,sampler})-1;}
  const base=embed(images[0]),n=embed(images[1]),material=j.materials.find(m=>m.name==='Block_End_Wood');material.pbrMetallicRoughness.baseColorTexture={index:base};material.normalTexture={index:n,scale:.035};
  if(color==='coral')await fs.writeFile(folder+`/${id}-end-grain.png`,images[0]);return pack(j,bin);
}
for(const [id,colors]of Object.entries(variants).filter(([id])=>!process.argv.includes('--chunky-only')||id==='orange-block'))for(const color of colors){let output;if(id.includes('block'))output=await block(id,color);else{
  const [j,bin]=decode(await fs.readFile(`public/models/play-${id}.glb`));
  for(const m of j.materials){const original=id==='ball'&&color==='yellow';if(original)continue;const hex=m.name==='Play_seam'?new T.Color(palette[color]).multiplyScalar(.83):new T.Color(palette[color]);m.pbrMetallicRoughness.baseColorFactor=[...hex.convertSRGBToLinear().toArray(),1];m.name=(m.name==='Play_seam'?'Play_seam_':'Play_')+color;}
  for(const n of j.nodes){if(n.mesh!==undefined)n.extras={...n.extras,assetGroup:'play-'+id,assetVariant:color};if(n.name==='Wedge_Teal_Body')n.name='Wedge_Body';if(n.name==='Ball_Yellow_Surface')n.name='Ball_Surface';}output=pack(j,bin);
  }
  await fs.writeFile(`${folder}/play-${id}-${color}.glb`,output);console.log(`${id} ${color}: ${Math.round(output.length/1024)} KB`);
}
