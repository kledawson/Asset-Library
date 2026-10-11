import fs from 'node:fs';
import zlib from 'node:zlib';
const source='public/models/workshop-cog.glb';
const data=fs.readFileSync(source);
const jsonLength=data.readUInt32LE(12);
const json=JSON.parse(data.subarray(20,20+jsonLength).toString());
const binAt=20+jsonLength, binLength=data.readUInt32LE(binAt);
const bin=Buffer.from(data.subarray(binAt+8,binAt+8+binLength));
const primitive=json.meshes[0].primitives[0];
const position=json.accessors[primitive.attributes.POSITION], normal=json.accessors[primitive.attributes.NORMAL];
delete primitive.attributes.COLOR_0;
const count=position.count;
let uvOffset=bin.length, uv=Buffer.alloc(0), uvAccessor=primitive.attributes.TEXCOORD_0;
if(uvAccessor===undefined){
  uv=Buffer.alloc(count*8);const posView=json.bufferViews[position.bufferView];
  for(let i=0;i<count;i++){
    const x=bin.readFloatLE(posView.byteOffset+i*12), y=bin.readFloatLE(posView.byteOffset+i*12+4);
    uv.writeFloatLE(x/.272+.5,i*8); uv.writeFloatLE(y/.272+.5,i*8+4);
  }
  uvOffset=bin.length+(bin.length%4?4-bin.length%4:0);
  json.bufferViews.push({buffer:0,byteOffset:uvOffset,byteLength:uv.length,target:34962});
  uvAccessor=json.accessors.length;json.accessors.push({bufferView:json.bufferViews.length-1,componentType:5126,count,type:'VEC2',min:[0,0],max:[1,1]});
  primitive.attributes.TEXCOORD_0=uvAccessor;
}
function crc32(b){let c=0xffffffff;for(const x of b){c^=x;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(c^0xffffffff)>>>0;}
function chunk(name,payload){const type=Buffer.from(name),len=Buffer.alloc(4),crc=Buffer.alloc(4);len.writeUInt32BE(payload.length);crc.writeUInt32BE(crc32(Buffer.concat([type,payload])));return Buffer.concat([len,type,payload,crc]);}
const w=1024,h=1024;
function makePNG(pixel){
  const raw=Buffer.alloc(h*(1+w*4));
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const rgba=pixel(x,y),o=y*(1+w*4)+1+x*4;
    for(let c=0;c<4;c++)raw[o+c]=rgba[c];
  }
  const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(w,0);ihdr.writeUInt32BE(h,4);ihdr[8]=8;ihdr[9]=6;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
}
function random(key){let v=Math.imul(key^19391,1597334677);v=Math.imul(v^(v>>>16),2246822519);return((v^(v>>>13))>>>0)/4294967295;}
function noise(value,seed=0){const cell=Math.floor(value),f=value-cell,t=f*f*(3-2*f);return random(cell+seed)*(1-t)+random(cell+1+seed)*t;}
function brushing(x,y,ring=false){
  const radius=Math.hypot(x/w-.5,y/h-.5)*.272;
  const coordinate=ring?radius/.0014:x/9+(noise(y/130,73)-.5)*1.2;
  const strength=.2+.8*noise(y/48,Math.floor(coordinate)*31);
  return (noise(coordinate,17)*2-1)*strength;
}
function streak(x,y){
  const radius=Math.hypot(x/w-.5,y/h-.5)*.272;
  const hub=radius>.032&&radius<.0535;
  const bronze=radius>.104&&radius<.109;
  const base=hub||bronze?[165,132,86]:[195,161,83];
  const grain=brushing(x,y,hub||bronze)*12+(noise(x/80,61)-.5)*2;
  return base.map(value=>Math.max(0,Math.min(255,Math.round(value+grain))));
}
const colorPNG=makePNG((x,y)=>[...streak(x,y),255]);
const metalRoughPNG=makePNG((x,y)=>{
  const radius=Math.hypot(x/w-.5,y/h-.5)*.272;
  const ring=radius<.054||radius>.104&&radius<.109;
  const edge=radius>.12||radius>.031&&radius<.034||radius>.05&&radius<.054||Math.abs(radius-.104)<.001||Math.abs(radius-.109)<.001;
  return[255,Math.round((edge?118:ring?155:168)+brushing(x,y,ring)*12),255,255];
});
const normalPNG=makePNG((x,y)=>[Math.round(128+(brushing(x+1,y)-brushing(x-1,y))*12),128,255,255]);
const images=[],textures=[],samplers=[];
const imageBase=images.length,textureBase=textures.length;
images.push({uri:'data:image/png;base64,'+colorPNG.toString('base64'),name:'Warm Streaked Brass'});
images.push({uri:'data:image/png;base64,'+metalRoughPNG.toString('base64'),name:'Brushed Metal Response'});
images.push({uri:'data:image/png;base64,'+normalPNG.toString('base64'),name:'Microscopic Machining Grain'});
samplers.push({magFilter:9729,minFilter:9987,wrapS:10497,wrapT:10497});
textures.push({sampler:samplers.length-1,source:imageBase,name:'Warm Streaked Brass'});
textures.push({sampler:samplers.length-1,source:imageBase+1,name:'Brushed Metal Response'});
textures.push({sampler:samplers.length-1,source:imageBase+2,name:'Microscopic Machining Grain'});
json.images=images;json.samplers=samplers;json.textures=textures;
const pbr=json.materials[primitive.material].pbrMetallicRoughness;
pbr.baseColorFactor=[1,1,1,1];pbr.baseColorTexture={index:textureBase,texCoord:0};
pbr.metallicFactor=.82;pbr.roughnessFactor=1;pbr.metallicRoughnessTexture={index:textureBase+1,texCoord:0};
json.materials[primitive.material].normalTexture={index:textureBase+2,texCoord:0,scale:.8};
json.materials[primitive.material].extensions={KHR_materials_clearcoat:{clearcoatFactor:.015,clearcoatRoughnessFactor:.5}};
json.extensionsUsed=[...new Set([...(json.extensionsUsed||[]),'KHR_materials_clearcoat'])];
let jt=Buffer.from(JSON.stringify(json));jt=Buffer.concat([jt,Buffer.alloc((4-jt.length%4)%4,32)]);
const binary=Buffer.concat([bin,Buffer.alloc(uvOffset-bin.length),uv]);
const jh=Buffer.alloc(8);jh.writeUInt32LE(jt.length);jh.writeUInt32LE(0x4e4f534a,4);
const bh=Buffer.alloc(8);bh.writeUInt32LE(binary.length);bh.writeUInt32LE(0x004e4942,4);
const header=Buffer.from(data.subarray(0,12));header.writeUInt32LE(12+jh.length+jt.length+bh.length+binary.length,8);
fs.writeFileSync('.asset-candidates/workshop-cog-fine-metal-streaks.glb',Buffer.concat([header,jh,jt,bh,binary]));




