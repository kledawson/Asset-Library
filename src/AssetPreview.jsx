import { hosted } from './hostedStorage';
import { Canvas, useLoader, useThree } from '@react-three/fiber';
import { CuboidCollider, Physics, RigidBody } from '@react-three/rapier';
import { Bounds, Html, OrbitControls } from '@react-three/drei';
import { Component, Suspense, startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box3, Matrix4, Plane, Quaternion, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { assetLibrary, assetPackages } from './assetLibrary';
import { EditableModel } from './EditableModel';
import { SavedAssetModel, useSavedModels, saveModel, restorePreviousModel } from './savedModels';
import { useCogReflectionMap } from './CogFinishStable';
const INDIVIDUAL_PREVIEW = {
  dropHeight: .65,
  restingCenterHeight: .55,
  ringRadius: .24,
  cameraPosition: [1.2, 1.1, 1.9],
  cameraTarget: [0, .55, 0],
};
class PreviewError extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <p className="asset-error">Unable to preview this model. Try another GLB file.</p> : this.props.children; }
}

function PreviewCamera({ assetId, individual }) {
  const { camera, controls, invalidate } = useThree();
  useEffect(() => {
    if (!individual || !controls) return;
    camera.position.fromArray(INDIVIDUAL_PREVIEW.cameraPosition);
    controls.target.fromArray(INDIVIDUAL_PREVIEW.cameraTarget);
    controls.update();
    invalidate();
  }, [assetId, individual, camera, controls, invalidate]);
  return null;
}
function DisplayModel({ showOriginal, modelKey, version, index, count, showLabels, testDrop, dropRun, editable, editorProps, onOpenVersion }) {
  const [angle, setAngle] = useState(0);
  const dropStart = useMemo(() => {
    const between = (min, max) => min + Math.random() * (max - min);
    return testDrop ? {
      position: [0, INDIVIDUAL_PREVIEW.dropHeight, 0],
      rotation: [between(-.18, .18), between(-.3, .3), between(-.18, .18)],
      linearVelocity: [0, 0, 0],
      angularVelocity: [between(-1.2, 1.2), between(-.5, .5), between(-1.2, 1.2)],
    } : { position: [0, 0, 0], rotation: [0, 0, 0], linearVelocity: [0, 0, 0], angularVelocity: [0, 0, 0] };
  }, [testDrop, dropRun]);
  const { scene } = useLoader(GLTFLoader, version.url);
  const cogReflection = useCogReflectionMap(modelKey === 'tool-cog:high' || modelKey === 'tool-rack:final');
  const previewTurn = ['tool-pencil:high','tool-notebook:high'].includes(modelKey) ? -Math.PI / 2 : 0;
  const previewTilt = modelKey === 'tool-notebook:high' ? Math.PI / 2 : 0;
  const previewBox = useMemo(() => new Box3().setFromObject(scene)
    .applyMatrix4(new Matrix4().makeRotationX(previewTilt))
    .applyMatrix4(new Matrix4().makeRotationZ(previewTurn)), [scene, previewTurn, previewTilt]);
  const radius = useMemo(() => {
    if (modelKey.startsWith('tool-') && !modelKey.startsWith('tool-rack:')) {
      return INDIVIDUAL_PREVIEW.ringRadius;
    }
    const size = previewBox.getSize(new Vector3());
    return Math.max(0.05, Math.hypot(size.x, size.z) * 0.54);
  }, [previewBox, modelKey]);
  const modelOffset = useMemo(() => {
    const box = previewBox;
    const center = box.getCenter(new Vector3());
    // Keep the same local pose: Drop raises it, Reset restores its original base.
    return [-center.x, -box.min.y, -center.z];
  }, [previewBox]);
  const dropCollider = useMemo(() => {
    const size = previewBox.getSize(new Vector3());
    return {
      halfSize: [Math.max(.002, size.x / 2), Math.max(.002, size.y / 2), Math.max(.002, size.z / 2)],
      center: [0, size.y / 2, 0],
    };
  }, [previewBox]);
  const restingPosition = useMemo(() => {
    const individual = modelKey.startsWith('tool-') && !modelKey.startsWith('tool-rack:');
    const height = previewBox.getSize(new Vector3()).y;
    return [0, individual ? INDIVIDUAL_PREVIEW.restingCenterHeight - height / 2 : 0, 0];
  }, [previewBox, modelKey]);
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  const controls = useThree(state => state.controls);
  const root = useRef();
  const body = useRef();
  useEffect(() => {
    if (!testDrop || !body.current) return;
    // Initialize each fall explicitly so no previous physics pose is reused.
    body.current.setTranslation({ x: 0, y: dropStart.position[1], z: 0 }, true);
    body.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
    body.current.wakeUp();
  }, [testDrop, dropRun, dropStart]);
  const drag = useRef(null);
  function rotateItem(delta) {
    if (!testDrop || !body.current) { setAngle(value => value + delta); return; }
    const rotation = body.current.rotation();
    const yaw = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), delta);
    const next = new Quaternion(rotation.x, rotation.y, rotation.z, rotation.w).premultiply(yaw);
    const center = root.current.getWorldPosition(new Vector3());
    const position = body.current.translation();
    const moved = new Vector3(position.x - center.x, position.y - center.y, position.z - center.z)
      .applyQuaternion(yaw).add(new Vector3(center.x, center.y, center.z));
    // Rotate the collider and model together around world up, preserving their height.
    body.current.setRotation(next, true);
    body.current.setTranslation(moved, true);
    body.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
  }
  function ringAngle(event) {
    const center = root.current.getWorldPosition(new Vector3());
    const point = event.ray.intersectPlane(new Plane(new Vector3(0, 1, 0), -(center.y + 0.001)), new Vector3());
    return point ? Math.atan2(point.z - center.z, point.x - center.x) : null;
  }
  function finish(event) {
    event.stopPropagation();
    if (!drag.current) return;
    if (controls) controls.enabled = drag.current.controlsEnabled;
    drag.current = null; setDragging(false);
    if (event.target.hasPointerCapture(event.pointerId)) event.target.releasePointerCapture(event.pointerId);
  }
  const Body = testDrop ? RigidBody : 'group';
  const offset = index - (count - 1) / 2;
  return <group ref={root} position={[offset * 2.1, 0, offset * -1.38]}>
    <Body ref={body} key={(testDrop ? 'dropped-' : 'resting-')+dropRun} {...(testDrop ? { type: 'dynamic', colliders: false, ...dropStart, restitution: 0.08, friction: 0.65, linearDamping: 0.08, angularDamping: 0.18, canSleep: false } : { position: restingPosition, rotation: [0, 0, 0] })}>
      {testDrop && <CuboidCollider args={dropCollider.halfSize} position={dropCollider.center} />}
      <group rotation-y={testDrop ? 0 : angle} onClick={event => event.stopPropagation()} onDoubleClick={event => { event.stopPropagation(); onOpenVersion(count > 1 ? version.id : 'all'); }}><group position={modelOffset}><group rotation-z={previewTurn}><group rotation-x={previewTilt}>{editable ? <EditableModel key={editorProps.assetId} url={version.url} cogReflection={cogReflection} {...editorProps} /> : <SavedAssetModel url={version.url} modelKey={modelKey} original={showOriginal} cogReflection={cogReflection} />}</group></group></group></group>
    </Body>
    <mesh rotation-x={-Math.PI / 2} position-y={0.001}
      onPointerOver={event => { event.stopPropagation(); setHovered(true); }}
      onPointerOut={() => setHovered(false)}
      onPointerDown={event => {
        event.stopPropagation(); const start = ringAngle(event); if (start === null) return;
        drag.current = { previous: start, controlsEnabled: controls?.enabled ?? true };
        if (controls) controls.enabled = false;
        event.target.setPointerCapture(event.pointerId); setDragging(true);
      }}
      onPointerMove={event => {
        if (!drag.current) return; event.stopPropagation();
        const next = ringAngle(event); if (next === null) return;
        let delta = next - drag.current.previous;
        delta = Math.atan2(Math.sin(delta), Math.cos(delta));
        rotateItem(-delta); drag.current.previous = next;
      }}
      onPointerUp={finish} onPointerCancel={finish} onLostPointerCapture={finish}>
      <ringGeometry args={[radius * 0.94, radius, 80]} />
      <meshBasicMaterial color={dragging ? '#303030' : '#626262'} transparent opacity={dragging ? 0.65 : hovered ? 0.42 : 0.24} depthWrite={false} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
    </mesh>
    {showLabels && !editable && <Html center position={[0, -0.15, radius * 0.8]}><div className="asset-model-label">
      <button aria-label={`Rotate ${version.label} left`} onClick={() => rotateItem(-Math.PI / 8)}>↶</button><span>{version.label}</span><button aria-label={`Rotate ${version.label} right`} onClick={() => rotateItem(Math.PI / 8)}>↷</button>
    </div></Html>}
  </group>;
}
function FloatingPane({ title, right = false, top, children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [position, setPosition] = useState(null);
  const drag = useRef(null);
  return <section className={`asset-floating-panel ${right ? 'asset-utility-pane' : ''} ${collapsed ? 'asset-pane-collapsed' : ''}`}
    style={position ? { left: position.x, top: position.y, right: 'auto' } : top ? { top } : undefined}>
    <header className="asset-panel-grip"
      onPointerDown={event => {
        if (event.target.closest('button')) return;
        event.stopPropagation(); const rect = event.currentTarget.parentElement.getBoundingClientRect();
        drag.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={event => {
        if (!drag.current) return; event.stopPropagation();
        const rect = event.currentTarget.parentElement.getBoundingClientRect();
        setPosition({ x: Math.max(0, Math.min(window.innerWidth - rect.width, event.clientX - drag.current.x)), y: Math.max(0, Math.min(window.innerHeight - rect.height, event.clientY - drag.current.y)) });
      }}
      onPointerUp={event => { drag.current = null; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
      onPointerCancel={() => { drag.current = null; }}>
      <span className="brand-kicker">ASSET WORKSHOP</span><strong>{title}</strong>
      <button className="asset-pane-collapse" aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${title}`} aria-expanded={!collapsed} onClick={() => setCollapsed(value => !value)}>{collapsed ? '+' : '−'}</button>
    </header>
    {!collapsed && children}
  </section>;
}
function TransformField({ label, value, step, onChange }) {
  return <label className="model-field"><span>{label}</span><input type="number" step={step} value={Number(value.toFixed(3))}
    onChange={event => onChange(Number(event.target.value) || 0)} /></label>;
}
export default function AssetPreview() {
  const [initialView] = useState(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem('pocketWorkshop.assetView') || '{}');
      const asset = assetLibrary.find(item=>item.id===saved.assetId);
      return asset ? { ...saved, variant: saved.variant==='all' || asset.versions.some(item=>item.id===saved.variant) ? saved.variant : 'all' } : {};
    } catch { return {}; }
  });
  const savedModels = useSavedModels();
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [selectedId, setSelectedId] = useState(initialView.assetId || assetLibrary[0].id);
  const [variant, setVariant] = useState(initialView.variant || 'all');
  const [reset, setReset] = useState(0);
  const [showLabels, setShowLabels] = useState(true);
  const [testDrop, setTestDrop] = useState(false);
  const [dropRun, setDropRun] = useState(0);
  const [localAsset, setLocalAsset] = useState(null);
  const [fileError, setFileError] = useState('');
  const [editorOpen, setEditorOpen] = useState(initialView.editorOpen === true);
  const [showOriginal, setShowOriginal] = useState(false);
  const clipboard = useRef(null);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [partFilter, setPartFilter] = useState('');
  const [selectionMode, setSelectionMode] = useState('item');
  const [transformMode, setTransformMode] = useState('translate');
  const [sourceModels, setSourceModels] = useState({});
  useEffect(() => {
    if (!assetLibrary.some(item=>item.id===selectedId)) return;
    try { sessionStorage.setItem('pocketWorkshop.assetView',JSON.stringify({assetId:selectedId,variant,editorOpen})); } catch {}
  }, [selectedId,variant,editorOpen]);
  const histories = useRef({});
  const [, refreshHistory] = useState(0);
  const [draftsByAsset, setDraftsByAsset] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pocketWorkshop.modelDrafts.v2') || '{}'); } catch { return {}; }
  });
  const draftsRef = useRef(draftsByAsset);
  useEffect(() => { try { localStorage.setItem('pocketWorkshop.modelDrafts.v2', JSON.stringify(draftsByAsset)); } catch {} }, [draftsByAsset]);
  const registerModelParts = useCallback((id, parts) => {
    setSourceModels(current => ({ ...current, [id]: parts }));
    const sourceRevision=savedModels[id]?.sourceRevision;
    const compatible = candidate => Array.isArray(candidate)
      && candidate.filter(item=>item.kind!=='copy').length===parts.length
      && candidate.every(item=>parts.some(part=>part.id===(item.sourceId||item.id)));
    const sourceChanged=sourceRevision && Number(localStorage.getItem(`asset-source:${id}`)||0)<sourceRevision;
    if(sourceChanged || (draftsRef.current[id] && !compatible(draftsRef.current[id]))) {
      delete draftsRef.current[id];
      delete histories.current[id];
      if(sourceRevision)localStorage.setItem(`asset-source:${id}`,String(sourceRevision));
    }
    if (!Object.prototype.hasOwnProperty.call(draftsRef.current, id) || (savedModels[id]?.items && JSON.stringify(draftsRef.current[id])===JSON.stringify(parts))) {
      const saved=savedModels[id]?.items;
      draftsRef.current = { ...draftsRef.current, [id]: !savedModels[id]?.pendingSource && compatible(saved) ? saved : parts };
      setDraftsByAsset(draftsRef.current);
    }
  }, [savedModels]);
  useEffect(() => () => { if (localAsset) URL.revokeObjectURL(localAsset.versions[0].url); }, [localAsset]);
  const assets = localAsset ? [...assetLibrary, localAsset] : assetLibrary;
  const asset = assets.find(item => item.id === selectedId) || assetLibrary[0];
  const individualView = asset.id.startsWith('tool-') && asset.id !== 'tool-rack';

  const packages = localAsset ? [...assetPackages, { id: 'imported', name: 'Imported Models', assetIds: [localAsset.id] }] : assetPackages;
  const selectedPackage = packages.find(item => item.assetIds.includes(asset.id)) || packages[0];
  const packageAssets = selectedPackage.assetIds.map(id => assets.find(item => item.id === id)).filter(Boolean);
  function chooseAsset(id) {
    startTransition(() => {
    setTestDrop(false);setDropRun(0); setSelectedItemId(''); setShowOriginal(false); setSaveMessage('');
    setSelectedId(id); setVariant('all');
    });
  }
  const preloadedUrls = useRef(new Set());
  useEffect(() => {
    const pending = [];
    for (const item of assetLibrary) {
      if (!item.id.startsWith('tool-')) continue;
      for (const version of item.versions) {
        const saved = savedModels[`${item.id}:${version.id}`];
        const linkedRevision = item.id === 'tool-rack' && version.id === 'final'
          ? Math.max(...['plant', 'triangle', 'pencil', 'notebook'].map(id => savedModels[`tool-${id}:high`]?.revision || 0)) : 0;
        const revision = Math.max(saved?.revision || 0, saved?.sourceRevision || 0, linkedRevision);
        pending.push(version.url + (version.url.includes('?') ? '&' : '?') + 'saved=' + revision);
      }
    }
    const next = new Set(pending);
    for (const url of preloadedUrls.current) if (!next.has(url)) useLoader.clear(GLTFLoader, url);
    preloadedUrls.current = next;
    let timer, cancelled = false;
    const preloadNext = () => {
      if (cancelled || !pending.length) return;
      useLoader.preload(GLTFLoader, pending.shift());
      timer = window.setTimeout(preloadNext, 150);
    };
    timer = window.setTimeout(preloadNext, 500);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [savedModels]);
  const baseVersions = variant === 'all' ? asset.versions : asset.versions.filter(item => item.id === variant);
  const versions = baseVersions.map(version=>({...version,label:asset.versions.length===1?'Default':version.label,url:version.url.startsWith('blob:')?version.url:version.url+(version.url.includes('?')?'&':'?')+'saved='+Math.max(Math.max(savedModels[`${asset.id}:${version.id}`]?.revision||0,savedModels[`${asset.id}:${version.id}`]?.sourceRevision||0),asset.id==='tool-rack'&&version.id==='final'?Math.max(savedModels['tool-plant:high']?.revision||0,savedModels['tool-triangle:high']?.revision||0,savedModels['tool-pencil:high']?.revision||0,savedModels['tool-notebook:high']?.revision||0):0)}));
  const editKey = `${asset.id}:${versions[0]?.id || variant}`;
  const objectItems = draftsByAsset[editKey] || [];
  useEffect(() => { setPartFilter(''); }, [editKey]);
  const visibleParts = objectItems.filter(item=>!item.hidden);
  const matchingParts = visibleParts.filter(item=>item.name.toLowerCase().includes(partFilter.trim().toLowerCase()))
    .sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true,sensitivity:'base'}));
  const canEdit = asset.id !== 'tool-rack' || variant === 'final';
  const selectedItem = canEdit && !saving && !showOriginal && versions.length === 1 && objectItems.find(item => item.id === selectedItemId && !item.hidden);
  const dirty = objectItems.length > 0 && (savedModels[editKey]?.pendingSource || !savedModels[editKey]?.revision || JSON.stringify(objectItems) !== JSON.stringify(savedModels[editKey]?.items || sourceModels[editKey] || []));
  function updateObjectItems(updater) {
    const previous = draftsRef.current[editKey] || [];
    const next = typeof updater === 'function' ? updater(previous) : updater;
    if (JSON.stringify(previous) === JSON.stringify(next)) return;
    const history = histories.current[editKey] ||= { past: [], future: [] };
    history.past = [...history.past.slice(-29), previous]; history.future = [];
    draftsRef.current = { ...draftsRef.current, [editKey]: next };
    setDraftsByAsset(draftsRef.current);
  }
  function undoRedo(redo = false) {
    const history = histories.current[editKey];
    const from = redo ? history?.future : history?.past;
    if (!from?.length) return;
    const to = redo ? history.past : history.future;
    to.push(draftsRef.current[editKey]);
    draftsRef.current = { ...draftsRef.current, [editKey]: from.pop() };
    setDraftsByAsset(draftsRef.current); setSelectedItemId(''); refreshHistory(value => value + 1);
  }
  function updateSelectedItem(key, value) {
    updateObjectItems(items => items.map(item => item.id === selectedItemId ? { ...item, [key]: value } : item));
  }
  function commitTransform(modelKey, itemId, transform) {
    if (modelKey !== editKey) return;
    updateObjectItems(items => items.map(item => item.id === itemId ? { ...item, ...transform } : item));
  }
  function duplicateSelected(part = selectedItem) {
    if (!part) return;
    const id = `copy-${crypto.randomUUID()}`;
    updateObjectItems(items => [...items, { ...part, id, name: `Copy of ${part.name}`,
      kind: 'copy', sourceId: part.kind === 'copy' ? part.sourceId : part.id,
      position: [part.position[0] + 0.035, part.position[1], part.position[2]], hidden: false }]);
    setSelectedItemId(id); setTransformMode('translate');
  }
  useEffect(() => {
    function keydown(event) {
      if (!canEdit || saving || !editorOpen || showOriginal || versions.length !== 1 || event.repeat || event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
      const key = event.key.toLowerCase(); const command = event.ctrlKey || event.metaKey;
      if (command && key === 'z') { event.preventDefault(); undoRedo(event.shiftKey); }
      else if (command && key === 'c' && selectedItem) { event.preventDefault(); clipboard.current = { key: editKey, part: JSON.parse(JSON.stringify(selectedItem)) }; }
      else if (command && key === 'v' && clipboard.current?.key === editKey) { event.preventDefault(); duplicateSelected(clipboard.current.part); }
      else if (command && key === 'b' && selectedItem) { event.preventDefault(); duplicateSelected(); }
      else if (!command && !event.altKey && ['w','e','r'].includes(key)) { event.preventDefault(); setTransformMode({w:'translate',e:'rotate',r:'scale'}[key]); }
      else if (key === 'escape') setSelectedItemId('');
    }
    window.addEventListener('keydown', keydown); return () => window.removeEventListener('keydown', keydown);
  });
  async function openFile(event) {
    const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
    const header = new DataView(await file.slice(0, 12).arrayBuffer());
    if (header.byteLength < 12 || header.getUint32(0, true) !== 0x46546c67 || header.getUint32(4, true) !== 2 || header.getUint32(8, true) !== file.size) { setFileError('Choose a valid GLB model file.'); return; }
    setFileError('');
    const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
    const id = `local-${Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')}`;
    setLocalAsset({ id, name: file.name, versions: [{ id: 'original', label: 'Original', url: URL.createObjectURL(file), filename: file.name, details: `${(file.size / 1000000).toFixed(2)} MB · Local preview` }] });
    setSelectedItemId(''); setSelectedId(id); setVariant('all'); setTestDrop(false);setDropRun(0);
  }
  return <main className="portfolio-app asset-fullscreen">
    {process.env.REACT_APP_WORKSHOP_URL && <a className="asset-return-button" href={process.env.REACT_APP_WORKSHOP_URL}>← Back to workshop</a>}
    <PreviewError key={reset}><Canvas onPointerMissed={event=>{if(event.type==='click'&&(event.delta ?? 0)<4){setSelectedItemId('');window.dispatchEvent(new Event('rack-editor-clear'));}}} frameloop={testDrop ? 'always' : 'demand'} shadows dpr={[1,1.5]} camera={{position:individualView ? INDIVIDUAL_PREVIEW.cameraPosition : [2.5,1.9,3.8],fov:35}}>
      <color attach="background" args={['#dbc9af']} /><ambientLight intensity={0.4}/><hemisphereLight args={['#fff4df','#8f6b50',0.35]}/>
      <directionalLight position={[-3,5,4]} intensity={1.25} color="#fff0d7" castShadow shadow-mapSize={[1024,1024]} shadow-camera-left={-5} shadow-camera-right={5} shadow-camera-top={5} shadow-camera-bottom={-5} shadow-bias={-0.0002}/>
      <Physics gravity={[0,-9.81,0]} timeStep={1/60}>
      <Suspense fallback={null}><Bounds key={`${asset.id}:${variant}`} fit={!individualView} clip={!individualView} margin={1.3}>
        {versions.map((version,index) => <DisplayModel key={`${asset.id}:${version.id}`} modelKey={`${asset.id}:${version.id}`} version={version} index={index} count={versions.length} showLabels={showLabels} onOpenVersion={id => { setSelectedItemId(''); setShowOriginal(false); setVariant(id); }} testDrop={testDrop && asset.id !== 'tool-rack' && asset.id.startsWith('tool-')}
        dropRun={dropRun} showOriginal={showOriginal} editable={canEdit && editorOpen && !saving && !showOriginal && versions.length === 1} editorProps={{ selectionMode, onExit: () => { setSelectedItemId(''); setVariant('all'); }, assetId: editKey, items: objectItems, selectedItem: selectedItemId, setSelectedItem: setSelectedItemId, transformMode, onGroupCommit: (key,changes) => { if(key===editKey)updateObjectItems(items=>items.map(item=>changes[item.id]?{...item,...changes[item.id]}:item)); }, onTransformCommit: commitTransform, onPartsLoaded: registerModelParts }} />)}</Bounds></Suspense>
      <RigidBody type="fixed" colliders={false}><CuboidCollider args={[100,0.05,100]} position={[0,-0.055,0]} friction={0.65} restitution={0.08}/></RigidBody>
      </Physics>
      <mesh onClick={event=>{if(event.delta<4){event.stopPropagation();setSelectedItemId('');window.dispatchEvent(new Event('rack-editor-clear'));}}} onDoubleClick={event=>{if(asset.id==='tool-rack'){event.stopPropagation();setSelectedItemId('');setVariant('all');}}} rotation-x={-Math.PI/2} position={[0,-0.005,0]} receiveShadow><planeGeometry args={[200,200]}/><meshStandardMaterial color="#dbc9af" roughness={1}/></mesh>
      <PreviewCamera assetId={asset.id} individual={individualView} />
      <OrbitControls makeDefault target={individualView ? INDIVIDUAL_PREVIEW.cameraTarget : [0,0,0]} maxPolarAngle={Math.PI/2.05}/>
    </Canvas></PreviewError>
    <FloatingPane title="Asset Library">
      <label className="asset-package-field"><span>Package</span><select aria-label="Package" value={selectedPackage.id} onChange={event => chooseAsset(packages.find(item => item.id === event.target.value).assetIds[0])}>{packages.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label className="asset-package-field"><span>Asset</span><select aria-label="Asset" value={asset.id} onChange={event => chooseAsset(event.target.value)}>{packageAssets.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <div className="asset-variants" role="group" aria-label="Asset version">{asset.versions.map(version=><button key={version.id} aria-pressed={asset.versions.length===1 || variant===version.id} onClick={()=>{setTestDrop(false);setDropRun(0);setSelectedItemId('');setVariant(version.id);}}>{asset.versions.length===1?'Default':version.label}</button>)}{asset.versions.length>1&&<button aria-pressed={variant==='all'} onClick={()=>{setTestDrop(false);setDropRun(0);setSelectedItemId('');setVariant('all');}}>All</button>}</div>
      <p>Drag to orbit · Scroll to zoom · Right-drag to pan<br/>Drag the ring or use ↶ ↷ to rotate the asset.</p>
    </FloatingPane>
    <FloatingPane title="Preview Settings" right>
      <div className="asset-panel-links">{asset.id !== 'tool-rack' && asset.id.startsWith('tool-') && <button disabled={editorOpen} onClick={()=>{setTestDrop(value=>!value);setDropRun(value=>value+1);}}>{testDrop ? 'Reset prop' : 'Drop test'}</button>}<label className="asset-open">Open GLB<input type="file" accept=".glb" onChange={openFile}/></label><button onClick={()=>{setTestDrop(false);setDropRun(0);setReset(value=>value+1);}}>Reset view</button><button aria-pressed={!showLabels} onClick={()=>setShowLabels(value=>!value)}>{showLabels ? 'Hide labels' : 'Show labels'}</button>
      </div>
      {fileError&&<p role="alert" className="asset-error">{fileError}</p>}
    </FloatingPane>
    <FloatingPane title="Model Editor" right top="300px">
      <div className="model-editor-actions">
        <button aria-pressed={editorOpen} onClick={()=>{setTestDrop(false);setDropRun(0);setShowOriginal(false);setEditorOpen(value=>!value);setSelectedItemId('');}}>{editorOpen ? 'Close Editor' : 'Edit Model'}</button>
        {editorOpen && <button aria-pressed={showOriginal} onClick={()=>{setShowOriginal(value=>!value);setSelectedItemId('');}}>{showOriginal ? 'Show Changes' : 'Show Original'}</button>}
      </div>
      {editorOpen && <details className="model-precise"><summary>Keyboard shortcuts</summary><p>W Move · E Rotate · R Resize<br/>Ctrl+C / Ctrl+V Copy / Paste · Ctrl+B Duplicate<br/>Ctrl+Z Undo · Ctrl+Shift+Z Redo · Esc Deselect</p><p>Click to select · Click outside to clear · Double-click to leave</p></details>}
      {editorOpen && !canEdit && versions.length===1 && <p>Historical comparison. Choose Final to edit.</p>}
      {editorOpen && versions.length > 1 && <p>Choose Final to edit the current model.</p>}
      {editorOpen && versions.length === 1 && canEdit && <>
        <div className="model-transform-modes" role="group" aria-label="Selection mode">
          <span>Select</span>
          <button aria-pressed={selectionMode==='item'} onClick={()=>{setSelectionMode('item');setSelectedItemId('');}}>Item</button>
          <button aria-pressed={selectionMode==='element'} onClick={()=>{setSelectionMode('element');setSelectedItemId('');}}>Element</button>
        </div>

        {visibleParts.length > 12 && <label className="model-select"><span>Filter parts</span><input type="search" aria-label="Filter parts" placeholder="Search names…" value={partFilter} onChange={event=>setPartFilter(event.target.value)} /></label>}
        <label className="model-select"><span>Selected part</span><select value={selectedItemId} onChange={event=>{setSelectionMode('element');setSelectedItemId(event.target.value);}}>
          <option value="">{matchingParts.length ? 'Choose a part' : 'No matching parts'}</option>
          {selectedItemId && !matchingParts.some(item=>item.id===selectedItemId) && visibleParts.filter(item=>item.id===selectedItemId).map(item=><option key={item.id} value={item.id}>{item.name} (selected)</option>)}
          {matchingParts.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
        </select></label>
          <div className="model-transform-modes" role="group" aria-label="Transform mode">
            <span>Tool</span>
            <button aria-pressed={transformMode==='translate'} onClick={()=>{setTransformMode('translate');}}>Move (W)</button>
            <button aria-pressed={transformMode==='rotate'} onClick={()=>{setTransformMode('rotate');}}>Rotate (E)</button>
            <button aria-pressed={transformMode==='scale'} onClick={()=>{setTransformMode('scale');}}>Resize (R)</button>
          </div>
      {selectionMode === 'element' && <div className="model-editor-actions">
        <button disabled={!selectedItem} onClick={()=>{updateObjectItems(items=>selectedItem.kind==='copy' ? items.filter(item=>item.id!==selectedItemId) : items.map(item=>item.id===selectedItemId?{...item,hidden:true}:item));setSelectedItemId('');}}>Remove Selected</button>
        <button disabled={!selectedItem} onClick={()=>duplicateSelected()}>Duplicate Selected</button>
      </div>}
        {selectedItem && <>
          <details className="model-precise"><summary>Precise adjustments</summary><div className="model-fields">
          {['X','Y','Z'].map((axis,index)=><TransformField key={axis} label={`Move ${axis}`} value={selectedItem.position[index]} step="0.01" onChange={value=>updateSelectedItem('position',selectedItem.position.map((item,i)=>i===index?value:item))}/>)}
          {['X','Y','Z'].map((axis,index)=><TransformField key={`rotate-${axis}`} label={`Turn ${axis}°`} value={selectedItem.rotation[index]*180/Math.PI} step="5" onChange={value=>updateSelectedItem('rotation',selectedItem.rotation.map((item,i)=>i===index?value*Math.PI/180:item))}/>)}
          {['X','Y','Z'].map((axis,index)=><TransformField key={`size-${axis}`} label={`Size ${axis}`} value={selectedItem.scale[index]} step="0.05" onChange={value=>updateSelectedItem('scale',selectedItem.scale.map((item,i)=>i===index?value:item))}/>)}
          </div></details>
        </>}
        <div className="model-editor-actions">
          <button disabled={saving || (!dirty && editKey !== 'tool-pencil:high') || showOriginal} onClick={async()=>{setSaving(true);try { const saved=await saveModel(editKey,objectItems);draftsRef.current={...draftsRef.current,[editKey]:saved};if(!editKey.startsWith('tool-rack:')){for(const v of ['final']){delete draftsRef.current[`tool-rack:${v}`];delete histories.current[`tool-rack:${v}`];}setSourceModels(current=>Object.fromEntries(Object.entries(current).filter(([key])=>!key.startsWith('tool-rack:'))));}setDraftsByAsset(draftsRef.current);setSelectedItemId('');setSaveMessage(hosted ? 'Saved in this browser. All instances now use this version.' : 'Model saved. All instances now use this version.'); } catch (error) {setSaveMessage(error.message); } finally {setSaving(false);}}}>{saving ? 'Saving…' : 'Save Model'}</button>
          <button disabled={saving || showOriginal || !savedModels[editKey]?.history?.length} onClick={async()=>{setSaving(true);try { const previous=await restorePreviousModel(editKey);const affected=!editKey.startsWith('tool-rack:')?[editKey,...['final'].map(v=>`tool-rack:${v}`)]:[editKey];for(const key of affected)delete draftsRef.current[key];if(previous)draftsRef.current[editKey]=previous;localStorage.setItem('pocketWorkshop.modelDrafts.v2',JSON.stringify(draftsRef.current));window.location.reload(); } catch (error) {setSaveMessage(error.message);} finally {setSaving(false);}}}>Previous Save</button>
          <button disabled={saving || showOriginal || !savedModels[editKey]?.nextAvailable} onClick={async()=>{setSaving(true);try { const previous=await restorePreviousModel(editKey,'next');const affected=!editKey.startsWith('tool-rack:')?[editKey,...['final'].map(v=>`tool-rack:${v}`)]:[editKey];for(const key of affected)delete draftsRef.current[key];if(previous)draftsRef.current[editKey]=previous;localStorage.setItem('pocketWorkshop.modelDrafts.v2',JSON.stringify(draftsRef.current));window.location.reload(); } catch (error) {setSaveMessage(error.message);} finally {setSaving(false);}}}>Next Save</button>
        </div>
        {saveMessage && <p role="status">{saveMessage}</p>}
        <div className="model-editor-actions">
          <button disabled={showOriginal || !histories.current[editKey]?.past.length} onClick={()=>undoRedo()}>Undo</button>
          <button disabled={showOriginal || !histories.current[editKey]?.future.length} onClick={()=>undoRedo(true)}>Redo</button>
          <button disabled={!selectedItem} onClick={()=>{
            const original = (savedModels[editKey]?.items || sourceModels[editKey])?.find(item=>item.id===(selectedItem.sourceId || selectedItemId));
            if (original) updateObjectItems(items=>items.map(item=>item.id===selectedItemId?{...item,position:original.position,rotation:original.rotation,scale:original.scale}:item));
          }}>Reset Part</button>
        </div>
      </>}
    </FloatingPane>
  </main>;
}




















