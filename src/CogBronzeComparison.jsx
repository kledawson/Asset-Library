import { Canvas, useLoader } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Suspense, useMemo } from 'react';
import { CanvasTexture, MeshStandardMaterial, sRGBEncoding } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { useCogReflectionMap } from './CogMetalFinish';

const finishes = [
  ['A · Dark rings', -.36],
  ['B · Bronze rim', 0],
  ['C · Double rings', .36],
];
function Samples() {
  const { scene } = useLoader(GLTFLoader, '/models/workshop-cog.glb');
  const reflection = useCogReflectionMap(true);
  const geometry = useMemo(() => { let result; scene.traverse(node => { if(node.isMesh) result=node.geometry; }); return result; }, [scene]);
  const materials = useMemo(() => finishes.map((_,index) => {
    const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=1024;
    const context=canvas.getContext('2d');const pixels=context.createImageData(1024,1024);
    const roughCanvas=document.createElement('canvas');roughCanvas.width=1024;roughCanvas.height=1024;
    const roughContext=roughCanvas.getContext('2d');const roughPixels=roughContext.createImageData(1024,1024);
    const random=key=>{let v=Math.imul(key^19391,1597334677);v=Math.imul(v^(v>>>16),2246822519);return((v^(v>>>13))>>>0)/4294967295;};
    const noise=(value,seed=0)=>{const cell=Math.floor(value),f=value-cell,t=f*f*(3-2*f);return random(cell+seed)*(1-t)+random(cell+1+seed)*t;};
    for(let y=0;y<1024;y++)for(let x=0;x<1024;x++) {
      const r=Math.hypot(x/1024-.5,y/1024-.5)*.272;
      const hub=r>.032&&r<.0535;
      const ring=index===0?r>.104&&r<.109:index===1?r>.098&&r<.114:(r>.061&&r<.064||r>.102&&r<.107);
      const bronze=hub||ring;
      const coordinate=bronze?r/.0014:x/9+(noise(y/130,73)-.5)*1.2;
      const grain=(noise(coordinate,17)*2-1)*(.2+.8*noise(y/48,Math.floor(coordinate)*31))*12;
      const base=bronze?[140,108,66]:[195,161,83];
      const i=(y*1024+x)*4;
      for(let c=0;c<3;c++)pixels.data[i+c]=Math.round(base[c]+grain);
      pixels.data[i+3]=255;
      roughPixels.data[i]=255;roughPixels.data[i+1]=Math.round(176+grain);roughPixels.data[i+2]=255;roughPixels.data[i+3]=255;
    }
    context.putImageData(pixels,0,0);roughContext.putImageData(roughPixels,0,0);
    const colorMap=new CanvasTexture(canvas);colorMap.encoding=sRGBEncoding;
    const roughMap=new CanvasTexture(roughCanvas);
    return new MeshStandardMaterial({map:colorMap,metalness:.82,roughness:1,roughnessMap:roughMap,
      envMap:reflection,envMapIntensity:.24});
  }), [reflection]);
  return finishes.map(([label,x],index)=><group key={label} position={[x,0,0]}>
    <mesh geometry={geometry} material={materials[index]} rotation={[.08,.32,0]}/>
    <Html center position={[0,-.175,0]} style={{whiteSpace:'nowrap',fontSize:17,fontWeight:600,color:'#3e3931'}}>{label}</Html>
  </group>);
}
export default function CogBronzeComparison() {
  return <main style={{height:'100vh',background:'#e6dfd1',fontFamily:'system-ui',color:'#3e3931'}}>
    <div style={{padding:'22px 32px 0',textAlign:'center'}}><h1 style={{fontSize:24,margin:0}}>Brass + bronze variations</h1><p style={{margin:'8px 0'}}>Less shine · visible irregular brushing · deeper bronze accents</p></div>
    <Canvas dpr={[1,1.5]} camera={{position:[0,0,1.45],fov:34}} style={{height:'calc(100vh - 100px)'}}>
      <color attach="background" args={['#e6dfd1']}/><ambientLight intensity={.4}/>
      <directionalLight position={[-3,5,4]} intensity={1.25} color="#fff0d7"/>
      <Suspense fallback={null}><Samples/></Suspense>
    </Canvas>
  </main>;
}
