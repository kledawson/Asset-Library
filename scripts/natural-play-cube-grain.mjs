import * as T from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';
import fs from 'node:fs/promises';
import zlib from 'node:zlib';

const bytes=await fs.readFile('public/models/editor-sources/play-cube.glb');
// Ignore the previous embedded grain while reading geometry in Node.
const inputSize=bytes.readUInt32LE(12),inputJson=JSON.parse(bytes.subarray(20,20+inputSize));
for(const material of inputJson.materials){if(material.pbrMetallicRoughness)delete material.pbrMetallicRoughness.baseColorTexture;delete material.normalTexture;}
let inputText=Buffer.from(JSON.stringify(inputJson));inputText=Buffer.concat([inputText,Buffer.alloc((4-inputText.length%4)%4,32)]);
const inputTail=bytes.subarray(20+inputSize),inputHeader=Buffer.from(bytes.subarray(0,20));inputHeader.writeUInt32LE(20+inputText.length+inputTail.length,8);inputHeader.writeUInt32LE(inputText.length,12);
const input=Buffer.concat([inputHeader,inputText,inputTail]);
const {scene}=await new GLTFLoader().parseAsync(input.buffer.slice(input.byteOffset,input.byteOffset+input.byteLength),'');
const obsolete=[];scene.traverse(n=>{if(n.name.startsWith('Cube_Grain_'))obsolete.push(n);});obsolete.forEach(n=>n.removeFromParent());
const wood=scene.getObjectByName('Cube_Wood');wood.geometry=new RoundedBoxGeometry(.155,.155,.155,2,.008);
wood.material=wood.material.clone();wood.material.color.setRGB(1,1,1);wood.material.roughness=.81;
const tile=256,width=tile*3,height=tile*2,colors=new Uint8Array(width*height*4),normals=new Uint8Array(width*height*4);
// One continuous solid-wood field, with fibres running through the Y axis.
// Side faces show flowing longitudinal grain; top/bottom reveal the same growth rings.
function tone(x,y,z){
 const bx=x+.13+.008*Math.sin(y*17)+.004*Math.sin(y*37+.7);
 const bz=z+.11+.006*Math.sin(y*19+1.2);
 const radius=Math.hypot(bx,bz),phase=radius*680+.45*Math.sin(radius*48)+.22*Math.sin(y*43+radius*15);
 const band=Math.pow((Math.sin(phase)+1)/2,6);
 const fibre=Math.sin(radius*5100+Math.sin(y*91)*.3)*.75;
 const broad=Math.sin(radius*38+y*6)*1.2;
 return 2.5-band*9+fibre+broad;
}
function point(face,u,v){const a=(u-.5)*.155,b=(v-.5)*.155;return [
 [a,b,.0775],[a,b,-.0775],[.0775,b,a],[-.0775,b,a],[a,.0775,b],[a,-.0775,b]
 ][face];}
for(let face=0;face<6;face++)for(let y=0;y<tile;y++)for(let x=0;x<tile;x++){
 const u=x/(tile-1),v=1-y/(tile-1),p=point(face,u,v),value=tone(...p);
 const index=((Math.floor(face/3)*tile+y)*width+(face%3)*tile+x)*4;
 colors.set([Math.round(217+value),Math.round(165+value*.87),Math.round(107+value*.63),255],index);
 const dx=(tone(...point(face,Math.min(1,u+.002),v))-tone(...point(face,Math.max(0,u-.002),v)))*.055;
 const dy=(tone(...point(face,u,Math.min(1,v+.002)))-tone(...point(face,u,Math.max(0,v-.002))))*.055;
 const n=new T.Vector3(-dx,-dy,1).normalize();normals.set([Math.round((n.x*.5+.5)*255),Math.round((n.y*.5+.5)*255),Math.round((n.z*.5+.5)*255),255],index);
}
const pos=wood.geometry.attributes.position,normal=wood.geometry.attributes.normal,uv=wood.geometry.attributes.uv;
for(let i=0;i<pos.count;i++){
 const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),nx=normal.getX(i),ny=normal.getY(i),nz=normal.getZ(i);
 let face,a,b;if(Math.abs(nz)>=Math.abs(nx)&&Math.abs(nz)>=Math.abs(ny)){face=nz>=0?0:1;a=x;b=y;}
 else if(Math.abs(nx)>=Math.abs(ny)){face=nx>=0?2:3;a=z;b=y;}else{face=ny>=0?4:5;a=x;b=z;}
 const u=T.MathUtils.clamp(a/.155+.5,0,1),v=T.MathUtils.clamp(b/.155+.5,0,1);
 uv.setXY(i,((face%3)*tile+1+u*(tile-2))/width,(Math.floor(face/3)*tile+1+(1-v)*(tile-2))/height);
}
function crc(data){let c=0xffffffff;for(const byte of data){c^=byte;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;}
function chunk(type,data){const tag=Buffer.from(type),out=Buffer.alloc(data.length+12);out.writeUInt32BE(data.length);tag.copy(out,4);data.copy(out,8);out.writeUInt32BE(crc(Buffer.concat([tag,data])),data.length+8);return out;}
function png(pixels){const header=Buffer.alloc(13);header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=8;header[9]=6;const rows=Buffer.alloc(height*(width*4+1));for(let y=0;y<height;y++)Buffer.from(pixels.buffer,y*width*4,width*4).copy(rows,y*(width*4+1)+1);return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]);}
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();});}};
const output=Buffer.from(await new GLTFExporter().parseAsync(scene,{binary:true})),jsonSize=output.readUInt32LE(12),json=JSON.parse(output.subarray(20,20+jsonSize)),binary=output.subarray(28+jsonSize);
let data=Buffer.from(binary);json.images??=[];json.textures??=[];json.samplers??=[];json.bufferViews??=[];
const sampler=json.samplers.push({magFilter:9729,minFilter:9729,wrapS:33071,wrapT:33071})-1;
function embed(image){const padding=Buffer.alloc((4-data.length%4)%4);data=Buffer.concat([data,padding]);const offset=data.length;data=Buffer.concat([data,image]);const view=json.bufferViews.push({buffer:0,byteOffset:offset,byteLength:image.length})-1;const source=json.images.push({bufferView:view,mimeType:'image/png'})-1;return json.textures.push({sampler,source})-1;}
const colorIndex=embed(png(colors)),normalIndex=embed(png(normals));
const mat=json.materials.find(m=>m.name==='Play_wood');mat.pbrMetallicRoughness.baseColorTexture={index:colorIndex};mat.normalTexture={index:normalIndex,scale:.13};
data=Buffer.concat([data,Buffer.alloc((4-data.length%4)%4)]);json.buffers[0].byteLength=data.length;
let j=Buffer.from(JSON.stringify(json));j=Buffer.concat([j,Buffer.alloc((4-j.length%4)%4,32)]);
const header=Buffer.alloc(20);header.write('glTF');header.writeUInt32LE(2,4);header.writeUInt32LE(28+j.length+data.length,8);header.writeUInt32LE(j.length,12);header.writeUInt32LE(0x4e4f534a,16);
const binHeader=Buffer.alloc(8);binHeader.writeUInt32LE(data.length);binHeader.writeUInt32LE(0x004e4942,4);
await fs.writeFile('.asset-candidates/play-props/play-cube-natural-grain.glb',Buffer.concat([header,j,binHeader,data]));
console.log('Created coherent wood grain: flowing side fibres and curved end grain, embedded color/normal textures.');
