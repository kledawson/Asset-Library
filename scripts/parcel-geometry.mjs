import * as T from 'three';
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

export { roundedPath, cutSide };
