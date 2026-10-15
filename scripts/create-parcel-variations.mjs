import * as T from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';
import fs from 'node:fs/promises';
const palette={coral:'#da7858',yellow:'#dda644',teal:'#458d92'};
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();});}};
for(const size of ['small','large'])for(const [color,hex] of Object.entries(palette)){
 const id='play-parcel-'+size,name=id+'-'+color+'.glb';
 if(await fs.stat('public/models/'+name).then(()=>true,()=>false))throw Error('Existing variant must be staged: '+name);
 const bytes=await fs.readFile('public/models/editor-sources/'+id+'.glb');
 const {scene}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 const material=new T.MeshStandardMaterial({name:'Parcel_'+color,color:new T.Color(hex).convertSRGBToLinear(),roughness:.72,metalness:.08});
 const remove=[];let label;
 scene.traverse(node=>{if(!node.isMesh)return;if(node.name.startsWith('Parcel_Tape'))node.material=material;if(node.name==='Parcel_Paper_Label')label=node;if(node.name.startsWith('Parcel_Label_')&&node.name!=='Parcel_Paper_Label')remove.push(node);});
 remove.forEach(node=>node.removeFromParent());
 const extent=size==='small'?.021:.029;let geometry;
 if(color==='coral')geometry=new RoundedBoxGeometry(extent,extent,.0008,2,.0005);
 if(color==='yellow')geometry=new T.CircleGeometry(extent*.52,32);
 if(color==='teal'){const shape=new T.Shape();shape.moveTo(-extent*.54,-extent*.52);shape.lineTo(extent*.54,-extent*.52);shape.lineTo(0,extent*.52);shape.closePath();geometry=new T.ExtrudeGeometry(shape,{depth:.0008,bevelEnabled:false});}
 const symbol=new T.Mesh(geometry,new T.MeshStandardMaterial({name:'Parcel_Black_Ink',color:0x242822,roughness:.83}));symbol.name='Parcel_Label_'+({coral:'Square',yellow:'Circle',teal:'Triangle'}[color]);symbol.position.copy(label.position);symbol.quaternion.copy(label.quaternion);symbol.position.z+=.0016;symbol.userData.assetGroup=id;scene.add(symbol);
 const output=Buffer.from(await new GLTFExporter().parseAsync(scene,{binary:true}));
 await fs.writeFile('public/models/'+name,output);await fs.writeFile('public/models/editor-sources/'+name,output);
 console.log(size+' '+color+': '+symbol.name+' ('+output.length+' bytes)');
}
