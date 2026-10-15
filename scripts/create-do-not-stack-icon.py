"""Create a crisp, transparent handling mark for the small Play Props parcels."""

from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

from PIL import Image, ImageDraw


OUT = Path("assets/raw-assets/play-props")
OUT.mkdir(parents=True, exist_ok=True)
stamp = datetime.now(ZoneInfo("America/Los_Angeles")).strftime("%Y-%m-%d_%H-%M-%S_%z")
stem = f"{stamp}_do-not-stack-symbol-v02"
ink = "#242822"

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="2048" height="2048" viewBox="0 0 1024 1024">
  <title>Do Not Stack</title>
  <desc>A package rests below another package crossed out with an X.</desc>
  <g fill="none" stroke="{ink}" stroke-width="28" stroke-linecap="round" stroke-linejoin="round">
    <rect x="271" y="527" width="482" height="284" rx="9"/>
    <path d="M512 545v248"/>
    <rect x="350" y="194" width="324" height="226" rx="9"/>
    <path stroke-width="36" d="M383 225 641 389m0-164L383 389"/>
  </g>
</svg>'''
(OUT / f"{stem}.svg").write_text(svg, encoding="utf-8")

# Draw at four times the final resolution for smooth edges at print size.
scale = 8
im = Image.new("RGBA", (1024 * scale, 1024 * scale), (0, 0, 0, 0))
draw = ImageDraw.Draw(im)
rgb = (36, 40, 34, 255)


def box(rect, radius=9, width=28):
    draw.rounded_rectangle(
        tuple(round(value * scale) for value in rect),
        radius=radius * scale,
        outline=rgb,
        width=width * scale,
    )


def line(coords, width=28):
    pts = [(round(x * scale), round(y * scale)) for x, y in coords]
    draw.line(pts, fill=rgb, width=width * scale, joint="curve")
    rad = width * scale // 2
    for x, y in (pts[0], pts[-1]):
        draw.ellipse((x - rad, y - rad, x + rad, y + rad), fill=rgb)


box((271, 527, 753, 811))
line([(512, 545), (512, 793)])
box((350, 194, 674, 420))
line([(383, 225), (641, 389)], width=36)
line([(641, 225), (383, 389)], width=36)
im.resize((2048, 2048), Image.Resampling.LANCZOS).save(OUT / f"{stem}.png", optimize=True)
print((OUT / f"{stem}.png").resolve())
