import { createPortal, useLoader, useThree } from '@react-three/fiber';
import { Edges, TransformControls } from '@react-three/drei';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Vector3, Matrix4, Quaternion, Euler } from 'three';

import ItemSelectionBounds from './RackItemBounds';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { addCogReflection, isCogPart } from './CogFinishStable';
export function EditableModel({ url, assetId, cogReflection, items, selectedItem, setSelectedItem, transformMode, onTransformCommit, onGroupCommit, onPartsLoaded, onExit, readOnly = false, selectionMode = "item" }) {
  const { scene: source } = useLoader(GLTFLoader, url);
  const world = useThree(state => state.scene);
  const orbit = useThree(state => state.controls);
  const refs = useRef(new Map());
  const [target, setTarget] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const groupRefs = useRef(new Map());
  const manipulating = useRef(false);
  const releasedAt = useRef(0);
  const pendingSelection = useRef(null);
  const cancelSelection = () => { clearTimeout(pendingSelection.current); pendingSelection.current = null; };
  useEffect(() => () => clearTimeout(pendingSelection.current), []);
  const data = useMemo(() => {
    source.updateMatrixWorld(true);
    const parts = [];
    source.traverse(node => {
      if (!node.isMesh) return;
      const position = new Vector3(); const quaternion = node.quaternion.clone(); const scale = new Vector3();
      node.matrixWorld.decompose(position, quaternion, scale);
      // Preserve leaf attachment pivots; center other mesh pivots for easy editing.
      const geometry = node.geometry.clone();
      if (!/Plant.Leaf|^Leaf[ _]/i.test(node.name)) {
        geometry.computeBoundingBox();
        const center = geometry.boundingBox.getCenter(new Vector3());
        geometry.translate(-center.x, -center.y, -center.z);
        position.add(center.multiply(scale).applyQuaternion(quaternion));
      }
      const euler = node.rotation.clone().setFromQuaternion(quaternion, 'XYZ');
      const material = isCogPart(node,assetId) && cogReflection ? (Array.isArray(node.material) ? node.material.map(value=>addCogReflection(value,cogReflection)) : addCogReflection(node.material,cogReflection)) : node.material;
      let ancestor=node;let assetGroup=node.userData.assetGroup;while(ancestor&&!assetGroup){if(/^Asset[ _]/.test(ancestor.name))assetGroup=ancestor.name.replace(/^Asset[ _]/,'');ancestor=ancestor.parent;}
      if (!assetGroup && assetId.startsWith('tool-') && !assetId.startsWith('tool-rack:')) assetGroup = assetId.split(':')[0].slice(5);
      parts.push({ assetGroup, id: `part-${parts.length}`, name: node.name || `Part ${parts.length + 1}`, geometry, material,
        position: position.toArray(), rotation: [euler.x, euler.y, euler.z], scale: scale.toArray() });
    });
    return parts;
  }, [source,assetId,cogReflection]);
  const originals = useMemo(() => data.map(({ geometry, material, ...part }) => ({ ...part, kind: 'base', sourceId: part.id })), [data]);
  useEffect(() => { onPartsLoaded(assetId, originals); }, [assetId, onPartsLoaded, originals]);
  useEffect(() => () => { if (orbit) orbit.enabled = true; data.forEach(part => part.geometry.dispose()); }, [orbit, data]);
  useEffect(()=>{if(readOnly)return;const clear=()=>{cancelSelection();if(!manipulating.current&&performance.now()-releasedAt.current>150){setSelectedGroup(null);setSelectedItem('');}};const key=event=>{if(event.key==='Escape'&&!/INPUT|TEXTAREA|SELECT/.test(event.target.tagName)){if(selectedItem)setSelectedItem('');else setSelectedGroup(null);}};window.addEventListener('rack-editor-clear',clear);window.addEventListener('keydown',key);return()=>{window.removeEventListener('rack-editor-clear',clear);window.removeEventListener('keydown',key);};},[selectedItem,setSelectedItem,readOnly]);
  useEffect(() => { clearTimeout(pendingSelection.current); setSelectedGroup(null); }, [selectionMode]);
  const objects = items.length ? items : originals;
  const sources = new Map(data.map(part => [part.id, part]));
  useLayoutEffect(() => { setTarget(readOnly ? null : selectedItem ? refs.current.get(selectedItem) : groupRefs.current.get(selectedGroup) || null); }, [selectedItem, selectedGroup, items, readOnly]);
  return <group dispose={null}>
    {(() => {
      const buckets=new Map();objects.filter(item=>!item.hidden).forEach(item=>{const part=sources.get(item.sourceId||item.id);const key=part?.assetGroup||item.assetGroup||item.id;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(item);});
      return [...buckets].map(([key,members])=>{const grouped=members.some(item=>sources.get(item.sourceId||item.id)?.assetGroup);const center=grouped?members.reduce((v,item)=>v.add(new Vector3(...item.position)),new Vector3()).divideScalar(members.length):new Vector3();
        return <group key={key} position={center.toArray()} ref={object=>{if(object)groupRefs.current.set(key,object);}}>
          {members.map(item=>{const part=sources.get(item.sourceId||item.id);if(!part)return null;return <group key={item.id} ref={object=>{if(object)refs.current.set(item.id,object);}} position={new Vector3(...item.position).sub(center).toArray()} rotation={item.rotation} scale={item.scale}>
            <mesh geometry={part.geometry} material={part.material} castShadow receiveShadow onDoubleClick={readOnly ? undefined : event=>{event.stopPropagation();cancelSelection();setSelectedGroup(null);setSelectedItem('');onExit?.();}} onClick={readOnly ? undefined : event=>{
              if(event.delta>4||manipulating.current||performance.now()-releasedAt.current<100)return;event.stopPropagation();
              
              cancelSelection();
              if (event.nativeEvent.detail >= 2) { setSelectedGroup(null); setSelectedItem(''); onExit?.(); return; }
              pendingSelection.current = setTimeout(() => {
              if(!grouped&&selectedGroup){setSelectedGroup(null);setSelectedItem('');return;}
              setSelectedGroup(grouped ? key : null);
              setSelectedItem(selectionMode === 'element' || !grouped ? item.id : '');
              }, 200);
            }}>{!readOnly&&(item.id===selectedItem||(!selectedItem&&selectedGroup===key))&&<Edges color={selectedItem?'#d97935':'#397d78'} threshold={24}/>}</mesh>
          </group>;})}
          {!readOnly&&selectedGroup===key&&groupRefs.current.get(key)&&<ItemSelectionBounds object={groupRefs.current.get(key)} context={!!selectedItem}/>}
        </group>;
      });
    })()}
    {/* Helpers have huge picking planes. Keep them outside model bounds and centering. */}
    {target && !objects.find(item => item.id === selectedItem)?.hidden && createPortal(
      <TransformControls object={target} mode={transformMode} space="local" size={0.85}
        onMouseDown={event => { if (event) manipulating.current = true; }}
        onMouseUp={event => {
          if (!event || !manipulating.current) return;
          manipulating.current = false; releasedAt.current = performance.now();
          if(!selectedItem&&selectedGroup){target.updateMatrix();const changes={};target.children.forEach(child=>{const entry=[...refs.current].find(([,object])=>object===child);if(!entry)return;child.updateMatrix();const combined=new Matrix4().multiplyMatrices(target.matrix,child.matrix),p=new Vector3(),q=new Quaternion(),scale=new Vector3();combined.decompose(p,q,scale);const e=new Euler().setFromQuaternion(q);changes[entry[0]]={position:p.toArray(),rotation:[e.x,e.y,e.z],scale:scale.toArray()};});onGroupCommit(assetId,changes);target.rotation.set(0,0,0);target.scale.set(1,1,1);}
          else {const p=target.position.clone().add(target.parent.position);onTransformCommit(assetId,selectedItem,{position:p.toArray(),rotation:[target.rotation.x,target.rotation.y,target.rotation.z],scale:target.scale.toArray()});}
        }} />, world)}
  </group>;
}

