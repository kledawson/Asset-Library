// Keep temporary preview edits separate from Latest and every release archive.
const fs = require('node:fs');
const path = require('node:path');
const { scopedStorage } = require('./archive-storage.cjs');

const root = path.resolve(__dirname, '..');
const src = path.join(root, 'src');
const helper = path.join(src, 'mobilePreviewStorage.js');
const prefix = 'assetLibrary.preview:mobile-v1:';

function walk(folder) {
  return fs.readdirSync(folder, { withFileTypes: true }).flatMap(entry =>
    entry.isDirectory() ? walk(path.join(folder, entry.name)) : [path.join(folder, entry.name)]);
}

for (const file of walk(src).filter(file => /\.(jsx?|mjs)$/.test(file))) {
  let source = fs.readFileSync(file, 'utf8');
  const names = ['localStorage', 'sessionStorage'].filter(name => new RegExp(`\\b${name}\\b`).test(source));
  if (!names.length) continue;
  source = source.replace(/window\.(localStorage|sessionStorage)\b/g, '$1');
  let relative = path.relative(path.dirname(file), helper).split(path.sep).join('/');
  if (!relative.startsWith('.')) relative = './' + relative;
  fs.writeFileSync(file, `import { ${names.join(', ')} } from '${relative}';\n${source}`);
}
fs.writeFileSync(helper, `${scopedStorage.toString()}\nexport const localStorage = scopedStorage(window.localStorage, ${JSON.stringify(prefix)});\nexport const sessionStorage = scopedStorage(window.sessionStorage, ${JSON.stringify(prefix)});\n`);

const hosted = path.join(src, 'hostedStorage.js');
const source = fs.readFileSync(hosted, 'utf8');
const databaseName = /(['"])dawson\.assetLibrary\.v1\1/g;
if ([...source.matchAll(databaseName)].length !== 1) throw Error('Review preview browser-save isolation: database name changed.');
fs.writeFileSync(hosted, source.replace(databaseName, JSON.stringify(prefix + 'models')));

const index = path.join(root, 'public', 'index.html');
const html = fs.readFileSync(index, 'utf8');
fs.writeFileSync(index, html.replace('</head>', '<meta name="robots" content="noindex,nofollow">\n</head>'));
console.log('Prepared isolated, unindexed mobile preview.');
