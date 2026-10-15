import fs from 'node:fs/promises';
import path from 'node:path';
const key='tool-rack:final',name='workshop-tool-rack-final.glb';
const state=JSON.parse(await fs.readFile('public/models/asset-saves.json','utf8')),old=state[key],revision=Date.now();
const items=JSON.parse(await fs.readFile('.asset-candidates/workshop-rack-wrench-mounts-items.json','utf8'));
const snapshot={...state,[key]:{...old,items,pendingSource:false,revision,sourceRevision:revision,history:[old.items||null],nextAvailable:false}};
const response=await fetch('http://127.0.0.1:3001/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key,snapshot,files:[{name,data:(await fs.readFile(items?'.asset-candidates/workshop-rack-wrench-mounts-export.glb':'.asset-candidates/workshop-rack-wrench-mounts.glb')).toString('base64')}]})});
if(!response.ok)throw Error(await response.text());
const runtime='C:/Users/dawso/OneDrive/Desktop/portfolio',backup=path.join(runtime,'.asset-backups','wrench-mount-runtime-sync-'+Date.now());
for(const prefix of ['','editor-sources/']){await fs.mkdir(path.join(backup,prefix),{recursive:true});const destination=path.join(runtime,'public/models',prefix,name);await fs.copyFile(destination,path.join(backup,prefix,name));await fs.copyFile('public/models/'+prefix+name,destination);}
const updated=JSON.parse(await fs.readFile('public/models/asset-saves.json','utf8')),target=path.join(runtime,'public/models/asset-saves.json'),runtimeState=JSON.parse(await fs.readFile(target,'utf8'));runtimeState[key]=updated[key];await fs.writeFile(target+'.sync.tmp',JSON.stringify(runtimeState));await fs.rename(target+'.sync.tmp',target);
await fs.cp('.asset-backups/tool-rack-final',path.join(runtime,'.asset-backups/tool-rack-final'),{recursive:true});console.log('Saved Final with both wrench mounting discs seated.');
