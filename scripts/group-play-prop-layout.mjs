import fs from 'node:fs/promises';
import { Matrix4,Vector3,Box3 } from 'three';
const bytes=await fs.readFile('public/models/play-props.glb'),size=bytes.readUInt32LE(12),j=JSON.parse(bytes.subarray(20,20+size)),bin=bytes.subarray(28+size);
// Keep the approved ramp, cube, and parcel formation. Cluster related props
// loosely, leaving breathing room and only small variations in orientation.
const layout={
  'play-coral-block-coral':[-.64,-.070,0],
  'play-coral-block-yellow':[-.54,-.090,.055],
  'play-coral-block-teal':[-.44,-.045,-.035],
  'play-orange-block-orange':[-.37,.66,null],
  'play-orange-block-coral':[-.215,.71,.10],
  'play-orange-block-teal':[-.06,.72,-.08],
  'play-wedge-teal':null,
  'play-wedge-coral':[.125,.56,-.16],
  'play-wedge-yellow':[.350,.585,.18],
  'play-ball-yellow':[-.235,.270,null],
  'play-ball-coral':[-.475,.270,null],
  'play-ball-teal':[-.36,.47,null],
};
const groups=new Map();
for(const index of j.scenes[j.scene||0].nodes){const n=j.nodes[index];if(n.mesh===undefined)continue;const id=n.extras?.assetGroup;if(!id)throw Error('Missing item group');if(!groups.has(id))groups.set(id,[]);groups.get(id).push(n);}
function bounds(nodes){const b=new Box3();for(const n of nodes){const m=new Matrix4().fromArray(n.matrix);for(const p of j.meshes[n.mesh].primitives){const a=j.accessors[p.attributes.POSITION];b.union(new Box3(new Vector3(...a.min),new Vector3(...a.max)).applyMatrix4(m));}}return b;}
for(const [id,pose]of Object.entries(layout)){
  if(process.argv.includes('--wedges-only')&&!['play-wedge-coral','play-wedge-yellow'].includes(id))continue;
  if(process.argv.includes('--chunky-only')&&!id.startsWith('play-orange-block-'))continue;
  if(!pose)continue;const nodes=groups.get(id);if(!nodes)throw Error('Missing '+id);const b=bounds(nodes),center=b.getCenter(new Vector3()),anchor=nodes[0].matrix,currentAngle=Math.atan2(anchor[8],anchor[0]);
  const [x,z,angle]=pose,delta=(angle??currentAngle)-currentAngle;
  const movement=new Matrix4().makeTranslation(x,b.min.y,z).multiply(new Matrix4().makeRotationY(delta)).multiply(new Matrix4().makeTranslation(-center.x,-b.min.y,-center.z));
  for(const node of nodes)node.matrix=movement.clone().multiply(new Matrix4().fromArray(node.matrix)).toArray();
}
const report=[...groups].map(([id,nodes])=>{const b=bounds(nodes);return{id,min:b.min.toArray(),max:b.max.toArray()};});
for(let i=0;i<report.length;i++)for(let k=i+1;k<report.length;k++){const a=report[i],b=report[k],dx=Math.min(a.max[0],b.max[0])-Math.max(a.min[0],b.min[0]),dz=Math.min(a.max[2],b.max[2])-Math.max(a.min[2],b.min[2]);if(dx>.001&&dz>.001)throw Error('Props overlap: '+a.id+' '+b.id);}
let json=Buffer.from(JSON.stringify(j));json=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,32)]);const header=Buffer.from(bytes.subarray(0,20)),binHeader=Buffer.alloc(8);header.writeUInt32LE(28+json.length+bin.length,8);header.writeUInt32LE(json.length,12);binHeader.writeUInt32LE(bin.length);binHeader.writeUInt32LE(0x004e4942,4);
await fs.writeFile('.asset-candidates/play-props/play-prop-set-grouped.glb',Buffer.concat([header,json,binHeader,bin]));await fs.writeFile('.asset-candidates/play-props/grouped-layout.json',JSON.stringify(report,null,2));console.log('Twenty props grouped by type; clear footprints; ramp, cube, and parcel matrices retained.');
