import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import * as T from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

globalThis.FileReader=class {readAsArrayBuffer(blob){blob.arrayBuffer().then(value=>{this.result=value;this.onloadend?.();});}};
const folder='.asset-candidates/parcels/approved-decals';
await fs.mkdir(folder,{recursive:true});
const decals={
  yellow:{kind:'H3',label:'Handle With Care',file:'assets/raw-assets/play-props/2026-10-13_21-06-08_-0700_h3-handle-care-refined-v02.png',width:.0595,height:.066},
  teal:{kind:'D3',label:'Keep Dry',file:'assets/raw-assets/play-props/2026-10-13_21-11-53_-0700_d3-keep-dry-even-corners-v03.png',width:.059,height:.064},
};
function addChunk(chunks,data){
  let offset=chunks.reduce((n,b)=>n+b.length,0);const pad=(4-offset%4)%4;
  if(pad){chunks.push(Buffer.alloc(pad));offset+=pad;}
  chunks.push(data);return offset;
}
function packGlb(json,binary){
  json.buffers[0].byteLength=binary.length;
  let encoded=Buffer.from(JSON.stringify(json));encoded=Buffer.concat([encoded,Buffer.alloc((4-encoded.length%4)%4,32)]);
  const header=Buffer.alloc(20),binHeader=Buffer.alloc(8);header.write('glTF');header.writeUInt32LE(2,4);header.writeUInt32LE(28+encoded.length+binary.length,8);header.writeUInt32LE(encoded.length,12);header.writeUInt32LE(0x4e4f534a,16);binHeader.writeUInt32LE(binary.length);binHeader.writeUInt32LE(0x004e4942,4);
  return Buffer.concat([header,encoded,binHeader,binary]);
}
function geometryOnly(glb){
  const jsonLength=glb.readUInt32LE(12),json=JSON.parse(glb.subarray(20,20+jsonLength));
  for(const material of json.materials||[]){
    if(material.pbrMetallicRoughness)delete material.pbrMetallicRoughness.baseColorTexture;
    delete material.normalTexture;delete material.occlusionTexture;delete material.emissiveTexture;
  }
  const binary=glb.subarray(28+jsonLength,28+jsonLength+glb.readUInt32LE(20+jsonLength));
  return packGlb(json,binary);
}
function embedDecal(glb,png,placement,{kind,label,width,height},group){
  const jsonLength=glb.readUInt32LE(12),json=JSON.parse(glb.subarray(20,20+jsonLength));
  const oldNode=json.nodes?.find(n=>n.name?.startsWith('Parcel_Care_')&&n.mesh!==undefined);
  if(oldNode){
    const primitive=json.meshes[oldNode.mesh].primitives[0],position=json.accessors[primitive.attributes.POSITION];
    const positionView=json.bufferViews[position.bufferView];
    const texture=json.materials[primitive.material].pbrMetallicRoughness.baseColorTexture.index;
    const image=json.images[json.textures[texture].source],imageView=json.bufferViews[image.bufferView];
    const binStart=28+jsonLength,binLength=glb.readUInt32LE(20+jsonLength);
    if(imageView.byteOffset+Math.ceil(imageView.byteLength/4)*4!==binLength)throw Error('Old care artwork is not the final GLB buffer view');
    const binary=Buffer.from(glb.subarray(binStart,binStart+imageView.byteOffset));
    const vertices=[-.5*width,-.5*height,0,.5*width,-.5*height,0,.5*width,.5*height,0,-.5*width,.5*height,0];
    const start=positionView.byteOffset+(position.byteOffset||0);
    vertices.forEach((value,index)=>binary.writeFloatLE(value,start+index*4));
    position.min=[-.5*width,-.5*height,0];position.max=[.5*width,.5*height,0];
    oldNode.matrix=placement.toArray();oldNode.name=`Parcel_Care_${kind}_Artwork`;
    oldNode.extras={assetGroup:group,careStamp:`${kind} ${label}`};
    json.meshes[oldNode.mesh].name=oldNode.name;
    json.materials[primitive.material].name=`Parcel_Care_${kind}_Printed_Paper`;
    image.name=`${kind} Approved Art`;imageView.byteLength=png.length;
    const merged=Buffer.concat([binary,png,Buffer.alloc((4-png.length%4)%4)]);
    return packGlb(json,merged);
  }
  for(const key of ['images','textures','samplers','materials','meshes','nodes','bufferViews','accessors'])json[key]??=[];
  const binStart=28+jsonLength,binLength=glb.readUInt32LE(20+jsonLength);
  const chunks=[glb.subarray(binStart,binStart+binLength)];
  const addView=(data,target)=>{const offset=addChunk(chunks,data),index=json.bufferViews.length;json.bufferViews.push({buffer:0,byteOffset:offset,byteLength:data.length,...(target?{target}:{})});return index;};
  const f32=v=>Buffer.from(new Float32Array(v).buffer);
  const u16=v=>Buffer.from(new Uint16Array(v).buffer);
  const accessor=(data,type,count,min,max,target)=>{const view=addView(data,target),index=json.accessors.length;json.accessors.push({bufferView:view,componentType:data.length===12&&type==='SCALAR'?5123:5126,count,type,...(min?{min}:{}),...(max?{max}:{})});return index;};
  const position=accessor(f32([-.5*width,-.5*height,0,.5*width,-.5*height,0,.5*width,.5*height,0,-.5*width,.5*height,0]),'VEC3',4,[-.5*width,-.5*height,0],[.5*width,.5*height,0],34962);
  const normal=accessor(f32([0,0,1,0,0,1,0,0,1,0,0,1]),'VEC3',4,null,null,34962);
  const uv=accessor(f32([0,1,1,1,1,0,0,0]),'VEC2',4,null,null,34962);
  const indices=accessor(u16([0,1,2,0,2,3]),'SCALAR',6,[0],[3],34963);
  const imageView=addView(png);
  const imageIndex=json.images.length;json.images.push({name:`${kind} Approved Art`,bufferView:imageView,mimeType:'image/png'});
  const samplerIndex=json.samplers.length;json.samplers.push({magFilter:9729,minFilter:9987,wrapS:33071,wrapT:33071});
  const textureIndex=json.textures.length;json.textures.push({source:imageIndex,sampler:samplerIndex});
  const materialIndex=json.materials.length;json.materials.push({name:`Parcel_Care_${kind}_Printed_Paper`,pbrMetallicRoughness:{baseColorFactor:[1,1,1,1],baseColorTexture:{index:textureIndex},metallicFactor:0,roughnessFactor:.91},alphaMode:'BLEND',doubleSided:true});
  const meshIndex=json.meshes.length;json.meshes.push({name:`Parcel_Care_${kind}_Artwork`,primitives:[{attributes:{POSITION:position,NORMAL:normal,TEXCOORD_0:uv},indices,material:materialIndex,mode:4}]});
  const nodeIndex=json.nodes.length;json.nodes.push({name:`Parcel_Care_${kind}_Artwork`,mesh:meshIndex,matrix:placement.toArray(),extras:{assetGroup:group,careStamp:`${kind} ${label}`}});
  json.scenes[json.scene||0].nodes.push(nodeIndex);
  const rawBinary=Buffer.concat(chunks),binary=Buffer.concat([rawBinary,Buffer.alloc((4-rawBinary.length%4)%4)]);json.buffers[0].byteLength=binary.length;
  let encoded=Buffer.from(JSON.stringify(json));encoded=Buffer.concat([encoded,Buffer.alloc((4-encoded.length%4)%4,32)]);
  const header=Buffer.alloc(20),binHeader=Buffer.alloc(8);header.write('glTF');header.writeUInt32LE(2,4);header.writeUInt32LE(28+encoded.length+binary.length,8);header.writeUInt32LE(encoded.length,12);header.writeUInt32LE(0x4e4f534a,16);binHeader.writeUInt32LE(binary.length);binHeader.writeUInt32LE(0x004e4942,4);
  return Buffer.concat([header,encoded,binHeader,binary]);
}
for(const size of ['small','large'])for(const color of (process.argv.includes('--teal-only')?['teal']:['teal','yellow'])){
  const id=`play-parcel-${size}`,name=`${id}-${color}.glb`,key=`${id}:${color}`,decal=decals[color];
  const bytes=await fs.readFile('public/models/'+name);
  const source=geometryOnly(bytes);
  const {scene}=await new GLTFLoader().parseAsync(source.buffer.slice(source.byteOffset,source.byteOffset+source.byteLength),'');
  let carton;const old=[];scene.traverse(n=>{if(n.name==='Parcel_Carton')carton=n;if(n.name.startsWith('Parcel_Care_'))old.push(n);});
  if(!carton)throw Error('Missing carton: '+name);old.forEach(n=>n.removeFromParent());scene.updateMatrixWorld(true);carton.geometry.computeBoundingBox();
  const small=size==='small',box=carton.geometry.boundingBox;
  const scale=color==='teal'?(small?.75:.95):(small?.76:1.13);
  const onPositiveX=color==='teal'||(color==='yellow'&&small);
  const offset=color==='teal'?new T.Vector3(box.max.x+.00045,small?.012:-.018,small?.0395:.044):small?new T.Vector3(box.max.x+.00045,.007,-.042):new T.Vector3(0,.014,box.min.z-.00045);
  const angle=(color==='teal'?(small?2:4):(small?5:-5))*Math.PI/180;
  const placement=scene.matrixWorld.clone().invert().multiply(carton.matrixWorld).multiply(new T.Matrix4().makeTranslation(...offset.toArray())).multiply(new T.Matrix4().makeRotationY(onPositiveX?Math.PI/2:Math.PI)).multiply(new T.Matrix4().makeRotationZ(angle)).multiply(new T.Matrix4().makeScale(scale,scale,scale));
  const base=Buffer.from(await new GLTFExporter().parseAsync(scene,{binary:true}));
  const candidate=path.resolve(folder,name);await fs.writeFile(candidate,embedDecal(base,await fs.readFile(decal.file),placement,decal,id));
  execFileSync(process.execPath,['scripts/stage-asset.cjs',key,candidate]);
  console.log(`${key}: exact ${decal.kind} art, embedded high-resolution print`);
}
