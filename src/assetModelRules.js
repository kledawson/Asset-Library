const playIds=['ramp','parcel-large','parcel-small','cube','coral-block','orange-block','wedge','ball'];
const colorVersions={'parcel-small':['coral','yellow','teal'],'parcel-large':['coral','yellow','teal'],'coral-block':['coral','yellow','teal'],'orange-block':['coral','orange','teal'],wedge:['coral','yellow','teal'],ball:['coral','yellow','teal']};
function isParcelVariant(key){return /^play-parcel-(small|large):(coral|yellow|teal)$/.test(key);}
function isPlayVariant(key){const [asset,color]=key.split(':');return asset.startsWith('play-')&&!!colorVersions[asset.slice(5)]?.includes(color);}
function isPlayKey(key){return isPlayVariant(key)||/^play-props:(default|organized)$/.test(key)||playIds.some(id=>key===`play-${id}:default`);}
function modelFileName(key){
  if(key==='play-props:organized')return 'play-props-organized.glb';
  if(isPlayVariant(key))return key.replace(':','-')+'.glb';
  if(isPlayKey(key))return key.split(':')[0]+'.glb';
  if(/^tool-rack:(light|medium|high|final)$/.test(key))return `workshop-tool-rack-${key.split(':')[1]}.glb`;
  if(/^tool-(plant|wrench|cog|hammer|screwdriver|triangle|pencil|notebook):high$/.test(key))return `workshop-${key.split(':')[0].slice(5)}.glb`;
  throw Error('Unknown asset key.');
}
function linkedAssemblyKeys(key){if(isPlayKey(key))return key.startsWith('play-props:')?[]:['play-props:default','play-props:organized'];return key.startsWith('tool-rack:')?[]:['tool-rack:final'];}
function linkedAssemblyKey(key){return linkedAssemblyKeys(key)[0]||null;}
function allowedFile(name){return Object.entries(colorVersions).some(([id,colors])=>colors.some(color=>name===`play-${id}-${color}.glb`))||/^(workshop-(plant|wrench|cog|hammer|screwdriver|triangle|pencil|notebook)|workshop-tool-rack-(light|medium|high|final))\.glb$/.test(name)||/^play-props(?:-organized)?\.glb$/.test(name)||playIds.some(id=>name===`play-${id}.glb`);}
module.exports={playIds,colorVersions,isPlayKey,isParcelVariant,isPlayVariant,modelFileName,linkedAssemblyKey,linkedAssemblyKeys,allowedFile};
