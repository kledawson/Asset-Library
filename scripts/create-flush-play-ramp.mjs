import fs from 'node:fs/promises';
import zlib from 'node:zlib';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { buildFlushRamp } from './flush-play-ramp.mjs';

globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then(result => { this.result = result; this.onloadend?.(); }); }
};
const candidate = '.asset-candidates/play-props/play-ramp-flush-deck.glb';
await fs.mkdir('.asset-candidates/play-props', { recursive: true });
const exported = Buffer.from(await new GLTFExporter().parseAsync(buildFlushRamp(), { binary: true }));
const jsonSize = exported.readUInt32LE(12);
const json = JSON.parse(exported.subarray(20, 20 + jsonSize));
let data = Buffer.from(exported.subarray(28 + jsonSize));

// Color lives in the surface texture. There are no raised grain meshes or
// normal-map ridges, so the wood remains smooth when viewed from the side.
const width = 512, height = 256;
const pixels = Buffer.alloc(width * height * 4);
for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
  const u = x / (width - 1), v = y / (height - 1);
  const bend = .038 * Math.sin(u * 7.5 + v * 4.2) + .014 * Math.sin(u * 23 - v * 8);
  const knot = Math.exp(-(((u - .38) / .085) ** 2 + ((v - .32) / .105) ** 2));
  const phase = (v + bend + .036 * knot * Math.sin((v - .32) * 27)) * 33;
  const tone = 3.6 * Math.sin(phase) + 1.35 * Math.sin(phase * 2.2 + u * 3)
    + .75 * Math.sin(v * 123 + u * 34) + 1.2 * Math.sin(u * 8 + v * 5) - knot * 4;
  const offset = (y * width + x) * 4;
  pixels[offset] = Math.round(214 + tone);
  pixels[offset + 1] = Math.round(170 + tone * .88);
  pixels[offset + 2] = Math.round(112 + tone * .68);
  pixels[offset + 3] = 255;
}
function crc(bytes) {
  let value = 0xffffffff;
  for (const byte of bytes) { value ^= byte; for (let i = 0; i < 8; i++) value = (value >>> 1) ^ ((value & 1) ? 0xedb88320 : 0); }
  return (value ^ 0xffffffff) >>> 0;
}
function chunk(type, body) {
  const tag = Buffer.from(type), result = Buffer.alloc(body.length + 12);
  result.writeUInt32BE(body.length); tag.copy(result, 4); body.copy(result, 8);
  result.writeUInt32BE(crc(Buffer.concat([tag, body])), body.length + 8);
  return result;
}
const header = Buffer.alloc(13);
header.writeUInt32BE(width); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = 6;
const rows = Buffer.alloc(height * (width * 4 + 1));
for (let y = 0; y < height; y++) pixels.copy(rows, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
const png = Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', header),
  chunk('IDAT', zlib.deflateSync(rows)), chunk('IEND', Buffer.alloc(0))]);
data = Buffer.concat([data, Buffer.alloc((4 - data.length % 4) % 4)]);
const imageOffset = data.length;
data = Buffer.concat([data, png, Buffer.alloc((4 - png.length % 4) % 4)]);
const viewIndex = json.bufferViews.push({ buffer: 0, byteOffset: imageOffset, byteLength: png.length }) - 1;
json.images ??= []; json.textures ??= []; json.samplers ??= [];
const sourceIndex = json.images.push({ bufferView: viewIndex, mimeType: 'image/png' }) - 1;
const samplerIndex = json.samplers.push({ magFilter: 9729, minFilter: 9729, wrapS: 33071, wrapT: 33071 }) - 1;
const textureIndex = json.textures.push({ sampler: samplerIndex, source: sourceIndex }) - 1;
const woodMaterial = json.materials.find(material => material.name === 'Play_wood');
woodMaterial.pbrMetallicRoughness.baseColorFactor = [1, 1, 1, 1];
woodMaterial.pbrMetallicRoughness.baseColorTexture = { index: textureIndex };
json.buffers[0].byteLength = data.length;
let jsonBytes = Buffer.from(JSON.stringify(json));
jsonBytes = Buffer.concat([jsonBytes, Buffer.alloc((4 - jsonBytes.length % 4) % 4, 32)]);
const glbHeader = Buffer.alloc(20), binHeader = Buffer.alloc(8);
glbHeader.write('glTF'); glbHeader.writeUInt32LE(2, 4); glbHeader.writeUInt32LE(28 + jsonBytes.length + data.length, 8);
glbHeader.writeUInt32LE(jsonBytes.length, 12); glbHeader.writeUInt32LE(0x4e4f534a, 16);
binHeader.writeUInt32LE(data.length); binHeader.writeUInt32LE(0x004e4942, 4);
await fs.writeFile(candidate, Buffer.concat([glbHeader, jsonBytes, binHeader, data]));
console.log(candidate);
