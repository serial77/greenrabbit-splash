"""Compose derived brand assets from the originals in images/.

Outputs (into build/raw/, then resized/encoded by scripts/images.mjs):
  logo-badge.png      circular logo with transparent background
  icon-square.png     rabbit-head crop on brand navy, for favicons
  og.jpg              1200x630 Open Graph image
  map.png             dark-styled static map preview (OpenStreetMap tiles)

Run via `npm run images`.
"""
import io
import math
import os
import urllib.request

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "images")
OUT = os.path.join(ROOT, "build", "raw")
FONTS = os.path.join(ROOT, "node_modules", "@fontsource")
os.makedirs(OUT, exist_ok=True)

NAVY = (1, 18, 34)
GOLD = (222, 200, 150)
CREAM = (239, 230, 210)
LAT, LON = 38.6428757, 0.0509588

LOGO = os.path.join(SRC, "logo.jpeg")
OG_PHOTO = os.path.join(SRC, "48aff171-39e5-49de-9e58-2c9bda786668.jpeg")


def circle_mask(size, scale=4):
    big = Image.new("L", (size * scale, size * scale), 0)
    ImageDraw.Draw(big).ellipse((0, 0, size * scale - 1, size * scale - 1), fill=255)
    return big.resize((size, size), Image.LANCZOS)


def logo_badge():
    # Gold ring measured at x 64..1186, y 67..1175 -> centre (625, 622), r ~562.
    im = Image.open(LOGO).convert("RGB")
    cx, cy, r = 625, 622, 570
    crop = im.crop((cx - r, cy - r, cx + r, cy + r))
    crop.putalpha(circle_mask(crop.width))
    crop.save(os.path.join(OUT, "logo-badge.png"))
    return crop


def icon_square():
    # Rabbit head + ears, legible at favicon sizes.
    im = Image.open(LOGO).convert("RGB")
    box = (290, 170, 960, 840)
    im.crop(box).save(os.path.join(OUT, "icon-square.png"))


def og_image(badge):
    W, H = 1200, 630
    photo = Image.open(OG_PHOTO).convert("RGB")
    photo = ImageOps.fit(photo, (W, H), Image.LANCZOS, centering=(0.6, 0.5))
    # Darken towards the left so the badge and text read cleanly.
    shade = Image.new("L", (W, 1))
    for x in range(W):
        t = x / W
        shade.putpixel((x, 0), int(245 - 150 * min(1, t * 1.4)))
    shade = shade.resize((W, H))
    base = Image.composite(Image.new("RGB", (W, H), NAVY), photo, shade)

    b = badge.resize((360, 360), Image.LANCZOS)
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse((40, 115, 440, 515), fill=(21, 78, 77, 140))
    glow = glow.filter(ImageFilter.GaussianBlur(40))
    base.paste(glow, (0, 0), glow)
    base.paste(b, (60, 135), b)

    d = ImageDraw.Draw(base)
    serif = ImageFont.truetype(os.path.join(FONTS, "cormorant-garamond/files/cormorant-garamond-latin-600-normal.woff2"), 64)
    sans = os.path.join(ROOT, "node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2")
    small = ImageFont.truetype(sans, 24)
    small.set_variation_by_axes([500])
    d.text((470, 215), "Cannabis Social Club", font=serif, fill=CREAM)
    d.text((470, 290), "Calpe · Costa Blanca", font=serif, fill=GOLD)
    d.line((472, 385, 552, 385), fill=GOLD, width=2)
    d.text((470, 410), "ASOCIACIÓN PRIVADA · SOLO SOCIOS", font=small, fill=CREAM)
    base.save(os.path.join(OUT, "og.jpg"), quality=88, optimize=True, progressive=True)


def deg2tile(lat, lon, z):
    n = 2 ** z
    x = (lon + 180) / 360 * n
    y = (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n
    return x, y


def static_map():
    """Fetch a handful of OSM tiles once and style them to match the site."""
    out = os.path.join(OUT, "map.png")
    raw = os.path.join(OUT, "map-tiles.png")
    z, W, H = 17, 1200, 800
    fx, fy = deg2tile(LAT, LON, z)
    px, py = fx * 256, fy * 256
    left, top = px - W / 2, py - H / 2
    if os.path.exists(raw):
        canvas = Image.open(raw).convert("RGB")
    else:
        canvas = fetch_tiles(z, left, top, W, H)
        canvas.save(raw)
    style_map(canvas, out, W, H)


def fetch_tiles(z, left, top, W, H):
    canvas = Image.new("RGB", (W, H))
    for tx in range(int(left // 256), int((left + W) // 256) + 1):
        for ty in range(int(top // 256), int((top + H) // 256) + 1):
            url = f"https://tile.openstreetmap.org/{z}/{tx}/{ty}.png"
            req = urllib.request.Request(url, headers={"User-Agent": "greenrabbit.es static site build (one-off map preview)"})
            tile = Image.open(io.BytesIO(urllib.request.urlopen(req, timeout=20).read())).convert("RGB")
            canvas.paste(tile, (int(tx * 256 - left), int(ty * 256 - top)))
    return canvas


def style_map(canvas, out, W, H):
    # Dark style: invert luminance, then map onto navy -> leaf green.
    g = ImageOps.invert(ImageOps.grayscale(canvas))
    g = ImageOps.autocontrast(g, cutoff=1)
    styled = ImageOps.colorize(g, black=(1, 14, 26), mid=(22, 72, 78), white=(200, 222, 205))
    d = ImageDraw.Draw(styled)
    cx, cy = W / 2, H / 2
    d.ellipse((cx - 34, cy - 34, cx + 34, cy + 34), fill=(222, 200, 150))
    d.ellipse((cx - 13, cy - 13, cx + 13, cy + 13), fill=NAVY)
    styled.save(out)


if __name__ == "__main__":
    badge = logo_badge()
    icon_square()
    og_image(badge)
    static_map()
    print("composed ->", OUT)


def favicon_ico():
    # Multi-size .ico for legacy browsers; PNG icons are produced by images.mjs.
    im = Image.open(os.path.join(OUT, "icon-square.png")).convert("RGBA")
    dest = os.path.join(ROOT, "src", "static")
    os.makedirs(dest, exist_ok=True)
    im.save(os.path.join(dest, "favicon.ico"), sizes=[(16, 16), (32, 32), (48, 48)])


if __name__ == "__main__":
    favicon_ico()
