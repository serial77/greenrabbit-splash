"""Generate the botanical decor SVGs (olive sprig, palm frond, leaf mark).

Deliberately Mediterranean (olive, palm) rather than cannabis leaves: they are
soft accents, not product imagery. Output: src/static/assets/img/decor/.
Run: python3 scripts/decor.py
"""
import math
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "src", "static", "assets", "img", "decor")
os.makedirs(OUT, exist_ok=True)

SAGE = "#53705E"
GOLD = "#C2A36B"
OAK = "#A57E5E"


def bezier(p0, p1, p2, p3, t):
    u = 1 - t
    x = u**3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t**3 * p3[0]
    y = u**3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t**3 * p3[1]
    return x, y


def tangent(p0, p1, p2, p3, t):
    a, b = bezier(p0, p1, p2, p3, max(0, t - 0.01)), bezier(p0, p1, p2, p3, min(1, t + 0.01))
    return math.atan2(b[1] - a[1], b[0] - a[0])


def leaf_path(x, y, angle, length, width):
    """Almond-shaped leaf from (x, y) pointing along angle."""
    ca, sa = math.cos(angle), math.sin(angle)
    def pt(u, v):
        return x + u * ca - v * sa, y + u * sa + v * ca
    c1, c2 = pt(length * 0.25, -width), pt(length * 0.75, -width)
    tip = pt(length, 0)
    c3, c4 = pt(length * 0.75, width), pt(length * 0.25, width)
    f = lambda p: f"{p[0]:.1f} {p[1]:.1f}"
    return f"M{x:.1f} {y:.1f}C{f(c1)} {f(c2)} {f(tip)}C{f(c3)} {f(c4)} {x:.1f} {y:.1f}Z", (x, y), tip


def olive_sprig(color, stroke_w, fill_opacity):
    p = [(110, 318), (88, 230), (150, 120), (132, 8)]
    parts = [f'<path d="M{p[0][0]} {p[0][1]}C{p[1][0]} {p[1][1]} {p[2][0]} {p[2][1]} {p[3][0]} {p[3][1]}" fill="none" stroke="{color}" stroke-width="{stroke_w}" stroke-linecap="round"/>']
    n = 13
    for i in range(n):
        t = 0.08 + i * (0.86 / (n - 1))
        x, y = bezier(*p, t)
        side = 1 if i % 2 else -1
        ang = tangent(*p, t) + side * math.radians(38)
        length = 58 - 26 * t
        d, base, tip = leaf_path(x, y, ang, length, 9 - 3 * t)
        parts.append(f'<path d="{d}" fill="{color}" fill-opacity="{fill_opacity}" stroke="{color}" stroke-width="{stroke_w}" stroke-linejoin="round"/>')
        parts.append(f'<path d="M{base[0]:.1f} {base[1]:.1f}L{(base[0] * .25 + tip[0] * .75):.1f} {(base[1] * .25 + tip[1] * .75):.1f}" stroke="{color}" stroke-width="{stroke_w * .6:.2f}" stroke-linecap="round"/>')
    tx, ty = bezier(*p, 1)
    d, _, _ = leaf_path(tx, ty + 4, tangent(*p, 1), 26, 6)
    parts.append(f'<path d="{d}" fill="{color}" fill-opacity="{fill_opacity}" stroke="{color}" stroke-width="{stroke_w}"/>')
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="20 -16 220 350" fill="none">{"".join(parts)}</svg>'


def palm_frond(color, opacity):
    p = [(30, 390), (120, 300), (250, 170), (380, 30)]
    parts = [f'<path d="M{p[0][0]} {p[0][1]}C{p[1][0]} {p[1][1]} {p[2][0]} {p[2][1]} {p[3][0]} {p[3][1]}" stroke="{color}" stroke-opacity="{opacity}" stroke-width="3" stroke-linecap="round"/>']
    n = 22
    for i in range(n):
        t = 0.06 + i * (0.9 / (n - 1))
        x, y = bezier(*p, t)
        base_ang = tangent(*p, t)
        length = 120 - 85 * t
        for side in (-1, 1):
            ang = base_ang + side * math.radians(62 - 18 * t)
            d, _, _ = leaf_path(x, y, ang, length, 6.5 - 3 * t)
            parts.append(f'<path d="{d}" fill="{color}" fill-opacity="{opacity}"/>')
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -30 460 450" fill="none">{"".join(parts)}</svg>'


def leaf_mark(color):
    d, base, tip = leaf_path(2, 14, math.radians(-35), 15, 4.2)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 16" fill="none">'
            f'<path d="{d}" fill="{color}" fill-opacity=".35" stroke="{color}" stroke-width="1.1" stroke-linejoin="round"/>'
            f'<path d="M{base[0]:.1f} {base[1]:.1f}L{(base[0] * .3 + tip[0] * .7):.1f} {(base[1] * .3 + tip[1] * .7):.1f}" stroke="{color}" stroke-width=".8" stroke-linecap="round"/></svg>')


FILES = {
    "olive-line.svg": olive_sprig(SAGE, 1.3, 0.06),
    "olive-gold.svg": olive_sprig(GOLD, 1.2, 0.12),
    "palm-tonal.svg": palm_frond(SAGE, 0.09),
    "palm-oak.svg": palm_frond(OAK, 0.10),
    "leaf-mark.svg": leaf_mark(GOLD),
}
for name, svg in FILES.items():
    with open(os.path.join(OUT, name), "w") as f:
        f.write(svg + "\n")
print("decor ->", OUT, {k: len(v) for k, v in FILES.items()})
