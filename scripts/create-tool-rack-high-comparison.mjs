import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeBufferGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { mkdir, writeFile } from 'node:fs/promises';

// Deterministic, editable modeling recipe. No images or paid services required.
const materials = Object.fromEntries(Object.entries({
  timber: ['#be8650', 0.85, 0], plank: ['#cb965f', 0.85, 0],
  darkWood: ['#805632', 0.95, 0], edge: ['#dfad73', 0.8, 0],
  navy: ['#344653', 0.65, 0.25], shadow: ['#57452f', 1, 0],
  brass: ['#dba243', 0.48, 0.35], cream: ['#e4d5b4', 0.7, 0.1],
  coral: ['#d67652', 0.8, 0], teal: ['#357e79', 0.75, 0],
  pot: ['#ad5e3d', 0.9, 0], soil: ['#503d2a', 1, 0],
  leaf: ['#597344', 0.95, 0], leafLight: ['#7c9251', 0.95, 0],
  grain: ['#a77847', 0.95, 0], grainLight: ['#dab17c', 0.95, 0],
  steel: ['#899398', 0.34, 0.72], steelEdge: ['#b4bcc0', 0.26, 0.8],
  steelInset: ['#57636b', 0.48, 0.55], bronze: ['#9d7135', 0.42, 0.65],
}).map(([name, [color, roughness, metalness]]) => [name, new THREE.MeshStandardMaterial({ name, color: new THREE.Color(color).convertSRGBToLinear(), roughness, metalness })]));
const pieces = [];
const propPieces = { wrench: [], cog: [], hammer: [], screwdriver: [], triangle: [], plant: [] };
let activeProp = null;
function mesh(geometry, material, position = [0, 0, 0], rotation = [0, 0, 0]) {
  const part = new THREE.Mesh(geometry, materials[material]);
  part.position.set(...position); part.rotation.set(...rotation); pieces.push(part);
  if (activeProp) propPieces[activeProp].push(part);
  return part;
}
function box(size, position, material, radius = 0.012, rotation) {
  return mesh(new RoundedBoxGeometry(...size, 2, Math.min(radius, Math.min(...size) / 3)), material, position, rotation);
}
function circle(radius, position, material) { return mesh(new THREE.CircleGeometry(radius, 10), material, position); }
function cylinder(radius, height, position, material, rotation) { return mesh(new THREE.CylinderGeometry(radius, radius, height, 12), material, position, rotation); }
function extrude(shape, depth, position, material, angle = 0) {
  const detailed = ['steel', 'steelInset', 'brass', 'bronze'].includes(material);
  return mesh(new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 0.0025, bevelSize: 0.0025, bevelSegments: detailed ? 3 : 1, steps: 1, curveSegments: detailed ? 20 : 12 }), material, position, [0, 0, angle]);
}

// Timber board, individual planks, dark rounded frame and exposed hardware.
box([1.34, 0.87, 0.095], [0, 0.76, -0.22], 'darkWood', 0.035);
for (let i = 0; i < 7; i++) box([0.171, 0.805, 0.068], [-0.537 + i * 0.179, 0.76, -0.173], i % 2 ? 'timber' : 'plank', 0.007);
box([1.41, 0.065, 0.12], [0, 1.218, -0.2], 'edge', 0.018);
box([1.41, 0.065, 0.12], [0, 0.305, -0.2], 'edge', 0.018);
for (const x of [-0.69, 0.69]) {
  box([0.065, 0.91, 0.12], [x, 0.76, -0.2], 'edge');
  box([0.06, 0.34, 0.12], [x, 0.17, -0.22], 'navy');
  box([0.16, 0.07, 0.31], [x, 0.045, -0.15], 'navy');
  for (const y of [0.36, 1.17]) circle(0.014, [x, y, -0.133], 'navy');
}
for (let row = 0; row < 8; row++) for (let col = 0; col < 13; col++) circle(0.006, [-0.57 + col * 0.095, 0.43 + row * 0.095, -0.136], 'shadow');
for (const x of [-0.49, -0.28, 0.13, 0.47]) {
  box([0.027, 0.022, 0.039], [x, 1.057, -0.107], 'navy', 0.004);
  circle(0.008, [x, 1.057, -0.083], 'brass');
}

// Forged steel combination wrench: circular shoulders, open jaw, box end.
activeProp = 'wrench';
const wrench = new THREE.Shape();
wrench.moveTo(-0.026, -0.174);
wrench.bezierCurveTo(-0.018, -0.08, -0.018, 0.02, -0.03, 0.095);
wrench.bezierCurveTo(-0.12, 0.13, -0.118, 0.237, -0.06, 0.278);
wrench.lineTo(-0.041, 0.221); wrench.quadraticCurveTo(-0.046, 0.195, -0.032, 0.189);
wrench.lineTo(0.032, 0.189); wrench.quadraticCurveTo(0.046, 0.195, 0.041, 0.221);
wrench.lineTo(0.06, 0.278);
wrench.bezierCurveTo(0.118, 0.237, 0.12, 0.13, 0.03, 0.095);
wrench.bezierCurveTo(0.018, 0.02, 0.018, -0.08, 0.026, -0.174);
wrench.absarc(0, -0.213, 0.047, Math.acos(0.026 / 0.047), Math.PI - Math.acos(0.026 / 0.047), true);
wrench.closePath();
const wrenchHole = new THREE.Path();
for (let i = 0; i < 24; i++) {
  const angle = -i / 24 * Math.PI * 2, radius = i % 2 ? 0.026 : 0.03;
  const x = Math.cos(angle) * radius, y = -0.213 + Math.sin(angle) * radius;
  if (!i) wrenchHole.moveTo(x, y); else wrenchHole.lineTo(x, y);
}
wrenchHole.closePath(); wrench.holes.push(wrenchHole);
extrude(wrench, 0.024, [-0.27, 0.74, -0.101], 'steel', -0.09);
const wrenchInset = new THREE.Shape();
wrenchInset.moveTo(-0.009, -0.152); wrenchInset.quadraticCurveTo(-0.015, -0.03, -0.009, 0.075);
wrenchInset.quadraticCurveTo(0, 0.088, 0.009, 0.075); wrenchInset.quadraticCurveTo(0.015, -0.03, 0.009, -0.152);
wrenchInset.quadraticCurveTo(0, -0.164, -0.009, -0.152);
extrude(wrenchInset, 0.001, [-0.27, 0.74, -0.073], 'steelInset', -0.09);
mesh(new THREE.TorusGeometry(0.036, 0.002, 5, 32), 'steelEdge', [-0.289, 0.528, -0.073]);
// Mirror the wrench's inset and box-end lip onto the reverse face.
extrude(wrenchInset, 0.001, [-0.27, 0.74, -0.102], 'steelInset', -0.09);
mesh(new THREE.TorusGeometry(0.036, 0.002, 5, 32), 'steelEdge', [-0.289, 0.528, -0.103]);
activeProp = null;

// Twelve machined brass teeth, lightening bores, stepped hub and keyway.
activeProp = 'cog';
const gear = new THREE.Shape();
for (let i = 0; i < 96; i++) {
  const a = i / 96 * Math.PI * 2, profile = [0.108, 0.108, 0.114, 0.133, 0.135, 0.133, 0.114, 0.108], r = profile[i % 8];
  if (i === 0) gear.moveTo(Math.cos(a) * r, Math.sin(a) * r); else gear.lineTo(Math.cos(a) * r, Math.sin(a) * r);
}
gear.closePath(); const hole = new THREE.Path(); hole.absarc(0, 0, 0.032, 0, Math.PI * 2, true); gear.holes.push(hole);
for (let i = 0; i < 6; i++) {
  const a = i / 6 * Math.PI * 2, bore = new THREE.Path();
  bore.absarc(Math.cos(a) * 0.073, Math.sin(a) * 0.073, 0.018, 0, Math.PI * 2, true); gear.holes.push(bore);
}
extrude(gear, 0.037, [0.13, 0.91, -0.103], 'brass', 0.12);
activeProp = null;

// Ball-peen hammer with a rounded striking end.
activeProp = 'hammer';
const handle = new THREE.Shape();
handle.moveTo(-0.021, -0.17); handle.bezierCurveTo(-0.033, -0.1, -0.012, 0.06, -0.017, 0.18);
handle.lineTo(0.017, 0.18); handle.bezierCurveTo(0.012, 0.06, 0.034, -0.1, 0.025, -0.17);
handle.quadraticCurveTo(0, -0.188, -0.021, -0.17);
extrude(handle, 0.034, [0.46, 0.75, -0.086], 'timber', -0.05);
box([0.047, 0.126, 0.046], [0.456, 0.644, -0.065], 'coral', 0.014, [0, 0, -0.05]);
box([0.131, 0.083, 0.071], [0.46, 0.925, -0.065], 'steelInset', 0.016);
mesh(new THREE.CylinderGeometry(0.047, 0.038, 0.047, 24), 'steel', [0.542, 0.925, -0.065], [0, 0, -Math.PI / 2]);
mesh(new THREE.CylinderGeometry(0.047, 0.047, 0.009, 24), 'steelEdge', [0.57, 0.925, -0.065], [0, 0, -Math.PI / 2]);
mesh(new THREE.CylinderGeometry(0.027, 0.032, 0.038, 20), 'steel', [0.38, 0.925, -0.065], [0, 0, -Math.PI / 2]);
mesh(new THREE.SphereGeometry(0.041, 24, 16), 'steel', [0.352, 0.925, -0.065]);
// Place the salmon maker's mark on each visible side of the steel head.
for (const z of [-0.026, -0.104]) box([0.034, 0.009, 0.004], [0.46, 0.947, z], 'coral', 0.002);
for (let i = 0; i < 3; i++) {
  const x = 0.449 + i * 0.02;
  for (const z of [-0.026, -0.104]) box([0.02, 0.002, 0.002], [x, 0.925, z], 'steel', 0.0005);
}
activeProp = null;
activeProp = 'screwdriver';
box([0.061, 0.145, 0.048], [-0.51, 0.7, -0.079], 'teal', 0.018);
box([0.014, 0.17, 0.015], [-0.51, 0.85, -0.079], 'steel', 0.004);
box([0.022, 0.026, 0.008], [-0.51, 0.946, -0.079], 'steelEdge', 0.002);
activeProp = null;

const ruler = new THREE.Shape();
ruler.moveTo(-0.15, -0.095); ruler.lineTo(0.15, -0.095); ruler.lineTo(0.15, 0.145); ruler.closePath();
const rulerHole = new THREE.Path(); rulerHole.moveTo(-0.038, -0.052); rulerHole.lineTo(0.103, 0.06); rulerHole.lineTo(0.103, -0.052); rulerHole.closePath(); ruler.holes.push(rulerHole);
activeProp = 'triangle';
// Match Medium's triangle geometry and seven raised graduations.
mesh(new THREE.ExtrudeGeometry(ruler, { depth: 0.018, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 1, steps: 1, curveSegments: 12 }), 'brass', [0.115, 0.535, -0.102]);
for (let i = 0; i < 7; i++) box([0.003, i % 2 ? 0.01 : 0.019, 0.003], [-0.01 + i * 0.033, 0.452, -0.078], 'shadow', 0.0008);
activeProp = null;

// Three colorful drawers and a shallow storage tray.
box([1.39, 0.085, 0.36], [0, 0.273, -0.07], 'timber');
for (const [x, color] of [[-0.48, 'teal'], [0, 'cream'], [0.48, 'brass']]) {
  box([0.43, 0.225, 0.34], [x, 0.14, -0.07], 'navy');
  box([0.394, 0.183, 0.037], [x, 0.14, 0.115], color);
  box([0.115, 0.021, 0.031], [x, 0.162, 0.153], 'brass');
  for (const bx of [-0.166, 0.166]) circle(0.006, [x + bx, 0.075, 0.135], 'navy');
}
box([0.26, 0.065, 0.18], [-0.485, 0.354, 0.055], 'coral');
box([0.22, 0.014, 0.137], [-0.485, 0.39, 0.055], 'shadow', 0.003);
box([0.105, 0.042, 0.085], [-0.5, 0.411, 0.055], 'teal');

// Terracotta pots with a handful of shaped leaves, as in the reference.
for (const [x, z, size] of [[-0.9, -0.18, 1], [0.89, 0.05, 0.8]]) {
  activeProp = x < 0 ? 'plant' : null;
  mesh(new THREE.CylinderGeometry(0.13 * size, 0.095 * size, 0.19 * size, 14), 'pot', [x, 0.1 * size, z]);
  mesh(new THREE.TorusGeometry(0.127 * size, 0.013 * size, 5, 16), 'pot', [x, 0.194 * size, z], [Math.PI / 2, 0, 0]);
  mesh(new THREE.CircleGeometry(0.116 * size, 16), 'soil', [x, 0.196 * size, z], [-Math.PI / 2, 0, 0]);
  cylinder(0.008 * size, 0.34 * size, [x, 0.36 * size, z], 'darkWood');
  for (let i = 0; i < 8; i++) {
    const a = i * 2.4;
    const leaf = new THREE.Shape(); leaf.moveTo(0, 0); leaf.quadraticCurveTo(-0.072, 0.065, 0, 0.18); leaf.quadraticCurveTo(0.072, 0.065, 0, 0);
    const part = extrude(leaf, 0.006, [x, (0.24 + i * 0.03) * size, z], i % 2 ? 'leaf' : 'leafLight');
    if (x < 0) part.name = `Plant Leaf ${i + 1}`;
    part.rotation.set(0.6, a, 0.5); part.scale.setScalar(size);
  }
  activeProp = null;
}

// Medium revision: warm timber grain, inset corner plates, proper hardware,
// tool contours, dimensional handles, foliage branches and carved pot bands.
function stroke(points, radius, material) {
  const curve = new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point)));
  return mesh(new THREE.TubeGeometry(curve, Math.max(4, points.length * 2), radius, 4, false), material);
}
for (let plank = 0; plank < 7; plank++) {
  const center = -0.537 + plank * 0.179;
  for (let line = 0; line < 10; line++) {
    const x = center - 0.074 + line * 0.016;
    const y = 0.39 + ((line * 13 + plank * 7) % 19) * 0.012;
    stroke(Array.from({length: 5}, (_, i) => [x + Math.sin(i * 1.5 + plank + line) * 0.003, y + i * 0.13, -0.1365]), 0.0008, line % 3 ? 'grain' : 'grainLight');
  }
  if (plank % 2 === 0) {
    for (const size of [1, 1.55]) {
      const knot = mesh(new THREE.TorusGeometry(0.014 * size, 0.001, 4, 18), 'grain', [center + 0.035, 0.59 + plank * 0.045, -0.135]);
      knot.scale.y = 1.9;
    }
  }
}
for (const x of [-0.66, 0.66]) for (const y of [0.37, 1.15]) {
  box([0.095, 0.10, 0.026], [x, y, -0.113], 'navy', 0.012);
  circle(0.012, [x, y, -0.097], 'brass');
  box([0.015, 0.002, 0.003], [x, y, -0.095], 'darkWood', 0.0005, [0, 0, 0.6]);
}
// Curved hooks visually connect the tools to the board.
for (const x of [-0.51, -0.27, 0.13, 0.47]) {
  stroke([[x, 1.052, -0.105], [x, 1.043, -0.069], [x, 1.025, -0.055], [x, 1.011, -0.068]], 0.005, 'navy');
}
// Subtle leather grip seams and timber fibers, kept readable at scene scale.
for (let i = 0; i < 5; i++) box([0.043, 0.002, 0.003], [0.457, 0.602 + i * 0.021, -0.04], 'darkWood', 0.0006);
stroke([[0.462, 0.715, -0.047], [0.46, 0.78, -0.047], [0.466, 0.87, -0.047]], 0.001, 'grain');
// Wrench face marks and jaw bevel highlights make the two ends easier to read.
activeProp = 'wrench';
for (let i = 0; i < 5; i++) {
  const y = 0.57 + i * 0.018;
  const material = i % 2 ? 'steelEdge' : 'steelInset';
  stroke([[-0.279, y, -0.074], [-0.273, y + 0.006, -0.074], [-0.267, y, -0.074]], 0.0009, material);
  stroke([[-0.279, y, -0.102], [-0.273, y + 0.006, -0.102], [-0.267, y, -0.102]], 0.0009, material);
}
activeProp = null;
// Drawer edge reveals and rounded bail pulls instead of block handles.
for (const x of [-0.48, 0, 0.48]) {
  for (const offset of [-0.172, 0.172]) box([0.004, 0.144, 0.003], [x + offset, 0.14, 0.137], 'grain', 0.001);
  stroke([[x - 0.045, 0.166, 0.152], [x - 0.045, 0.148, 0.176], [x + 0.045, 0.148, 0.176], [x + 0.045, 0.166, 0.152]], 0.007, 'brass');
  for (const offset of [-0.045, 0.045]) circle(0.013, [x + offset, 0.166, 0.154], 'brass');
}
// Small handmade details on the pots and foliage, without adding clutter.
for (const [x, z, size] of [[-0.9, -0.18, 1], [0.89, 0.05, 0.8]]) {
  activeProp = x < 0 ? 'plant' : null;
  for (const y of [0.035, 0.16]) mesh(new THREE.TorusGeometry((y > 0.1 ? 0.12 : 0.102) * size, 0.004 * size, 4, 18), 'edge', [x, y * size, z], [Math.PI / 2, 0, 0]);
  for (let i = 0; i < 7; i++) {
    const angle = i * 2.4;
    const base = (0.25 + i * 0.032) * size;
    const end = [x + Math.sin(angle) * 0.09 * size, base + 0.07 * size, z + Math.cos(angle) * 0.09 * size];
    stroke([[x, base, z], [x + Math.sin(angle) * 0.045 * size, base + 0.035 * size, z + Math.cos(angle) * 0.045 * size], end], 0.003 * size, 'darkWood');
  }
  activeProp = null;
}

// Merge by material: many modeled details, only one draw call per material.
const group = new THREE.Group(); group.name = 'Pocket Workshop Tool Rack';
for (const [name, material] of Object.entries(materials)) {
  const geometries = pieces.filter(part => part.material === material).map(part => {
    part.updateMatrix(); let geometry = part.geometry.index ? part.geometry.toNonIndexed() : part.geometry.clone();
    geometry.deleteAttribute('uv'); geometry.applyMatrix4(part.matrix); return geometry;
  });
  if (!geometries.length) continue;
  const part = new THREE.Mesh(mergeVertices(mergeBufferGeometries(geometries)), material); part.name = name; part.castShadow = true; part.receiveShadow = true; group.add(part);
}
class NodeFileReader {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then(result => { this.result = result; this.onloadend?.(); }); }
  readAsDataURL(blob) { blob.arrayBuffer().then(result => { this.result = `data:${blob.type};base64,${Buffer.from(result).toString('base64')}`; this.onloadend?.(); }); }
}
globalThis.FileReader = NodeFileReader;
const output = await new GLTFExporter().parseAsync(group, { binary: true });
await mkdir('public/models', { recursive: true });
await writeFile('public/models/workshop-tool-rack-high.glb', Buffer.from(output));
for (const [prop, sourcePieces] of Object.entries({})) {
  const propGroup = new THREE.Group(); propGroup.name = `Workshop ${prop}`;
  if (prop === 'plant') {
    for (const source of sourcePieces.filter(part => part.name.startsWith('Plant Leaf '))) {
      const leaf = new THREE.Mesh(source.geometry.clone(), source.material);
      leaf.name = source.name;
      leaf.position.copy(source.position); leaf.rotation.copy(source.rotation); leaf.scale.copy(source.scale);
      leaf.castShadow = true; leaf.receiveShadow = true; propGroup.add(leaf);
    }
  }
  for (const [name, material] of Object.entries(materials)) {
    const geometries = sourcePieces.filter(part => part.material === material && !part.name.startsWith('Plant Leaf ')).map(part => {
      part.updateMatrix(); const geometry = part.geometry.index ? part.geometry.toNonIndexed() : part.geometry.clone();
      geometry.deleteAttribute('uv'); geometry.applyMatrix4(part.matrix); return geometry;
    });
    if (geometries.length) { const model = new THREE.Mesh(mergeVertices(mergeBufferGeometries(geometries)), material); model.name = name; model.castShadow = true; propGroup.add(model); }
  }
  const propOutput = await new GLTFExporter().parseAsync(propGroup, { binary: true });
  await writeFile(`public/models/workshop-${prop}.glb`, Buffer.from(propOutput));
}
let triangles = 0; group.traverse(part => { if (part.isMesh) triangles += (part.geometry.index?.count ?? part.geometry.attributes.position.count) / 3; });
console.log(JSON.stringify({ file: 'public/models/workshop-tool-rack-high.glb', bytes: output.byteLength, materials: group.children.length, triangles }));
