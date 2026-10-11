// Stage an AI/generated candidate without overwriting the approved model.
const fs=require('fs');const path=require('path');
const [key,candidate]=process.argv.slice(2);
if(!/^(tool-(plant|wrench|cog|hammer|screwdriver|triangle|pencil|notebook)):high$|^tool-rack:(light|medium|high|final)$/.test(key||'')||!candidate)throw Error('Usage: node scripts/stage-asset.cjs tool-triangle:high candidate.glb');
const root=process.env.ASSET_MODEL_ROOT||path.resolve(__dirname,'../public/models');
const name=key.startsWith('tool-rack:')?`workshop-tool-rack-${key.split(':')[1]}.glb`:`workshop-${key.split(':')[0].slice(5)}.glb`;
const data=fs.readFileSync(candidate);if(data.length<12||data.toString('ascii',0,4)!=='glTF'||data.readUInt32LE(8)!==data.length)throw Error('Invalid GLB');
const stateFile=path.join(root,'asset-saves.json');const state=JSON.parse(fs.readFileSync(stateFile,'utf8'));
const pending=path.join(process.env.ASSET_PENDING_ROOT||path.resolve(__dirname,'../.asset-pending'),key.replace(':','-'));fs.mkdirSync(pending,{recursive:true});
if(!state[key]?.pendingSource){fs.copyFileSync(path.join(root,'editor-sources',name),path.join(pending,'source.glb'));fs.writeFileSync(path.join(pending,'previous.json'),JSON.stringify(state));}
fs.writeFileSync(path.join(root,'editor-sources',name),data);
state[key]={...state[key],pendingSource:true,sourceRevision:Date.now(),revision:Date.now()};fs.writeFileSync(stateFile,JSON.stringify(state));
console.log('Candidate staged. Open this asset and click Save Model to apply it.');
