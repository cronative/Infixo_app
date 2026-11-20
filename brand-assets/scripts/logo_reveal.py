"""Inflixo logo reveal: frames for a 1080p video.
usage: python logo_reveal.py <brand-assets dir> <out frames dir> <W> <H>
"""
import sys, os, math
from PIL import Image, ImageDraw, ImageFilter, ImageChops, ImageEnhance, ImageFont

ASSETS, OUT, W, H = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
os.makedirs(OUT, exist_ok=True)
FPS, SECS = 30, 4.6
N = round(FPS * SECS)
PORTRAIT = H > W
CREAM = (255, 248, 244)
FONT = "/System/Library/Fonts/Avenir Next.ttc"

# ── easing ──
def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))
def prog(t, a, b): return clamp((t - a) / (b - a))
def ease_out_cubic(p): return 1 - (1 - p) ** 3
def ease_in_out(p): return 4 * p ** 3 if p < 0.5 else 1 - (-2 * p + 2) ** 3 / 2
def ease_out_back(p, s=1.7):
    p -= 1
    return 1 + (s + 1) * p ** 3 + s * p ** 2
def lerp(a, b, p): return a + (b - a) * p

# ── mark (1024 working copy), split into circle and two sparks ──
mark = Image.open(f"{ASSETS}/source/inflixo-mark-2048.png").convert("RGBA").resize((1024, 1024), Image.LANCZOS)
def region(img, keep):
    out = Image.new("RGBA", img.size, (0, 0, 0, 0)); m = Image.new("L", img.size, 0)
    ImageDraw.Draw(m).rectangle(keep, fill=255)
    out.paste(img, (0, 0), ImageChops.multiply(img.split()[-1], m))
    return out
circle = region(mark, (0, 330, 703, 1024))     # x<703, y>=330 (2048 coords /2)
def shape(img, seed):
    a = img.split()[-1].point(lambda v: 255 if v > 20 else 0)
    ImageDraw.floodfill(a, seed, 128)
    m = a.point(lambda v: 255 if v == 128 else 0).filter(ImageFilter.MaxFilter(5))
    out = Image.new("RGBA", img.size, (0, 0, 0, 0)); out.paste(img, (0, 0), ImageChops.multiply(img.split()[-1], m))
    return out
spark1 = shape(mark, (690, 160))   # upper spark
spark2 = shape(mark, (845, 320))   # right spark
C_BOX = circle.split()[-1].getbbox()           # circle bbox in mark coords
C_D = C_BOX[2] - C_BOX[0]
C_CX, C_CY = (C_BOX[0] + C_BOX[2]) / 2, (C_BOX[1] + C_BOX[3]) / 2
S1_ANCHOR = (592, 298)   # spark ends nearest the circle (mark coords)
S2_ANCHOR = (706, 408)

def scaled_about(img, s, anchor):
    """img scaled by s about anchor, on a canvas the same size as img."""
    if s <= 0.001: return Image.new("RGBA", img.size, (0, 0, 0, 0))
    w, h = img.size
    sm = img.resize((max(1, round(w * s)), max(1, round(h * s))), Image.LANCZOS)
    out = Image.new("RGBA", img.size, (0, 0, 0, 0))
    out.alpha_composite(sm, (round(anchor[0] - anchor[0] * s), round(anchor[1] - anchor[1] * s)))
    return out

def fade(img, a):
    if a >= 0.999: return img
    out = img.copy(); out.putalpha(img.split()[-1].point(lambda v: round(v * a))); return out

# ── wordmark: letters as separate layers, plus the o+sparks tail ──
WM = Image.open(f"{ASSETS}/source/inflixo-wordmark-title-gulaal-play.png").convert("RGBA")
wa = WM.split()[-1].point(lambda v: 255 if v > 30 else 0)
def comp_mask(seed):
    tmp = wa.copy(); ImageDraw.floodfill(tmp, seed, 128)
    return tmp.point(lambda v: 255 if v == 128 else 0)
# seeds (native wordmark coords) per letter group; found from the component scan
GROUPS = {
    "I": [(20, 120)], "n": [(70, 150)], "f": [(200, 150)], "l": [(264, 120)],
    "i": [(312, 140), (314, 40)], "x": [(360, 160)],
}
def find_seed(pt):
    x0, y0 = pt
    for r in range(0, 30):
        for dx in range(-r, r + 1):
            for dy in (-r, r):
                for (x, y) in ((x0 + dx, y0 + dy), (x0 + dy, y0 + dx)):
                    if 0 <= x < WM.width and 0 <= y < WM.height and wa.getpixel((x, y)) == 255:
                        return (x, y)
    raise SystemExit(f"no seed near {pt}")
letter_masks = {}
for k, seeds in GROUPS.items():
    m = Image.new("L", WM.size, 0)
    for sd in seeds: m = ImageChops.lighter(m, comp_mask(find_seed(sd)))
    letter_masks[k] = m
letters_union = Image.new("L", WM.size, 0)
for m in letter_masks.values(): letters_union = ImageChops.lighter(letters_union, m)
O_BOX_N = (451, 65, 574, 185)  # the "o" circle in the native wordmark

# Final layout
WM_W = 760 if PORTRAIT else 1000
K = WM_W / WM.width
wm_s = WM.resize((round(WM.width * K), round(WM.height * K)), Image.LANCZOS)
WM_X = (W - wm_s.width) // 2 + round(12 * K)   # optical centre (spark lines hang right)
WM_Y = (H - wm_s.height) // 2 - (60 if PORTRAIT else 50)
def letter_layer(k):
    m = letter_masks[k].resize(wm_s.size, Image.LANCZOS)
    out = Image.new("RGBA", wm_s.size, (0, 0, 0, 0)); out.paste(wm_s, (0, 0), ImageChops.multiply(wm_s.split()[-1], m))
    return out, m.getbbox()
LETTERS = [letter_layer(k) for k in GROUPS]
# o centre and size on screen at the end
O_CX = WM_X + (O_BOX_N[0] + O_BOX_N[2]) / 2 * K
O_CY = WM_Y + (O_BOX_N[1] + O_BOX_N[3]) / 2 * K
O_D = (O_BOX_N[2] - O_BOX_N[0]) * K
# Intro: big mark in the middle (circle centre at screen centre, a bit left so sparks fit)
D0 = 420 if PORTRAIT else 400
I_CX, I_CY = W / 2 - D0 * 0.12, H / 2 + D0 * 0.12

# ── 3D extrusion of the finished wordmark ──
def make3d(face, depth, shadow_alpha):
    w, h = face.size
    pad = 70
    canvas = Image.new("RGBA", (w + pad * 2, h + pad * 2), (0, 0, 0, 0))
    a = face.split()[-1]
    if shadow_alpha > 0:
        sl = Image.new("RGBA", face.size, (90, 20, 40, 255)); sl.putalpha(a.point(lambda v: v * shadow_alpha // 255))
        sh = Image.new("RGBA", canvas.size, (0, 0, 0, 0)); sh.alpha_composite(sl, (pad + round(depth) + 6, pad + round(depth) + 14))
        canvas.alpha_composite(sh.filter(ImageFilter.GaussianBlur(16)))
    if depth >= 1:
        side = ImageEnhance.Brightness(face).enhance(0.62)
        d = int(round(depth))
        for i in range(d, 0, -1):
            canvas.alpha_composite(ImageEnhance.Brightness(side).enhance(1 + (d - i) * 0.012), (pad + i, pad + i))
    lit = face.copy()
    if depth >= 1:
        hl = Image.new("L", face.size, 0); dr = ImageDraw.Draw(hl)
        for y in range(h): dr.line([(0, y), (w, y)], fill=round(80 * max(0.0, 1 - y / (h * 0.55)) * min(1, depth / 10)))
        lit.alpha_composite(Image.merge("RGBA", (*Image.new("RGB", face.size, (255, 255, 255)).split(), ImageChops.multiply(hl, a))))
    canvas.alpha_composite(lit, (pad, pad))
    return canvas, pad

FULL3D, PAD3D = make3d(wm_s, 16 * K / 1.6, 80)

# ── background: cream + soft pink glow (blur the alpha only, so the colour stays clean) ──
_r = min(W, H) * 0.55
GLOW_MASK = Image.new("L", (W, H), 0)
ImageDraw.Draw(GLOW_MASK).ellipse((W / 2 - _r, H / 2 - _r * 0.8, W / 2 + _r, H / 2 + _r * 0.8), fill=150)
GLOW_MASK = GLOW_MASK.filter(ImageFilter.GaussianBlur(140))
def background(glow):
    bg = Image.new("RGBA", (W, H), CREAM + (255,))
    if glow > 0:
        bg.alpha_composite(Image.merge("RGBA", (*Image.new("RGB", (W, H), (255, 214, 200)).split(), GLOW_MASK.point(lambda v: round(v * glow)))))
    return bg

TAG = "For Creators. By Creators."
tag_font = ImageFont.truetype(FONT, 54 if PORTRAIT else 50, index=2)
def tagline(alpha, dy):
    b = tag_font.getbbox(TAG)
    lay = Image.new("RGBA", (b[2] - b[0] + 20, b[3] - b[1] + 20), (0, 0, 0, 0))
    ImageDraw.Draw(lay).text((10 - b[0], 10 - b[1]), TAG, font=tag_font, fill=(194, 27, 92, round(255 * alpha)))
    return lay, (W - lay.width) // 2, round(WM_Y + wm_s.height + (110 if PORTRAIT else 90) + dy)

for f in range(N):
    t = f / FPS
    frame = background(ease_out_cubic(prog(t, 0.0, 1.2)))
    if t < 1.62:
        # mark group, built in mark coords (1024) then placed
        group = Image.new("RGBA", mark.size, (0, 0, 0, 0))
        pc = prog(t, 0.0, 0.55)
        cs = ease_out_back(pc) if pc > 0 else 0
        rot = lerp(-120, 0, ease_out_cubic(pc))
        if cs > 0:
            ci = scaled_about(circle, cs, (C_CX, C_CY))
            if abs(rot) > 0.5: ci = ci.rotate(rot, resample=Image.BICUBIC, center=(C_CX, C_CY))
            group.alpha_composite(ci)
        for spark, anchor, start in ((spark1, S1_ANCHOR, 0.45), (spark2, S2_ANCHOR, 0.53)):
            ps = prog(t, start, start + 0.3)
            if ps > 0: group.alpha_composite(fade(scaled_about(spark, ease_out_back(ps, 2.2), anchor), min(1, ps * 2)))
        pm = ease_in_out(prog(t, 0.95, 1.55))
        d = lerp(D0, O_D, pm)
        cx, cy = lerp(I_CX, O_CX, pm), lerp(I_CY, O_CY, pm)
        s = d / C_D
        gs = group.resize((max(1, round(1024 * s)), max(1, round(1024 * s))), Image.LANCZOS)
        frame.alpha_composite(gs, (round(cx - C_CX * s), round(cy - C_CY * s)))
        # letters rise in, one by one
        for i, (lay, bb) in enumerate(LETTERS):
            pl = prog(t, 1.15 + i * 0.07, 1.15 + i * 0.07 + 0.32)
            if pl <= 0: continue
            e = ease_out_back(pl, 1.4)
            frame.alpha_composite(fade(lay, min(1, pl * 1.6)), (WM_X, round(WM_Y + (1 - e) * 46 * K)))
    else:
        # finished wordmark: 3D grows, a small pulse
        p3 = ease_out_cubic(prog(t, 1.75, 2.3))
        pulse = 1 + 0.035 * math.sin(math.pi * prog(t, 1.75, 2.25))
        if p3 < 0.999:
            art, pad = make3d(wm_s, 16 * K / 1.6 * p3, round(80 * p3))
        else:
            art, pad = FULL3D, PAD3D
        if abs(pulse - 1) > 0.001:
            art = art.resize((round(art.width * pulse), round(art.height * pulse)), Image.LANCZOS)
            pad = pad * pulse
        ox = WM_X - pad - (art.width - (wm_s.width + 2 * pad * 1)) / 2 * 0
        cxw, cyw = WM_X + wm_s.width / 2, WM_Y + wm_s.height / 2
        frame.alpha_composite(art, (round(cxw - (wm_s.width / 2 + PAD3D) * pulse), round(cyw - (wm_s.height / 2 + PAD3D) * pulse)))
        pt = ease_out_cubic(prog(t, 2.3, 2.9))
        if pt > 0:
            lay, x, y = tagline(pt, (1 - pt) * 28)
            frame.alpha_composite(lay, (x, y))
    frame.convert("RGB").save(f"{OUT}/{f:04d}.jpg", quality=93)
print("frames", N, "size", W, H, "K", round(K, 2))
