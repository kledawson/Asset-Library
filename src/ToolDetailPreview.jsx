import { Canvas, useLoader } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Suspense, useMemo } from 'react';
import { Box3, Vector3, CanvasTexture } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
function Stamp({text,position,width,height,color='#444b50'}) {
 const map=useMemo(()=>{const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle=color;ctx.font='bold 78px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,64);return new CanvasTexture(c);},[text,color]);
 return <mesh position={position}><planeGeometry args={[width,height]}/><meshBasicMaterial map={map} transparent depthWrite={false}/></mesh>;
}
function Sample({kind,detail,x}) {
 const {scene}=useLoader(GLTFLoader,`/models/workshop-${kind}.glb`);
 const model=useMemo(()=>{const clone=scene.clone(true);clone.traverse(n=>{if(n.isMesh){n.material=n.material.clone();if(detail&&kind==='wrench'){n.material.roughness=.48;if(n.name==='Handle_relief_front')n.material.color.set('#586168');}}});return clone;},[scene,detail,kind]);
 const box=useMemo(()=>new Box3().setFromObject(model),[model]);const center=box.getCenter(new Vector3());const scale=(kind==="triangle"?1.05:1.4)/box.getSize(new Vector3()).y;
 return <group position={[x,0,0]}><group scale={scale}><group position={[-center.x,-center.y,-center.z]}>
 <primitive object={model}/>
 {detail&&kind==='wrench'&&<><Stamp text="12" position={[-.26,.835,-.065]} width={.04} height={.025}/><Stamp text="—" position={[-.278,.67,-.068]} width={.016} height={.006}/></>}
 {detail&&kind==='triangle'&&<><Stamp text="5" position={[.10,.480,-.076]} width={.02} height={.016} color="#6b5030"/><Stamp text="10" position={[.17,.480,-.076]} width={.025} height={.016} color="#6b5030"/><Stamp text="15" position={[.235,.480,-.076]} width={.025} height={.016} color="#6b5030"/><mesh position={[.244,.48,-.079]}><circleGeometry args={[.004,20]}/><meshStandardMaterial color="#796344" roughness={.6}/></mesh></>}
 </group></group><Html center position={[0,-.94,0]} style={{whiteSpace:'nowrap',fontSize:17,color:'#3e3931'}}>{kind==='wrench'?'Wrench':'Triangle'} · {detail?'Detail idea':'Current'}</Html></group>;
}
export default function ToolDetailComparison(){return <main style={{height:'100vh',background:'#e6dfd1',fontFamily:'system-ui',color:'#3e3931'}}><header style={{textAlign:'center',padding:'24px 0'}}><h1 style={{fontSize:24,margin:0}}>Small details, same simple shapes</h1><p>Wrench: stamped size + softer steel inset. Triangle: tiny measurement numbers + corner fastener.</p></header><Canvas orthographic camera={{position:[0,0,8],zoom:185}} style={{height:'calc(100vh - 130px)'}}><color attach="background" args={['#e6dfd1']}/><ambientLight intensity={.6}/><directionalLight position={[-3,5,4]} intensity={1.25}/><Suspense fallback={null}>{['wrench','wrench','triangle','triangle'].map((kind,i)=><Sample key={i} kind={kind} detail={i%2===1} x={(i-1.5)*1.35}/>)}</Suspense></Canvas></main>}

