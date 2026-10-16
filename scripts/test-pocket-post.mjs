// Save/restore integration against disposable copies, never the live library.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
import { Box3, Vector3, Euler, Quaternion } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { mailPreviewColliders } from '../src/mailPreviewPhysics.mjs';
const require=createRequire(import.meta.url),rules=require('../src/assetModelRules.js');
let source=await fs.readFile('src/assetFiles.js','utf8');
source=source.replace(/^import \{ hosted, hostedRequest \}.*\r?\n/m,'').replace('  if(hosted) return hostedRequest(route,body);','');
for(const name of ['playSetStorage.js','rackHardware.mjs','rackRefinement.mjs','assetModelRules.js','materialColors.mjs'])source=source.replace(`'./${name.replace(/\.js$/,'')}'`,`'${pathToFileURL(path.resolve('src',name)).href}'`).replace(`'./${name}'`,`'${pathToFileURL(path.resolve('src',name)).href}'`);
for(const name of ['three','three/examples/jsm/loaders/GLTFLoader','three/examples/jsm/exporters/GLTFExporter'])source=source.replace(`'${name}'`,`'${pathToFileURL(require.resolve(name==='three'?name:name+'.js')).href}'`);
const {writeModelFiles}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const scratch=await fs.mkdtemp(path.join(os.tmpdir(),'pocket-post-check-')),root=path.join(scratch,'models');await fs.mkdir(path.join(root,'editor-sources'),{recursive:true});
const files=['pocket-post.glb','pocket-post-organized.glb',...rules.mailIds.map(id=>'mail-'+id+'.glb')];
for(const name of files)for(const prefix of ['','editor-sources/'])await fs.copyFile('public/models/'+prefix+name,path.join(root,prefix,name));
await fs.writeFile(path.join(root,'asset-saves.json'),'{}');
const originalFetch=globalThis.fetch,originalLoad=GLTFLoader.prototype.loadAsync,originalParse=GLTFLoader.prototype.parseAsync;
GLTFLoader.prototype.parseAsync=function(data,resourcePath){
  // Node has no browser image decoder. Strip only test-time material references.
  const bytes=Buffer.from(data),length=bytes.readUInt32LE(12),json=JSON.parse(bytes.subarray(20,20+length));
  for(const material of json.materials||[]){if(material.pbrMetallicRoughness){delete material.pbrMetallicRoughness.baseColorTexture;delete material.pbrMetallicRoughness.metallicRoughnessTexture;}for(const field of ['normalTexture','occlusionTexture','emissiveTexture'])delete material[field];}
  const text=Buffer.from(JSON.stringify(json)),encoded=Buffer.alloc(Math.ceil(text.length/4)*4,32);text.copy(encoded);const tail=bytes.subarray(20+length),out=Buffer.alloc(20+encoded.length+tail.length);bytes.copy(out,0,0,20);out.writeUInt32LE(out.length,8);out.writeUInt32LE(encoded.length,12);encoded.copy(out,20);tail.copy(out,20+encoded.length);return originalParse.call(this,out.buffer.slice(out.byteOffset,out.byteOffset+out.byteLength),resourcePath);
};
GLTFLoader.prototype.loadAsync=async function(url){const bytes=await fs.readFile(path.join(root,String(url).replace(/^\/models\//,'').split('?')[0]));return this.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');};
globalThis.fetch=(url,options)=>originalFetch(String(url).replace('127.0.0.1:3001','127.0.0.1:3005'),options);
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();});}};
const loader=new GLTFLoader();
function centers(scene){scene.updateMatrixWorld(true);const result={};scene.traverse(node=>{if(node.isMesh){const id=node.userData.assetGroup;result[id]??=[];result[id].push(new Box3().setFromObject(node).getCenter(new Vector3()).toArray().map(v=>Number(v.toFixed(5))));}});return result;}
const mean=points=>points.reduce((sum,p)=>sum.map((v,i)=>v+p[i]/points.length),[0,0,0]);
function isInside(point,c){const p=new Vector3(...point).sub(new Vector3(...c.center)).applyQuaternion(new Quaternion().setFromEuler(new Euler(...c.rotation)).invert());return p.toArray().every((v,i)=>Math.abs(v)<c.halfSize[i]-.0001);}
const child=spawn(process.execPath,['scripts/asset-save-server.cjs'],{env:{...process.env,ASSET_MODEL_ROOT:root,ASSET_BACKUP_ROOT:path.join(scratch,'backups'),ASSET_PENDING_ROOT:path.join(scratch,'pending'),ASSET_SAVE_PORT:'3005'},stdio:['ignore','pipe','pipe'],windowsHide:true});
child.stderr.on('data',data=>process.stderr.write(data));
try{
  await new Promise((resolve,reject)=>{child.stdout.once('data',resolve);child.once('error',reject);child.once('exit',code=>reject(Error('Test service exited '+code)));});
  for(const [id,point]of [['mailbox',[0,.12,.15]],['dispatch-bin',[0,.075,0]],['sack',[.01,.22,0]]]){const scene=(await loader.loadAsync('/models/mail-'+id+'.glb')).scene,colliders=mailPreviewColliders(scene,'mail-'+id+':default',[0,0,0]);assert(colliders.length>3);assert(!colliders.some(c=>isInside(point,c)),id+' opening is blocked');}
  for(const id of rules.mailIds){
    const key='mail-'+id+':default',name='mail-'+id+'.glb',group='mail-'+id;
    const before={};for(const file of files.slice(0,2))before[file]=centers((await loader.loadAsync('/models/'+file)).scene);
    const scene=(await loader.loadAsync('/models/editor-sources/'+name)).scene,items=[];scene.updateMatrixWorld(true);
    scene.traverse(node=>{if(!node.isMesh)return;const p=new Vector3(),s=new Vector3(),q=new Quaternion();node.matrixWorld.decompose(p,q,s);node.geometry.computeBoundingBox();p.add(node.geometry.boundingBox.getCenter(new Vector3()).multiply(s).applyQuaternion(q));p.x+=.006;const e=new Euler().setFromQuaternion(q);items.push({id:'part-'+items.length,name:node.name,assetGroup:group,position:p.toArray(),rotation:[e.x,e.y,e.z],scale:s.toArray()});});
    const snapshot=JSON.parse(await fs.readFile(path.join(root,'asset-saves.json'),'utf8'));for(const affected of [key,...rules.linkedAssemblyKeys(key)])snapshot[affected]={items:affected===key?items:null,revision:Date.now(),history:[null]};
    await writeModelFiles(key,items,{},snapshot);
    for(const file of files.slice(0,2)){const after=centers((await loader.loadAsync('/models/'+file)).scene);for(const other of Object.keys(before[file]))if(other!==group)assert.deepEqual(after[other],before[file][other],'Unrelated prop moved: '+other);assert.equal(after[group].length,items.length,'Prop duplicated or lost');const delta=mean(after[group]).map((v,i)=>v-mean(before[file][group])[i]);assert(Math.abs(Math.hypot(...delta)-.006)<.00003,'Move did not sync to '+file);}
    const response=await globalThis.fetch('http://127.0.0.1:3001/restore',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key})});assert.equal(response.status,200);
    for(const file of files.slice(0,2))assert.deepEqual(centers((await loader.loadAsync('/models/'+file)).scene),before[file],'Restore changed layout '+file);
    console.log('Verified save/restore in both layouts: '+id);
  }
  console.log('Pocket Post: six individual saves, both layouts, unrelated props, restores and open container collisions passed.');
}finally{globalThis.fetch=originalFetch;GLTFLoader.prototype.loadAsync=originalLoad;GLTFLoader.prototype.parseAsync=originalParse;const stopped=new Promise(resolve=>child.once('exit',resolve));child.kill();await stopped;
  const tempRoot=path.resolve(os.tmpdir())+path.sep;if(!scratch.startsWith(tempRoot)||!path.basename(scratch).startsWith('pocket-post-check-'))throw Error('Unexpected scratch path');await fs.rm(scratch,{recursive:true,force:true});}
