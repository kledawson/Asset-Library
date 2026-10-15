import fs from 'node:fs/promises';
import { Matrix4 } from 'three';

const supportHeight = 0.126;
const visibleHeight = 0.114;
const hiddenOffset = (supportHeight - visibleHeight) / 2;

async function seat(sourcePath, candidatePath) {
  const bytes = await fs.readFile(sourcePath);
  const jsonSize = bytes.readUInt32LE(12);
  const json = JSON.parse(bytes.subarray(20, 20 + jsonSize));
  const supports = json.nodes.filter(node => /^Ramp_Rear_Support_/.test(node.name || ''));
  if (supports.length !== 2) throw Error(`Expected two rear ramp supports in ${sourcePath}`);
  const localAdjustment = new Matrix4().makeTranslation(0, hiddenOffset, 0)
    .multiply(new Matrix4().makeScale(1, visibleHeight / supportHeight, 1));
  for (const node of supports) {
    if (!node.matrix || Math.abs(node.matrix[5] - 1) > 0.0001) throw Error(`Unexpected transform for ${node.name}`);
    node.matrix = new Matrix4().fromArray(node.matrix).multiply(localAdjustment).toArray();
  }

  let encoded = Buffer.from(JSON.stringify(json));
  encoded = Buffer.concat([encoded, Buffer.alloc((4 - encoded.length % 4) % 4, 32)]);
  const binary = bytes.subarray(28 + jsonSize);
  const header = Buffer.from(bytes.subarray(0, 20));
  header.writeUInt32LE(28 + encoded.length + binary.length, 8);
  header.writeUInt32LE(encoded.length, 12);
  const binaryHeader = Buffer.alloc(8);
  binaryHeader.writeUInt32LE(binary.length, 0);
  binaryHeader.writeUInt32LE(0x004e4942, 4);
  await fs.mkdir('.asset-candidates/play-props', { recursive: true });
  await fs.writeFile(candidatePath, Buffer.concat([header, encoded, binaryHeader, binary]));
  console.log(`${candidatePath}: rear wood supports now end 1 mm inside the rubber feet`);
}

await seat('public/models/play-ramp.glb', '.asset-candidates/play-props/play-ramp-seated-feet.glb');
await seat('public/models/play-props.glb', '.asset-candidates/play-props/play-prop-set-seated-ramp-feet.glb');
