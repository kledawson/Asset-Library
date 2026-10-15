import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const key='play-props:default',name='play-props.glb',candidate=process.argv[2]||'.asset-candidates/play-props/play-prop-set-grouped.glb';
execFileSync(process.execPath,['scripts/stage-asset.cjs',key,path.resolve(candidate)]);
const state=JSON.parse(await fs.readFile('public/models/asset-saves.json','utf8')),old=state[key],revision=Date.now(),snapshot={...state,[key]:{...old,items:null,pendingSource:false,revision,sourceRevision:revision,history:[old.items||null],nextAvailable:false}};
let response;const body=JSON.stringify({key,snapshot,files:[{name,data:(await fs.readFile(candidate)).toString('base64')}]});for(let i=0;i<3;i++){response=await fetch('http://127.0.0.1:3001/save',{method:'POST',headers:{'Content-Type':'application/json'},body});if(response.ok)break;await new Promise(resolve=>setTimeout(resolve,500));}if(!response.ok)throw Error(await response.text());
const runtime='C:/Users/dawso/OneDrive/Desktop/portfolio',backup=path.join(runtime,'.asset-backups','grouped-play-set-'+Date.now());
for(const prefix of ['','editor-sources/']){await fs.mkdir(path.join(backup,prefix),{recursive:true});const target=path.join(runtime,'public/models',prefix,name);await fs.copyFile(target,path.join(backup,prefix,name));await fs.copyFile('public/models/'+prefix+name,target);}
const updated=JSON.parse(await fs.readFile('public/models/asset-saves.json','utf8')),target=path.join(runtime,'public/models/asset-saves.json'),other=JSON.parse(await fs.readFile(target,'utf8'));other[key]=updated[key];await fs.writeFile(target+'.sync.tmp',JSON.stringify(other));await fs.rename(target+'.sync.tmp',target);await fs.cp('.asset-backups/play-props-default',path.join(runtime,'.asset-backups/play-props-default'),{recursive:true});console.log('Saved grouped Play Prop Set.');
