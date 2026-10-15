import fs from 'node:fs/promises';
import path from 'node:path';

const key = 'play-ramp:default';
const names = ['play-ramp.glb', 'play-props.glb'];
const candidatePaths = process.argv.slice(2);
if (candidatePaths.length !== 2) throw Error('Supply the staged ramp candidate and its matching Play Prop Set candidate');
const statePath = 'public/models/asset-saves.json';
const state = JSON.parse(await fs.readFile(statePath, 'utf8'));
if (!state[key]?.pendingSource) throw Error('Stage the ramp candidate before saving');
const revision = Date.now();
const oldRamp = state[key];
const oldSet = state['play-props:default'];
const snapshot = {
  ...state,
  [key]: { ...oldRamp, items: null, pendingSource: false, revision, sourceRevision: revision, history: [...(oldRamp.history || []), oldRamp.items || null], nextAvailable: false },
  'play-props:default': { ...oldSet, items: null, pendingSource: false, revision, sourceRevision: revision, nextAvailable: false },
};
const files = await Promise.all(names.map(async (name, index) => ({ name, data: (await fs.readFile(candidatePaths[index])).toString('base64') })));
const body = JSON.stringify({ key, files, snapshot });
let response;
for (let attempt = 0; attempt < 3; attempt++) {
  response = await fetch('http://127.0.0.1:3001/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
  if (response.ok) break;
  await new Promise(resolve => setTimeout(resolve, 500));
}
if (!response.ok) throw Error(await response.text());

const runtime = 'C:/Users/dawso/OneDrive/Desktop/portfolio';
const backup = path.join(runtime, '.asset-backups', `ramp-refinement-sync-${revision}`);
for (const name of names) {
  for (const prefix of ['', 'editor-sources/']) {
    const source = path.join('public/models', prefix, name);
    const destination = path.join(runtime, 'public/models', prefix, name);
    await fs.mkdir(path.join(backup, prefix), { recursive: true });
    await fs.copyFile(destination, path.join(backup, prefix, name));
    await fs.copyFile(source, destination);
  }
}
const runtimeStatePath = path.join(runtime, 'public/models/asset-saves.json');
const runtimeState = JSON.parse(await fs.readFile(runtimeStatePath, 'utf8'));
for (const changedKey of [key, 'play-props:default']) runtimeState[changedKey] = snapshot[changedKey];
await fs.writeFile(runtimeStatePath + '.sync.tmp', JSON.stringify(runtimeState));
await fs.rename(runtimeStatePath + '.sync.tmp', runtimeStatePath);
await fs.cp('.asset-backups/play-ramp-default', path.join(runtime, '.asset-backups/play-ramp-default'), { recursive: true });
console.log('Saved the ramp refinement in the individual asset and Play Prop Set.');
