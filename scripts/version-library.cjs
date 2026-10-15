// Increment integer components: 1.9 -> 1.10, never decimal arithmetic.
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const mode = process.argv[2];
if (!['patch', 'release'].includes(mode)) throw Error('Use patch or release.');
const versionFile = path.join(root, 'src/libraryVersion.json');
const version = JSON.parse(fs.readFileSync(versionFile, 'utf8'));
if (!Number.isSafeInteger(version.release) || version.release < 1 || !Number.isSafeInteger(version.patch) || version.patch < 0) throw Error('Invalid library version.');
if (mode === 'release') { version.release += 1; version.patch = 1; }
else version.patch += 1;
const npmVersion = `${version.release}.${version.patch}.0`;
const packageFile = path.join(root, 'package.json');
const pkg = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
pkg.version = npmVersion;
const lockFile = path.join(root, 'package-lock.json');
const lock = JSON.parse(fs.readFileSync(lockFile, 'utf8'));
lock.version = npmVersion;
if (lock.packages?.['']) lock.packages[''].version = npmVersion;
for (const [file, data] of [[versionFile, version], [packageFile, pkg], [lockFile, lock]]) fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
console.log(`Asset Library ${version.release}.${version.patch} — GitHub tag v${version.release}.${version.patch}`);
