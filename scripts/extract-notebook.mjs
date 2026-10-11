import fs from 'node:fs/promises';
import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { mergeBufferGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const bytes=await fs.readFile('public/models/workshop-tool-rack-final.glb');
const {scene}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
scene.updateMatrixWorld(true);
const geometries=[];
scene.traverse(node=>{
  if(!node.isMesh || !node.name.startsWith('Refined_Notebook_'))return;
  const geometry=(node.geometry.index?node.geometry.toNonIndexed():node.geometry.clone()).applyMatrix4(node.matrixWorld);
  for(const name of Object.keys(geometry.attributes))if(!['position','normal'].includes(name))geometry.deleteAttribute(name);
  const colors=[];
  for(let i=0;i<geometry.attributes.position.count;i++)colors.push(...node.material.color.toArray());
  geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  geometries.push(geometry);
});
if(geometries.length!==10)throw Error('Expected the cover, two paper pieces, six rules, and binding (10 parts).');
const notebook=new T.Mesh(mergeBufferGeometries(geometries),new T.MeshStandardMaterial({vertexColors:true,roughness:.85}));
notebook.name='Notebook';
const model=new T.Group();model.add(notebook);
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();});}};
const output=Buffer.from(await new GLTFExporter().parseAsync(model,{binary:true}));
await fs.writeFile('.asset-candidates/workshop-notebook.glb',output);
for(const path of ['public/models/workshop-notebook.glb','public/models/editor-sources/workshop-notebook.glb']){
  try{await fs.writeFile(path,output,{flag:'wx'});}catch(error){if(error.code!=='EEXIST')throw error;}
}
