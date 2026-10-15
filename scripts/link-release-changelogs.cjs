// Keep history-page documentation changes independent of the frozen app-build cache.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const folder = path.join(root, 'build', 'versions');
const records = JSON.parse(fs.readFileSync(path.join(folder, 'releases.json')));
const file = path.join(folder, 'index.html');
let html = fs.readFileSync(file, 'utf8');
for (const { tag } of records) {
  if (!/^v\d+\.\d+$/.test(tag)) throw Error('Invalid release tag in history manifest.');
  execFileSync('git', ['-c', `safe.directory=${root.split(path.sep).join('/')}`, 'cat-file', '-e', `${tag}:CHANGELOG.md`], { cwd: root });
  const repo = 'https://github.com/kledawson/Asset-Library';
  const changelog = `${repo}/blob/${tag}/CHANGELOG.md`;
  if (html.includes(`href="${changelog}"`)) continue;
  const notes = `<a href="${repo}/releases/tag/${tag}">Release Notes ↗</a>`;
  if (!html.includes(notes)) throw Error(`Release Notes link missing for ${tag}.`);
  html = html.replace(notes, `${notes} <span aria-hidden="true">·</span> <a href="${changelog}">Changelog ↗</a>`);
}
fs.writeFileSync(file, html);
console.log(`Version history links verified: ${records.length} tagged changelogs beside Release Notes.`);
