import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { Vector3, Euler } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Exercise the actual browser save/export implementation and the actual save
// service against an isolated copy of the model library.
const require = createRequire(import.meta.url);
let moduleSource = await fs.readFile('src/assetFiles.js', 'utf8');
moduleSource = moduleSource.replace("from './rackHardware.mjs'", `from '${pathToFileURL(path.resolve('src/rackHardware.mjs')).href}'`);
moduleSource = moduleSource.replace("from './rackRefinement.mjs'", `from '${pathToFileURL(path.resolve('src/rackRefinement.mjs')).href}'`);
for (const name of ['three', 'three/examples/jsm/loaders/GLTFLoader', 'three/examples/jsm/exporters/GLTFExporter']) {
  moduleSource = moduleSource.replace(`from '${name}'`, `from '${pathToFileURL(require.resolve(name === 'three' ? name : name + '.js')).href}'`);
}
const { writeModelFiles } = await import('data:text/javascript;base64,' + Buffer.from(moduleSource).toString('base64'));
const ids = ['wrench', 'cog', 'hammer', 'screwdriver', 'triangle', 'plant'];
const root = path.resolve('.asset-candidates/individual-sync-test/models');
await fs.mkdir(path.join(root, 'editor-sources'), { recursive: true });
const names = [...ids.map(id => `workshop-${id}.glb`), 'workshop-tool-rack-final.glb'];
for (const name of [...names, 'workshop-tool-rack-high-base.glb']) {
  const source = await fs.readFile(path.join('public/models/editor-sources', name));
  await fs.writeFile(path.join(root, 'editor-sources', name), source);
  if (names.includes(name)) await fs.copyFile(path.join('public/models', name), path.join(root, name));
}
await fs.writeFile(path.join(root, 'asset-saves.json'), '{}');
const child = spawn(process.execPath, ['scripts/asset-save-server.cjs'], {
  env: { ...process.env, ASSET_MODEL_ROOT: root, ASSET_BACKUP_ROOT: path.join(root, '../backups'), ASSET_PENDING_ROOT: path.join(root, '../pending'), ASSET_SAVE_PORT: '3003' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
const originalLoad = GLTFLoader.prototype.loadAsync;
const originalFetch = globalThis.fetch;
GLTFLoader.prototype.loadAsync = async function(url) {
  const bytes = await fs.readFile(path.join(root, url.replace(/^\/models\//, '').split('?')[0]));
  return this.parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
};
globalThis.fetch = (url, options) => originalFetch(url.replace('127.0.0.1:3001', '127.0.0.1:3003'), options);
globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then(result => { this.result = result; this.onloadend?.(); }); }
  readAsDataURL(blob) { blob.arrayBuffer().then(result => { this.result = `data:${blob.type};base64,${Buffer.from(result).toString('base64')}`; this.onloadend?.(); }); }
};
const loader = new GLTFLoader();
const meshes = scene => { const result = []; scene.updateMatrixWorld(true); scene.traverse(node => { if (node.isMesh) result.push(node); }); return result; };
function fingerprint(scene) {
  return meshes(scene).map(node => {
    const positions = node.geometry.attributes.position.array;
    return { vertices: createHash('sha256').update(Buffer.from(positions.buffer, positions.byteOffset, positions.byteLength)).digest('hex'), matrix: node.matrixWorld.elements.map(value => Number(value.toFixed(8))), color: node.material.color.toArray(), roughness: node.material.roughness, metalness: node.material.metalness };
  });
}
try {
  await new Promise((resolve, reject) => { child.stdout.once('data', resolve); child.once('error', reject); child.once('exit', code => reject(Error('Service exited: ' + code))); });
  for (const id of ids) {
    const others = new Map(await Promise.all(ids.filter(other => other !== id).map(async other => [other, fingerprint((await loader.loadAsync(`/models/workshop-${other}.glb`)).scene)])));
    const source = (await loader.loadAsync(`/models/editor-sources/workshop-${id}.glb`)).scene;
    const items = meshes(source).map((node, index) => {
      const position = new Vector3(), quaternion = node.quaternion.clone(), scale = new Vector3();
      node.matrixWorld.decompose(position, quaternion, scale);
      if (!/Plant.Leaf|^Leaf[ _]/i.test(node.name)) { node.geometry.computeBoundingBox(); position.add(node.geometry.boundingBox.getCenter(new Vector3()).multiply(scale).applyQuaternion(quaternion)); }
      const rotation = new Euler().setFromQuaternion(quaternion);
      return { id: `part-${index}`, sourceId: `part-${index}`, kind: 'base', name: node.name, position: position.toArray(), rotation: [rotation.x, rotation.y, rotation.z], scale: scale.toArray() };
    });
    items[0].position[1] += 0.004;
    items[0].scale[0] *= 1.03;
    const key = `tool-${id}:high`;
    await writeModelFiles(key, items, {}, { [key]: { items, revision: Date.now() }, 'tool-rack:final': { items: null, revision: Date.now() } });
    const individual = (await loader.loadAsync(`/models/workshop-${id}.glb`)).scene;
    const rack = (await loader.loadAsync('/models/workshop-tool-rack-final.glb')).scene;
    for(const mesh of meshes(rack.getObjectByName('Pocket_Workshop_Tool_Rack'))) {
      if(mesh.material.name!=='darkWood')continue;
      const positions=mesh.geometry.attributes.position,index=mesh.geometry.index;
      for(let vertex=0;vertex<(index?index.count:positions.count);vertex++) {
        const point=new Vector3().fromBufferAttribute(positions,index?index.getX(vertex):vertex).applyMatrix4(mesh.matrixWorld);
        assert.ok(!(point.x>.433&&point.x<.481&&point.y>.599&&point.y<.689&&point.z>-.043&&point.z<-.037),`${id}: legacy hammer lines must not remain in the frame`);
      }
    }
    assert.deepEqual(fingerprint(rack.getObjectByName(`Asset_${id}`)), fingerprint(individual), `${id}: rack must exactly match exported individual`);
    for (const [other, before] of others) assert.deepEqual(fingerprint(rack.getObjectByName(`Asset_${other}`)), before, `${id}: preserve ${other}`);
    assert.deepEqual(await fs.readFile(path.join(root, 'workshop-tool-rack-final.glb')), await fs.readFile(path.join(root, 'editor-sources/workshop-tool-rack-final.glb')));
    console.log(`PASS ${id}: edited geometry, transform and material match Final; other individuals preserved.`);
  }
  const missingRack = await originalFetch('http://127.0.0.1:3003/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'tool-cog:high', files: [{ name: 'workshop-cog.glb', data: (await fs.readFile(path.join(root, 'workshop-cog.glb'))).toString('base64') }], snapshot: {} }) });
  assert.equal(missingRack.status, 400);
  console.log('PASS individual saves cannot omit Final. Live models unchanged by this test.');
} finally {
  child.kill();
  GLTFLoader.prototype.loadAsync = originalLoad;
  globalThis.fetch = originalFetch;
}
