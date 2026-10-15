import fs from 'node:fs/promises';

const source = 'public/models/play-ramp.glb';
const destination = '.asset-candidates/play-props/play-ramp-no-rear-side-pins.glb';
const glb = await fs.readFile(source);
const jsonLength = glb.readUInt32LE(12);
const json = JSON.parse(glb.subarray(20, 20 + jsonLength));
const removed = json.nodes.map((node, index) =>
  /^Ramp_Side_Pin_(?:Face_|Slot_)?(?:Left|Right)_Leg$/.test(node.name || '') ? index : -1
).filter(index => index >= 0);
if (removed.length !== 6) throw Error(`Expected the two rear side fasteners (six components); found ${removed.length}`);

const excluded = new Set(removed);
const remap = new Map();
const nodes = json.nodes.filter((_, index) => !excluded.has(index));
json.nodes.forEach((_, index) => {
  if (!excluded.has(index)) remap.set(index, index - removed.filter(removedIndex => removedIndex < index).length);
});
for (const node of nodes) {
  if (node.children) node.children = node.children.filter(index => !excluded.has(index)).map(index => remap.get(index));
}
for (const scene of json.scenes) scene.nodes = scene.nodes.filter(index => !excluded.has(index)).map(index => remap.get(index));
json.nodes = nodes;

const top = nodes.filter(node => /^Ramp_Brass_Bolt_(?:Left|Right)_(?:Rear|Front)$/.test(node.name || '')).length;
const sides = nodes.filter(node => /^Ramp_Side_Pin_(?:Left|Right)_(?:Brace|Lower_Brace)$/.test(node.name || '')).length;
if (top !== 4 || sides !== 4) throw Error(`Unexpected screw counts: ${top} top, ${sides} side`);

let encoded = Buffer.from(JSON.stringify(json));
encoded = Buffer.concat([encoded, Buffer.alloc((4 - encoded.length % 4) % 4, 32)]);
const binary = glb.subarray(28 + jsonLength, 28 + jsonLength + glb.readUInt32LE(20 + jsonLength));
const header = Buffer.alloc(20), binHeader = Buffer.alloc(8);
header.write('glTF');
header.writeUInt32LE(2, 4);
header.writeUInt32LE(28 + encoded.length + binary.length, 8);
header.writeUInt32LE(encoded.length, 12);
header.writeUInt32LE(0x4e4f534a, 16);
binHeader.writeUInt32LE(binary.length, 0);
binHeader.writeUInt32LE(0x004e4942, 4);
await fs.writeFile(destination, Buffer.concat([header, encoded, binHeader, binary]));
console.log(`Staged ramp candidate with ${top} top and ${sides} side screws at ${destination}`);
