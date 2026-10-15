import { Group, Mesh, Vector3, Euler, Quaternion, Matrix4 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
import { seatRackHardware } from './rackHardware.mjs';
import { refineRackAppearance } from './rackRefinement.mjs';
import { hosted, hostedRequest } from './hostedStorage';
import { playSetURL } from './playSetStorage';
import modelRules from './assetModelRules.js';
import { applyMaterialColors } from './materialColors.mjs';

const loader = new GLTFLoader();
async function load(name) { return (await loader.loadAsync(`/models/editor-sources/${name}?v=${Date.now()}`)).scene; }
// Older rack bases accidentally included hammer decoration in frame meshes.
// Remove only those legacy triangles before assembling current individual props.
function removeLegacyHammerDetails(base) {
  base.updateMatrixWorld(true);
  base.traverse(node=>{
    if(!node.isMesh || !['darkWood','grain'].includes(node.material.name))return;
    const geometry=node.geometry.clone(),positions=geometry.attributes.position,index=geometry.index;
    const count=index?index.count:positions.count,kept=[];
    const point=new Vector3();
    for(let i=0;i<count;i+=3){
      const vertices=[0,1,2].map(offset=>index?index.getX(i+offset):i+offset);
      const legacy=vertices.every(vertex=>{
        point.fromBufferAttribute(positions,vertex).applyMatrix4(node.matrixWorld);
        return node.material.name==='darkWood'
          ? point.x>.433 && point.x<.481 && point.y>.599 && point.y<.689 && point.z>-.043 && point.z<-.037
          : point.x>.456 && point.x<.469 && point.y>.713 && point.y<.872 && point.z>-.049 && point.z<-.045;
      });
      if(!legacy)kept.push(...vertices);
    }
    geometry.setIndex(kept);node.geometry=geometry;
  });
  return base;
}
function build(source, items) {
  if (!items) return source.clone(true);
  const parts=[]; source.updateMatrixWorld(true);
  source.traverse(node=>{if(node.isMesh)parts.push(node);});
  const group=new Group();
  for(const item of items.filter(item=>!item.hidden)) {
    const node=parts[Number((item.sourceId||item.id).replace('part-',''))];
    if(!node)continue;
    const geometry=node.geometry.clone();
    if(!/Plant.Leaf|^Leaf[ _]/i.test(node.name)) {geometry.computeBoundingBox();const center=geometry.boundingBox.getCenter(new Vector3());geometry.translate(-center.x,-center.y,-center.z);}
    const mesh=new Mesh(geometry,applyMaterialColors(node.material,item.colorOverrides));mesh.name=item.name; mesh.userData={...node.userData,assetGroup:item.assetGroup||node.userData.assetGroup};
    mesh.position.fromArray(item.position);mesh.rotation.set(...item.rotation);mesh.scale.fromArray(item.scale);
    group.add(mesh);
  }
  return group;
}
function remapRack(full,bare,items) {
  if(!items)return null;
  const old=[];const next=[];full.traverse(n=>{if(n.isMesh)old.push(n);});bare.traverse(n=>{if(n.isMesh)next.push(n);});
  return items.flatMap(item=>{
    const source=old[Number((item.sourceId||item.id).replace('part-',''))];const i=next.findIndex(n=>n.name===source?.name);if(i<0)return [];
    source.geometry.computeBoundingBox();next[i].geometry.computeBoundingBox();
    const shift=next[i].geometry.boundingBox.getCenter(new Vector3()).sub(source.geometry.boundingBox.getCenter(new Vector3())).multiply(new Vector3(...item.scale)).applyQuaternion(new Quaternion().setFromEuler(new Euler(...item.rotation)));
    return [{...item,id:item.kind==='copy'?item.id:`part-${i}`,sourceId:`part-${i}`,position:new Vector3(...item.position).add(shift).toArray()}];
  });
}
async function encode(name,model) {
  model.updateMatrixWorld(true);
  const buffer=await new GLTFExporter().parseAsync(model,{binary:true});
  const bytes=new Uint8Array(buffer);let data='';
  for(let i=0;i<bytes.length;i+=32768)data+=String.fromCharCode(...bytes.subarray(i,i+32768));
  return {name,data:btoa(data)};
}
export async function writeModelFiles(key,items,models,snapshot) {
  const name=modelRules.modelFileName(key);
  const rackName='workshop-tool-rack-final.glb';
  const edited=build(await load(name),items);
  const files=[await encode(name,edited)];
  if (modelRules.isPlayKey(key)) {
    if (!key.startsWith('play-props:')) {
      const id=key.split(':')[0];
      const variant=modelRules.isPlayVariant(key)?key.split(':')[1]:null;
      const groupId=variant?`${id}-${variant}`:id;
      const source=await load(name);
      source.updateMatrixWorld(true);
      const sourceParts=[];source.traverse(node=>{if(node.isMesh)sourceParts.push(node);});
      const matchingSource=node=>sourceParts.find(part=>part.name===node.name)||sourceParts.find(part=>part.material.name===node.material.name&&part.geometry.attributes.position.count===node.geometry.attributes.position.count);
      for(const assemblyKey of modelRules.linkedAssemblyKeys(key)){
        const assemblyName=modelRules.modelFileName(assemblyKey);
        const assembly=(await loader.loadAsync(playSetURL(`/models/${assemblyName}?v=${Date.now()}`))).scene;
        assembly.updateMatrixWorld(true);
        let members=[];assembly.traverse(node=>{if(node.isMesh&&node.userData.assetGroup===groupId)members.push(node);});
        // Older sets had one parcel per size; preserve that save behavior until expanded.
        if(variant&&!members.length)assembly.traverse(node=>{if(node.isMesh&&node.userData.assetGroup===id)members.push(node);});
        const anchor=members.find(matchingSource);
        const part=edited.clone(true);
        part.traverse(node=>{if(node.isMesh)node.userData={...node.userData,assetGroup:groupId,...(variant?{assetVariant:variant}:{})};});
        if(anchor){
          const centered=node=>{node.geometry.computeBoundingBox();return node.matrixWorld.clone().multiply(new Matrix4().makeTranslation(...node.geometry.boundingBox.getCenter(new Vector3()).toArray()));};
          part.applyMatrix4(assembly.matrixWorld.clone().invert().multiply(centered(anchor)).multiply(centered(matchingSource(anchor)).invert()));
        }
        members.forEach(node=>node.removeFromParent());
        assembly.getObjectByName('Asset '+groupId)?.removeFromParent();
        part.name='Asset '+groupId;assembly.add(part);
        files.push(await encode(assemblyName,assembly));
      }
    }
    await request('/save',{key,files,snapshot});
    return;
  }
  if(key==='tool-pencil:high' || key==='tool-notebook:high') {
    const id=key==='tool-pencil:high'?'pencil':'notebook';
    const rack=(await loader.loadAsync(`/models/${rackName}?v=${Date.now()}`)).scene;
    const remove=[];
    rack.traverse(node=>{if(node.isMesh&&(node.name.startsWith(id==='pencil'?'Refined_Pencil_':'Refined_Notebook_')||node.name===(id==='pencil'?'Pencil':'Notebook')||node.userData.assetGroup===id))remove.push(node);});
    for(const node of remove)node.removeFromParent();
    const previous=rack.getObjectByName('Asset '+id)||rack.getObjectByName('Asset_'+id);
    if(previous)previous.removeFromParent();
    const part=edited.clone(true);
    part.name='Asset '+id;rack.add(part);
    files.push(await encode(rackName,rack));
  } else if(key.startsWith('tool-') && !key.startsWith('tool-rack:')) {
    const bare=refineRackAppearance(seatRackHardware(removeLegacyHammerDetails(await load('workshop-tool-rack-high-base.glb'))));
    const notebookParts=[];bare.traverse(node=>{if(node.isMesh&&node.name.startsWith('Refined_Notebook_'))notebookParts.push(node);});
    notebookParts.forEach(node=>node.removeFromParent());
    const full=await load(rackName);
    const rack=build(bare,remapRack(full,bare,models['tool-rack:final']?.items));
    for(const id of ['wrench','cog','hammer','screwdriver','triangle','plant','pencil','notebook']) {
      const part=key==='tool-'+id+':high'?build(await load('workshop-'+id+'.glb'),items):(await loader.loadAsync('/models/workshop-'+id+'.glb?v='+Date.now())).scene;
      part.name='Asset '+id;rack.add(part);
      if(id==='plant'){const second=part.clone(true);second.position.set(1.61,0,0.194);second.scale.setScalar(0.8);rack.add(second);}
    }
    files.push(await encode(rackName,rack));
  }
  await request('/save',{key,files,snapshot});
}
export async function restoreModelFiles(key,direction) { return request('/restore',{key,direction}); }
async function request(route,body) {
  if(hosted) return hostedRequest(route,body);
  let response;
  try {response=await fetch(`http://127.0.0.1:3001${route}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});}catch{throw Error('Start the local asset save service (npm run asset-server), then try again.');}
  if(!response.ok)throw Error((await response.json().catch(()=>({}))).error||'Unable to write model files.');
  return response.json();
}
