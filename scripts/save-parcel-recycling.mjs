import fs from 'node:fs/promises';
import path from 'node:path';
const assembly=await fs.readFile('.asset-candidates/play-props/play-prop-set-showcase.glb');
const keys=[];
const careStamps=process.argv.includes('--care-stamps');
const refinedCare=process.argv.includes('--refined-care');
const approvedDecals=process.argv.includes('--approved-decals');
const candidateFolder=approvedDecals?'approved-decals':refinedCare?'refined-care':careStamps?'care-stamps':'recycling';
for(const size of (process.argv.includes('--small-only')?['small']:process.argv.includes('--large-only')?['large']:['small','large']))for(const color of (process.argv.includes('--teal-only')?['teal']:approvedDecals||refinedCare?['yellow','teal']:careStamps?['coral','teal']:['coral','yellow','teal'])){
  const key=`play-parcel-${size}:${color}`,name=`play-parcel-${size}-${color}.glb`;
  const state=JSON.parse(await fs.readFile('public/models/asset-saves.json','utf8')),old=state[key],revision=Date.now();
  const snapshot={...state,[key]:{...old,items:null,pendingSource:false,revision,history:[old.items||null],nextAvailable:false},'play-props:default':{...state['play-props:default'],items:null,pendingSource:false,revision,sourceRevision:revision,nextAvailable:false}};
  const response=await fetch('http://127.0.0.1:3001/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key,snapshot,files:[{name,data:(await fs.readFile('.asset-candidates/parcels/'+candidateFolder+'/'+name)).toString('base64')},{name:'play-props.glb',data:assembly.toString('base64')}]})});
  if(!response.ok)throw Error(await response.text());keys.push(key);console.log('Saved '+key);
}
const runtime='C:/Users/dawso/OneDrive/Desktop/portfolio';
const backup=path.join(runtime,'.asset-backups','recycling-runtime-sync-'+Date.now());await fs.mkdir(backup,{recursive:true});
for(const name of [...keys.map(k=>k.replace(':','-')+'.glb'),'play-props.glb'])for(const prefix of ['','editor-sources/']){
  const target=path.join(runtime,'public/models',prefix,name);await fs.mkdir(path.join(backup,prefix),{recursive:true});await fs.copyFile(target,path.join(backup,prefix,name)).catch(()=>{});await fs.copyFile('public/models/'+prefix+name,target);
}
const state=JSON.parse(await fs.readFile('public/models/asset-saves.json','utf8')),runtimeState=JSON.parse(await fs.readFile(path.join(runtime,'public/models/asset-saves.json'),'utf8'));
for(const key of [...keys,'play-props:default'])runtimeState[key]=state[key];
const target=path.join(runtime,'public/models/asset-saves.json');await fs.writeFile(target+'.sync.tmp',JSON.stringify(runtimeState));await fs.rename(target+'.sync.tmp',target);
for(const key of keys)await fs.cp('.asset-backups/'+key.replace(':','-'),path.join(runtime,'.asset-backups',key.replace(':','-')),{recursive:true});
