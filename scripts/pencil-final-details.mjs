import fs from 'node:fs/promises';import * as T from 'three';import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';import {mergeBufferGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
globalThis.FileReader=class{readAsArrayBuffer(b){b.arrayBuffer().then(r=>{this.result=r;this.onloadend?.();});}};
const b=await fs.readFile('public/models/workshop-pencil.glb');const {scene}=await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');
const ferrule=scene.getObjectByName('Refined_Pencil_Ferrule'),eraser=scene.getObjectByName('Refined_Pencil_Eraser'),shaft=scene.getObjectByName('Refined_Pencil_Shaft');
function turned(profile){const geo=new T.LatheGeometry(profile.map(([r,x])=>new T.Vector2(r,x)),48);geo.rotateZ(-Math.PI/2);return geo;}
// Two narrow recesses, with softly bevelled rims on the round collar.
ferrule.geometry=turned([[0,-.0045],[.00518,-.0045],[.0054,-.00428],[.0054,-.00275],[.00522,-.00262],[.00522,-.00235],[.0054,-.00222],[.0054,.00222],[.00522,.00235],[.00522,.00262],[.0054,.00275],[.0054,.00428],[.00518,.0045],[0,.0045]]);
// A slightly shorter eraser with a gently rounded exposed cap.
eraser.position.x=ferrule.position.x-.0045-.00525;
eraser.geometry=turned([[0,-.00525],[.00475,-.00525],[.00508,-.00512],[.0053,-.00487],[.0054,-.00452],[.0054,.00525],[0,.00525]]);
const existing=[];scene.traverse(n=>{if(/DL_Stamp/.test(n.name))existing.push(n);});existing.forEach(n=>n.removeFromParent());
const font={D:['110','101','101','101','110'],L:['100','100','100','100','111']},unit=.0008,pixels=[];
for(let d=0;d<2;d++)for(let r=0;r<5;r++)for(let c=0;c<3;c++)if(font['DL'[d]][r][c]==='1'){const geo=new T.PlaneGeometry(unit*.9,unit*.9);geo.rotateX(-Math.PI/2);geo.translate((d*4+c-3)*unit,0,(r-2)*unit);pixels.push(geo);}
const stamp=new T.Mesh(mergeBufferGeometries(pixels),new T.MeshStandardMaterial({name:'Pencil DL ink',color:new T.Color('#665137').convertSRGBToLinear(),roughness:.9}));stamp.name='Refined_Pencil_DL_Stamp';stamp.userData.assetGroup='pencil';stamp.position.set(shaft.position.x-.041,shaft.position.y+.00470,shaft.position.z);scene.add(stamp);
await fs.writeFile('.asset-candidates/pencil-final-details.glb',Buffer.from(await new GLTFExporter().parseAsync(scene,{binary:true})));
console.log('DL faces world +Y (up on the notebook); collar has two recessed rings; eraser is shorter with a rounded cap.');
