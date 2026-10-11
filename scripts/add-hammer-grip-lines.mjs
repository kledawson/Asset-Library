import fs from 'node:fs/promises';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

const source = await fs.readFile('public/models/editor-sources/workshop-hammer.glb');
const { scene } = await new GLTFLoader().parseAsync(source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength), '');

const oldLines = [];
scene.traverse(node => { if (/^Grip_Seam_/.test(node.name)) oldLines.push(node); });
oldLines.forEach(node => node.removeFromParent());
// Flush light brown marks on the salmon pads, without raised pale ridges.
const seam = new THREE.MeshStandardMaterial({ name: 'Brown Grip Detail', color: new THREE.Color('#765237').convertSRGBToLinear(), roughness: 1, metalness: 0 });
for (const [side, z] of [['Front', -0.0407], ['Back', -0.0893]]) {
  for (let row = 0; row < 6; row++) {
    const y = 0.596 + row * 0.019;
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.00085, 0.00015), seam);
    line.position.set(0.46, y, side === 'Front' ? -0.04095 : -0.08905);
    line.name = `Grip_Seam_${side}_${row + 1}`;
    scene.add(line);
  }
}

class FileReaderShim {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then(result => { this.result = result; this.onloadend?.(); }); }
  readAsDataURL(blob) { blob.arrayBuffer().then(result => { this.result = `data:${blob.type};base64,${Buffer.from(result).toString('base64')}`; this.onloadend?.(); }); }
}
globalThis.FileReader = FileReaderShim;
await fs.mkdir('.asset-candidates', { recursive: true });
await fs.writeFile('.asset-candidates/workshop-hammer-grip-lines.glb', Buffer.from(await new GLTFExporter().parseAsync(scene, { binary: true })));
