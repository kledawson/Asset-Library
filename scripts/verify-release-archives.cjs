const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..', 'build', 'versions');
const records = JSON.parse(fs.readFileSync(path.join(root, 'releases.json')));
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);
const base = process.argv[2];
(async () => {
  let count = 0;
  for (const record of records) {
    const folder = path.join(root, record.version);
    const html = fs.readFileSync(path.join(folder, 'index.html'), 'utf8');
    assert(html.includes(`Archive <strong>${record.version}</strong>`));
    const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(match => match[1]);
    assert(scripts.length > 0);
    for (const script of scripts) {
      assert(script.startsWith(record.path + 'static/'), script);
      assert(fs.existsSync(path.join(folder, script.slice(record.path.length))), script);
    }
    const models = walk(path.join(folder, 'models')).filter(file => file.endsWith('.glb'));
    if (base) {
      const url = new URL(record.path, base);
      const page = await fetch(url); assert.equal(page.status, 200);
      assert((await page.text()).includes(`Archive <strong>${record.version}</strong>`));
      const response = await fetch(new URL('release-snapshot.json', url)); assert.equal(response.status, 200);
      assert.equal((await response.json()).commit, record.commit);
      const metadata = await fetch(new URL('models/asset-saves.json', url)); assert.equal(metadata.status, 200); await metadata.json();
      let index = 0;
      await Promise.all(Array.from({ length: 4 }, async () => {
        while (index < models.length) {
          const file = models[index++];
          const relative = path.relative(folder, file).split(path.sep).join('/');
          let result = await fetch(new URL(relative, url), { headers: { Range: 'bytes=0-27' } });
          if (result.status >= 500) result = await fetch(new URL(relative, url), { headers: { Range: 'bytes=0-27' } });
          assert([200, 206].includes(result.status), relative + ': HTTP ' + result.status);
          const bytes = Buffer.from(await result.arrayBuffer());
          assert.equal(bytes.toString('ascii', 0, 4), 'glTF', relative);
          assert.equal(bytes.readUInt32LE(8), fs.statSync(file).size, relative);
        }
      }));
    }
    count += models.length;
    console.log(`Archive ${record.version} verified: ${models.length} models, tagged commit, nested script URLs${base ? ', live HTTP checks' : ''}.`);
  }
  if (base) { const index = await fetch(new URL(records[0].path.replace(/[^/]+\/$/, ''), base)); assert.equal(index.status, 200); }
  console.log(`Release archives passed: ${records.length} versions, ${count} models.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
