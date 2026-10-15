import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import * as T from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();});}};
const folder='.asset-candidates/parcels/recycling';
const ink=new T.MeshStandardMaterial({name:'Parcel_Bottom_Dark_Ink',color:new T.Color('#44362b').convertSRGBToLinear(),roughness:.94,metalness:0});
const font=new FontLoader().parse(JSON.parse(await fs.readFile('node_modules/three/examples/fonts/optimer_bold.typeface.json','utf8')));
function normalized(group,size){group.updateMatrixWorld(true);const b=new T.Box3().setFromObject(group),c=b.getCenter(new T.Vector3()),scale=size/Math.max(b.max.x-b.min.x,b.max.y-b.min.y);for(const mesh of group.children){mesh.geometry.translate(-c.x,-c.y,0);mesh.geometry.scale(scale,scale,1);}return group;}
function fsc(){
  const group=new T.Group(),tree=new T.Path();tree.moveTo(24,128);tree.lineTo(54,159);tree.bezierCurveTo(65,129,81,39,123,25);tree.bezierCurveTo(145,17,165,30,164,51);tree.bezierCurveTo(187,55,197,80,182,99);tree.bezierCurveTo(211,115,202,151,173,151);tree.lineTo(144,143);tree.lineTo(144,174);tree.lineTo(113,174);tree.lineTo(113,145);tree.lineTo(92,147);
  const geo=SVGLoader.pointsToStroke(tree.getPoints(36),SVGLoader.getStrokeStyle(12,'#44362b','round','round'));geo.scale(1,-1,1);
  const idx=geo.index?.array;if(idx){for(let i=0;i<idx.length;i+=3){const t=idx[i+1];idx[i+1]=idx[i+2];idx[i+2]=t;}}else{const a=geo.attributes.position;for(let i=0;i<a.count;i+=3){const v=new T.Vector3().fromBufferAttribute(a,i+1),w=new T.Vector3().fromBufferAttribute(a,i+2);a.setXYZ(i+1,w.x,w.y,w.z);a.setXYZ(i+2,v.x,v.y,v.z);}}
  geo.computeVertexNormals();group.add(new T.Mesh(geo,ink));
  const text=new T.ShapeGeometry(font.generateShapes('FSC',60),5);text.computeBoundingBox();const size=text.boundingBox.getSize(new T.Vector3());text.scale(157/size.x,157/size.x,1);text.computeBoundingBox();text.translate(129-text.boundingBox.getCenter(new T.Vector3()).x,-245-text.boundingBox.min.y,0);group.add(new T.Mesh(text,ink));return normalized(group,.0095);
}
function ce(){const group=new T.Group();for(const x of [.5,1.36]){const shape=new T.Shape();shape.absarc(x,.5,.5,Math.PI/2,Math.PI*1.5,false);shape.lineTo(x,.14);shape.absarc(x,.5,.36,Math.PI*1.5,Math.PI/2,true);shape.closePath();group.add(new T.Mesh(new T.ShapeGeometry(shape,24),ink));}const bar=new T.Shape();bar.moveTo(.88,.43);bar.lineTo(1.30,.43);bar.lineTo(1.30,.57);bar.lineTo(.88,.57);bar.closePath();group.add(new T.Mesh(new T.ShapeGeometry(bar),ink));return normalized(group,.0095);}
for(const color of ['coral','yellow','teal']){
  const name=`play-parcel-small-${color}.glb`,bytes=await fs.readFile(path.join(folder,name));const {scene}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');let carton;const old=[];scene.traverse(n=>{if(n.name==='Parcel_Carton')carton=n;if(n.name.startsWith('Parcel_Bottom_'))old.push(n);});old.forEach(n=>n.removeFromParent());scene.updateMatrixWorld(true);carton.geometry.computeBoundingBox();const b=carton.geometry.boundingBox;
  for(const [label,group,column,row] of [['FSC',fsc(),1,0],['CE',ce(),0,1]]){
    const markBounds=new T.Box3().setFromObject(group),dimensions=markBounds.getSize(new T.Vector3());
    const x=b.min.x+.005+column*.0125+dimensions.x/2,z=b.max.z-.005-row*.0125-dimensions.y/2;
    const placement=scene.matrixWorld.clone().invert().multiply(carton.matrixWorld).multiply(new T.Matrix4().makeTranslation(x,b.min.y-.00018,z)).multiply(new T.Matrix4().makeRotationX(Math.PI/2));
    for(const [i,mesh] of [...group.children].entries()){mesh.name=`Parcel_Bottom_${label}_${i}`;mesh.userData={assetGroup:'play-parcel-small',bottomMark:label};mesh.applyMatrix4(placement);scene.add(mesh);}
  }
  const candidate=path.resolve(folder,name);await fs.writeFile(candidate,Buffer.from(await new GLTFExporter().parseAsync(scene,{binary:true})));execFileSync(process.execPath,['scripts/stage-asset.cjs',`play-parcel-small:${color}`,candidate]);console.log('Added FSC and CE to small '+color);
}
