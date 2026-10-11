const fs = require('fs'), path = require('path'), assert = require('assert/strict');
const base = process.argv[2] || 'https://kledawson.github.io/Asset-Library';
const files = [];
function walk(dir) { for (const entry of fs.readdirSync(dir, { withFileTypes: true })) { const file = path.join(dir, entry.name); if (entry.isDirectory()) walk(file); else if (file.endsWith('.glb')) files.push(path.relative('public', file).split(path.sep).join('/')); } }
walk('public/models');
(async () => {
  const page = await fetch(base + '/'); assert.equal(page.status, 200);
  const metadata = await fetch(base + '/models/asset-saves.json'); assert.equal(metadata.status, 200); await metadata.json();
  let index = 0;
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (index < files.length) {
      const file = files[index++];
      let response = await fetch(base + '/' + file, { headers: { Range: 'bytes=0-27' } });
      if (response.status >= 500) response = await fetch(base + '/' + file);
      assert([200, 206].includes(response.status), file + ': HTTP ' + response.status);
      const bytes = Buffer.from(await response.arrayBuffer());
      assert.equal(bytes.toString('ascii', 0, 4), 'glTF', file);
      assert.equal(bytes.readUInt32LE(4), 2, file);
      assert(bytes.readUInt32LE(8) > 28, file);
    }
  }));
  console.log('Live deployment verified: page, save metadata, and all ' + files.length + ' GLBs.');
})().catch(error => { console.error(error); process.exitCode = 1; });
