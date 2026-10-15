import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import * as T from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

globalThis.FileReader = class { readAsArrayBuffer(blob) { blob.arrayBuffer().then(result => { this.result = result; this.onloadend?.(); }); } };
const runtime = 'C:/Users/dawso/OneDrive/Desktop/portfolio';
await fs.mkdir('.asset-candidates/parcels', { recursive: true });
function polygon(points) {
  const shape = new T.Shape(); shape.moveTo(...points[0]);
  for (const point of points.slice(1)) shape.lineTo(...point);
  shape.closePath(); return shape;
}
for (const color of ['coral','yellow','teal']) {
  const name = `play-parcel-large-${color}.glb`, key = `play-parcel-large:${color}`;
  const bytes = await fs.readFile(path.join(runtime,'public/models',name));
  const { scene } = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  let carton; const old = [];
  scene.traverse(node => { if(node.name === 'Parcel_Carton') carton = node; if(node.name.startsWith('Parcel_Up_Arrows')) old.push(node); });
  if (!carton) throw Error('Missing carton: '+color);
  old.forEach(node => node.removeFromParent()); scene.updateMatrixWorld(true);
  carton.geometry.computeBoundingBox();
  const box = carton.geometry.boundingBox, shapes = [];
  for (const x of [-.008,.008]) shapes.push(polygon([[x-.002,-.013],[x+.002,-.013],[x+.002,.007],[x+.006,.007],[x,.016],[x-.006,.007],[x-.002,.007]]));
  shapes.push(polygon([[-.017,-.020],[.017,-.020],[.017,-.018],[-.017,-.018]]));
  const arrows = new T.Mesh(new T.ExtrudeGeometry(shapes,{depth:.00015,bevelEnabled:false}),new T.MeshStandardMaterial({name:'Parcel_Up_Arrow_Ink',color:new T.Color('#443c30').convertSRGBToLinear(),roughness:.94,metalness:0}));
  arrows.name = 'Parcel_Up_Arrows_Positive_X'; arrows.userData.assetGroup = 'play-parcel-large';
  // The side strap occupies z=-.0152..+.0152. Ink stays z=-.069..-.035,
  // leaving almost 2 cm of bare cardboard between the stamp and strap.
  const transform = scene.matrixWorld.clone().invert().multiply(carton.matrixWorld).multiply(new T.Matrix4().makeTranslation(box.max.x+.00015,-.012,-.052)).multiply(new T.Matrix4().makeRotationY(Math.PI/2));
  arrows.applyMatrix4(transform); scene.add(arrows);
  const candidate = path.resolve('.asset-candidates/parcels',`play-parcel-large-${color}-up-arrows.glb`);
  await fs.writeFile(candidate,Buffer.from(await new GLTFExporter().parseAsync(scene,{binary:true})));
  for (const root of [process.cwd(),runtime]) execFileSync(process.execPath,[path.join(root,'scripts/stage-asset.cjs'),key,candidate],{cwd:root});
}
console.log('Three large parcel candidates staged with +X cardboard arrows clear of the straps.');
