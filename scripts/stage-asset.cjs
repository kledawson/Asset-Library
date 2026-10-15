const modelRules=require('../src/assetModelRules.js');
// Stage an AI/generated candidate without overwriting the approved model.
const fs=require('fs');const path=require('path');
const [key,candidate]=process.argv.slice(2);
if(!candidate)throw Error('Supply an asset key and candidate GLB.');
const root=process.env.ASSET_MODEL_ROOT||path.resolve(__dirname,'../public/models');
const name=modelRules.modelFileName(key);
const data=fs.readFileSync(candidate);if(data.length<12||data.toString('ascii',0,4)!=='glTF'||data.readUInt32LE(8)!==data.length)throw Error('Invalid GLB');
const stateFile=path.join(root,'asset-saves.json');const state=JSON.parse(fs.readFileSync(stateFile,'utf8'));
const pending=path.join(process.env.ASSET_PENDING_ROOT||path.resolve(__dirname,'../.asset-pending'),key.replace(':','-'));fs.mkdirSync(pending,{recursive:true});
if(!state[key]?.pendingSource){fs.copyFileSync(path.join(root,'editor-sources',name),path.join(pending,'source.glb'));fs.writeFileSync(path.join(pending,'previous.json'),JSON.stringify(state));}
fs.writeFileSync(path.join(root,'editor-sources',name),data);
state[key]={...state[key],pendingSource:true,sourceRevision:Date.now(),revision:Date.now()};
// Replace metadata atomically so file watchers/OneDrive do not hold the write target.
const temporary=stateFile+'.stage-'+process.pid+'.tmp';fs.writeFileSync(temporary,JSON.stringify(state));
for(let attempt=0;;attempt++){
  try{fs.renameSync(temporary,stateFile);break;}
  catch(error){if(!['EPERM','EBUSY','EACCES'].includes(error.code)||attempt>=20)throw error;Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,100);}
}
console.log('Candidate staged. Open this asset and click Save Model to apply it.');
