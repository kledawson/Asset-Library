import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Matrix4, Quaternion, Vector3 } from 'three';

// A spring-driven fabric response for the individual sack preview. The GLB is
// the undeformed rest shape; temporary geometry never enters editor saves.
export default function MailSackMotion({ active, body, impacts, children }) {
  const root=useRef();
  const state=useRef({parts:[],velocity:null,x:0,z:0,vx:0,vz:0,squash:0,vs:0,elapsed:0});
  useEffect(()=>{
    const s=state.current;
    return ()=>{for(const part of s.parts){if(part.mesh.geometry===part.animated)part.mesh.geometry=part.original;part.animated.dispose();}state.current={parts:[],velocity:null,x:0,z:0,vx:0,vz:0,squash:0,vs:0,elapsed:0};};
  },[active]);
  useFrame((_,rawDt)=>{
    if(!active || !body.current || !root.current)return;
    const s=state.current,dt=Math.min(rawDt,.033),frame=root.current;
    frame.updateWorldMatrix(true,true);
    const inverseWorld=frame.matrixWorld.clone().invert();
    if(!s.parts.length)frame.traverse(mesh=>{
      if(!mesh.isMesh || !mesh.name.startsWith('Mail_Sack_'))return;
      const original=mesh.geometry,animated=original.clone();mesh.geometry=animated;
      const localToFrame=new Matrix4().multiplyMatrices(inverseWorld,mesh.matrixWorld);
      s.parts.push({mesh,original,animated,vertices:original.attributes.position.array.slice(),localToFrame,frameToLocal:localToFrame.clone().invert()});
    });
    const velocity=body.current.linvel(),rotation=body.current.rotation(),angular=body.current.angvel();
    const acceleration=s.velocity?new Vector3((velocity.x-s.velocity.x)/dt,(velocity.y-s.velocity.y)/dt+9.81,(velocity.z-s.velocity.z)/dt):new Vector3();
    acceleration.clampLength(0,100).applyQuaternion(new Quaternion(rotation.x,rotation.y,rotation.z,rotation.w).invert());
    s.velocity={...velocity};
    const hit=impacts.current;impacts.current=0;s.vs+=Math.min(2.5,hit*1.4);
    s.vx+=(-65*s.x-12*s.vx-acceleration.x*.045-angular.z*.10)*dt;
    s.vz+=(-65*s.z-12*s.vz-acceleration.z*.045+angular.x*.10)*dt;
    s.vs+=(-85*s.squash-13*s.vs)*dt;
    s.x=Math.max(-.045,Math.min(.045,s.x+s.vx*dt));s.z=Math.max(-.045,Math.min(.045,s.z+s.vz*dt));
    s.squash=Math.max(-.1,Math.min(.65,s.squash+s.vs*dt));s.elapsed+=dt;
    if(s.elapsed<1/30)return;s.elapsed=0;
    const p=new Vector3(),world=new Vector3();
    for(const part of s.parts){const attr=part.animated.attributes.position,src=part.vertices;
      for(let i=0;i<attr.count;i++){
        p.set(src[i*3],src[i*3+1],src[i*3+2]).applyMatrix4(part.localToFrame);
        const h=Math.max(0,Math.min(1,(p.y-.025)/.215)),bend=h*h;
        p.x=p.x*(1+s.squash*.14*(1-h))+s.x*bend;
        p.z=p.z*(1+s.squash*.14*(1-h))+s.z*bend;
        p.y-=s.squash*.058*h+Math.hypot(s.x,s.z)*.22*bend;
        // Prevent visible fabric passing through the preview floor when tipped.
        world.copy(p).applyMatrix4(frame.matrixWorld);
        if(world.y<.003){world.y=.003;p.copy(world).applyMatrix4(inverseWorld);}
        p.applyMatrix4(part.frameToLocal);attr.setXYZ(i,p.x,p.y,p.z);
      }
      attr.needsUpdate=true;part.animated.computeVertexNormals();part.animated.computeBoundingSphere();
    }
  });
  return <group ref={root}>{children}</group>;
}
