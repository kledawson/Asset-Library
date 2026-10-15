import modelRules from './assetModelRules.js';
import { writeModelFiles, restoreModelFiles } from './assetFiles';
import { useMemo, useSyncExternalStore } from 'react';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { EditableModel } from './EditableModel';
import { addCogReflection, isCogPart } from './CogFinishStable';
import { hosted, hostedSnapshot, publicPath } from './hostedStorage';

const storageKey = 'pocketWorkshop.savedModels.v1';
let models;
try { models = JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch { models = {}; }
const listeners = new Set();
const subscribe = listener => { listeners.add(listener); return () => listeners.delete(listener); };
const snapshot = () => models;
async function syncSavedModels() {
  try {
    const response = hosted ? { ok: true, json: async () => hostedSnapshot() } : await fetch(publicPath('/models/asset-saves.json'), { cache: 'no-store' });
    if (!response.ok) return;
    const saved = await response.json();
    const next = hosted ? { ...saved } : { ...models };
    let changed = hosted && JSON.stringify(saved) !== JSON.stringify(models);
    for (const [key, value] of Object.entries(saved)) {
      if ((value.revision || 0) > (models[key]?.revision || 0)) {
        next[key] = value;
        changed = true;
      }
    }
    if (changed) publish(next);
  } catch {}
}
syncSavedModels();
window.addEventListener('focus', syncSavedModels);
document.addEventListener('visibilitychange', () => { if (!document.hidden) syncSavedModels(); });
setInterval(() => { if (!document.hidden) syncSavedModels(); }, 5000);
function publish(next) {
  if (!hosted) localStorage.setItem(storageKey, JSON.stringify(next));
  models = next;
  window.dispatchEvent(new Event('asset-files-updated'));
  listeners.forEach(listener => listener());
}
window.addEventListener('storage', event => {
  if (event.key !== storageKey) return;
  try { models = JSON.parse(event.newValue || '{}'); window.dispatchEvent(new Event('asset-files-updated')); listeners.forEach(listener => listener()); } catch {}
});
export const useSavedModels = () => useSyncExternalStore(subscribe, snapshot);
export async function saveModel(key, items) {
  const current = models[key];
  // Explicit Save always rewrites linked Final assets, including an unchanged pencil.
  let leaf = 0; const names = new Map();
  const normalized = items.map(item => {
    if (item.hidden) return item;
    const base = item.name.replace(/^(Copy of )+/i, '');
    const name = /leaf/i.test(base) ? 'Leaf ' + (++leaf) : base;
    const count = (names.get(name) || 0) + 1; names.set(name,count);
    return {...item,name:count > 1 ? name + ' ' + count : name};
  });
  const next = { ...models, [key]: { sourceRevision: current?.sourceRevision, pendingSource: false, items: normalized, history: [current?.revision ? current.items : null], revision: Date.now() } };
  for(const assemblyKey of modelRules.linkedAssemblyKeys(key))
    next[assemblyKey]={...models[assemblyKey],items:null,pendingSource:false,nextAvailable:false,sourceRevision:next[key].revision,revision:next[key].revision};
  await writeModelFiles(key,normalized,models,next);
  publish(next);
  return normalized;
}
export async function restorePreviousModel(key,direction) {
  const current = models[key];
  if (!(direction==='next'?current?.nextAvailable:current?.history?.length)) return current?.items;
  const result=await restoreModelFiles(key,direction);
  publish(result.snapshot);
  return result.snapshot[key]?.items;
}
const ignoreParts = () => {};
export function SavedAssetModel({ url, modelKey, original = false, cogReflection, ...props }) {
  const models = useSavedModels();
  const saved = models[modelKey]?.pendingSource ? null : models[modelKey]?.items;
  return <SourceModel url={original && models[modelKey]?.pendingSource ? url.replace('/editor-sources/','/') : url} modelKey={modelKey} saved={saved} cogReflection={cogReflection} {...props} />;
}
function SourceModel({ url, modelKey, saved, cogReflection, ...props }) {
  const { scene } = useLoader(GLTFLoader, url);
  const original = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse(part => { if (part.isMesh) { part.castShadow = !/^Grip_Seam_/.test(part.name); part.receiveShadow = !/^Grip_Seam_/.test(part.name); if(isCogPart(part,modelKey)&&cogReflection)part.material=Array.isArray(part.material)?part.material.map(material=>addCogReflection(material,cogReflection)):addCogReflection(part.material,cogReflection); } });
    return clone;
  }, [scene,modelKey,cogReflection]);
  return <group {...props} dispose={null}>{saved
    ? <EditableModel readOnly url={url} assetId={modelKey} cogReflection={cogReflection} items={saved} selectedItem="" setSelectedItem={ignoreParts} onPartsLoaded={ignoreParts} />
    : <primitive object={original} dispose={null} />}</group>;
}

