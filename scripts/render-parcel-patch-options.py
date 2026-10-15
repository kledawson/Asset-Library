"""Render a lightweight, text-accurate comparison of parcel patch concepts."""
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo
import math
import random

from PIL import Image, ImageDraw, ImageFont

W, H = 1660, 980
CREAM = '#fff8e9'
PAGE = '#f8f0e2'
CARDBOARD = '#d6ae7e'
BROWN = '#3c291e'
YELLOW = '#e9ae27'
OCHRE = '#d5a12b'
TEAL = '#398d91'
SHADOW = '#b9966e'
font_path = 'C:/Windows/Fonts/ARLRDBD.TTF'
font_title = ImageFont.truetype(font_path, 49)
font_section = ImageFont.truetype(font_path, 25)
font_id = ImageFont.truetype(font_path, 27)
font_label = ImageFont.truetype(font_path, 21)
font_caption = ImageFont.truetype('C:/Windows/Fonts/seguisb.ttf', 18)

image = Image.new('RGB', (W, H), PAGE)
draw = ImageDraw.Draw(image)

def centered(text, cx, top, font, color=BROWN):
    box = draw.textbbox((0, 0), text, font=font)
    draw.text((cx - (box[2]-box[0])/2, top), text, font=font, fill=color)

def cardboard(x, y, width=360, height=302):
    draw.rounded_rectangle((x+5,y+7,x+width+5,y+height+7), radius=21, fill='#ddcfb9')
    draw.rounded_rectangle((x,y,x+width,y+height), radius=21, fill=CARDBOARD)
    rng = random.Random(x * 7 + y)
    for _ in range(620):
        px=x+rng.randrange(12,width-12); py=y+rng.randrange(12,height-12)
        color = '#d0a676' if rng.random() < .5 else '#ddb789'
        draw.line((px,py,px+rng.randrange(1,5),py+rng.randrange(-1,2)),fill=color,width=1)

def patch_rect(x, y, width, height, fill=CREAM, border=None, radius=24):
    draw.rounded_rectangle((x+4,y+6,x+width+4,y+height+6),radius=radius,fill=SHADOW)
    draw.rounded_rectangle((x,y,x+width,y+height),radius=radius,fill=fill)
    if border:
        draw.rounded_rectangle((x+10,y+10,x+width-10,y+height-10),radius=max(8,radius-8),outline=border,width=4)

def postage(x, y, width, height, border):
    draw.rounded_rectangle((x+4,y+6,x+width+4,y+height+6),radius=10,fill=SHADOW)
    draw.rectangle((x+10,y+10,x+width-10,y+height-10),fill=CREAM)
    for px in range(x+16,x+width-12,19):
        draw.ellipse((px-9,y,px+9,y+20),fill=CREAM)
        draw.ellipse((px-9,y+height-20,px+9,y+height),fill=CREAM)
    for py in range(y+16,y+height-12,19):
        draw.ellipse((x,py-9,x+20,py+9),fill=CREAM)
        draw.ellipse((x+width-20,py-9,x+width,py+9),fill=CREAM)
    draw.rounded_rectangle((x+20,y+20,x+width-20,y+height-20),radius=13,outline=border,width=3)

def hands_box(cx, cy, scale=1, light=False):
    ink = CREAM if light else BROWN
    gold = CREAM if light else YELLOW
    def p(dx,dy): return (cx+dx*scale,cy+dy*scale)
    draw.polygon([p(-26,-20),p(0,-32),p(26,-20),p(0,-8)],fill=gold)
    draw.polygon([p(-26,-20),p(0,-8),p(0,18),p(-26,5)],fill=gold)
    draw.polygon([p(0,-8),p(26,-20),p(26,5),p(0,18)],fill=OCHRE if not light else '#e4d5b1')
    draw.line([p(-26,-20),p(0,-8),p(26,-20)],fill=CREAM,width=max(2,int(4*scale)),joint='curve')
    draw.line([p(0,-8),p(0,18)],fill=CREAM,width=max(2,int(3*scale)))
    for sign in (-1,1):
        pts=[p(sign*54,-1),p(sign*54,22),p(sign*37,40),p(sign*18,36)]
        draw.line(pts,fill=ink,width=max(5,int(11*scale)),joint='curve')
        draw.line([p(sign*35,20),p(sign*21,13)],fill=ink,width=max(4,int(8*scale)))
        draw.ellipse((cx+sign*54*scale-5*scale,cy-6*scale,cx+sign*54*scale+5*scale,cy+4*scale),fill=ink)

def umbrella(cx, cy, scale=1, light=False):
    ink=CREAM if light else BROWN
    canopy=CREAM if light else TEAL
    r=43*scale
    upper=[(cx-r+i*2*r/24,cy+24*scale-28*scale*math.sqrt(max(0,1-(-1+i/12)**2))) for i in range(25)]
    lower=[(cx+r,cy+24*scale),(cx+27*scale,cy+18*scale),(cx+13*scale,cy+25*scale),
           (cx,cy+18*scale),(cx-13*scale,cy+25*scale),(cx-27*scale,cy+18*scale),(cx-r,cy+24*scale)]
    draw.polygon(upper+lower,fill=canopy)
    draw.line(upper,fill=ink,width=max(2,int(3*scale)),joint='curve')
    draw.line(lower,fill=ink,width=max(2,int(3*scale)),joint='curve')
    draw.line((cx,cy+21*scale,cx,cy+59*scale),fill=ink,width=max(2,int(4*scale)))
    draw.arc((cx-2*scale,cy+51*scale,cx+20*scale,cy+72*scale),0,180,fill=ink,width=max(2,int(4*scale)))
    for dx,dy in [(-34,-27),(0,-40),(34,-27)]:
        x=cx+dx*scale; y=cy+dy*scale
        draw.polygon([(x,y-8*scale),(x-6*scale,y+4*scale),(x,y+9*scale),(x+6*scale,y+4*scale)],fill=canopy)

def label_pair(cx, top, color=BROWN):
    centered('HANDLE',cx,top,font_label,color)
    centered('WITH CARE',cx,top+24,font_label,color)

xs=[50,450,850,1250]
for x in xs:
    cardboard(x,173)
    cardboard(x,559)

centered('PARCEL PATCH OPTIONS',W/2,39,font_title)
draw.line((55,126,1605,126),fill='#d9c7a9',width=2)
draw.text((56,135),'Y3-INSPIRED: HANDLE WITH CARE',font=font_section,fill=BROWN)
draw.text((56,521),'K7-INSPIRED: KEEP DRY',font=font_section,fill=BROWN)

for x,code,caption in zip(xs,['H1','H2','H3','H4'],
                          ['Rounded frame','Postage edge','Wide label','Ochre patch']):
    draw.text((x+17,188),code,font=font_id,fill=BROWN)
    centered(caption,x+180,443,font_caption)

# H1: closest to the source Y3 shape and hierarchy.
patch_rect(130,217,200,206,border=YELLOW)
hands_box(230,294,.82)
label_pair(230,349)

# H2: a tactile postage edge with the same typography.
postage(530,217,200,206,YELLOW)
hands_box(630,294,.82)
label_pair(630,349)

# H3: short horizontal format that can fit a long parcel side.
patch_rect(890,245,280,154,border=YELLOW,radius=21)
hands_box(955,313,.62)
label_pair(1082,298)

# H4: warmer filled patch, keeping cream ink and the familiar box silhouette.
patch_rect(1330,217,200,206,fill=OCHRE,radius=24)
hands_box(1430,294,.82,light=True)
label_pair(1430,349,CREAM)

for x,code,caption in zip(xs,['D1','D2','D3','D4'],
                          ['Rounded frame','Postage edge','Wide label','Teal patch']):
    draw.text((x+17,574),code,font=font_id,fill=BROWN)
    centered(caption,x+180,829,font_caption)

# D1–D4 reuse the same type size as H1–H4, with a smaller umbrella and drops.
patch_rect(130,603,200,206,border=TEAL)
umbrella(230,665,.76)
centered('KEEP DRY',230,761,font_label)

postage(530,603,200,206,TEAL)
umbrella(630,665,.76)
centered('KEEP DRY',630,761,font_label)

patch_rect(890,631,280,154,border=TEAL,radius=21)
umbrella(957,680,.59)
centered('KEEP DRY',1084,692,font_label)

patch_rect(1330,603,200,206,fill=TEAL,radius=24)
umbrella(1430,665,.76,light=True)
centered('KEEP DRY',1430,761,font_label,CREAM)

centered('Concepts only · Select one yellow and one teal option before parcel changes',W/2,911,font_caption,'#7b6651')
stamp=datetime.now(ZoneInfo('America/Los_Angeles')).strftime('%Y-%m-%d_%H-%M-%S_%z')
directory=Path('assets/raw-assets/play-props')
directory.mkdir(parents=True,exist_ok=True)
file=directory/f'{stamp}_handle-care-keep-dry-patch-variations-v01.png'
image.save(file,optimize=True)
mobile=image.copy(); mobile.thumbnail((900,900))
mobile.save(directory/f'{stamp}_handle-care-keep-dry-patch-variations-mobile-v01.jpg',quality=68,optimize=True)
file.with_suffix('.md').write_text(
    '# Handle With Care and Keep Dry patch variations\n\n'
    'New visual exploration, rendered on the filename timestamp in Pacific time. '
    'Y3 from the earlier yellow parcel ideas and K7 from the Keep Dry patch ideas are the style references. '
    'All lettering uses the same rounded font and size on both patch families. '
    'H1–H4 and D1–D4 are concepts only; no parcel model was changed.\n',encoding='utf-8')
print(file)
