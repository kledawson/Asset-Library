import fs from 'node:fs/promises';
import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

const bytes = await fs.readFile('public/models/editor-sources/workshop-hammer.glb');
const { scene } = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
const meshes = []; scene.traverse(o => { if (o.isMesh) meshes.push(o); });
const materials = Object.fromEntries(meshes.map(o => [o.material.name, o.material]));
function filterTriangles(mesh, keep) {
  const source = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry;
  const p = source.attributes.position, n = source.attributes.normal, positions = [], normals = [];
  for (let i = 0; i < p.count; i += 3) {
    if (!keep(p, i)) continue;
    for (let j = i; j < i + 3; j++) {
      positions.push(p.getX(j), p.getY(j), p.getZ(j));
      normals.push(n.getX(j), n.getY(j), n.getZ(j));
    }
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new T.Float32BufferAttribute(normals, 3));
  mesh.geometry = geometry;
}
for (const mesh of meshes) {
  if (mesh.material.name === 'timber' || /^Claw[ _]|^Handle[ _]Pad/.test(mesh.name)) mesh.removeFromParent();
  else if (mesh.material.name === 'coral') filterTriangles(mesh, (p, i) => Math.min(p.getY(i), p.getY(i + 1), p.getY(i + 2)) > .90);
  else if (mesh.material.name === 'steel') filterTriangles(mesh, (p, i) => Math.min(p.getX(i), p.getX(i + 1), p.getX(i + 2)) >= .394);
}

// Symmetric wooden silhouette, with its top seated inside the steel head.
const wood = new T.Shape();
wood.moveTo(-.019, .931); wood.lineTo(.019, .931);
wood.bezierCurveTo(.015, .82, .029, .65, .025, .59);
wood.quadraticCurveTo(.025, .568, 0, .566);
wood.quadraticCurveTo(-.025, .568, -.025, .59);
wood.bezierCurveTo(-.029, .65, -.015, .82, -.019, .931);
const handle = new T.Mesh(new T.ExtrudeGeometry(wood, { depth: .034, bevelEnabled: true, bevelSize: .002, bevelThickness: .002, bevelSegments: 3, curveSegments: 16 }), materials.timber);
handle.name = 'Wood Handle'; handle.position.set(.46, 0, -.082); scene.add(handle);
for (const [name, z] of [['Front', -.046], ['Back', -.084]]) {
  const pad = new T.Mesh(new RoundedBoxGeometry(.047, .126, .010, 3, .004), materials.coral);
  pad.name = `Grip ${name}`; pad.position.set(.46, .644, z); scene.add(pad);
}

// Loft two matched, chamfered tines. The V slot widens toward the thin nail-lifting tips.
const curve = new T.CubicBezierCurve3(new T.Vector3(.401, .945, 0), new T.Vector3(.348, .955, 0), new T.Vector3(.299, .927, 0), new T.Vector3(.322, .874, 0));
const metal = materials.steel.clone(); metal.metalness = .65; metal.roughness = .36;
for (const side of [-1, 1]) {
  const vertices = [], indices = [], steps = 32, ringSize = 8;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps, point = curve.getPoint(t), tangent = curve.getTangent(t);
    const normal = new T.Vector3(-tangent.y, tangent.x, 0);
    const thickness = T.MathUtils.lerp(.024, .0028, t * t);
    const slot = T.MathUtils.lerp(.002, .014, t);
    const totalWidth = T.MathUtils.lerp(.062, .046, t);
    const width = (totalWidth - slot) / 2, half = width / 2, h = thickness / 2;
    const bevel = Math.min(.0015, h * .45), center = -.065 + side * (slot / 2 + half);
    const section = [[-half + bevel, -h], [half - bevel, -h], [half, -h + bevel], [half, h - bevel], [half - bevel, h], [-half + bevel, h], [-half, h - bevel], [-half, -h + bevel]];
    for (const [z, offset] of section) vertices.push(point.x + normal.x * offset, point.y + normal.y * offset, center + z);
  }
  for (let i = 0; i < steps; i++) for (let j = 0; j < ringSize; j++) {
    const a = i * ringSize + j, b = i * ringSize + (j + 1) % ringSize, c = a + ringSize, d = b + ringSize;
    indices.push(a, c, b, b, c, d);
  }
  for (let j = 1; j < ringSize - 1; j++) {
    indices.push(0, j, j + 1);
    const end = steps * ringSize; indices.push(end, end + j + 1, end + j);
  }
  const geometry = new T.BufferGeometry(); geometry.setAttribute('position', new T.Float32BufferAttribute(vertices, 3)); geometry.setIndex(indices); geometry.computeVertexNormals();
  const claw = new T.Mesh(geometry, metal); claw.name = side < 0 ? 'Claw Front' : 'Claw Back'; scene.add(claw);
}
class Reader { readAsArrayBuffer(blob) { blob.arrayBuffer().then(result => { this.result = result; this.onloadend?.(); }); } readAsDataURL(blob) { blob.arrayBuffer().then(result => { this.result = `data:${blob.type};base64,${Buffer.from(result).toString('base64')}`; this.onloadend?.(); }); } }
globalThis.FileReader = Reader;
await fs.mkdir('.asset-candidates', { recursive: true });
const output = await new GLTFExporter().parseAsync(scene, { binary: true });
await fs.writeFile('.asset-candidates/workshop-hammer-symmetric.glb', Buffer.from(output));
console.log('Symmetric hammer with tapered nail-pulling claw generated.');
