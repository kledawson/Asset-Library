const fs=require('fs'),path=require('path');
const T=require('three');
const state=JSON.parse(fs.readFileSync('public/models/asset-saves.json'));
const items=structuredClone(state['tool-rack:final'].items);
const bytes=fs.readFileSync('public/models/editor-sources/workshop-tool-rack-final.glb'),jsonLength=bytes.readUInt32LE(12),j=JSON.parse(bytes.subarray(20,20+jsonLength));
const bin=bytes.subarray(28+jsonLength,28+jsonLength+bytes.readUInt32LE(20+jsonLength)),chunks=[bin];let length=bin.length;
const templateNode=j.nodes.find(n=>n.name==='Driver_Hook'),templatePrimitive=j.meshes[templateNode.mesh].primitives[0],templateAccessor=j.accessors[templatePrimitive.attributes.POSITION];
for(const node of j.nodes.filter(n=>/^Wrench_Hook(?:_2)?$/.test(n.name))){
  const primitive=j.meshes[node.mesh].primitives[0],source=j.accessors[primitive.attributes.POSITION],view=j.bufferViews[templateAccessor.bufferView];
  const positions=new Float32Array(templateAccessor.count*3);
  for(let i=0;i<templateAccessor.count;i++)for(let c=0;c<3;c++)positions[i*3+c]=bin.readFloatLE((view.byteOffset||0)+(templateAccessor.byteOffset||0)+i*(view.byteStride||12)+c*4);
  // The first 216 vertices are the complete circular cylinder, including both
  // faces. Copy the intact driver hook rather than shifting half a disc.
  const mountVertices=Array.from({length:216},(_,i)=>i);
  const front=Math.max(...mountVertices.map(i=>positions[i*3+1]))+node.matrix[14],shift=-.134-front;
  for(const i of mountVertices)positions[i*3+1]+=shift;
  const data=Buffer.from(positions.buffer),bufferView=j.bufferViews.push({buffer:0,byteOffset:length,byteLength:data.length,target:34962})-1;chunks.push(data);length+=data.length;
  const accessor={...templateAccessor,bufferView,byteOffset:0,min:[0,1,2].map(c=>Math.min(...Array.from({length:templateAccessor.count},(_,i)=>positions[i*3+c]))),max:[0,1,2].map(c=>Math.max(...Array.from({length:templateAccessor.count},(_,i)=>positions[i*3+c])))};
  primitive.attributes={...templatePrimitive.attributes};if(templatePrimitive.indices!==undefined)primitive.indices=templatePrimitive.indices;else delete primitive.indices;
  primitive.attributes.POSITION=j.accessors.push(accessor)-1;
  const item=items?.find(item=>item.name===node.name);
  if(item){const delta=new T.Vector3(...accessor.min).add(new T.Vector3(...accessor.max)).multiplyScalar(.5).sub(new T.Vector3(...source.min).add(new T.Vector3(...source.max)).multiplyScalar(.5));delta.multiply(new T.Vector3(...item.scale)).applyEuler(new T.Euler(...item.rotation));item.position=new T.Vector3(...item.position).add(delta).toArray();}
  console.log(node.name+': circular base seated against actual plank face');
}
j.buffers[0].byteLength=length;let json=Buffer.from(JSON.stringify(j));json=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,32)]);const binary=Buffer.concat(chunks),header=Buffer.alloc(20),binHeader=Buffer.alloc(8);header.write('glTF');header.writeUInt32LE(2,4);header.writeUInt32LE(28+json.length+binary.length,8);header.writeUInt32LE(json.length,12);header.writeUInt32LE(0x4e4f534a,16);binHeader.writeUInt32LE(binary.length);binHeader.writeUInt32LE(0x004e4942,4);
fs.mkdirSync('.asset-candidates',{recursive:true});const candidate='.asset-candidates/workshop-rack-wrench-mounts.glb';fs.writeFileSync(candidate,Buffer.concat([header,json,binHeader,binary]));
// Retain the restored editor state, including its removed corner screws.
fs.writeFileSync('.asset-candidates/workshop-rack-wrench-mounts-items.json',JSON.stringify(items));
if(items){
  const parts=[];function visit(index){const node=j.nodes[index];if(node.mesh!==undefined)parts.push(index);(node.children||[]).forEach(visit);}(j.scenes[j.scene||0].nodes||[]).forEach(visit);
  const exportJson=structuredClone(j),visible=[];
  for(const item of items.filter(item=>!item.hidden)){
    const sourceNode=j.nodes[parts[Number((item.sourceId||item.id).replace('part-',''))]];if(!sourceNode)throw Error('Missing saved part '+item.name);
    const node=structuredClone(sourceNode),a=j.accessors[j.meshes[node.mesh].primitives[0].attributes.POSITION];
    const center=new T.Vector3(...a.min).add(new T.Vector3(...a.max)).multiplyScalar(.5);
    if(/Plant.Leaf|^Leaf[ _]/i.test(node.name))center.set(0,0,0);
    node.matrix=new T.Matrix4().compose(new T.Vector3(...item.position),new T.Quaternion().setFromEuler(new T.Euler(...item.rotation)),new T.Vector3(...item.scale)).multiply(new T.Matrix4().makeTranslation(-center.x,-center.y,-center.z)).toArray();
    delete node.children;delete node.translation;delete node.rotation;delete node.scale;node.name=item.name;visible.push(exportJson.nodes.push(node)-1);
  }
  exportJson.scenes=[{nodes:visible}];exportJson.scene=0;let output=Buffer.from(JSON.stringify(exportJson));output=Buffer.concat([output,Buffer.alloc((4-output.length%4)%4,32)]);const exportHeader=Buffer.from(header);exportHeader.writeUInt32LE(28+output.length+binary.length,8);exportHeader.writeUInt32LE(output.length,12);fs.writeFileSync('.asset-candidates/workshop-rack-wrench-mounts-export.glb',Buffer.concat([exportHeader,output,binHeader,binary]));
}
require('child_process').execFileSync(process.execPath,['scripts/stage-asset.cjs','tool-rack:final',path.resolve(candidate)],{stdio:'inherit'});
