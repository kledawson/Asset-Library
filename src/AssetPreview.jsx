import { assetDescription } from './assetDescriptions';
import { libraryVersion } from './libraryVersion';
import StableButtonLabel from './StableButtonLabel';
import MaterialColorPicker from './MaterialColorPicker';
import HelpIcon from './HelpIcon';
import { controlLabels as labels } from './controlLabels';
import ControlsHelp from './ControlsHelp';
import modelRules from './assetModelRules.js';
import { hosted } from './hostedStorage';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { BallCollider, CuboidCollider, Physics, RigidBody } from '@react-three/rapier';
import { Bounds, Html, useBounds } from '@react-three/drei';
import FloorSafeOrbitControls from './FloorSafeOrbitControls';
import { BALL_CONTACT_SETTINGS, BALL_DROP_SETTINGS, ballDropMotion } from './playBallMotion.mjs';
import { Component, Suspense, startTransition, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Box3, Matrix4, Plane, Quaternion, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { assetLibrary, assetPackages, isIndividualAsset } from './assetLibrary';
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
const serializeEdits = items => JSON.stringify(items, (key, value) => key === 'materials' ? undefined : value);
class PreviewError extends Component {
  state = { failed: false };
  disposed = false;
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) {
    this.failedUrl = /^Could not load (.+?): /s.exec(error.message || '')?.[1];
    if (this.failedUrl) this.scheduleRetry();
  }
  componentDidUpdate(previous) {
    if (this.state.failed && previous.urls.join('|') !== this.props.urls.join('|')) this.retry();
  }
  componentWillUnmount() { this.disposed = true; window.clearTimeout(this.retryTimer); }
  scheduleRetry() {
    window.clearTimeout(this.retryTimer);
    this.retryTimer = window.setTimeout(async () => {
      if (this.disposed || !this.state.failed) return;
      try {
        const response = await fetch(this.failedUrl || this.props.urls[0], { method: 'HEAD', cache: 'no-store' });
        const type = response.headers.get('content-type') || '';
        if (response.ok && !type.includes('text/html')) { this.retry(); return; }
      } catch {}
      this.scheduleRetry();
    }, 3000);
  }
  retry() {
    if (this.disposed) return;
    window.clearTimeout(this.retryTimer);
    for (const url of new Set([this.failedUrl, ...this.props.urls].filter(Boolean))) useLoader.clear(GLTFLoader, url);
    this.failedUrl = null;
    this.setState({ failed: false });
  }
  render() { return this.state.failed ? <div className="asset-preview-recovery"><p>Model preview unavailable. {this.failedUrl ? 'Reconnecting…' : 'Please try again.'}</p><button onClick={() => this.retry()}>Retry Preview</button></div> : this.props.children; }
}

function PreviewCamera({ assetId, individual }) {
  const { camera, controls, invalidate } = useThree();
  const bounds = useBounds();
  const pendingFit = useRef(true);
  useLayoutEffect(() => {
    pendingFit.current = true;
    invalidate();
  }, [assetId, individual, camera, controls, bounds, invalidate]);
  useFrame(() => {
    if (!pendingFit.current || !bounds) return;
    pendingFit.current = false;
    // Fit before the first rendered frame, once all model refs are mounted.
    camera.position.fromArray(individual ? INDIVIDUAL_PREVIEW.cameraPosition : [2.5, 1.9, 3.8]);
    camera.near = .01; camera.far = 100; camera.updateProjectionMatrix();
    const target = new Vector3().fromArray(individual ? INDIVIDUAL_PREVIEW.cameraTarget : [0, 0, 0]);
    camera.lookAt(target);
    if (controls) { controls.target.copy(target); controls.update(); }
    if (!individual) bounds.refresh().clip().fit();
    invalidate();
  }, -100);
  return null;
}
function DisplayModel({ showOriginal, modelKey, version, index, count, showLabels, testDrop, dropRun, editable, editorProps, onOpenVersion }) {
  const [angle, setAngle] = useState(0);
  const isBall = modelKey.startsWith('play-ball:');
  const dropStart = useMemo(() => {
    const between = (min, max) => min + Math.random() * (max - min);
    const ballMotion=isBall?ballDropMotion():null;
    return testDrop ? {
      position: [0, INDIVIDUAL_PREVIEW.dropHeight, 0],
      rotation: [between(-.18, .18), between(-.3, .3), between(-.18, .18)],
      linearVelocity: ballMotion?.linearVelocity || [0, 0, 0],
      angularVelocity: ballMotion?.angularVelocity || [between(-1.2, 1.2), between(-.5, .5), between(-1.2, 1.2)],
    } : { position: [0, 0, 0], rotation: [0, 0, 0], linearVelocity: [0, 0, 0], angularVelocity: [0, 0, 0] };
  }, [testDrop, dropRun, isBall]);
  const { scene } = useLoader(GLTFLoader, version.url);
  const cogReflection = useCogReflectionMap(modelKey === 'tool-cog:high' || modelKey === 'tool-rack:final');
  const previewTurn = ['tool-pencil:high','tool-notebook:high'].includes(modelKey) ? -Math.PI / 2 : 0;
  const previewTilt = modelKey === 'tool-notebook:high' ? Math.PI / 2 : 0;
  const previewBox = useMemo(() => new Box3().setFromObject(scene)
    .applyMatrix4(new Matrix4().makeRotationX(previewTilt))
    .applyMatrix4(new Matrix4().makeRotationZ(previewTurn)), [scene, previewTurn, previewTilt]);
  const radius = useMemo(() => {
    if (isIndividualAsset(modelKey.split(':')[0])) {
      return INDIVIDUAL_PREVIEW.ringRadius;
    }
    const size = previewBox.getSize(new Vector3());
    return modelKey.startsWith('play-props:') ? 1.05 : Math.max(0.05, Math.hypot(size.x, size.z) * 0.54);
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
    const individual = isIndividualAsset(modelKey.split(':')[0]);
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
    body.current.setLinvel({ x: dropStart.linearVelocity[0], y: 0, z: dropStart.linearVelocity[2] }, true);
    body.current.setAngvel({ x: dropStart.angularVelocity[0], y: dropStart.angularVelocity[1], z: dropStart.angularVelocity[2] }, true);
    body.current.wakeUp();
  }, [testDrop, dropRun, dropStart]);
  const drag = useRef(null);
  useEffect(() => () => {
    const active = drag.current; drag.current = null;
    if (active && controls) controls.enabled = active.controlsEnabled;
    try { if (active?.captureTarget?.hasPointerCapture(active.pointerId)) active.captureTarget.releasePointerCapture(active.pointerId); } catch {}
  }, [controls]);
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
  return <group ref={root} position={isIndividualAsset(modelKey.split(':')[0]) ? [offset * .58, 0, offset * -.381] : [offset * 2.1, 0, offset * -1.38]}>
    <Body ref={body} key={(testDrop ? 'dropped-' : 'resting-')+dropRun} {...(testDrop ? { type: 'dynamic', colliders: false, ...dropStart, restitution: 0.08, friction: 0.65, linearDamping: 0.08, angularDamping: 0.18, canSleep: false, ...(isBall?BALL_DROP_SETTINGS:{}) } : { position: restingPosition, rotation: [0, 0, 0] })}>
      {testDrop && (isBall ? <BallCollider args={[Math.max(...dropCollider.halfSize)]} position={dropCollider.center} {...BALL_CONTACT_SETTINGS} /> : <CuboidCollider args={dropCollider.halfSize} position={dropCollider.center} />)}
      <group rotation-y={testDrop ? 0 : angle} onClick={event => event.stopPropagation()} onDoubleClick={event => { event.stopPropagation(); onOpenVersion(count > 1 ? version.id : 'all'); }}><group position={modelOffset}><group rotation-z={previewTurn}><group rotation-x={previewTilt}>{editable ? <EditableModel key={editorProps.assetId} url={version.url} cogReflection={cogReflection} {...editorProps} /> : <SavedAssetModel url={version.url} modelKey={modelKey} original={showOriginal} cogReflection={cogReflection} />}</group></group></group></group>
    </Body>
    <mesh rotation-x={-Math.PI / 2} position-y={0.001}
      onPointerOver={event => { event.stopPropagation(); setHovered(true); }}
      onPointerOut={() => setHovered(false)}
      onPointerDown={event => {
        event.stopPropagation(); const start = ringAngle(event); if (start === null) return;
        drag.current = { previous: start, controlsEnabled: controls?.enabled ?? true, captureTarget: event.target, pointerId: event.pointerId };
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
      <meshBasicMaterial color="#626262" transparent opacity={dragging ? 0.60 : hovered ? 0.42 : 0.24} depthWrite={false} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
    </mesh>
    {showLabels && !editable && <Html center position={[0, -0.15, radius * 0.8]}><div className="asset-model-label">
      <button aria-label={`Rotate ${version.label} left`} onClick={() => rotateItem(-Math.PI / 8)}>↶</button><span>{version.label}</span><button aria-label={`Rotate ${version.label} right`} onClick={() => rotateItem(Math.PI / 8)}>↷</button>
    </div></Html>}
  </group>;
}
function FloatingPane({ title, right = false, top, children, className = '', mobileOpen = false, onMobileClose }) {
  const [collapsed, setCollapsed] = useState(false);
  const [position, setPosition] = useState(null);
  const drag = useRef(null);
  const paneCollapsed = collapsed && !mobileOpen;
  return <section className={`asset-floating-panel ${right ? 'asset-utility-pane' : ''} ${paneCollapsed ? 'asset-pane-collapsed' : ''} ${className}`} data-mobile-open={mobileOpen || undefined} role={mobileOpen ? 'dialog' : undefined} aria-label={mobileOpen ? title : undefined}
    style={position ? { left: position.x, top: position.y, right: 'auto' } : top ? { top } : undefined}>
    <header className="asset-panel-grip"
      onPointerDown={event => {
        if (mobileOpen || event.target.closest('button')) return;
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
      <span className="brand-kicker version-kicker">VERSION <span className="version-number">{libraryVersion}</span></span><strong>{title}</strong>
      <button className="asset-pane-collapse" aria-label={mobileOpen ? `Close ${title}` : `${collapsed ? 'Expand' : 'Collapse'} ${title}`} aria-expanded={!paneCollapsed} onClick={() => mobileOpen ? onMobileClose?.() : setCollapsed(value => !value)}>{mobileOpen ? '×' : collapsed ? '+' : '−'}</button>
    </header>
    {!paneCollapsed && children}
  </section>;
}
function TransformField({ label, value, step, onChange }) {
  return <label className="model-field"><span>{label}</span><input type="number" step={step} value={Number(value.toFixed(3))}
    onChange={event => onChange(Number(event.target.value) || 0)} /></label>;
}
export default function AssetPreview() {
  const [initialView] = useState(() => {
    const firstView = () => window.matchMedia('(max-width:760px), (max-height:500px) and (pointer:coarse)').matches ? { variant: 'final' } : {};
    try {
      const saved = JSON.parse(sessionStorage.getItem('pocketWorkshop.assetView') || '{}');
      const asset = assetLibrary.find(item=>item.id===saved.assetId);
      return asset ? { ...saved, variant: (saved.variant==='all' && !asset.noAll) || asset.versions.some(item=>item.id===saved.variant) ? saved.variant : asset.noAll ? asset.versions[0].id : 'all' } : firstView();
    } catch { return firstView(); }
  });
  const rememberedVariants = useRef((() => {
    try { return JSON.parse(localStorage.getItem('pocketWorkshop.parcelVariants.v1') || '{}') || {}; } catch { return {}; }
  })());
  const savedModels = useSavedModels();
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveAvailability, setSaveAvailability] = useState({previous:false,next:false});
  const [selectedId, setSelectedId] = useState(initialView.assetId || assetLibrary[0].id);
  const [variant, setVariant] = useState(initialView.variant || 'all');
  const [reset, setReset] = useState(0);
  const [showLabels, setShowLabels] = useState(true);
  const [testDrop, setTestDrop] = useState(false);
  const [dropRun, setDropRun] = useState(0);
  const [dropNotice, setDropNotice] = useState(false);
  const [localAsset, setLocalAsset] = useState(null);
  const [fileError, setFileError] = useState('');
  const [editorOpen, setEditorOpen] = useState(initialView.editorOpen === true);
  const [showOriginal, setShowOriginal] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [mobileView, setMobileView] = useState(() => window.matchMedia('(max-width: 760px), (max-height: 500px) and (pointer: coarse)').matches);
  const [mobileMenu, setMobileMenu] = useState(null);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 760px), (max-height: 500px) and (pointer: coarse)');
    const update = () => setMobileView(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (mobileView) setEditorOpen(false);
    else setMobileMenu(null);
  }, [mobileView]);
  useEffect(() => {
    if (!mobileMenu) return;
    const closeOnEscape = event => { if (event.key === 'Escape') setMobileMenu(null); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [mobileMenu]);
  const clipboard = useRef(null);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const [materialIndex, setMaterialIndex] = useState(0);
  const colorGesture = useRef(null);
  const [partFilter, setPartFilter] = useState('');
  const [selectionMode, setSelectionMode] = useState('item');
  const [transformMode, setTransformMode] = useState('translate');
  const [sourceModels, setSourceModels] = useState({});
  useEffect(() => {
    if (!assetLibrary.some(item=>item.id===selectedId)) return;
    try { sessionStorage.setItem('pocketWorkshop.assetView',JSON.stringify({assetId:selectedId,variant,editorOpen})); } catch {}
    if (assetLibrary.find(item=>item.id===selectedId)?.kind==='individual' && assetLibrary.find(item=>item.id===selectedId)?.versions.length>1) {
      rememberedVariants.current[selectedId] = variant;
      try { localStorage.setItem('pocketWorkshop.parcelVariants.v1',JSON.stringify(rememberedVariants.current)); } catch {}
    }
  }, [selectedId,variant,editorOpen]);
  const histories = useRef({});
  const [, refreshHistory] = useState(0);
  const [draftsByAsset, setDraftsByAsset] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pocketWorkshop.modelDrafts.v2') || '{}'); } catch { return {}; }
  });
  const draftsRef = useRef(draftsByAsset);
  useEffect(() => {
    const persist = () => { try { localStorage.setItem('pocketWorkshop.modelDrafts.v2', JSON.stringify(draftsRef.current)); } catch {} };
    const timer = window.setTimeout(persist, 200);
    window.addEventListener('pagehide', persist);
    return () => { window.clearTimeout(timer); window.removeEventListener('pagehide', persist); };
  }, [draftsByAsset]);
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
  const individualView = isIndividualAsset(asset.id) && (variant !== 'all' || asset.versions.length === 1);

  const packages = localAsset ? [...assetPackages, { id: 'imported', name: 'Imported Models', assetIds: [localAsset.id] }] : assetPackages;
  const selectedPackage = packages.find(item => item.assetIds.includes(asset.id)) || packages[0];
  const packageAssets = selectedPackage.assetIds.map(id => assets.find(item => item.id === id)).filter(Boolean);
  function chooseAsset(id) {
    startTransition(() => {
    setTestDrop(false);setDropRun(0); setSelectedItemId(''); setShowOriginal(false); setSaveMessage('');setFileError('');
    const nextAsset = assets.find(item => item.id === id);
    const remembered = rememberedVariants.current[id];
    const nextVariant = nextAsset?.noAll ? nextAsset.versions[0].id : nextAsset?.kind==='individual' && nextAsset.versions.length>1 && (remembered === 'all' || nextAsset.versions.some(item => item.id === remembered)) ? remembered : 'all';
    setSelectedId(id); setVariant(nextVariant);
    });
  }
  const navigationState = useRef(null);
  const navigationDrag = useRef(false);
  navigationState.current = { packages, selectedPackage, packageAssets, selectedId, chooseAsset, saving, helpOpen, variant, tabs: asset.versions.length > 1 ? [...asset.versions.map(item => item.id), ...(asset.noAll ? [] : ['all'])] : [asset.versions[0]?.id], chooseVariant: id => { setTestDrop(false); setDropRun(0); setSelectedItemId(''); setShowOriginal(false); setSaveMessage(''); setVariant(id); } };
  useEffect(() => {
    const pointerDown = event => { navigationDrag.current = !!event.target.closest?.('canvas'); };
    const pointerEnd = () => { navigationDrag.current = false; };
    const navigate = event => {
      if (!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','PageUp','PageDown'].includes(event.key) || event.ctrlKey || event.metaKey || event.altKey) return;
      if (!navigationDrag.current && event.target.closest?.('input, textarea, .model-editor-pane select, [role="slider"], [contenteditable="true"]')) return;
      const state = navigationState.current;
      if (state.saving || state.helpOpen) return;
      event.preventDefault(); event.stopPropagation();
      if (event.repeat) return;
      if (event.key === 'PageUp' || event.key === 'PageDown') {
        const index = state.packages.findIndex(item => item.id === state.selectedPackage.id);
        const next = index + (event.key === 'PageDown' ? 1 : -1);
        if (next >= 0 && next < state.packages.length) state.chooseAsset(state.packages[next].assetIds[0]);
      } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        const index=state.packageAssets.findIndex(item=>item.id===state.selectedId);
        const direction=event.key==='ArrowDown'?1:-1;
        const next=index+direction;
        if(next>=0 && next<state.packageAssets.length) state.chooseAsset(state.packageAssets[next].id);
      } else {
        const index=state.tabs.indexOf(state.variant);
        const direction=event.key==='ArrowRight'?1:-1;
        const next=index+direction;
        if(index>=0 && next>=0 && next<state.tabs.length) state.chooseVariant(state.tabs[next]);
      }
    };
    window.addEventListener('keydown',navigate,true);
    window.addEventListener('pointerdown',pointerDown,true);
    window.addEventListener('pointerup',pointerEnd,true);
    window.addEventListener('pointercancel',pointerEnd,true);
    return () => {
      window.removeEventListener('keydown',navigate,true);
      window.removeEventListener('pointerdown',pointerDown,true);
      window.removeEventListener('pointerup',pointerEnd,true);
      window.removeEventListener('pointercancel',pointerEnd,true);
    };
  }, []);
  const preloadedUrls = useRef(new Set());
  useEffect(() => {
    const pending = [];
    for (const item of assetLibrary) {

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
  useEffect(() => { setDropNotice(false); }, [editKey, editorOpen]);
  useEffect(() => {
    let cancelled=false;
    setSaveAvailability({previous:false,next:false});
    const check = async () => {
      const saved=savedModels[editKey];
      if(hosted){setSaveAvailability({previous:!!saved?.history?.length,next:!!saved?.nextAvailable});return;}
      try {
        const response=await fetch(`http://127.0.0.1:3001/history/${encodeURIComponent(editKey)}`,{cache:'no-store'});
        if(!response.ok)return;
        const available=await response.json();
        if(!cancelled)setSaveAvailability({previous:!!saved?.history?.length&&available.previous,next:!!saved?.nextAvailable&&available.next});
      } catch {}
    };
    check();
    window.addEventListener('focus',check);
    return()=>{cancelled=true;window.removeEventListener('focus',check);};
  }, [editKey, savedModels]);
  const objectItems = draftsByAsset[editKey] || [];
  useEffect(() => { setPartFilter(''); setSelectedGroupIds([]); }, [editKey, editorOpen]);
  useEffect(() => { setMaterialIndex(0); }, [selectedItemId]);
  const visibleParts = objectItems.filter(item=>!item.hidden);
  const matchingParts = visibleParts.filter(item=>item.name.toLowerCase().includes(partFilter.trim().toLowerCase()))
    .sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true,sensitivity:'base'}));
  const importedPreview = asset.id.startsWith('local-');
  const canEdit = !importedPreview && (asset.id !== 'tool-rack' || variant === 'final');
  const selectedItem = canEdit && !saving && !showOriginal && versions.length === 1 && objectItems.find(item => item.id === selectedItemId && !item.hidden);
  const colorItems = canEdit && !saving && !showOriginal && versions.length === 1 ? selectedItem ? [selectedItem] : objectItems.filter(item => selectedGroupIds.includes(item.id) && !item.hidden) : [];
  const materialsFor = item => item.materials || sourceModels[editKey]?.find(part => part.id === (item.sourceId || item.id))?.materials || [];
  const selectedMaterials = colorItems.length === 1 ? materialsFor(colorItems[0]) : [];
  const activeMaterialIndex = Math.min(materialIndex, Math.max(0, selectedMaterials.length - 1));
  const colorEntries = colorItems.flatMap(item => materialsFor(item).flatMap((material, index) => colorItems.length === 1 && index !== activeMaterialIndex ? [] : [{ item, index, material, color: item.colorOverrides?.[index] || material.color }]));
  const colorValue = colorEntries[0]?.color || '#ffffff';
  const dirty = objectItems.length > 0 && (savedModels[editKey]?.pendingSource || !savedModels[editKey]?.revision || serializeEdits(objectItems) !== serializeEdits(savedModels[editKey]?.items || sourceModels[editKey] || []));
  function updateObjectItems(updater, recordHistory = true) {
    const previous = draftsRef.current[editKey] || [];
    const next = typeof updater === 'function' ? updater(previous) : updater;
    if (JSON.stringify(previous) === JSON.stringify(next)) return;
    if (recordHistory) {
      const history = histories.current[editKey] ||= { past: [], future: [] };
      history.past = [...history.past.slice(-29), previous]; history.future = [];
    }
    draftsRef.current = { ...draftsRef.current, [editKey]: next };
    setDraftsByAsset(draftsRef.current);
  }
  function startColorChange() {
    if (!colorGesture.current) colorGesture.current = { key: editKey, items: draftsRef.current[editKey] || [] };
  }
  function endColorChange() {
    const gesture = colorGesture.current;
    colorGesture.current = null;
    if (!gesture || JSON.stringify(gesture.items) === JSON.stringify(draftsRef.current[gesture.key])) return;
    const history = histories.current[gesture.key] ||= { past: [], future: [] };
    history.past = [...history.past.slice(-29), gesture.items]; history.future = [];
    refreshHistory(value => value + 1);
  }
  function changeColor(hex) {
    const ids = new Set(colorItems.map(item => item.id));
    updateObjectItems(items => items.map(item => {
      if (!ids.has(item.id)) return item;
      const colorOverrides = { ...item.colorOverrides };
      materialsFor(item).forEach((_, index) => { if (colorItems.length > 1 || index === activeMaterialIndex) colorOverrides[index] = hex; });
      return { ...item, colorOverrides };
    }), !colorGesture.current);
  }
  function resetColor() {
    endColorChange();
    const ids = new Set(colorItems.map(item => item.id));
    updateObjectItems(items => items.map(item => {
      if (!ids.has(item.id) || !item.colorOverrides) return item;
      const { colorOverrides: previous, ...rest } = item;
      const colorOverrides = { ...previous };
      if (colorItems.length === 1) delete colorOverrides[activeMaterialIndex];
      else Object.keys(colorOverrides).forEach(index => delete colorOverrides[index]);
      return Object.keys(colorOverrides).length ? { ...rest, colorOverrides } : rest;
    }));
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
      if (helpOpen || !canEdit || saving || !editorOpen || showOriginal || versions.length !== 1 || event.repeat || event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
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
    try {
    const header = new DataView(await file.slice(0, 12).arrayBuffer());
    if (header.byteLength < 12 || header.getUint32(0, true) !== 0x46546c67 || header.getUint32(4, true) !== 2 || header.getUint32(8, true) !== file.size) { setFileError('Choose a valid GLB model file.'); return; }
    setFileError('');
    const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
    const id = `local-${Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')}`;
    setLocalAsset({ id, name: file.name, versions: [{ id: 'original', label: 'Original', url: URL.createObjectURL(file), filename: file.name, details: `${(file.size / 1000000).toFixed(2)} MB · Local preview` }] });
    setSelectedItemId(''); setSelectedId(id); setVariant('all'); setTestDrop(false);setDropRun(0);setShowOriginal(false);setEditorOpen(false);
    } catch { setFileError('Could not open that file. Please choose a valid GLB model.'); }
  }
  return <main className="portfolio-app asset-fullscreen" data-mobile-panel={mobileMenu || undefined}>
    {process.env.REACT_APP_WORKSHOP_URL && <a className="asset-return-button" href={process.env.REACT_APP_WORKSHOP_URL}>← {labels.back}</a>}
    <PreviewError key={reset} urls={versions.map(version => version.url)}><Canvas onPointerMissed={event=>{if(event.type==='click'&&(event.delta ?? 0)<4){setSelectedItemId('');window.dispatchEvent(new Event('rack-editor-clear'));}}} frameloop={testDrop ? 'always' : 'demand'} shadows dpr={[1,1.5]} camera={{position:individualView ? INDIVIDUAL_PREVIEW.cameraPosition : [2.5,1.9,3.8],fov:35}}>
      <color attach="background" args={['#dbc9af']} /><ambientLight intensity={0.4}/><hemisphereLight args={['#fff4df','#8f6b50',0.35]}/>
      <directionalLight position={[-3,5,4]} intensity={1.25} color="#fff0d7" castShadow shadow-mapSize={[1024,1024]} shadow-camera-left={-5} shadow-camera-right={5} shadow-camera-top={5} shadow-camera-bottom={-5} shadow-bias={-0.0002}/>
      <Physics gravity={[0,-9.81,0]} timeStep={1/60}>
      <Suspense fallback={null}><Bounds key={`${asset.id}:${variant}`} fit={false} clip={false} damping={0} margin={1.3}>
        {versions.map((version,index) => <DisplayModel key={`${asset.id}:${version.id}`} modelKey={`${asset.id}:${version.id}`} version={version} index={index} count={versions.length} showLabels={showLabels} onOpenVersion={id => { setTestDrop(false); setDropRun(0); setSelectedItemId(''); setShowOriginal(false); setVariant(id); }} testDrop={testDrop && isIndividualAsset(asset.id)}
        dropRun={dropRun} showOriginal={showOriginal} editable={canEdit && editorOpen && !saving && !showOriginal && versions.length === 1} editorProps={{ selectionMode, onGroupSelection: setSelectedGroupIds, onExit: () => { setSelectedItemId(''); setVariant(asset.noAll ? asset.versions[0].id : 'all'); }, assetId: editKey, items: objectItems, selectedItem: selectedItemId, setSelectedItem: setSelectedItemId, transformMode, onGroupCommit: (key,changes) => { if(key===editKey)updateObjectItems(items=>items.map(item=>changes[item.id]?{...item,...changes[item.id]}:item)); }, onTransformCommit: commitTransform, onPartsLoaded: registerModelParts }} />)}<PreviewCamera assetId={`${asset.id}:${variant}`} individual={individualView} /></Bounds></Suspense>
      <RigidBody type="fixed" colliders={false}><CuboidCollider args={[100,0.05,100]} position={[0,-0.055,0]} friction={0.65} restitution={0.08}/></RigidBody>
      </Physics>
      <mesh onClick={event=>{if(event.delta<4){event.stopPropagation();setSelectedItemId('');window.dispatchEvent(new Event('rack-editor-clear'));}}} onDoubleClick={event=>{if(asset.id==='tool-rack'){event.stopPropagation();setSelectedItemId('');setVariant('all');}}} rotation-x={-Math.PI/2} position={[0,-0.005,0]} receiveShadow><planeGeometry args={[200,200]}/><meshStandardMaterial color="#dbc9af" roughness={1}/></mesh>

      <FloorSafeOrbitControls enabled={!helpOpen} target={individualView ? INDIVIDUAL_PREVIEW.cameraTarget : [0,0,0]} />
    </Canvas></PreviewError>
    <FloatingPane title="Asset Library" mobileOpen={mobileView && mobileMenu === 'asset-library'} onMobileClose={() => setMobileMenu(null)}>
      <label className="asset-package-field"><span>Package</span><select aria-label="Package" value={selectedPackage.id} onChange={event => { chooseAsset(packages.find(item => item.id === event.target.value).assetIds[0]); if (mobileView) setMobileMenu(null); }}>{packages.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label className="asset-package-field"><span>Asset</span><select aria-label="Asset" value={asset.id} onChange={event => { chooseAsset(event.target.value); if (mobileView) setMobileMenu(null); }}>{packageAssets.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <div className="asset-version-field"><span>Versions</span>
      <div className="asset-variants" role="group" aria-label="Version Tabs">{asset.versions.map(version=><button key={version.id} aria-pressed={asset.versions.length===1 || variant===version.id} onClick={()=>{setTestDrop(false);setDropRun(0);setSelectedItemId('');setVariant(version.id);if(mobileView)setMobileMenu(null);}}>{asset.versions.length===1?'Default':version.label}</button>)}{asset.versions.length>1&&!asset.noAll&&<button aria-pressed={variant==='all'} onClick={()=>{setTestDrop(false);setDropRun(0);setSelectedItemId('');setVariant('all');if(mobileView)setMobileMenu(null);}}>All</button>}</div>
      </div>
      <p className="asset-description">{assetDescription(asset, variant)}</p>
    </FloatingPane>
    <FloatingPane title="Preview Settings" right className="preview-settings-pane" mobileOpen={mobileView && mobileMenu === 'preview-settings'} onMobileClose={() => setMobileMenu(null)}>
      <div className="asset-panel-links preview-view-actions" role="group" aria-label="Preview View">
        <button onClick={()=>{setTestDrop(false);setDropRun(0);setReset(value=>value+1);if(mobileView)setMobileMenu(null);}}><HelpIcon name="reset-view" /><span>{labels.resetView}</span></button>
        <button aria-pressed={!showLabels} onClick={()=>{setShowLabels(value=>!value);if(mobileView)setMobileMenu(null);}}><HelpIcon name={showLabels ? 'eye' : 'eye-off'} /><StableButtonLabel labels={[labels.hideLabels, labels.showLabels]} value={showLabels ? labels.hideLabels : labels.showLabels} /></button>
      </div>
      <div className="asset-panel-links preview-model-actions" role="group" aria-label="Preview Model">
        {isIndividualAsset(asset.id) && <button disabled={versions.length !== 1} onClick={()=>{if(editorOpen){setDropNotice(true);return;}setTestDrop(value=>!value);setDropRun(value=>value+1);if(mobileView)setMobileMenu(null);}}><HelpIcon name={testDrop ? 'return' : 'drop'} /><StableButtonLabel labels={[labels.drop, labels.resetProp]} value={testDrop ? labels.resetProp : labels.drop} /></button>}
        <label className="asset-open"><HelpIcon name="open-file" /><span>{labels.openModel}</span><input aria-label={labels.openModel} aria-describedby="open-glb-description" type="file" accept=".glb,model/gltf-binary" onChange={openFile}/></label>
      </div>
      <p id="open-glb-description" className="preview-settings-note">{importedPreview ? 'Temporary preview · Your library is unchanged.' : 'Open GLB previews a local 3D model.'}</p>
      {dropNotice && <div className="drop-editor-notice" role="alert">
        <button className="drop-notice-dismiss" aria-label="Dismiss Drop Test Message" onClick={()=>setDropNotice(false)}>×</button>
        <strong>Close Editor To Drop</strong>
        <p>Close the Model Editor before starting a Drop Test.</p>
        <button className="drop-notice-action" onClick={()=>{endColorChange();setEditorOpen(false);setShowOriginal(false);setSelectedItemId('');setSelectedGroupIds([]);setDropNotice(false);setTestDrop(true);setDropRun(value=>value+1);}}>Close Editor &amp; Drop</button>
      </div>}
      {fileError && <div className="drop-editor-notice" role="alert"><button className="drop-notice-dismiss" aria-label="Dismiss File Error" onClick={()=>setFileError('')}>×</button><strong>Couldn’t Open Model</strong><p>{fileError}</p></div>}
    </FloatingPane>
    <FloatingPane title="Model Editor" right top="280px" className="model-editor-pane" mobileOpen={mobileView && mobileMenu === 'model-editor'} onMobileClose={() => setMobileMenu(null)}>
      <div className="model-editor-actions model-editor-toolbar">
        <button disabled={importedPreview} aria-pressed={editorOpen} onClick={()=>{setTestDrop(false);setDropRun(0);setShowOriginal(false);setEditorOpen(value=>!value);setSelectedItemId('');if(mobileView)setMobileMenu(null);}}><StableButtonLabel labels={[labels.editModel, labels.closeEditor]} value={editorOpen ? labels.closeEditor : labels.editModel} /></button>
        {editorOpen && <button aria-pressed={showOriginal} onClick={()=>{setShowOriginal(value=>!value);setSelectedItemId('');}}><StableButtonLabel labels={[labels.showOriginal, labels.showChanges]} value={showOriginal ? labels.showChanges : labels.showOriginal} /></button>}
      </div>
      {importedPreview && <p>Imported models are preview only. Choose a library asset to edit.</p>}
      {editorOpen && !canEdit && !importedPreview && versions.length===1 && <p>Historical comparison. Choose Final to edit.</p>}
      {editorOpen && versions.length > 1 && <p>Choose a single version to edit its model.</p>}
      {editorOpen && versions.length === 1 && canEdit && <>
        <fieldset className="model-editor-scroll" disabled={saving || showOriginal}>
        <details className="model-editor-section" open>
        <summary>Selection</summary>
        <div className="model-transform-modes" role="group" aria-label="Selection Mode">
          <button aria-pressed={selectionMode==='item'} onClick={()=>{setSelectionMode('item');setSelectedItemId('');}}>{labels.selectItem}</button>
          <button aria-pressed={selectionMode==='element'} onClick={()=>{setSelectionMode('element');setSelectedItemId('');}}>{labels.selectPart}</button>
        </div>

        {visibleParts.length > 12 && <label className="model-select"><span>{labels.filterParts}</span><input type="search" aria-label={labels.filterParts} placeholder="Search names…" value={partFilter} onChange={event=>setPartFilter(event.target.value)} /></label>}
        <label className="model-select"><span>{labels.selectedPart}</span><select aria-label={labels.selectedPart} value={selectedItemId} onChange={event=>{setSelectionMode('element');setSelectedItemId(event.target.value);}}>
          <option value="">{matchingParts.length ? 'Choose a Part' : 'No Matching Parts'}</option>
          {selectedItemId && !matchingParts.some(item=>item.id===selectedItemId) && visibleParts.filter(item=>item.id===selectedItemId).map(item=><option key={item.id} value={item.id}>{item.name} (selected)</option>)}
          {matchingParts.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
        </select></label>
        </details>
        <details className="model-editor-section" open>
          <summary>Transform</summary>
          <div className="model-transform-modes" role="group" aria-label="Transform Mode">
            <button aria-pressed={transformMode==='translate'} onClick={()=>{setTransformMode('translate');}}>{labels.move} (W)</button>
            <button aria-pressed={transformMode==='rotate'} onClick={()=>{setTransformMode('rotate');}}>{labels.rotate} (E)</button>
            <button aria-pressed={transformMode==='scale'} onClick={()=>{setTransformMode('scale');}}>{labels.resize} (R)</button>
          </div>
      {selectionMode === 'element' && <div className="model-editor-actions">
        <button disabled={!selectedItem} onClick={()=>{updateObjectItems(items=>selectedItem.kind==='copy' ? items.filter(item=>item.id!==selectedItemId) : items.map(item=>item.id===selectedItemId?{...item,hidden:true}:item));setSelectedItemId('');}}>{labels.removePart}</button>
        <button disabled={!selectedItem} onClick={()=>duplicateSelected()}>{labels.duplicatePart}</button>
      </div>}
        {selectedItem && <>
          <details className="model-precise"><summary>{labels.precise}</summary><div className="model-fields">
          {['X','Y','Z'].map((axis,index)=><TransformField key={axis} label={`${labels.position} ${axis}`} value={selectedItem.position[index]} step="0.01" onChange={value=>updateSelectedItem('position',selectedItem.position.map((item,i)=>i===index?value:item))}/>)}
          {['X','Y','Z'].map((axis,index)=><TransformField key={`rotate-${axis}`} label={`${labels.rotation} ${axis}°`} value={selectedItem.rotation[index]*180/Math.PI} step="5" onChange={value=>updateSelectedItem('rotation',selectedItem.rotation.map((item,i)=>i===index?value*Math.PI/180:item))}/>)}
          {['X','Y','Z'].map((axis,index)=><TransformField key={`size-${axis}`} label={`${labels.scale} ${axis}`} value={selectedItem.scale[index]} step="0.05" onChange={value=>updateSelectedItem('scale',selectedItem.scale.map((item,i)=>i===index?value:item))}/>)}
          </div></details>
        </>}
        <div className="model-editor-actions model-edit-history">
          <button disabled={showOriginal || !histories.current[editKey]?.past.length} onClick={()=>undoRedo()}>{labels.undo}</button>
          <button disabled={showOriginal || !histories.current[editKey]?.future.length} onClick={()=>undoRedo(true)}>{labels.redo}</button>
          <button disabled={!selectedItem} onClick={()=>{
            const original = (savedModels[editKey]?.items || sourceModels[editKey])?.find(item=>item.id===(selectedItem.sourceId || selectedItemId));
            if (original) updateObjectItems(items=>items.map(item=>item.id===selectedItemId?{...item,position:original.position,rotation:original.rotation,scale:original.scale}:item));
          }}>{labels.resetPart}</button>
        </div>
        </details>
        <details className="model-editor-section model-appearance-section" open>
          <summary>Appearance</summary>
          {colorEntries.length ? <>
            <p className="model-selection-caption">{selectedItem ? selectedItem.name.replace(/_/g, ' ') : `Whole Item · ${colorItems.length} Parts`}</p>
            {selectedMaterials.length > 1 && <label className="model-select"><span>Material</span><select aria-label="Material" value={activeMaterialIndex} onChange={event => { endColorChange(); setMaterialIndex(Number(event.target.value)); }}>{selectedMaterials.map((material, index) => <option key={index} value={index}>{material.name.replace(/_/g, ' ')}</option>)}</select></label>}
            <MaterialColorPicker key={`${editKey}:${selectedItemId || selectedGroupIds.join('|')}:${activeMaterialIndex}`} value={colorValue} mixed={colorEntries.some(entry => entry.color !== colorValue)} textured={colorEntries.some(entry => entry.material.textured)} onChange={changeColor} onStart={startColorChange} onEnd={endColorChange} onReset={resetColor} canReset={colorEntries.some(entry => entry.item.colorOverrides?.[entry.index])} />
          </> : <p className="model-editor-empty">Select an item or part to change its color.</p>}
        </details>
        </fieldset>
        <div className="model-editor-footer">
        <div className="model-editor-actions model-save-actions">
          <button disabled={saving || (!dirty && editKey !== 'tool-pencil:high') || showOriginal} onClick={async()=>{setSaving(true);try { const saved=await saveModel(editKey,objectItems);draftsRef.current={...draftsRef.current,[editKey]:saved};const linked=modelRules.linkedAssemblyKeys(editKey);for(const key of linked){delete draftsRef.current[key];delete histories.current[key];}if(linked.length)setSourceModels(current=>Object.fromEntries(Object.entries(current).filter(([key])=>!linked.includes(key))));setDraftsByAsset(draftsRef.current);setSelectedItemId('');setSaveMessage(hosted ? 'Saved in this browser. All instances now use this version.' : 'Model saved. All instances now use this version.'); } catch (error) {setSaveMessage(error.message); } finally {setSaving(false);}}}><StableButtonLabel labels={[labels.save, 'Saving…']} value={saving ? 'Saving…' : labels.save} /></button>
          <button disabled={saving || showOriginal || !saveAvailability.previous} onClick={async()=>{setSaving(true);try { const previous=await restorePreviousModel(editKey);const affected=[editKey,...modelRules.linkedAssemblyKeys(editKey)];for(const key of affected)delete draftsRef.current[key];if(previous)draftsRef.current[editKey]=previous;localStorage.setItem('pocketWorkshop.modelDrafts.v2',JSON.stringify(draftsRef.current));window.location.reload(); } catch (error) {setSaveMessage(error.message);} finally {setSaving(false);}}}>{labels.previousSave}</button>
          <button disabled={saving || showOriginal || !saveAvailability.next} onClick={async()=>{setSaving(true);try { const previous=await restorePreviousModel(editKey,'next');const affected=[editKey,...modelRules.linkedAssemblyKeys(editKey)];for(const key of affected)delete draftsRef.current[key];if(previous)draftsRef.current[editKey]=previous;localStorage.setItem('pocketWorkshop.modelDrafts.v2',JSON.stringify(draftsRef.current));window.location.reload(); } catch (error) {setSaveMessage(error.message);} finally {setSaving(false);}}}>{labels.nextSave}</button>
        </div>
        {saveMessage && <p role="status">{saveMessage}</p>}
        </div>
      </>}
    </FloatingPane>
    <nav className="mobile-view-bar" aria-label="Mobile Viewer Controls">
      {['Asset Library', 'Preview Settings', 'Model Editor'].map(title => {
        const key = title.toLowerCase().replace(' ', '-');
        return <button key={key} aria-expanded={mobileMenu === key} onClick={() => setMobileMenu(current => current === key ? null : key)}>{title}{key === 'model-editor' && editorOpen && <small>Editing</small>}</button>;
      })}
      <button onClick={() => { setMobileMenu(null); setHelpOpen(true); }}>Help</button>
    </nav>
    {mobileMenu && <button className="mobile-view-scrim" aria-label="Close Mobile Panel" onClick={() => setMobileMenu(null)} />}
    <ControlsHelp open={helpOpen} onOpen={() => setHelpOpen(true)} onClose={() => setHelpOpen(false)} />
  </main>;
}




















