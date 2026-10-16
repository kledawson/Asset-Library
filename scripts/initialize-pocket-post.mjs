// First registration only. Later model revisions must be staged and saved.
import fs from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
const folder='.asset-candidates/mail-package';
const {entries}=JSON.parse(await fs.readFile(folder+'/manifest.json','utf8'));
for(const {name} of entries)for(const prefix of ['','editor-sources/'])if(await fs.stat('public/models/'+prefix+name).then(()=>true,()=>false))throw Error('Pocket Post already exists; stage subsequent changes individually: '+name);
let snapshot=JSON.parse(await fs.readFile('public/models/asset-saves.json','utf8'));
for(const {key,name} of entries){for(const prefix of ['','editor-sources/'])await fs.copyFile(folder+'/'+name,'public/models/'+prefix+name);snapshot[key]={items:null,history:[],revision:0,sourceRevision:0,pendingSource:false};}
await fs.writeFile('public/models/asset-saves.json',JSON.stringify(snapshot));
for(const {key,name} of entries){
  execFileSync(process.execPath,['scripts/stage-asset.cjs',key,folder+'/'+name]);
  snapshot=JSON.parse(await fs.readFile('public/models/asset-saves.json','utf8'));
  const keys=key.startsWith('pocket-post:')?[key]:[key,'pocket-post:default','pocket-post:organized'];
  const revision=Date.now();for(const affected of keys)snapshot[affected]={...snapshot[affected],items:null,history:[snapshot[affected]?.items||null],pendingSource:false,sourceRevision:revision,revision,nextAvailable:false};
  const names=key.startsWith('pocket-post:')?[name]:[name,'pocket-post.glb','pocket-post-organized.glb'];
  const files=[];for(const file of names)files.push({name:file,data:(await fs.readFile(file===name?folder+'/'+file:'public/models/'+file)).toString('base64')});
  const response=await fetch('http://127.0.0.1:3001/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key,files,snapshot})});
  if(!response.ok)throw Error('Save Model failed for '+key+': '+await response.text());console.log('Staged and saved '+key);
}
const catalog=JSON.parse(await fs.readFile('catalog/assets.json','utf8'));
const names={mailbox:'Parcel Mailbox','hand-truck':'Mail Trolley',scale:'Parcel Scale','tape-dispenser':'Tape Dispenser',sack:'Mail Sack','dispatch-bin':'Dispatch Bin'};
catalog.packages.push({id:'mail-package',name:'Pocket Post',assetIds:['pocket-post',...Object.keys(names).map(id=>'mail-'+id)]});
catalog.assets.push({id:'pocket-post',name:'Pocket Post Set',kind:'assembly',noAll:true,versions:[['default','Loose','pocket-post.glb'],['organized','Organized','pocket-post-organized.glb']].map(([id,label,name])=>({id,label,model:'public/models/'+name,source:'public/models/editor-sources/'+name}))},...Object.entries(names).map(([id,name])=>({id:'mail-'+id,name,kind:'individual',versions:[{id:'default',label:'Default',model:'public/models/mail-'+id+'.glb',source:'public/models/editor-sources/mail-'+id+'.glb'}]})));
catalog.updatedAt=new Date().toISOString();await fs.writeFile('catalog/assets.json',JSON.stringify(catalog,null,2)+'\n');
console.log('Registered six props and two layouts. Existing parcels and releases were preserved.');
