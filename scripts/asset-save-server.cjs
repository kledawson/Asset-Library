const modelRules=require('../src/assetModelRules.js');
const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const app = express();
const root = process.env.ASSET_MODEL_ROOT || path.resolve(__dirname, '../public/models');
const backups = process.env.ASSET_BACKUP_ROOT || path.resolve(__dirname, '../.asset-backups');
const allowed = {test:modelRules.allowedFile};
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && !/^http:\/\/(localhost|127\.0\.0\.1):(3000|3002)$/.test(origin)) return res.sendStatus(403);
  if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
// The assembled set must be read from the same storage that receives saves.
app.get('/models/:name', async (req,res) => {
  if(!allowed.test(req.params.name)) return res.sendStatus(400);
  try { res.set('Cache-Control','no-store'); res.type('model/gltf-binary').send(await fs.readFile(path.join(root,req.params.name))); }
  catch { res.sendStatus(404); }
});
app.get('/models/editor-sources/:name', async (req,res) => {
  if(!allowed.test(req.params.name)) return res.sendStatus(400);
  try { res.set('Cache-Control','no-store'); res.type('model/gltf-binary').send(await fs.readFile(path.join(root,'editor-sources',req.params.name))); }
  catch { res.sendStatus(404); }
});
async function historyAvailable(folder) {
  try {
    const manifest=JSON.parse(await fs.readFile(path.join(folder,'manifest.json'),'utf8'));
    if(!Array.isArray(manifest.files)||!manifest.files.length||manifest.files.some(name=>!allowed.test(name)))return false;
    const names=[...manifest.files,...(manifest.allSources?manifest.files.map(name=>'source-'+name):[]),...(manifest.sourceBackup?['editor-source.glb']:[])];
    await Promise.all(names.map(name=>fs.access(path.join(folder,name))));
    return true;
  } catch { return false; }
}
app.get('/history/:key', async (req,res) => {
  try { modelRules.modelFileName(req.params.key); } catch { return res.sendStatus(400); }
  const folder=path.join(backups,req.params.key.replace(':','-'));
  res.set('Cache-Control','no-store').json({previous:await historyAvailable(folder),next:await historyAvailable(path.join(folder,'next'))});
});
app.use(express.json({ limit: '40mb' }));
let busy = false;
const validVector = (value, positive = false) => Array.isArray(value) && value.length === 3 && value.every(number => Number.isFinite(number) && Math.abs(number) <= 100 && (!positive || number > 0));
const validTransform = value => value && validVector(value.position) && validVector(value.rotation) && validVector(value.scale, true);
app.post('/workbench-layout', async (req, res) => {
  const layout = req.body;
  if (!layout || layout.version !== 1 || !validTransform(layout.root) || !layout.parts || typeof layout.parts !== 'object' || Array.isArray(layout.parts) || !Array.isArray(layout.copies) || layout.copies.length > 100) return res.sendStatus(400);
  if (Object.entries(layout.parts).some(([id, value]) => !/^part-[A-Za-z0-9_-]+$/.test(id) || !validTransform(value) || typeof value.hidden !== 'boolean')) return res.sendStatus(400);
  if (layout.assets && (typeof layout.assets !== 'object' || Array.isArray(layout.assets) || Object.entries(layout.assets).some(([id,value]) => !/^asset-[A-Za-z0-9_-]+$/.test(id) || !validTransform(value) || typeof value.hidden !== 'boolean'))) return res.sendStatus(400);
  if (layout.copies.some(copy => !/^copy-[A-Za-z0-9_-]+$/.test(copy.id) || !/^(part|asset)-[A-Za-z0-9_-]+$/.test(copy.sourceId) || !validTransform(copy) || (copy.kind && !['asset','element'].includes(copy.kind)))) return res.sendStatus(400);
  try {
    const destination = path.join(root, 'workbench-layout.json');
    const previous = await fs.readFile(destination).catch(() => null);
    if (previous) { await fs.mkdir(backups, { recursive: true }); await fs.writeFile(path.join(backups, 'workbench-layout.json'), previous); }
    const next = { ...layout, revision: Date.now() };
    await fs.writeFile(destination + '.tmp', JSON.stringify(next));
    await fs.rename(destination + '.tmp', destination);
    res.json(next);
  } catch { res.status(500).json({ error: 'Could not save the workbench layout.' }); }
});
app.post('/workbench-layout/restore', async (req, res) => {
  try {
    const previous = JSON.parse(await fs.readFile(path.join(backups, 'workbench-layout.json'), 'utf8'));
    const destination = path.join(root, 'workbench-layout.json');
    const current = await fs.readFile(destination);
    const restored = { ...previous, revision: Date.now() };
    await fs.writeFile(destination + '.tmp', JSON.stringify(restored));
    await fs.rename(destination + '.tmp', destination);
    await fs.writeFile(path.join(backups, 'workbench-layout.json'), current);
    res.json(restored);
  } catch { res.status(404).json({ error: 'No previous workbench layout is available.' }); }
});
app.post('/save', async (req, res) => {
  if (busy) return res.status(409).json({ error: 'A save is already running.' });
  const { key, files, snapshot } = req.body;
  let expected,linkedKeys;try {expected=modelRules.modelFileName(key||'');linkedKeys=modelRules.linkedAssemblyKeys(key);}catch{return res.sendStatus(400);}
  const linkedNames=linkedKeys.map(modelRules.modelFileName);
  const names=[expected,...linkedNames];
  if(!Array.isArray(files)||files.length!==names.length||files.some(file=>!names.includes(file.name))||names.some(name=>!files.some(file=>file.name===name)))return res.sendStatus(400);
  const decoded = files.map(file=>({name:file.name, data:Buffer.from(file.data,'base64')}));
  if (new Set(files.map(file=>file.name)).size!==files.length || decoded.some(file=>file.data.length<12 || file.data.toString('ascii',0,4)!=='glTF' || file.data.readUInt32LE(4)!==2 || file.data.readUInt32LE(8)!==file.data.length)) return res.sendStatus(400);
  busy = true;
  const folder = path.join(backups, key.replace(':','-'));
  const previous = [];
  try {
    await fs.mkdir(folder,{recursive:true});
    for (const file of decoded) previous.push({name:file.name,data:await fs.readFile(path.join(root,file.name))});
    for (const file of previous) await fs.writeFile(path.join(folder,file.name),file.data);
    let previousSnapshot=JSON.parse(await fs.readFile(path.join(root,'asset-saves.json'),'utf8').catch(()=>'{}'));
    let sourceBackup=false;
    if(previousSnapshot[key]?.pendingSource){
      const pending=path.join(process.env.ASSET_PENDING_ROOT||path.resolve(__dirname,'../.asset-pending'),key.replace(':','-'));
      const old=JSON.parse(await fs.readFile(path.join(pending,'previous.json'),'utf8'));
      previousSnapshot[key]=old[key]||{items:null};
      await fs.copyFile(path.join(pending,'source.glb'),path.join(folder,'editor-source.glb'));sourceBackup=true;
    }
    await fs.writeFile(path.join(folder,'manifest.json'),JSON.stringify({files:files.map(file=>file.name),snapshot:previousSnapshot,sourceBackup,sourceName:expected}));
    for (const file of decoded) await fs.writeFile(path.join(root,file.name),file.data);
    for(const file of decoded.filter(file=>linkedNames.includes(file.name))) await fs.writeFile(path.join(root,'editor-sources',file.name),file.data);
    await fs.writeFile(path.join(root,'asset-saves.json'),JSON.stringify(snapshot));
    res.json({ok:true});
  } catch (error) {
    console.error('Asset save failed:', error.message);
    for (const file of previous) await fs.writeFile(path.join(root,file.name),file.data).catch(()=>{});
    res.status(500).json({error:'Could not save model files.'});
  } finally { busy=false; }
});
app.post('/restore', async(req,res)=>{
  const {key,direction}=req.body;
  const forward=direction==='next';
  try{modelRules.modelFileName(key||'');}catch{return res.sendStatus(400);}if(busy)return res.sendStatus(409);
  busy=true;
  try {
    const baseFolder=path.join(backups,key.replace(':','-'));
    const folder=forward?path.join(baseFolder,'next'):baseFolder;
    const manifest=JSON.parse(await fs.readFile(path.join(folder,'manifest.json'),'utf8'));
    const permitted=manifest.files.filter(name=>key.startsWith('tool-rack:') || !/^workshop-tool-rack-(light|medium|high)\.glb$/.test(name));
    const files=await Promise.all(permitted.map(async name=>{if(!allowed.test(name))throw Error();return {name,data:await fs.readFile(path.join(folder,name))};}));
    // Preserve the current saved files and editor sources before stepping back.
    if(!forward){
      const nextFolder=path.join(baseFolder,'next');await fs.mkdir(nextFolder,{recursive:true});
      const currentSnapshot=JSON.parse(await fs.readFile(path.join(root,'asset-saves.json'),'utf8'));
      for(const name of permitted){await fs.copyFile(path.join(root,name),path.join(nextFolder,name));await fs.copyFile(path.join(root,'editor-sources',name),path.join(nextFolder,'source-'+name));}
      await fs.writeFile(path.join(nextFolder,'manifest.json'),JSON.stringify({files:permitted,snapshot:currentSnapshot,allSources:true}));
    }
    const linkedNames=modelRules.linkedAssemblyKeys(key).map(modelRules.modelFileName);
    for(const file of files){await fs.writeFile(path.join(root,file.name),file.data);if(linkedNames.includes(file.name))await fs.writeFile(path.join(root,'editor-sources',file.name),file.data);}
    // Older backups predate saved-transform snapshots. Use their geometry as
    // the new editor baseline instead of replaying unrelated old transforms.
    if(!manifest.snapshot)for(const file of files)await fs.writeFile(path.join(root,'editor-sources',file.name),file.data);
    if(manifest.allSources)for(const name of permitted)await fs.copyFile(path.join(folder,'source-'+name),path.join(root,'editor-sources',name));
    if(manifest.sourceBackup)await fs.copyFile(path.join(folder,'editor-source.glb'),path.join(root,'editor-sources',manifest.sourceName));
    const snapshot=JSON.parse(await fs.readFile(path.join(root,'asset-saves.json'),'utf8').catch(()=>'{}'));
    const keys=[key,...modelRules.linkedAssemblyKeys(key)];
    for(const affected of keys)snapshot[affected]={...(manifest.snapshot?.[affected]||{items:null}),history:forward?(manifest.snapshot?.[affected]?.history||[null]):[],nextAvailable:!forward,revision:Date.now(),sourceRevision:Date.now()};
    await fs.writeFile(path.join(root,'asset-saves.json'),JSON.stringify(snapshot));
    res.json({ok:true,snapshot});
  }catch(error){console.error('Asset restore failed:',error.message);res.status(error.code==='ENOENT'?404:500).json({error:error.code==='ENOENT'?'That backup is not available on this computer.':'Could not restore backup files.'});}finally{busy=false;}
});
app.listen(Number(process.env.ASSET_SAVE_PORT)||3001,'127.0.0.1',()=>console.log('Asset save service ready'));
