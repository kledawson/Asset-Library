import * as T from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { originalHandles } from './rackOriginalHandles.mjs';

export function refineRackAppearance(scene) {
  scene.updateMatrixWorld(true);
  const meshes=[];scene.traverse(node=>{if(node.isMesh)meshes.push(node);});
  const grey=new T.MeshStandardMaterial({name:'Cabinet Slate Grey',color:new T.Color('#737d81').convertSRGBToLinear(),roughness:.72,metalness:.15});
  const steel=new T.MeshStandardMaterial({name:'Rack Brushed Steel',color:new T.Color('#899398').convertSRGBToLinear(),roughness:.64,metalness:.35});
  const dark=new T.MeshStandardMaterial({name:'Rack Recess',color:new T.Color('#485055').convertSRGBToLinear(),roughness:.9});
  const paper=new T.MeshStandardMaterial({name:'Notepad Paper',color:new T.Color('#eee4cf').convertSRGBToLinear(),roughness:1});
  const cover=new T.MeshStandardMaterial({name:'Notepad Cover',color:new T.Color('#467570').convertSRGBToLinear(),roughness:.92});
  const dotMaterial=meshes.find(mesh=>mesh.name==='shadow')?.material.clone() ?? new T.MeshStandardMaterial({color:new T.Color('#805632').convertSRGBToLinear(),roughness:.95});
  dotMaterial.name='Raised Brown Board Dots';
  function add(name,geometry,material,position,rotation=[0,0,0]){const mesh=new T.Mesh(geometry,material);mesh.name=('Refined_'+name).replace(/[.\[\]:/]/g,'');mesh.position.set(...position);mesh.rotation.set(...rotation);scene.add(mesh);return mesh;}
  function box(name,size,position,material,radius=.002){return add(name,new RoundedBoxGeometry(...size,3,Math.min(radius,Math.min(...size)/3)),material,position);}
  for(const mesh of meshes){
    if(mesh.name==='Refined_Grey_Drawer')continue;
    if(mesh.name.startsWith('Refined_')){mesh.removeFromParent();continue;}
    const material=mesh.material.name;
    if(!['navy','brass','darkWood','grain','coral','shadow','teal','edge'].includes(material))continue;
    const geometry=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone();
    const p=geometry.attributes.position,kept=[],drawer=[];
    for(let i=0;i<p.count;i+=3){
      const points=[0,1,2].map(j=>new T.Vector3().fromBufferAttribute(p,i+j).applyMatrix4(mesh.matrixWorld));
      const all=test=>points.every(test);
      const corner=all(v=>Math.abs(v.x)>.608&&Math.abs(v.x)<.713&&(Math.abs(v.y-.37)<.056||Math.abs(v.y-1.15)<.056)&&v.z>-.155&&v.z<-.089);
      const oldMount=mesh.name==='brass'&&all(v=>v.y>1.025&&v.y<1.08&&v.z>-.155&&v.z<-.074&&[-.49,-.28,.13,.47].some(x=>Math.abs(v.x-x)<.035));
      const hook=material==='navy'&&all(v=>v.y>.995&&v.y<1.08&&v.z>-.19&&v.z<-.04&&[-.51,-.49,-.28,-.27,.13,.47].some(x=>Math.abs(v.x-x)<.035));
      const clutter=['coral','shadow','teal'].includes(material)&&all(v=>v.x>-.625&&v.x<-.345&&v.y>.318&&v.y<.435&&v.z>-.04&&v.z<.15);
      const details=all(v=>Math.abs(v.x)<.7&&v.y>.065&&v.y<.214)&&((material==='grain'&&all(v=>v.z>.134))||(material==='navy'&&all(v=>v.z>.133&&v.y<.083))||(material==='brass'&&all(v=>v.z>.136)));
      const yellow=material==='brass'&&all(v=>v.x>.28&&v.x<.68&&v.y>.045&&v.y<.235&&v.z>.095&&v.z<.135);
      const frame=material==='edge'&&all(v=>Math.abs(v.x)<.73&&v.y>.27&&v.z<-.139);
      const flatDot=material==='shadow'&&all(v=>Math.abs(v.x)<.58&&v.y>.42&&v.y<1.11&&Math.abs(v.z+.136)<.00001);
      if(yellow)drawer.push(i,i+1,i+2);
      else if(!corner&&!hook&&!oldMount&&!clutter&&!details&&!frame&&!flatDot)kept.push(i,i+1,i+2);
    }
    function subset(indices){const result=new T.BufferGeometry();for(const [name,attribute]of Object.entries(geometry.attributes)){const array=[];for(const index of indices)for(let c=0;c<attribute.itemSize;c++)array.push(attribute.array[index*attribute.itemSize+c]);result.setAttribute(name,new T.Float32BufferAttribute(array,attribute.itemSize));}return result;}
    if(drawer.length){const face=new T.Mesh(subset(drawer),grey);face.name='Refined_Grey_Drawer';face.applyMatrix4(mesh.matrixWorld);scene.add(face);}
    mesh.geometry=subset(kept);mesh.geometry.computeBoundingBox();mesh.geometry.computeBoundingSphere();
  }
  // Shallow rounded studs intersect the plank face, giving the dots real relief.
  for(let row=0;row<8;row++)for(let plank=0;plank<7;plank++)for(let side=0;side<2;side++){
    const x=-.537+plank*.179+(side===0?-.045:.045);
    const dot=add(`Board_Dot_${row}_${plank}_${side}`,new T.SphereGeometry(1,12,8),dotMaterial,[x,.43+row*.095,-.1395]);
    dot.scale.set(.006,.006,.005);
  }
  // Small countersunk fasteners directly on the timber replace bulky plates.
  for(const [x,y]of[[-.585,.4],[.585,.4],[-.585,1.115],[.585,1.115]]){
    add(`Corner_Screw_${x}_${y}`,new T.CylinderGeometry(.009,.009,.007,20),steel,[x,y,-.1415],[Math.PI/2,0,0]);
    box(`Corner_Slot_${x}_${y}`,[.01,.0013,.0005],[x,y,-.1378],dark,.0002);
  }
  const rim=new T.MeshStandardMaterial({name:'Rounded Timber Rim',color:new T.Color().setRGB(.7379104087672317,.4178850708380236,.171441100722554),roughness:.8});
  box('Frame_Top',[1.41,.065,.12],[0,1.218,-.2],rim,.022);
  box('Frame_Bottom',[1.41,.065,.12],[0,.305,-.2],rim,.022);
  for(const x of[-.69,.69])box(`Frame_Side_${x}`,[.065,.91,.12],[x,.76,-.2],rim,.022);
  // Short pegs meet the actual tool openings/shoulders, with a screw at the root.
  for(const [id,x,y]of[['Driver',-.51,.985],['Wrench',-.27,1.015],['Cog',.13,.937],['Hammer',.46,.885]]){
    add(`${id}_Mount`,new T.CylinderGeometry(.012,.012,.008,20),steel,[x,y,-.139],[Math.PI/2,0,0]);
    const curve=new T.CatmullRomCurve3([new T.Vector3(x,y,-.145),new T.Vector3(x,y,-.105),new T.Vector3(x,y,-.054),new T.Vector3(x,y+.014,-.047)]);
    add(`${id}_Peg`,new T.TubeGeometry(curve,20,.0045,8,false),steel,[0,0,0]);
  }
  const handles=new T.BufferGeometry();
  handles.setAttribute('position',new T.Float32BufferAttribute(originalHandles.positions,3));
  handles.setAttribute('normal',new T.Float32BufferAttribute(originalHandles.normals,3));
  const handleMaterial=new T.MeshStandardMaterial({name:'Original Yellow Handles',color:new T.Color().fromArray(originalHandles.material.color),roughness:originalHandles.material.roughness,metalness:originalHandles.material.metalness});
  add('Original_Yellow_Handles',handles,handleMaterial,[0,0,0]);
  // A real pocket notebook lying on the shelf under the screwdriver.
  if(!scene.getObjectByName('Asset notebook')&&!scene.getObjectByName('Asset_notebook')&&!scene.getObjectByName('Notebook')) {
  box('Notebook_Cover',[.235,.014,.155],[-.485,.324,.035],cover,.004);
  box('Notebook_Pages',[.221,.022,.143],[-.485,.34,.035],paper,.002);
  box('Notebook_Top',[.221,.004,.143],[-.485,.353,.035],paper,.001);
  for(let i=0;i<6;i++)box(`Notebook_Ruling_${i}`,[.0008,.0004,.105],[-.55+i*.026,.3553,.035],grey,.0001);
  const bindingPoints=[];
  for(let i=0;i<=315;i++){
    // Both ends stop beneath the paper; the upper end is inset from its corner.
    const t=i/315,angle=Math.PI-t*Math.PI*14;
    bindingPoints.push(new T.Vector3(-.581+t*.184,.353+.006*Math.cos(angle),-.033+.006*Math.sin(angle)));
  }
  add('Notebook_Binding',new T.TubeGeometry(new T.CatmullRomCurve3(bindingPoints),630,.0013,8,false),steel,[0,0,0]);
  }
  scene.updateMatrixWorld(true);return scene;
}


