import { DefaultLoadingManager } from 'three';
import modelRules from './assetModelRules.js';
import { playSetURL } from './playSetStorage';

export const hosted = !['localhost', '127.0.0.1'].includes(window.location.hostname);
const base = new URL(process.env.PUBLIC_URL || '/', window.location.origin).pathname.replace(/\/$/, '');
export const publicPath = path => `${base}${path}`;
let database;
let state = { files: {}, snapshot: null, previous: {}, next: {} };
const urls = new Map();
export function modelURL(url) {
  if (/^(blob:|data:)/.test(url)) return url;
  if (!hosted) {
    const savedSetURL = playSetURL(url);
    if (savedSetURL !== url) return savedSetURL;
  }
  let name = new URL(url, window.location.href).pathname;
  if (base && name.startsWith(`${base}/`)) name = name.slice(base.length);
  return urls.get(name)?.url || (url.startsWith('/models/') ? publicPath(url) : url);
}
DefaultLoadingManager.setURLModifier(modelURL);
function installFiles() {
  for (const [name, entry] of urls) {
    if (state.files[name.slice(8)] === entry.blob) continue;
    URL.revokeObjectURL(entry.url); urls.delete(name);
  }
  for (const [name, blob] of Object.entries(state.files)) {
    const key = `/models/${name}`;
    if (!urls.has(key)) urls.set(key, { blob, url: URL.createObjectURL(blob) });
  }
}
export async function initializeHostedStorage() {
  if (!hosted) return;
  database = await new Promise((resolve, reject) => {
    const request = indexedDB.open('dawson.assetLibrary.v1', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('library');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  const saved = await new Promise((resolve, reject) => {
    const request = database.transaction('library').objectStore('library').get('state');
    request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
  });
  if (saved) state = saved;
  if (!state.snapshot) {
    const response = await fetch(publicPath('/models/asset-saves.json'));
    if (!response.ok) throw Error('Could not load model metadata.');
    state.snapshot = await response.json();
    for (const value of Object.values(state.snapshot)) { value.history = []; value.nextAvailable = false; }
  }
  installFiles();
}
export function hostedSnapshot() { return state.snapshot; }
async function persist(next) {
  await new Promise((resolve, reject) => {
    const transaction = database.transaction('library', 'readwrite');
    transaction.objectStore('library').put(next, 'state');
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error || Error('Browser storage is full.'));
  });
  state = next; installFiles();
}
const capture = names => ({ files: Object.fromEntries(names.map(name => [name, state.files[name] || null])), snapshot: state.snapshot });
export async function hostedRequest(route, body) {
  if (route === '/save') {
    const files = { ...state.files };
    const names = [];
    for (const file of body.files) {
      const bytes = Uint8Array.from(atob(file.data), char => char.charCodeAt(0));
      const blob = new Blob([bytes], { type: 'model/gltf-binary' });
      files[file.name] = blob; names.push(file.name);
      const linkedNames=modelRules.linkedAssemblyKeys(body.key).map(modelRules.modelFileName);
      if (linkedNames.includes(file.name)) {
        files[`editor-sources/${file.name}`] = blob; names.push(`editor-sources/${file.name}`);
      }
    }
    await persist({ files, snapshot: body.snapshot, previous: { ...state.previous, [body.key]: capture(names) }, next: { ...state.next, [body.key]: null } });
    return { ok: true };
  }
  const forward = body.direction === 'next';
  const restore = (forward ? state.next : state.previous)[body.key];
  if (!restore) throw Error('No saved version is available in this browser yet.');
  const current = capture(Object.keys(restore.files));
  const files = { ...state.files };
  for (const [name, blob] of Object.entries(restore.files)) { if (blob) files[name] = blob; else delete files[name]; }
  const snapshot = { ...state.snapshot };
  const keys = [body.key,...modelRules.linkedAssemblyKeys(body.key)];
  for (const key of keys) snapshot[key] = { ...restore.snapshot[key], revision: Date.now(), sourceRevision: Date.now(), history: forward ? [null] : [], nextAvailable: !forward };
  await persist({ files, snapshot, previous: forward ? { ...state.previous, [body.key]: current } : state.previous, next: forward ? { ...state.next, [body.key]: null } : { ...state.next, [body.key]: current } });
  return { ok: true, snapshot };
}
