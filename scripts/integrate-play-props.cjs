const fs=require('fs'),path=require('path');
const library=path.resolve(__dirname,'..'),desktop='C:/Users/dawso/OneDrive/Desktop/portfolio';
function edit(root,file,fn){const p=path.join(root,file);fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8')));}
const rules=fs.readFileSync(path.join(library,'src/assetModelRules.js'));
for(const root of [library,desktop]){
 fs.writeFileSync(path.join(root,'src/assetModelRules.js'),rules);
 if(root===desktop){fs.copyFileSync(path.join(library,'src/assetLibrary.js'),path.join(root,'src/assetLibrary.js'));
   let file=fs.readFileSync(path.join(library,'src/assetFiles.js'),'utf8').replace("import { hosted, hostedRequest } from './hostedStorage';\n",'').replace('  if(hosted) return hostedRequest(route,body);\n','');fs.writeFileSync(path.join(root,'src/assetFiles.js'),file);
 }
 edit(root,'src/savedModels.jsx',s=>{
  s="import modelRules from './assetModelRules.js';\n"+s;
  const start=s.indexOf("  if (!key.startsWith('tool-rack:')) for(const version");
  const end=s.indexOf('\n  await writeModelFiles',start);
  if(start<0||end<0)throw Error('Missing saved-model synchronization');
  return s.slice(0,start)+"  const assemblyKey=modelRules.linkedAssemblyKey(key);\n  if(assemblyKey) next[assemblyKey]={...models[assemblyKey],items:null,pendingSource:false,nextAvailable:false,sourceRevision:next[key].revision,revision:next[key].revision};"+s.slice(end);
 });
 edit(root,'src/AssetPreview.jsx',s=>{
  s=s.replace("import { assetLibrary, assetPackages }", "import { assetLibrary, assetPackages, isIndividualAsset }");
  s="import modelRules from './assetModelRules.js';\n"+s;
  s=s.replaceAll("modelKey.startsWith('tool-') && !modelKey.startsWith('tool-rack:')","isIndividualAsset(modelKey.split(':')[0])");
  s=s.replace("asset.id.startsWith('tool-') && asset.id !== 'tool-rack'",'isIndividualAsset(asset.id)');
  s=s.replaceAll("asset.id !== 'tool-rack' && asset.id.startsWith('tool-')",'isIndividualAsset(asset.id)');
  s=s.replace("      if (!item.id.startsWith('tool-')) continue;",'');
  s=s.replace("if(!editKey.startsWith('tool-rack:')){for(const v of ['final']){delete draftsRef.current[`tool-rack:${v}`];delete histories.current[`tool-rack:${v}`];}setSourceModels(current=>Object.fromEntries(Object.entries(current).filter(([key])=>!key.startsWith('tool-rack:'))));}","const linked=modelRules.linkedAssemblyKey(editKey);if(linked){delete draftsRef.current[linked];delete histories.current[linked];setSourceModels(current=>Object.fromEntries(Object.entries(current).filter(([key])=>key!==linked)));}");
  s=s.replaceAll("const affected=!editKey.startsWith('tool-rack:')?[editKey,...['final'].map(v=>`tool-rack:${v}`)]:[editKey]","const affected=[editKey,modelRules.linkedAssemblyKey(editKey)].filter(Boolean)");
  return s;
 });
 edit(root,'scripts/asset-save-server.cjs',s=>{
  s="const modelRules=require('../src/assetModelRules.js');\n"+s;
  s=s.replace(/^const allowed = .*;$/m,'const allowed = {test:modelRules.allowedFile};');
  const start=s.indexOf('  if (!/^(tool-plant');const end=s.indexOf('  const decoded =',start);
  if(start<0||end<0)throw Error('Missing server validation');
  s=s.slice(0,start)+`  let expected,linked;try {expected=modelRules.modelFileName(key||'');linked=modelRules.linkedAssemblyKey(key);}catch{return res.sendStatus(400);}
  const names=linked?[expected,modelRules.modelFileName(linked)]:[expected];
  if(!Array.isArray(files)||files.length!==names.length||files.some(file=>!names.includes(file.name))||names.some(name=>!files.some(file=>file.name===name)))return res.sendStatus(400);
`+s.slice(end);
  s=s.replace("if(!key.startsWith('tool-rack:')) for(const file of decoded.filter(file=>file.name.startsWith('workshop-tool-rack-')))","if(linked) for(const file of decoded.filter(file=>file.name===modelRules.modelFileName(linked)))");
  s=s.replace("  if (!/^(tool-[a-z]+):(high|medium|light|final)$/.test(key||'') || busy) return res.sendStatus(400);", "  try{modelRules.modelFileName(key||'');}catch{return res.sendStatus(400);}if(busy)return res.sendStatus(409);");
  s=s.replace("if(!key.startsWith('tool-rack:')&&file.name.startsWith('workshop-tool-rack-'))", "if(modelRules.linkedAssemblyKey(key)&&file.name===modelRules.modelFileName(modelRules.linkedAssemblyKey(key)))");
  s=s.replace("const keys=!key.startsWith('tool-rack:')?[key,...['final'].map(version=>`tool-rack:${version}`)]:[key]", "const keys=[key,modelRules.linkedAssemblyKey(key)].filter(Boolean)");return s;
 });
 edit(root,'scripts/stage-asset.cjs',s=>{
  s="const modelRules=require('../src/assetModelRules.js');\n"+s;
  s=s.replace(/^if\(!\/\^\(\(tool-.*$/m,"if(!candidate)throw Error('Supply an asset key and candidate GLB.');");
  s=s.replace(/^const name=key.startsWith.*$/m,'const name=modelRules.modelFileName(key);');return s;
 });
}
for(const file of fs.readdirSync(path.join(library,'public/models')).filter(name=>name.startsWith('play-'))){for(const folder of ['public/models','public/models/editor-sources'])fs.copyFileSync(path.join(library,folder,file),path.join(desktop,folder,file));}
console.log('Play Props integrated into the standalone library and local preview.');
