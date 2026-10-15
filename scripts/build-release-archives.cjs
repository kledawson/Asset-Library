const fs = require('node:fs');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const { scopedStorage } = require('./archive-storage.cjs');
const root = path.resolve(__dirname, '..');
const gitArgs = ['-c', `safe.directory=${root.split(path.sep).join('/')}`];
const git = args => execFileSync('git', [...gitArgs, ...args], { cwd: root, encoding: 'utf8' }).trim();
const base = new URL(require('../package.json').homepage).pathname.replace(/\/$/, '');
const recipe = createHash('sha256').update(fs.readFileSync(__filename)).update(fs.readFileSync(path.join(__dirname, 'archive-storage.cjs'))).update(base).digest('hex').slice(0, 16);
const cache = path.join(root, '.release-site-cache');
const work = path.join(root, '.release-build');
const output = path.join(root, 'build', 'versions');
function removeWork(target) {
  const resolved = path.resolve(target);
  if (!resolved.startsWith(work + path.sep)) throw Error('Refusing cleanup outside the archive build directory.');
  fs.rmSync(resolved, { recursive: true, force: true });
}
function command(bin, args, cwd, env = {}) {
  const result = spawnSync(bin, args, { cwd, env: { ...process.env, ...env }, stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) throw Error(`${bin} ${args.join(' ')} failed (${result.status}).`);
}
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);
}
function adaptArchive(folder, version) {
  const prefix = `assetLibrary.archive:${version}:`;
  const helper = path.join(folder, 'src', 'releaseArchiveStorage.js');
  for (const file of walk(path.join(folder, 'src')).filter(file => /\.(jsx?|mjs)$/.test(file))) {
    let source = fs.readFileSync(file, 'utf8');
    const names = ['localStorage', 'sessionStorage'].filter(name => new RegExp(`\\b${name}\\b`).test(source));
    if (names.length) {
      source = source.replace(/window\.(localStorage|sessionStorage)\b/g, '$1');
      let relative = path.relative(path.dirname(file), helper).split(path.sep).join('/');
      if (!relative.startsWith('.')) relative = './' + relative;
      source = `import { ${names.join(', ')} } from '${relative}';\n` + source;
      fs.writeFileSync(file, source);
    }
  }
  fs.writeFileSync(helper, `${scopedStorage.toString()}\nexport const localStorage = scopedStorage(window.localStorage, ${JSON.stringify(prefix)});\nexport const sessionStorage = scopedStorage(window.sessionStorage, ${JSON.stringify(prefix)});\n`);
  const hosted = path.join(folder, 'src', 'hostedStorage.js');
  const source = fs.readFileSync(hosted, 'utf8');
  const databaseName = /(['"])dawson\.assetLibrary\.v1\1/g;
  if ([...source.matchAll(databaseName)].length !== 1) throw Error(`Review browser-save isolation for archive ${version}: database name changed.`);
  fs.writeFileSync(hosted, source.replace(databaseName, JSON.stringify(prefix + 'models')));
}
function decorateArchive(folder, record) {
  const file = path.join(folder, 'index.html');
  const html = fs.readFileSync(file, 'utf8');
  const banner = `<aside aria-label="Release archive" style="position:fixed;bottom:18px;left:18px;z-index:2000;padding:10px 14px;border:1px solid #d4c3a7;border-radius:12px;background:#fff6e6;color:#5d4b36;font:13px/1.4 system-ui;box-shadow:0 4px 18px #0001">Archive <strong>${record.version}</strong> · <a style="color:#347d78" href="${base}/">Latest Version</a> · <a style="color:#347d78" href="${base}/versions/">Version History</a></aside>`;
  fs.writeFileSync(file, html.replace('</body>', banner + '</body>'));
  fs.writeFileSync(path.join(folder, 'release-snapshot.json'), JSON.stringify(record, null, 2) + '\n');
}
const tags = git(['tag', '--list', 'v*', '--sort=-version:refname']).split('\n').filter(tag => /^v\d+\.\d+$/.test(tag));
if (!tags.length) throw Error('No Release.Patch tags were fetched. Checkout must fetch full tag history.');
fs.mkdirSync(output, { recursive: true });
fs.mkdirSync(work, { recursive: true });
fs.mkdirSync(cache, { recursive: true });
const records = [];
for (const tag of tags) {
  const version = tag.slice(1);
  const sha = git(['rev-parse', `${tag}^{commit}`]);
  const record = { version, tag, commit: sha, checkpointDate: git(['show', '-s', '--format=%cI', sha]), path: `${base}/versions/${version}/`, storageNamespace: `assetLibrary.archive:${version}:`, note: 'Tagged source and models; deployment adapts only the URL base, isolated browser storage, and archive navigation.' };
  const cached = path.join(cache, `${tag}-${sha}-${recipe}`);
  if (!fs.existsSync(path.join(cached, 'index.html'))) {
    const folder = path.join(work, `${tag}-${sha}`);
    removeWork(folder);
    fs.mkdirSync(folder, { recursive: true });
    const tar = path.join(folder, 'snapshot.tar');
    execFileSync('git', [...gitArgs, 'archive', '--format=tar', '-o', tar, sha, 'src', 'public', 'scripts', 'package.json', 'package-lock.json', '.npmrc'], { cwd: root, stdio: 'inherit' });
    execFileSync('tar', ['-xf', tar, '-C', folder], { stdio: 'inherit' });
    fs.unlinkSync(tar);
    command('npm', ['ci', '--no-audit', '--no-fund'], folder);
    command('npm', ['run', 'verify:assets'], folder);
    adaptArchive(folder, version);
    command('npm', ['run', 'build'], folder, { CI: 'false', PUBLIC_URL: record.path.replace(/\/$/, ''), REACT_APP_WORKSHOP_URL: '' });
    decorateArchive(path.join(folder, 'build'), record);
    fs.cpSync(path.join(folder, 'build'), cached, { recursive: true });
    removeWork(folder);
  }
  const manifest = JSON.parse(fs.readFileSync(path.join(cached, 'release-snapshot.json')));
  if (manifest.commit !== sha || manifest.path !== record.path) throw Error(`Archive cache mismatch for ${tag}.`);
  fs.cpSync(cached, path.join(output, version), { recursive: true });
  records.push(record);
  console.log(`Archive ${version}: ${sha} -> ${record.path}`);
}
fs.writeFileSync(path.join(output, 'releases.json'), JSON.stringify(records, null, 2) + '\n');
const cards = records.map(record => {
  const date = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', dateStyle: 'long' }).format(new Date(record.checkpointDate));
  return `<article><h2>Version ${record.version}</h2><p>${date} · <code>${record.commit.slice(0, 7)}</code></p><a class="button" href="${record.path}">Open Version ${record.version}</a> <a href="https://github.com/kledawson/Asset-Library/releases/tag/${record.tag}">Release Notes ↗</a></article>`;
}).join('\n');
fs.writeFileSync(path.join(output, 'index.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Version History · Asset Library</title><style>*{box-sizing:border-box}body{margin:0;background:#e8e0cd;color:#253b44;font:16px/1.6 system-ui}main{max-width:920px;margin:60px auto;padding:0 24px}h1{font-size:38px;margin:0}h2{margin:0}p{color:#71604c}a{color:#347d78}article{background:#fff6e6;border:1px solid #dac9ae;border-radius:20px;padding:26px;margin:20px 0}.button{display:inline-block;background:#347d78;color:white;padding:10px 16px;border-radius:9px;text-decoration:none;margin:6px 16px 6px 0}.button:hover{background:#286b67}code{font-size:13px}header{margin-bottom:32px}</style></head><body><main><header><h1>Asset Library</h1><p>Version History — revisit each checkpoint and see how the collection grew.</p><a class="button" href="${base}/">Open Latest Version</a></header>${cards}<p>Archive demos keep their original code and assets. Their browser saves are separate from each other and from Latest. Checkpoint dates come from the tagged commits.</p></main></body></html>`);
console.log(`Built ${records.length} release archives and the version-history page.`);
