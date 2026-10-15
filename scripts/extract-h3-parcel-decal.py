"""Extract the approved H3 and D3 prints as clean, resolution-safe decals."""
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo
from PIL import Image, ImageDraw, ImageFilter

source = Path('assets/raw-assets/play-props/2026-10-13_16-28-47_-0700_y3-handle-care-and-current-keep-dry-refined-v01.png')
image = Image.open(source).convert('RGBA')
stamp = datetime.now(ZoneInfo('America/Los_Angeles')).strftime('%Y-%m-%d_%H-%M-%S_%z')

for kind, bounds in [('h3', (958, 148, 1186, 398)), ('d3', (1237, 522, 1495, 784))]:
    decal = image.crop(bounds)
    mask = Image.new('L', decal.size, 0)
    draw = ImageDraw.Draw(mask)
    if kind == 'h3':
        draw.rounded_rectangle((3, 3, 224, 246), radius=33, fill=255)
    else:
        draw.polygon([(43, 2), (213, 2), (255, 44), (255, 216),
                      (213, 259), (43, 259), (3, 216), (3, 44)], fill=255)
    decal.putalpha(mask.filter(ImageFilter.GaussianBlur(.55)))
    decal = decal.resize((912, 1000), Image.Resampling.LANCZOS)
    candidate = Path(f'.asset-candidates/parcels/refined-care/{kind}-decal.png')
    candidate.parent.mkdir(parents=True, exist_ok=True)
    decal.save(candidate, optimize=True)
    archive = Path('assets/raw-assets/play-props') / f'{stamp}_{kind}-clean-decal-v01.png'
    decal.save(archive, optimize=True)
    archive.with_suffix('.md').write_text('Clean decal extracted from the previously approved H3/D3 concept sheet. The timestamp is archive time; original concept was generated earlier.\n')
    print(archive)
