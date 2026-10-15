import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import * as T from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

globalThis.FileReader = class { readAsArrayBuffer(blob) { blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();}); } };
const roots = [process.cwd(),'C:/Users/dawso/OneDrive/Desktop/portfolio'];
const folder = '.asset-candidates/parcels/wide-double-wrap';
await fs.mkdir(folder,{recursive:true});
function roundedPath(Type,width,height,radius) {
  const p=new Type(),x=width/2,y=height/2,r=radius;
  p.moveTo(-x+r,-y);p.lineTo(x-r,-y);p.quadraticCurveTo(x,-y,x,-y+r);
  p.lineTo(x,y-r);p.quadraticCurveTo(x,y,x-r,y);p.lineTo(-x+r,y);p.quadraticCurveTo(-x,y,-x,y-r);
  p.lineTo(-x,-y+r);p.quadraticCurveTo(-x,-y,-x+r,-y);p.closePath();return p;
}
function cutSide(geometry,outline,centerY,sign) {
  const g=geometry.index?geometry.toNonIndexed():geometry.clone(),p=g.attributes.position,n=g.attributes.normal;
  const positions=[],normals=[];
  const emit=poly=>{for(let i=1;i<poly.length-1;i++)for(const v of [poly[0],poly[i],poly[i+1]]){positions.push(...v.p);normals.push(...v.n);}};
  // Convex rounded slot is in the positive X wall, expressed in z/y coordinates.
  const border=outline.map(v=>[v.x,v.y+centerY]);
  for(let i=0;i<p.count;i+=3){let poly=[0,1,2].map(k=>({p:[p.getX(i+k),p.getY(i+k),p.getZ(i+k)],n:[n.getX(i+k),n.getY(i+k),n.getZ(i+k)]}));
    if(!poly.every(v=>v.n[0]*sign>.999)){emit(poly);continue;}
    for(let edge=0;edge<border.length&&poly.length;edge++){
      const a=border[edge],b=border[(edge+1)%border.length];
      const distance=v=>(b[0]-a[0])*(v.p[1]-a[1])-(b[1]-a[1])*(v.p[2]-a[0]);
      const inside=[],outside=[];
      for(let j=0;j<poly.length;j++){
        const v=poly[j],w=poly[(j+1)%poly.length],dv=distance(v),dw=distance(w);
        (dv>=0?inside:outside).push(v);
        if((dv>=0)!==(dw>=0)){const t=dv/(dv-dw),cross={p:v.p.map((value,axis)=>value+(w.p[axis]-value)*t),n:v.n.map((value,axis)=>value+(w.n[axis]-value)*t)};inside.push(cross);outside.push(cross);}
      }
      emit(outside);poly=inside;
    }
    // Discard the remaining polygon inside the slot.
  }
  const result=new T.BufferGeometry();result.setAttribute('position',new T.Float32BufferAttribute(positions,3));result.setAttribute('normal',new T.Float32BufferAttribute(normals,3));return result;
}
for(const color of ['coral','yellow','teal']){
  const name=`play-parcel-large-${color}.glb`,key=`play-parcel-large:${color}`;
  const bytes=await fs.readFile('public/models/'+name);
  const {scene}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  let carton,tape;const remove=[];
  scene.traverse(node=>{if(!node.isMesh)return;if(node.name==='Parcel_Carton')carton=node;
    if(node.name.startsWith('Parcel_Tape')){tape??=node.material;remove.push(node);}
    if(node.name==='Parcel_Paper_Label'||node.name.startsWith('Parcel_Label_')||node.name.startsWith('Parcel_Carry_'))remove.push(node);
  });
  if(!carton||!tape)throw Error('Missing carton or tape: '+color);
  remove.forEach(node=>node.removeFromParent());scene.updateMatrixWorld(true);
  carton.geometry=carton.geometry.clone();carton.geometry.computeBoundingBox();
  const old=carton.geometry.boundingBox.getSize(new T.Vector3()),factor=.25/old.x;
  // Keep the approved shallow front panel and grain; widen their existing geometry.
  carton.geometry.scale(factor,1,1);carton.geometry.computeBoundingBox();
  const bounds=carton.geometry.boundingBox,h=old.y,d=old.z,centerY=.044;
  scene.traverse(node=>{if(!node.isMesh||node===carton)return;
    if(node.name.startsWith('Parcel_Recess_Wall')){node.geometry=node.geometry.clone();node.geometry.scale(factor,1,1);node.position.x*=factor;}
    else if(node.name==='Parcel_Lid_Seam'){node.geometry=node.geometry.clone();node.geometry.scale(factor,1,1);node.position.x*=factor;}
    else if(node.name.startsWith('Parcel_Up_Arrows'))node.position.x=bounds.max.x+.000225;
  });
  const attach=(mesh,name,transform)=>{mesh.name=name;mesh.userData.assetGroup='play-parcel-large';mesh.applyMatrix4(scene.matrixWorld.clone().invert().multiply(carton.matrixWorld).multiply(transform));scene.add(mesh);};
  // Two continuous ribbons around y/z. They never reach either +/-X side wall.
  for(const [index,x]of [[0,-.065],[1,.065]]){
    const shape=roundedPath(T.Shape,d+.002,h+.002,.008);
    shape.holes.push(roundedPath(T.Path,d+.0004,h+.0004,.0072));
    const geometry=new T.ExtrudeGeometry(shape,{depth:.044,bevelEnabled:false,curveSegments:5});
    attach(new T.Mesh(geometry,tape),`Parcel_Tape_Parallel_${index+1}`,new T.Matrix4().makeTranslation(x-.022,0,0).multiply(new T.Matrix4().makeRotationY(Math.PI/2)));
  }
  const slot=roundedPath(T.Shape,.084,.024,.012),points=slot.getPoints(8);
  if(points[0].distanceTo(points[points.length-1])<1e-8)points.pop();
  if(T.ShapeUtils.isClockWise(points))points.reverse();
  const innerMaterial=new T.MeshStandardMaterial({name:'Parcel_Carry_Inner_Cardboard',color:new T.Color('#92734e').convertSRGBToLinear(),roughness:.95,side:T.DoubleSide});
  const dark=new T.MeshStandardMaterial({name:'Parcel_Carry_Interior',color:new T.Color('#57452d').convertSRGBToLinear(),roughness:1});
  for(const sign of [1,-1]){
    carton.geometry=cutSide(carton.geometry,points,centerY,sign);
    const side=sign===1?'Positive_X':'Negative_X',x=sign===1?bounds.max.x:bounds.min.x;
    const wallPositions=[];
    for(let i=0;i<points.length;i++){
      const a=points[i],b=points[(i+1)%points.length];
      const outerA=[x,a.y+centerY,a.x],outerB=[x,b.y+centerY,b.x];
      const innerA=[x-sign*.010,a.y+centerY,a.x],innerB=[x-sign*.010,b.y+centerY,b.x];
      for(const vertex of [outerA,outerB,innerA,outerB,innerB,innerA])wallPositions.push(...vertex);
    }
    const liner=new T.BufferGeometry();liner.setAttribute('position',new T.Float32BufferAttribute(wallPositions,3));liner.computeVertexNormals();
    attach(new T.Mesh(liner,innerMaterial),'Parcel_Carry_Slot_Walls_'+side,new T.Matrix4());
    // Recessed inner walls sit behind actual openings in both side faces.
    attach(new T.Mesh(new T.ShapeGeometry(slot,8),dark),'Parcel_Carry_Slot_Interior_'+side,new T.Matrix4().makeTranslation(x-sign*.010,centerY,0).multiply(new T.Matrix4().makeRotationY(sign*Math.PI/2)));
  }
  const candidate=path.resolve(folder,name);await fs.writeFile(candidate,Buffer.from(await new GLTFExporter().parseAsync(scene,{binary:true})));
  for(const root of roots)execFileSync(process.execPath,[path.join(root,'scripts/stage-asset.cjs'),key,candidate],{cwd:root});
  console.log(color+': wider carton, two front/back ribbons, carrying slots on both sides, no label');
}
