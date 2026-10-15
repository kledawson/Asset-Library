import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {spawn} from 'node:child_process';
import {Box3,Vector3} from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import { materialHex } from '../src/materialColors.mjs';
const require=createRequire(import.meta.url),{playIds}=require('../src/assetModelRules.js');
let source=await fs.readFile('src/assetFiles.js','utf8');
source=source.replace(/^import \{ hosted, hostedRequest \}.*\r?\n/m,'').replace('  if(hosted) return hostedRequest(route,body);','');
source=source.replace("'./playSetStorage'","'"+pathToFileURL(path.resolve('src/playSetStorage.js')).href+"'");
for(const file of ['rackHardware.mjs','rackRefinement.mjs','assetModelRules.js','materialColors.mjs'])source=source.replace(`'./${file}'`,`'${pathToFileURL(path.resolve('src',file)).href}'`);
for(const name of ['three','three/examples/jsm/loaders/GLTFLoader','three/examples/jsm/exporters/GLTFExporter'])source=source.replace(`'${name}'`,`'${pathToFileURL(require.resolve(name==='three'?name:name+'.js')).href}'`);
const {writeModelFiles}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const scratch=await fs.mkdtemp(path.join(os.tmpdir(),'play-props-test-'));const root=path.join(scratch,'models');await fs.mkdir(path.join(root,'editor-sources'),{recursive:true});
for(const file of ['play-props.glb','play-props-organized.glb',...playIds.map(id=>'play-'+id+'.glb')]){await fs.copyFile('public/models/'+file,path.join(root,file));await fs.copyFile('public/models/editor-sources/'+file,path.join(root,'editor-sources',file));}
await fs.writeFile(path.join(root,'asset-saves.json'),'{}');
for(const size of ['small','large'])for(const color of ['coral','yellow','teal'])for(const folder of ['','editor-sources/']){const file='play-parcel-'+size+'-'+color+'.glb';await fs.copyFile('public/models/'+folder+file,path.join(root,folder,file));}
const child=spawn(process.execPath,['scripts/asset-save-server.cjs'],{env:{...process.env,ASSET_MODEL_ROOT:root,ASSET_BACKUP_ROOT:path.join(root,'../backups'),ASSET_SAVE_PORT:'3004'},stdio:['ignore','pipe','pipe']});
child.stderr.on('data',data=>console.error(data.toString().trim()));
const originalFetch=globalThis.fetch,originalLoad=GLTFLoader.prototype.loadAsync;
GLTFLoader.prototype.loadAsync=async function(url){const file=url.replace(/^\/models\//,'').split('?')[0],b=await fs.readFile(path.join(root,file));return this.parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');};
globalThis.fetch=(url,options)=>originalFetch(String(url).replace('127.0.0.1:3001','127.0.0.1:3004'),options);
globalThis.FileReader=class{readAsArrayBuffer(b){b.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();});}};
// Remove embedded texture references in this Node-only test. Production GLBs stay untouched.
const parse=GLTFLoader.prototype.parseAsync;
GLTFLoader.prototype.parseAsync=function(data,resourcePath){const b=Buffer.from(data),j=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString());for(const m of j.materials||[]){if(m.pbrMetallicRoughness){delete m.pbrMetallicRoughness.baseColorTexture;delete m.pbrMetallicRoughness.metallicRoughnessTexture;}delete m.normalTexture;delete m.occlusionTexture;delete m.emissiveTexture;}const text=Buffer.from(JSON.stringify(j)),json=Buffer.alloc(Math.ceil(text.length/4)*4,32);text.copy(json);const tail=b.subarray(20+b.readUInt32LE(12)),out=Buffer.alloc(20+json.length+tail.length);b.copy(out,0,0,20);out.writeUInt32LE(out.length,8);out.writeUInt32LE(json.length,12);json.copy(out,20);tail.copy(out,20+json.length);return parse.call(this,out.buffer.slice(out.byteOffset,out.byteOffset+out.byteLength),resourcePath);};
for(const id of ['coral-block','orange-block','wedge','ball'])for(const color of (id==='orange-block'?['coral','orange','teal']:['coral','yellow','teal']))for(const folder of ['','editor-sources/']){const file='play-'+id+'-'+color+'.glb';await fs.copyFile('public/models/'+folder+file,path.join(root,folder,file));}
const loader=new GLTFLoader();
function groupCenters(scene){scene.updateMatrixWorld(true);const groups={};scene.traverse(node=>{if(node.isMesh){const id=node.userData.assetGroup;groups[id]??=[];const box=new Box3().setFromObject(node);groups[id].push(box.getCenter(new Vector3()).toArray().map(v=>Number(v.toFixed(5))));}});return groups;}
function groupColors(scene){const groups={};scene.traverse(node=>{if(node.isMesh){const id=node.userData.assetGroup;groups[id]??=[];groups[id].push((Array.isArray(node.material)?node.material:[node.material]).map(materialHex));}});return groups;}
try{
 await new Promise((resolve,reject)=>{child.stdout.once('data',resolve);child.once('error',reject);child.once('exit',code=>reject(Error('Save service exited '+code)));});
 const variants=process.argv.includes('--smoke')?[['orange-block','teal']]:['coral-block','orange-block','wedge','ball'].flatMap(id=>(id==='orange-block'?['coral','orange','teal']:['coral','yellow','teal']).map(color=>[id,color]));
 for(const [id,color] of variants){
  const file='play-'+id+'-'+color+'.glb';
  console.log('Checking '+id+' '+color);
  const before=Object.fromEntries(await Promise.all(['play-props.glb','play-props-organized.glb'].map(async name=>[name,groupCenters((await loader.loadAsync('/models/'+name)).scene)])));
  const beforeColors=Object.fromEntries(await Promise.all(['play-props.glb','play-props-organized.glb'].map(async name=>[name,groupColors((await loader.loadAsync('/models/'+name)).scene)])));
  const individual=(await loader.loadAsync('/models/editor-sources/'+file)).scene,items=[];individual.updateMatrixWorld(true);
  individual.traverse(node=>{if(!node.isMesh)return;const position=new Vector3(),scale=new Vector3(),quaternion=node.quaternion.clone();node.matrixWorld.decompose(position,quaternion,scale);node.geometry.computeBoundingBox();position.add(node.geometry.boundingBox.getCenter(new Vector3()).multiply(scale).applyQuaternion(quaternion));position.x+=.01;items.push({id:'part-'+items.length,name:node.name,position:position.toArray(),rotation:[node.rotation.x,node.rotation.y,node.rotation.z],scale:scale.toArray(),assetGroup:'play-'+id});});
  if(process.argv.includes('--colors'))items[0].colorOverrides={0:'#397d78'};
  const key='play-'+id+':'+color,snapshot={[key]:{items,revision:Date.now(),history:[null]},'play-props:default':{items:null,revision:Date.now()},'play-props:organized':{items:null,revision:Date.now()}};
  await writeModelFiles(key,items,{},snapshot);
  const history=await (await globalThis.fetch('http://127.0.0.1:3001/history/'+encodeURIComponent(key))).json();assert.equal(history.previous,true,'Completed save should have an available backup');
  const group='play-'+id+'-'+color;
  if(process.argv.includes('--colors'))for(const name of [file,'play-props.glb','play-props-organized.glb']){const scene=(await loader.loadAsync('/models/'+name)).scene;let target;scene.traverse(node=>{if(node.isMesh&&node.name.replace(/_\d+$/,'')===items[0].name.replace(/_\d+$/,'')&&(name===file||node.userData.assetGroup===group))target=node;});assert(target,'Recolored part missing from '+name);assert.equal(materialHex(Array.isArray(target.material)?target.material[0]:target.material),'#397d78','Saved color differs in '+name);const colors=groupColors(scene);if(beforeColors[name])for(const other of Object.keys(beforeColors[name]))if(other!==group)assert.deepEqual(colors[other],beforeColors[name][other],'Unrelated color changed: '+other);}
  const mean=points=>points.reduce((sum,point)=>sum.map((value,axis)=>value+point[axis]/points.length),[0,0,0]);
  for(const name of ['play-props.glb','play-props-organized.glb']){
    const after=groupCenters((await loader.loadAsync('/models/'+name)).scene);
    for(const other of Object.keys(before[name]))if(other!==group)assert.deepEqual(after[other],before[name][other],'Unrelated asset moved in '+name+': '+other);
    assert.equal(after[group].length,items.length,'Duplicate/missing prop parts in '+name);
    const previous=before[name][group],updated=after[group],delta=mean(updated).map((value,axis)=>value-mean(previous)[axis]);
    assert(Math.abs(Math.hypot(...delta)-.01)<.00002,'Individual did not sync its move in '+name+': '+id+' '+color);
    for(const point of previous)assert(updated.some(next=>Math.hypot(...next.map((value,axis)=>value-point[axis]-delta[axis]))<.00003),'Relative prop parts changed in '+name+': '+id+' '+color);
  }
  const restored=await globalThis.fetch('http://127.0.0.1:3001/restore',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key})});assert.equal(restored.status,200);
 }
 const bad=await globalThis.fetch('http://127.0.0.1:3001/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:'play-ball:default',files:[{name:'play-ball.glb',data:''},{name:'workshop-tool-rack-final.glb',data:''}],snapshot:{}})});assert.equal(bad.status,400);
 const cubeBefore=await fs.readFile(path.join(root,'play-cube.glb'));const missing=await globalThis.fetch('http://127.0.0.1:3001/restore',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:'play-cube:default'})});assert.equal(missing.status,404);assert.deepEqual(await fs.readFile(path.join(root,'play-cube.glb')),cubeBefore,'Missing backup must leave the current model intact');
 console.log(`${variants.length} color variant(s) save/sync/restore in both Play Prop Set layouts; other props preserved; cross-package writes rejected.`);
}finally{child.kill();globalThis.fetch=originalFetch;GLTFLoader.prototype.loadAsync=originalLoad;}
