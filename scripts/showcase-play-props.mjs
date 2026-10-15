import fs from 'node:fs/promises';
import path from 'node:path';
import { Matrix4, Quaternion, Vector3, Box3 } from 'three';

// Assemble approved exports directly, preserving their embedded resources.
const root = process.argv[2] || 'public/models';
const loosePoses = [
  ['play-ramp', -.24, -.23, 0],
  ['play-parcel-large-yellow', .30, -.28, 0],
  ['play-parcel-large-coral', .49, -.34, .08],
  ['play-parcel-large-teal', .75, -.20, -.10],
  ['play-parcel-small-yellow', .33, .045, 0],
  ['play-parcel-small-coral', .44, .085, .12],
  ['play-parcel-small-teal', .70, .17, -.12],
  ['play-cube', -.04, .29, 0],
  ['play-coral-block-coral', -.49, -.17, 0],
  ['play-coral-block-yellow', -.52, -.10, .10],
  ['play-coral-block-teal', -.68, .18, -.16],
  ['play-orange-block-orange', .48, .34, 0],
  ['play-orange-block-coral', -.49, .38, .18],
  ['play-orange-block-teal', -.43, .57, -.13],
  ['play-wedge-teal', .20, .42, 0],
  ['play-wedge-coral', -.63, -.39, .10],
  ['play-wedge-yellow', -.38, -.42, -.11],
  ['play-ball-yellow', -.40, .30, 0],
  ['play-ball-coral', -.13, -.52, 0],
  ['play-ball-teal', .08, -.57, 0],
];
const organized = process.argv.includes('--organized');
// Back to front: parcels, mixed props, wooden blocks, then wedges and balls.
// All angles are zero so the collection reads as a tidy display.
const organizedPoses = [
  ['play-parcel-large-coral', -.48, -.52, 0],
  ['play-parcel-large-yellow', 0, -.52, 0],
  ['play-parcel-large-teal', .48, -.52, 0],
  ['play-ramp', -.68, -.16, 0],
  ['play-parcel-small-coral', -.25, -.16, 0],
  ['play-parcel-small-yellow', .04, -.16, 0],
  ['play-parcel-small-teal', .33, -.16, 0],
  ['play-cube', .68, -.16, 0],
  ['play-coral-block-coral', -.58, .17, 0],
  ['play-coral-block-yellow', -.37, .17, 0],
  ['play-coral-block-teal', -.16, .17, 0],
  ['play-orange-block-coral', .18, .17, 0],
  ['play-orange-block-orange', .40, .17, 0],
  ['play-orange-block-teal', .62, .17, 0],
  ['play-wedge-coral', -.57, .50, 0],
  ['play-wedge-yellow', -.30, .50, 0],
  ['play-wedge-teal', -.03, .50, 0],
  ['play-ball-coral', .28, .50, 0],
  ['play-ball-yellow', .51, .50, 0],
  ['play-ball-teal', .74, .50, 0],
];
const poses = organized ? organizedPoses : loosePoses;
const originalBytes = await fs.readFile(path.join(root, 'play-props.glb'));
const original = JSON.parse(originalBytes.subarray(20,20 + originalBytes.readUInt32LE(12)));
const oldParts = [];
function localMatrix(node) {
  return node.matrix ? new Matrix4().fromArray(node.matrix) : new Matrix4().compose(new Vector3().fromArray(node.translation || [0,0,0]), new Quaternion().fromArray(node.rotation || [0,0,0,1]), new Vector3().fromArray(node.scale || [1,1,1]));
}
function collectOriginal(index, parent, inherited) {
  const node = original.nodes[index], world = parent.clone().multiply(localMatrix(node));
  const group = node.extras?.assetGroup || inherited;
  if (node.mesh !== undefined) oldParts.push({ node, world, group });
  for (const child of node.children || []) collectOriginal(child, world, group);
}
for (const index of original.scenes[original.scene || 0].nodes) collectOriginal(index,new Matrix4());
const preserved = { 'play-parcel-large-yellow':'play-parcel-large', 'play-parcel-small-yellow':'play-parcel-small','play-coral-block-coral':'play-coral-block','play-orange-block-orange':'play-orange-block','play-wedge-teal':'play-wedge','play-ball-yellow':'play-ball' };
const out = { asset: { version: '2.0', generator: 'Asset Library Play Props showcase' }, scene: 0,
  scenes: [{ name: 'Play Prop Set', nodes: [] }], nodes: [], meshes: [], materials: [],
  accessors: [], bufferViews: [], images: [], textures: [], samplers: [], buffers: [] };
const chunks = [], report = [];
let byteOffset = 0;
for (const [id, x, z, angle] of poses) {
  const sourceFile = process.argv.includes('--ramp-side-pin-candidate') && id === 'play-ramp'
    ? path.join('.asset-candidates/play-props/play-ramp-no-rear-side-pins.glb')
    : process.argv.includes('--ramp-candidate') && id === 'play-ramp'
    ? path.join('.asset-candidates/play-props/play-ramp-flush-deck.glb')
    : process.argv.includes('--approved-decal-candidates') && /^play-parcel-(small|large)-(teal|yellow)$/.test(id)
    ? path.join('.asset-candidates/parcels/approved-decals',id+'.glb')
    : process.argv.includes('--refined-care-candidates') && /^play-parcel-(small|large)-(teal|yellow)$/.test(id)
    ? path.join('.asset-candidates/parcels/refined-care',id+'.glb')
    : process.argv.includes('--block-candidates') && /^play-(coral-block|orange-block)-(coral|yellow|teal|orange)$/.test(id)
    ? path.join('.asset-candidates/play-props/color-variants',id+'.glb')
    : process.argv.includes('--chunky-candidates') && /^play-orange-block-(coral|orange|teal)$/.test(id)
    ? path.join('.asset-candidates/play-props/color-variants',id+'.glb')
    : process.argv.includes('--color-prop-candidates') && /^play-(coral-block|orange-block|wedge|ball)-(coral|yellow|teal|orange)$/.test(id)
    ? path.join('.asset-candidates/play-props/color-variants',id+'.glb')
    : process.argv.includes('--large-bottom-mark-candidates') && /^play-parcel-large-(coral|yellow|teal)$/.test(id)
    ? path.join('.asset-candidates/parcels/recycling',id+'.glb')
    : process.argv.includes('--recycling-candidates') && /^play-parcel-(small|large)-(coral|yellow|teal)$/.test(id)
    ? path.join('.asset-candidates/parcels/recycling',id+'.glb')
    : process.argv.includes('--teal-care-candidates') && /^play-parcel-(small|large)-teal$/.test(id)
    ? path.join('.asset-candidates/parcels/care-stamps',id+'.glb')
    : process.argv.includes('--care-stamp-candidates') && /^play-parcel-(small|large)-(coral|teal)$/.test(id)
    ? path.join('.asset-candidates/parcels/care-stamps',id+'.glb')
    : process.argv.includes('--postage-label-candidates') && /^play-parcel-(small|large)-(coral|yellow|teal)$/.test(id)
    ? path.join('.asset-candidates/parcels/postage-edges',id+'.glb')
    : process.argv.includes('--small-label-candidates') && /^play-parcel-small-(coral|yellow|teal)$/.test(id)
    ? path.join('.asset-candidates/parcels/seated-small-labels',id+'.glb')
    : process.argv.includes('--symmetric-parcel-candidates') && /^play-parcel-(small|large)-(coral|yellow|teal)$/.test(id)
    ? path.join('.asset-candidates/parcels/symmetric-wraps-side-labels',id+'.glb')
    : process.argv.includes('--wide-parcel-candidates') && id.startsWith('play-parcel-large-')
      ? path.join('.asset-candidates/parcels/wide-double-wrap',id+'.glb') : path.join(root,id+'.glb');
  const bytes = await fs.readFile(sourceFile);
  const length = bytes.readUInt32LE(12), source = JSON.parse(bytes.subarray(20, 20 + length));
  const bin = bytes.subarray(28 + length);
  const offsets = Object.fromEntries(['meshes','materials','accessors','bufferViews','images','textures','samplers'].map(key => [key, out[key].length]));
  const remapTextureInfo = value => {
    if (!value || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value)) {
      if (key.toLowerCase().includes('texture') && child && typeof child.index === 'number') child.index += offsets.textures;
      else if (child && typeof child === 'object') remapTextureInfo(child);
    }
  };
  for (const view of source.bufferViews || []) out.bufferViews.push({ ...view, buffer: 0, byteOffset: byteOffset + (view.byteOffset || 0) });
  for (const accessor of source.accessors || []) {
    const copy = structuredClone(accessor);
    if (copy.bufferView !== undefined) copy.bufferView += offsets.bufferViews;
    if (copy.sparse) { copy.sparse.indices.bufferView += offsets.bufferViews; copy.sparse.values.bufferView += offsets.bufferViews; }
    out.accessors.push(copy);
  }
  for (const image of source.images || []) out.images.push({ ...image, ...(image.bufferView === undefined ? {} : { bufferView: image.bufferView + offsets.bufferViews }) });
  out.samplers.push(...(source.samplers || []));
  for (const texture of source.textures || []) out.textures.push({ ...texture,
    ...(texture.source === undefined ? {} : { source: texture.source + offsets.images }),
    ...(texture.sampler === undefined ? {} : { sampler: texture.sampler + offsets.samplers }) });
  for (const material of source.materials || []) { const copy = structuredClone(material); remapTextureInfo(copy); out.materials.push(copy); }
  for (const mesh of source.meshes || []) {
    const copy = structuredClone(mesh);
    for (const primitive of copy.primitives) {
      primitive.attributes = Object.fromEntries(Object.entries(primitive.attributes).map(([key, value]) => [key, value + offsets.accessors]));
      if (primitive.indices !== undefined) primitive.indices += offsets.accessors;
      if (primitive.material !== undefined) primitive.material += offsets.materials;
    }
    out.meshes.push(copy);
  }
  const flat = [], bounds = new Box3();
  function walk(index, parent) {
    const node = source.nodes[index];
    const local = node.matrix ? new Matrix4().fromArray(node.matrix) : new Matrix4().compose(new Vector3().fromArray(node.translation || [0,0,0]), new Quaternion().fromArray(node.rotation || [0,0,0,1]), new Vector3().fromArray(node.scale || [1,1,1]));
    const world = parent.clone().multiply(local);
    if (node.mesh !== undefined) {
      flat.push({ node, world });
      for (const primitive of source.meshes[node.mesh].primitives) {
        const accessor = source.accessors[primitive.attributes.POSITION];
        for (let mask = 0; mask < 8; mask++) bounds.expandByPoint(new Vector3(...accessor.min.map((v, axis) => mask & (1 << axis) ? accessor.max[axis] : v)).applyMatrix4(world));
      }
    }
    for (const child of node.children || []) walk(child, world);
  }
  for (const node of source.scenes[source.scene || 0].nodes) walk(node, new Matrix4());
  const center = bounds.getCenter(new Vector3());
  let placement = new Matrix4().makeTranslation(x, 0, z).multiply(new Matrix4().makeRotationY(angle)).multiply(new Matrix4().makeTranslation(-center.x, -bounds.min.y, -center.z));
  const oldGroup = oldParts.some(part => part.group === id) ? id : preserved[id] || (!id.match(/parcel-.*-(coral|teal)$/) ? id : null);
  const legacyName=name=>name?.replace('Wedge_Teal_Body','Wedge_Body').replace('Ball_Yellow_Surface','Ball_Surface');
  const matches = (item, part) => legacyName(item.node.name) === legacyName(part.node.name) || part.node.name?.startsWith(item.node.name + '_');
  const anchor = oldGroup && oldParts.find(part => part.group === oldGroup && flat.some(item => matches(item,part)));
  if (anchor && !organized) {
    const sourceAnchor = flat.find(item => item.node.name === anchor.node.name) || flat.find(item => matches(item,anchor));
    const centered = (entry, document) => {
      const accessor = document.accessors[document.meshes[entry.node.mesh].primitives[0].attributes.POSITION];
      const geometryCenter = accessor.min.map((value,axis) => (value+accessor.max[axis])/2);
      return entry.world.clone().multiply(new Matrix4().makeTranslation(...geometryCenter));
    };
    placement = centered(anchor,original).multiply(centered(sourceAnchor,source).invert());
    if (id === 'play-wedge' && !oldParts.some(part => part.group === 'play-parcel-large-teal')) placement.premultiply(new Matrix4().makeTranslation(.04,0,.12));
    if (process.argv.includes('--wide-parcel-candidates') && id === 'play-parcel-large-coral') placement.premultiply(new Matrix4().makeTranslation(0,0,-.025));
    if (process.argv.includes('--wide-parcel-candidates') && id === 'play-parcel-large-teal') placement.premultiply(new Matrix4().makeTranslation(.04,0,0));
  }
  if (process.argv.includes('--ramp-candidate') && id === 'play-ramp') {
    const oldBounds = new Box3();
    for (const part of oldParts.filter(part => part.group === id)) {
      for (const primitive of original.meshes[part.node.mesh].primitives) {
        const accessor = original.accessors[primitive.attributes.POSITION];
        oldBounds.union(new Box3(new Vector3(...accessor.min), new Vector3(...accessor.max)).applyMatrix4(part.world));
      }
    }
    const oldCenter = oldBounds.getCenter(new Vector3());
    placement = new Matrix4().makeTranslation(oldCenter.x - center.x, oldBounds.min.y - bounds.min.y, oldCenter.z - center.z);
  }
  if(process.argv.includes('--display-cube-front') && id==='play-cube'){
    placement.premultiply(new Matrix4().makeTranslation(.52,0,.50));
  }
  if(id.startsWith('play-orange-block-')){
    if(process.argv.includes('--space-chunky-from-balls'))placement.premultiply(new Matrix4().makeTranslation(0,0,.045));
    const bottom=bounds.clone().applyMatrix4(placement).min.y;
    if(Math.abs(bottom)>1e-6)placement.premultiply(new Matrix4().makeTranslation(0,-bottom,0));
  }
  const variant = id.match(/-(coral|yellow|teal|orange)$/)?.[1];
  const placedBounds = new Box3();
  for (const { node, world } of flat) {
    const matrix = placement.clone().multiply(world);
    const copy = { ...node, mesh: node.mesh + offsets.meshes, matrix: matrix.toArray(), extras: { ...node.extras, assetGroup: id, ...(variant ? { assetVariant: variant } : {}) } };
    for (const key of ['translation','rotation','scale','children']) delete copy[key];
    out.scenes[0].nodes.push(out.nodes.length); out.nodes.push(copy);
  }
  for (let mask = 0; mask < 8; mask++) placedBounds.expandByPoint(new Vector3(...bounds.min.toArray().map((v, axis) => mask & (1 << axis) ? bounds.max.toArray()[axis] : v)).applyMatrix4(placement));
  report.push({ id, min: placedBounds.min.toArray(), max: placedBounds.max.toArray() });
  chunks.push(bin); byteOffset += bin.length;
  for (const key of ['extensionsUsed','extensionsRequired']) if (source[key]) out[key] = [...new Set([...(out[key] || []), ...source[key]])];
}
out.buffers = [{ byteLength: byteOffset }];
let json = Buffer.from(JSON.stringify(out)); json = Buffer.concat([json, Buffer.alloc((4 - json.length % 4) % 4, 32)]);
const bin = Buffer.concat(chunks), header = Buffer.alloc(20), binHeader = Buffer.alloc(8);
header.write('glTF'); header.writeUInt32LE(2,4); header.writeUInt32LE(28 + json.length + bin.length,8); header.writeUInt32LE(json.length,12); header.writeUInt32LE(0x4e4f534a,16);
binHeader.writeUInt32LE(bin.length); binHeader.writeUInt32LE(0x004e4942,4);
await fs.mkdir('.asset-candidates/play-props', { recursive: true });
await fs.writeFile(`.asset-candidates/play-props/play-prop-set-${organized?'organized':'showcase'}.glb`, Buffer.concat([header,json,binHeader,bin]));
await fs.writeFile(`.asset-candidates/play-props/${organized?'organized':'showcase'}-layout.json`, JSON.stringify(report,null,2));
console.log(`Created showcase candidate with ${poses.length} individually grouped props.`);
for (const item of report) console.log(item.id, item.min.map(v=>v.toFixed(3)).join(','), item.max.map(v=>v.toFixed(3)).join(','));
