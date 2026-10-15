import fs from 'node:fs/promises';
import path from 'node:path';
import rules from '../src/assetModelRules.js';
const assembly=await fs.readFile('.asset-candidates/play-props/play-prop-set-showcase.glb'),keys=[];
for(const id of (process.argv.includes('--chunky-only')?['orange-block']:process.argv.includes('--blocks-only')?['coral-block','orange-block']:['coral-block','orange-block','wedge','ball']))for(const color of rules.colorVersions[id]){
  const key=`play-${id}:${color}`,name=`play-${id}-${color}.glb`,state=JSON.parse(await fs.readFile('public/models/asset-saves.json','utf8')),revision=Date.now(),old=state[key];
  const snapshot={...state,[key]:{...old,items:null,pendingSource:false,revision,sourceRevision:revision,history:[old?.items||null],nextAvailable:false},'play-props:default':{...state['play-props:default'],items:null,pendingSource:false,revision,sourceRevision:revision,nextAvailable:false}};
  const body=JSON.stringify({key,snapshot,files:[{name,data:(await fs.readFile('.asset-candidates/play-props/color-variants/'+name)).toString('base64')},{name:'play-props.glb',data:assembly.toString('base64')}]});
  let response;for(let attempt=0;attempt<3;attempt++){response=await fetch('http://127.0.0.1:3001/save',{method:'POST',headers:{'Content-Type':'application/json'},body});if(response.ok)break;await new Promise(resolve=>setTimeout(resolve,500));}
  if(!response.ok)throw Error(await response.text());keys.push(key);console.log('Saved '+key);
}
const runtime='C:/Users/dawso/OneDrive/Desktop/portfolio',backup=path.join(runtime,'.asset-backups','colored-props-runtime-sync-'+Date.now());
for(const name of [...keys.map(k=>k.replace(':','-')+'.glb'),'play-props.glb'])for(const prefix of ['','editor-sources/']){await fs.mkdir(path.join(backup,prefix),{recursive:true});const target=path.join(runtime,'public/models',prefix,name);await fs.copyFile(target,path.join(backup,prefix,name)).catch(()=>{});await fs.copyFile('public/models/'+prefix+name,target);}
const state=JSON.parse(await fs.readFile('public/models/asset-saves.json','utf8')),target=path.join(runtime,'public/models/asset-saves.json'),other=JSON.parse(await fs.readFile(target,'utf8'));for(const key of [...keys,'play-props:default'])other[key]=state[key];await fs.writeFile(target+'.sync.tmp',JSON.stringify(other));await fs.rename(target+'.sync.tmp',target);
for(const key of keys)await fs.cp('.asset-backups/'+key.replace(':','-'),path.join(runtime,'.asset-backups',key.replace(':','-')),{recursive:true});
