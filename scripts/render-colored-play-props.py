"""Archive a geometry-based comparison render of the approved GLBs."""
import json, struct, io, math, sys
from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo
import numpy as np
from PIL import Image, ImageDraw, ImageFont

def load(file):
    b=Path(file).read_bytes(); length=struct.unpack_from('<I',b,12)[0]
    j=json.loads(b[20:20+length]); binary=b[28+length:]
    def accessor(i):
        a=j['accessors'][i]; v=j['bufferViews'][a['bufferView']]
        dtype={5126:'<f4',5125:'<u4',5123:'<u2',5121:'u1'}[a['componentType']]
        n={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[a['type']]
        offset=v.get('byteOffset',0)+a.get('byteOffset',0); item=np.dtype(dtype).itemsize
        return np.ndarray((a['count'],n),dtype=dtype,buffer=binary,offset=offset,strides=(v.get('byteStride',n*item),item)).copy()
    textures=[]
    for t in j.get('textures',[]):
        im=j['images'][t['source']]; v=j['bufferViews'][im['bufferView']]
        textures.append(np.array(Image.open(io.BytesIO(binary[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']])).convert('RGBA')))
    parts=[]
    def visit(index,parent):
        node=j['nodes'][index]; m=np.array(node.get('matrix',np.eye(4).T.reshape(-1))).reshape((4,4)).T
        if 'matrix' not in node:
            # Generated review models use matrices or translation only.
            m[:3,3]=node.get('translation',[0,0,0])
        m=parent@m
        if 'mesh' in node:
            for p in j['meshes'][node['mesh']]['primitives']:
                pos=accessor(p['attributes']['POSITION']); world=np.c_[pos,np.ones(len(pos))]@m.T
                normals=accessor(p['attributes']['NORMAL'])@np.linalg.inv(m[:3,:3])
                indices=accessor(p['indices']).ravel().reshape(-1,3) if 'indices' in p else np.arange(len(pos)).reshape(-1,3)
                mat=j['materials'][p['material']]['pbrMetallicRoughness']; uv=accessor(p['attributes']['TEXCOORD_0']) if 'TEXCOORD_0' in p['attributes'] else None
                texture=textures[mat['baseColorTexture']['index']] if 'baseColorTexture' in mat else None
                rgb=np.array(mat.get('baseColorFactor',[1,1,1,1])[:3]); rgb=np.where(rgb<=.0031308,rgb*12.92,1.055*rgb**(1/2.4)-.055)*255
                parts.append((world[:,:3],normals,indices,uv,texture,rgb))
        for child in node.get('children',[]): visit(child,m)
    for index in j['scenes'][j.get('scene',0)]['nodes']: visit(index,np.eye(4))
    return parts

def render(parts,w=360,h=230,scale=850,ring=False,view_direction=(1.6,1.0,2.0)):
    pixels=np.full((h,w,3),[247,239,221],dtype=np.uint8); depth=np.full((h,w),-np.inf)
    allpos=np.concatenate([p[0] for p in parts]); center=(allpos.min(0)+allpos.max(0))/2
    view=np.array(view_direction,dtype=float); view/=np.linalg.norm(view); right=np.cross([0,1,0],view);right/=np.linalg.norm(right);up=np.cross(view,right)
    light=np.array([-3.,5.,4.]);light/=np.linalg.norm(light)
    if ring:
        base=Image.fromarray(pixels);draw=ImageDraw.Draw(base);points=[]
        for angle in np.linspace(0,2*np.pi,180):
            point=np.array([1.05*np.cos(angle),-.005,1.05*np.sin(angle)])-center
            points.append((float(point@right*scale+w/2),float(-point@up*scale+h/2)))
        draw.line(points,fill='#c8c1b2',width=9);pixels=np.array(base)
    for pos,normals,indices,uv,texture,rgb in parts:
        rel=pos-center; screen=np.c_[rel@right*scale+w/2,-rel@up*scale+h/2,rel@view]
        for tri in indices:
            normal=normals[tri].mean(0);normal/=max(np.linalg.norm(normal),1e-9)
            if normal@view<=0:continue
            p=screen[tri];x0=max(0,int(np.floor(p[:,0].min())));x1=min(w-1,int(np.ceil(p[:,0].max())));y0=max(0,int(np.floor(p[:,1].min())));y1=min(h-1,int(np.ceil(p[:,1].max())))
            if x0>x1 or y0>y1:continue
            yy,xx=np.mgrid[y0:y1+1,x0:x1+1];xx=xx+.5;yy=yy+.5
            denom=(p[1,1]-p[2,1])*(p[0,0]-p[2,0])+(p[2,0]-p[1,0])*(p[0,1]-p[2,1])
            if abs(denom)<1e-9:continue
            a=((p[1,1]-p[2,1])*(xx-p[2,0])+(p[2,0]-p[1,0])*(yy-p[2,1]))/denom
            b=((p[2,1]-p[0,1])*(xx-p[2,0])+(p[0,0]-p[2,0])*(yy-p[2,1]))/denom;c=1-a-b
            z=a*p[0,2]+b*p[1,2]+c*p[2,2];existing=depth[y0:y1+1,x0:x1+1];mask=(a>=-1e-5)&(b>=-1e-5)&(c>=-1e-5)&(z>existing)
            if not mask.any():continue
            shade=.73+.27*max(0,normal@light)
            if texture is not None:
                coords=a[...,None]*uv[tri[0]]+b[...,None]*uv[tri[1]]+c[...,None]*uv[tri[2]]
                tx=np.clip((coords[...,0]*texture.shape[1]).astype(int),0,texture.shape[1]-1);ty=np.clip((coords[...,1]*texture.shape[0]).astype(int),0,texture.shape[0]-1)
                sampled=texture[ty,tx]
                colors=sampled[...,:3]*shade
                alpha=sampled[...,3]/255
                mask &= alpha>.5
            else:
                colors=np.broadcast_to(rgb*shade,mask.shape+(3,))
                alpha=1
            existing[mask]=z[mask];pixels[y0:y1+1,x0:x1+1][mask]=np.clip(colors[mask],0,255).astype(np.uint8)
    return Image.fromarray(pixels)

if '--block-candidates' in sys.argv:
    canvas=Image.new('RGB',(1200,680),'#f7efdd');draw=ImageDraw.Draw(canvas)
    font=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',23)
    folder=Path('.asset-candidates/play-props/color-variants')
    for row,(asset,colors,title,direction) in enumerate([
        ('coral-block',['coral','yellow','teal'],'Timber Block',(1.4,.75,2.1)),
        ('orange-block',['coral','orange','teal'],'Chunky Block',(1.5,2.1,1.0))]):
        draw.text((25,14+row*340),title,font=font,fill='#44362b')
        for col,color in enumerate(colors):
            image=render(load(folder/f'play-{asset}-{color}.glb'),385,285,1350,view_direction=direction)
            x=10+col*395;y=45+row*340
            canvas.paste(image,(x,y));draw.text((x+13,y+255),color.title(),font=font,fill='#44362b')
    stamp=datetime.now(ZoneInfo('America/Los_Angeles')).strftime('%Y-%m-%d_%H-%M-%S_%z')
    file=Path('assets/raw-assets/play-props')/f'{stamp}_flat-block-ends-and-varied-grain-review-v01.png'
    canvas.save(file)
    file.with_suffix('.md').write_text('Offline candidate render of flat wood faces and seed-varied end grain for Timber and Chunky Blocks; not a live browser screenshot.\n')
    print(file);sys.exit(0)

if '--approved-decal-preview' in sys.argv or '--refined-care-preview' in sys.argv:
    canvas=Image.new('RGB',(1120,900),'#f7efdd')
    draw=ImageDraw.Draw(canvas)
    font=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',22)
    source=Path('.asset-candidates/parcels/approved-decals' if '--approved-decal-preview' in sys.argv else '.asset-candidates/parcels/refined-care')
    for row,size in enumerate(['small','large']):
        for col,color in enumerate(['teal','yellow']):
            direction=(2.3,.5,.45) if color=='teal' else (2.3,.5,-.65) if size=='small' else (.3,.45,-2.2)
            scale=1850 if size=='small' else 1150
            image=render(load(source/f'play-parcel-{size}-{color}.glb'),540,390,scale,view_direction=direction)
            x=10+col*550;y=55+row*420
            canvas.paste(image,(x,y));draw.text((x+10,y+8),f'{size.title()} {color.title()}',font=font,fill='#44362b')
    stamp=datetime.now(ZoneInfo('America/Los_Angeles')).strftime('%Y-%m-%d_%H-%M-%S_%z')
    label='approved-decal' if '--approved-decal-preview' in sys.argv else 'candidate'
    file=Path('assets/raw-assets/play-props')/f'{stamp}_d3-h3-parcel-{label}-review-v01.png'
    canvas.save(file)
    file.with_suffix('.md').write_text('Offline geometry render of staged D3 and H3 parcel candidates for placement review; not a live browser screenshot.\n')
    print(file)
    sys.exit(0)

if '--current-care-preview' in sys.argv:
    canvas=Image.new('RGB',(1200,540),'#f7efdd')
    draw=ImageDraw.Draw(canvas)
    font=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',22)
    canvas.paste(render(load('public/models/play-parcel-small-teal.glb'),580,455,2050,view_direction=(2.5,.6,.75)),(5,60))
    canvas.paste(render(load('public/models/play-parcel-large-teal.glb'),580,455,1550,view_direction=(2.5,.6,.75)),(605,60))
    draw.text((20,18),'Current Saved Teal Parcels — Umbrella Patch Reference',font=font,fill='#44362b')
    stamp=datetime.now(ZoneInfo('America/Los_Angeles')).strftime('%Y-%m-%d_%H-%M-%S_%z')
    file=Path('assets/raw-assets/play-props')/f'{stamp}_current-teal-umbrella-patch-reference-v01.png'
    canvas.save(file)
    file.with_suffix('.md').write_text('Offline geometry render of the currently saved teal parcels, archived at filename time as a visual reference for the unchanged umbrella icon. Not a live browser screenshot.\n')
    print(file)
    sys.exit(0)

if '--ramp-preview' in sys.argv or '--ramp-underside-preview' in sys.argv:
    underside='--ramp-underside-preview' in sys.argv
    option='--ramp-underside-preview' if underside else '--ramp-preview'
    source=sys.argv[sys.argv.index(option)+1]
    parts=load(source)
    canvas=Image.new('RGB',(1200,465),'#f7efdd')
    draw=ImageDraw.Draw(canvas)
    font=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',22)
    views=((1.4,-.85,2.0),(-1.4,-.7,-1.9)) if underside else ((1.4,.9,2.0),(2.3,.55,.45))
    canvas.paste(render(parts,590,390,1050,view_direction=views[0]),(5,55))
    canvas.paste(render(parts,590,390,1050,view_direction=views[1]),(605,55))
    draw.text((20,17),'Flush Deck Ramp — Underside Candidate' if underside else 'Flush Deck Ramp — Front / Side Candidate',font=font,fill='#44362b')
    stamp=datetime.now(ZoneInfo('America/Los_Angeles')).strftime('%Y-%m-%d_%H-%M-%S_%z')
    label='flush-deck-ramp-underside-review' if underside else 'flush-deck-ramp-candidate-review'
    file=Path('assets/raw-assets/play-props')/f'{stamp}_{label}-v01.png'
    canvas.save(file)
    file.with_suffix('.md').write_text('Offline geometry review of the staged ramp candidate; not a live browser screenshot.\n')
    print(file)
    sys.exit(0)
if '--set-only' in sys.argv or '--set-candidate' in sys.argv or '--organized-candidate' in sys.argv:
    set_source='.asset-candidates/play-props/play-prop-set-organized.glb' if '--organized-candidate' in sys.argv else '.asset-candidates/play-props/play-prop-set-showcase.glb' if '--set-candidate' in sys.argv else 'public/models/play-props.glb'
    canvas=render(load(set_source),1100,650,480,True);draw=ImageDraw.Draw(canvas)
    font=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',24)
    draw.text((32,24),'Play Prop Set — Organized' if '--organized-candidate' in sys.argv else 'Play Prop Set — Loose Groups',font=font,fill='#44362b')
    stamp=datetime.now(ZoneInfo('America/Los_Angeles')).strftime('%Y-%m-%d_%H-%M-%S_%z')
    label='organized-play-prop-set-candidate' if '--organized-candidate' in sys.argv else 'decorated-cube-front-candidate' if '--set-candidate' in sys.argv else 'grouped-play-prop-set-review'
    file=Path('assets/raw-assets/play-props')/f'{stamp}_{label}-v01.png';canvas.save(file)
    file.with_suffix('.md').write_text('Offline geometry render of the saved grouped Play Prop Set. Records current model placement, not a live browser screenshot.\n')
    canvas.thumbnail((600,600));canvas.save(file.with_name(file.stem+'-mobile.jpg'),quality=50,optimize=True)
    print(file);sys.exit(0)
canvas=Image.new('RGB',(1140,1110),'#f7efdd');draw=ImageDraw.Draw(canvas)
font=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',23);small=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',16)
draw.text((35,24),'Play Props — Saved Color Collection',font=font,fill='#44362b')
for row,(id,label) in enumerate([('coral-block','Timber Block'),('orange-block','Chunky Block'),('wedge','Wedge'),('ball','Play Ball')]):
    draw.text((35,75+row*255),label,font=font,fill='#44362b')
    for col,color in enumerate(['coral','orange','teal'] if id=='orange-block' else ['coral','yellow','teal']):
        image=render(load(f'public/models/play-{id}-{color}.glb'))
        x=20+col*380;y=105+row*255;canvas.paste(image,(x,y));draw.text((x+145,y+205),color.title(),font=small,fill='#44362b')
stamp=datetime.now(ZoneInfo('America/Los_Angeles')).strftime('%Y-%m-%d_%H-%M-%S_%z')
file=Path('assets/raw-assets/play-props')/f'{stamp}_colored-props-geometry-review-v01.png';canvas.save(file)
file.with_suffix('.md').write_text('Geometry-based review render of the saved GLBs, including embedded end-grain textures. This is an offline model comparison render, not a screenshot of the live website.\n')
print(file)
