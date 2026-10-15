const assert = require('node:assert/strict');
const { scopedStorage } = require('./archive-storage.cjs');
const data = new Map([['pocketWorkshop.assetView', 'latest']]);
const storage = {
  get length() { return data.size; },
  key(index) { return [...data.keys()][index] ?? null; },
  getItem(key) { return data.get(key) ?? null; },
  setItem(key, value) { data.set(key, String(value)); },
  removeItem(key) { data.delete(key); },
};
const first = scopedStorage(storage, 'archive:1.0:');
const second = scopedStorage(storage, 'archive:1.1:');
assert.equal(first.getItem('pocketWorkshop.assetView'), null);
first.setItem('pocketWorkshop.assetView', 'old view');
second.setItem('pocketWorkshop.assetView', 'new view');
assert.equal(first.getItem('pocketWorkshop.assetView'), 'old view');
assert.equal(second.getItem('pocketWorkshop.assetView'), 'new view');
assert.equal(first.length, 1);
assert.equal(first.key(0), 'pocketWorkshop.assetView');
assert.equal(first.key(1), null);
first.clear();
assert.equal(storage.getItem('pocketWorkshop.assetView'), 'latest');
assert.equal(second.getItem('pocketWorkshop.assetView'), 'new view');
assert.equal(first.length, 0);
console.log('Archive storage passed: independent versions, Latest preserved, scoped keys and clear.');
