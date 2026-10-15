const fs = require('fs'), vm = require('vm'), assert = require('assert/strict');
let stored, modifier, blobCount = 0;
const records = {
  'tool-wrench:high': { items: null, history: [null], revision: 1 },
  'tool-pencil:high': { items: null, history: [null], revision: 1 },
  'tool-rack:final': { items: null, history: [null], revision: 1 },
};
const database = { transaction() {
  const tx = { objectStore() { return {
    get() { const request = {}; setImmediate(() => { request.result = stored; request.onsuccess(); }); return request; },
    put(value) { stored = structuredClone(value); setImmediate(() => tx.oncomplete()); },
  }; } }; return tx;
} };
const context = vm.createContext({
  URL: class extends URL { static createObjectURL() { return 'blob:test-' + (++blobCount); } static revokeObjectURL() {} },
  Blob, Uint8Array, atob, Date, Error, Object, Promise, structuredClone,
  window: { location: { hostname: 'kledawson.github.io', origin: 'https://kledawson.github.io', href: 'https://kledawson.github.io/Asset-Library/' } },
  process: { env: { PUBLIC_URL: 'https://kledawson.github.io/Asset-Library' } },
  DefaultLoadingManager: { setURLModifier(value) { modifier = value; } },
  modelRules: require('../src/assetModelRules.js'),
  indexedDB: { open() { const request = {}; setImmediate(() => { request.result = database; request.onsuccess(); }); return request; } },
  fetch: async url => { assert.equal(url, '/Asset-Library/models/asset-saves.json'); return { ok: true, json: async () => structuredClone(records) }; },
});
let source = fs.readFileSync('src/hostedStorage.js', 'utf8').replace(/^import .*;\r?\n/gm, '').replace(/export /g, '');
vm.runInContext(source + '\nthis.api={initializeHostedStorage,hostedSnapshot,hostedRequest,modelURL};', context);
(async () => {
  const { api } = context;
  await api.initializeHostedStorage();
  assert.equal(api.hostedSnapshot()['tool-wrench:high'].history.length, 0);
  assert.equal(modifier('/models/workshop-wrench.glb'), '/Asset-Library/models/workshop-wrench.glb');
  const next = structuredClone(records); next['tool-wrench:high'].revision = 2;
  await api.hostedRequest('/save', { key: 'tool-wrench:high', files: [{ name: 'workshop-wrench.glb', data: Buffer.from('wrench').toString('base64') }, { name: 'workshop-tool-rack-final.glb', data: Buffer.from('rack').toString('base64') }], snapshot: next });
  assert(stored.files['workshop-wrench.glb'] instanceof Blob);
  assert.equal(stored.files['workshop-wrench.glb'].size, 6);
  assert.strictEqual(stored.files['workshop-tool-rack-final.glb'], stored.files['editor-sources/workshop-tool-rack-final.glb']);
  const currentURL = modifier('/models/workshop-wrench.glb'); assert.match(currentURL, /^blob:/);
  const back = await api.hostedRequest('/restore', { key: 'tool-wrench:high' });
  assert.equal(modifier('/models/workshop-wrench.glb'), '/Asset-Library/models/workshop-wrench.glb');
  assert.equal(back.snapshot['tool-wrench:high'].nextAvailable, true);
  await api.hostedRequest('/restore', { key: 'tool-wrench:high', direction: 'next' });
  assert.match(modifier('/models/workshop-wrench.glb'), /^blob:/);
  await api.initializeHostedStorage();
  assert.match(modifier('/models/workshop-wrench.glb'), /^blob:/);
  console.log('Hosted storage passed: subpath URLs, binary data, shared Final/source Blob, save, previous/next, and reload.');
})().catch(error => { console.error(error); process.exitCode = 1; });
