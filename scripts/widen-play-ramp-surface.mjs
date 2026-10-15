import fs from 'node:fs/promises';

const halfWidthBefore = 0.127;
const halfWidthAfter = 0.138;
const scale = halfWidthAfter / halfWidthBefore;

async function widen(sourcePath, candidatePath) {
  const bytes = await fs.readFile(sourcePath);
  const jsonSize = bytes.readUInt32LE(12);
  const json = JSON.parse(bytes.subarray(20, 20 + jsonSize));
  const surface = json.nodes.find(node => node.name === 'Ramp_Driving_Surface');
  if (!surface || surface.mesh === undefined) throw Error(`Ramp driving surface missing from ${sourcePath}`);
  const primitives = json.meshes[surface.mesh].primitives;
  if (primitives.length !== 1) throw Error('Unexpected driving surface geometry');
  const accessor = json.accessors[primitives[0].attributes.POSITION];
  const view = json.bufferViews[accessor.bufferView];
  if (accessor.componentType !== 5126 || accessor.type !== 'VEC3') throw Error('Unexpected driving surface position format');
  if (Math.abs(accessor.min[0] + halfWidthBefore) > 0.0001 || Math.abs(accessor.max[0] - halfWidthBefore) > 0.0001) throw Error('Ramp width changed; inspect before widening again');

  const binary = Buffer.from(bytes.subarray(28 + jsonSize));
  const stride = view.byteStride || 12;
  const first = (view.byteOffset || 0) + (accessor.byteOffset || 0);
  for (let index = 0; index < accessor.count; index++) {
    const offset = first + index * stride;
    binary.writeFloatLE(binary.readFloatLE(offset) * scale, offset);
  }
  accessor.min[0] = -halfWidthAfter;
  accessor.max[0] = halfWidthAfter;

  let encoded = Buffer.from(JSON.stringify(json));
  encoded = Buffer.concat([encoded, Buffer.alloc((4 - encoded.length % 4) % 4, 32)]);
  const header = Buffer.from(bytes.subarray(0, 20));
  header.writeUInt32LE(28 + encoded.length + binary.length, 8);
  header.writeUInt32LE(encoded.length, 12);
  const binaryHeader = Buffer.alloc(8);
  binaryHeader.writeUInt32LE(binary.length, 0);
  binaryHeader.writeUInt32LE(0x004e4942, 4);
  await fs.mkdir('.asset-candidates/play-props', { recursive: true });
  await fs.writeFile(candidatePath, Buffer.concat([header, encoded, binaryHeader, binary]));
  console.log(`${candidatePath}: driving surface now extends 7 mm beneath each rail`);
}

await widen('public/models/play-ramp.glb', '.asset-candidates/play-props/play-ramp-wider-surface.glb');
await widen('public/models/play-props.glb', '.asset-candidates/play-props/play-prop-set-wider-ramp.glb');
