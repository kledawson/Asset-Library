// Apply reviewed Pocket Post candidates through the same Save Model route as the UI.
import fs from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import rules from '../src/assetModelRules.js';
const folder='.asset-candidates/mail-package';
const {entries}=JSON.parse(await fs.readFile(folder+'/manifest.json','utf8'));
for(const {key}of entries){if(!rules.isMailKey(key))throw Error('Only Pocket Post candidates may be saved here.');}
for(const {key,name}of entries){
  execFileSync(process.execPath,['scripts/stage-asset.cjs',key,folder+'/'+name]);
  const snapshot=JSON.parse(await fs.readFile('public/models/asset-saves.json','utf8'));
  const linked=rules.linkedAssemblyKeys(key),revision=Date.now();
  for(const affected of [key,...linked])snapshot[affected]={...snapshot[affected],items:null,history:[snapshot[affected]?.items||null],pendingSource:false,sourceRevision:revision,revision,nextAvailable:false};
  const files=[{name,data:(await fs.readFile(folder+'/'+name)).toString('base64')}];
  for(const assembly of linked){const file=rules.modelFileName(assembly);files.push({name:file,data:(await fs.readFile('public/models/'+file)).toString('base64')});}
  const response=await fetch('http://127.0.0.1:3001/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key,files,snapshot})});
  if(!response.ok)throw Error('Save Model failed: '+key+' '+await response.text());console.log('Staged and saved '+key);
}
