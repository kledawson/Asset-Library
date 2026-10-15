import fs from 'node:fs/promises';

// Change assembly transforms directly, preserving embedded materials/textures.
const bytes=await fs.readFile(process.argv[2]||'public/models/editor-sources/play-props.glb');
const oldLength=bytes.readUInt32LE(12),json=JSON.parse(bytes.subarray(20,20+oldLength));
const positions={
 'play-ramp':[-.24,0,-.23],
 'play-parcel-large':[.30,0,-.28],
 'play-parcel-small':[.33,0,.045],
 'play-cube':[-.04,0,.29],
 'play-coral-block':[-.49,0,-.17],
 'play-orange-block':[.48,0,.34],
 'play-wedge':[.24,0,.35],
 'play-ball':[-.40,0,.30],
};
// Exported saves may flatten the hierarchy, so translate each mesh's world pose.
function multiply(a,b){const o=Array(16).fill(0);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)o[c*4+r]+=a[k*4+r]*b[c*4+k];return o;}
const identity=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
const meshes=[];
function walk(index,parent,group){const node=json.nodes[index];const id=node.extras?.assetGroup||group;let local=node.matrix||identity.slice();if(!node.matrix&&node.translation){local=identity.slice();local[12]=node.translation[0];local[13]=node.translation[1];local[14]=node.translation[2];}
 // Hierarchical rotated props use glTF TRS; preserve them via Three's matrix composer.
 if(!node.matrix&&(node.rotation||node.scale)){throw Error('Use matrix export before rearranging this source.');}
 const world=multiply(parent,local);if(node.mesh!==undefined){if(!positions[id])throw Error('Unknown assembly group '+id);meshes.push({...node,extras:{...node.extras,assetGroup:id},matrix:world,children:undefined,translation:undefined,rotation:undefined,scale:undefined});}
 for(const child of node.children||[])walk(child,world,id);
}
for(const root of json.scenes[json.scene||0].nodes)walk(root,identity,null);
const bounds={};
for(const node of meshes){const id=node.extras.assetGroup;bounds[id]??={min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]};
 for(const primitive of json.meshes[node.mesh].primitives){const accessor=json.accessors[primitive.attributes.POSITION];for(let mask=0;mask<8;mask++){const point=accessor.min.map((v,i)=>(mask&(1<<i))?accessor.max[i]:v);for(let axis=0;axis<3;axis++){const value=node.matrix[axis]*point[0]+node.matrix[4+axis]*point[1]+node.matrix[8+axis]*point[2]+node.matrix[12+axis];bounds[id].min[axis]=Math.min(bounds[id].min[axis],value);bounds[id].max[axis]=Math.max(bounds[id].max[axis],value);}}}}
for(const node of meshes){const id=node.extras.assetGroup,b= bounds[id],target=positions[id];node.matrix[12]+=target[0]-(b.min[0]+b.max[0])/2;node.matrix[13]-=b.min[1];node.matrix[14]+=target[2]-(b.min[2]+b.max[2])/2;}
json.nodes=meshes;json.scenes=[{name:'Play Prop Set',nodes:meshes.map((_,i)=>i)}];json.scene=0;
let text=Buffer.from(JSON.stringify(json));text=Buffer.concat([text,Buffer.alloc((4-text.length%4)%4,32)]);
const tail=bytes.subarray(20+oldLength),header=Buffer.from(bytes.subarray(0,20));header.writeUInt32LE(20+text.length+tail.length,8);header.writeUInt32LE(text.length,12);
await fs.writeFile('.asset-candidates/play-props/play-prop-set-spaced.glb',Buffer.concat([header,text,tail]));
console.log('Created spaced Play Prop Set candidate with open room around the props.');
