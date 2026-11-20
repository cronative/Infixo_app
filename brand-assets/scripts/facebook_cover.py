import sys
from PIL import Image, ImageDraw, ImageFilter, ImageChops, ImageEnhance, ImageFont
white_src, out = sys.argv[1], sys.argv[2]
W, H = 1640, 856
FONT = "/System/Library/Fonts/Avenir Next.ttc"
f_bold = lambda s: ImageFont.truetype(FONT, s, index=0)
f_demi = lambda s: ImageFont.truetype(FONT, s, index=2)

def gradient(w, h, c1, c2):
    g = Image.new("RGBA", (w, h)); px = g.load()
    for y in range(h):
        for x in range(w):
            t = (x / (w - 1)) * 0.75 + (y / (h - 1)) * 0.25
            px[x, y] = tuple(round(c1[i] + (c2[i] - c1[i]) * t) for i in range(3)) + (255,)
    return g

def make3d(face, side_rgb, depth=16, shadow_alpha=120):
    w, h = face.size
    pad = depth + 40
    canvas = Image.new("RGBA", (w + pad * 2, h + pad * 2), (0, 0, 0, 0))
    a = face.split()[-1]
    sh = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    sl = Image.new("RGBA", face.size, (60, 10, 30, 255)); sl.putalpha(a.point(lambda v: v * shadow_alpha // 255))
    sh.alpha_composite(sl, (pad + depth + 6, pad + depth + 12))
    canvas.alpha_composite(sh.filter(ImageFilter.GaussianBlur(14)))
    side = Image.new("RGBA", face.size, side_rgb + (255,)); side.putalpha(a)
    for i in range(depth, 0, -1):
        canvas.alpha_composite(ImageEnhance.Brightness(side).enhance(1 + (depth - i) * 0.012), (pad + i, pad + i))
    hl = Image.new("L", face.size, 0); d = ImageDraw.Draw(hl)
    for y in range(h):
        d.line([(0, y), (w, y)], fill=round(85 * max(0.0, 1 - y / (h * 0.55))))
    hl = ImageChops.multiply(hl, a)
    lit = face.copy()
    lit.alpha_composite(Image.merge("RGBA", (*Image.new("RGB", face.size, (255, 255, 255)).split(), hl)))
    canvas.alpha_composite(lit, (pad, pad))
    return canvas, pad

def text_layer(text, font, fill=(255, 255, 255, 255), shadow=True):
    box = font.getbbox(text)
    tw, th = box[2] - box[0], box[3] - box[1]
    lay = Image.new("RGBA", (tw + 40, th + 40), (0, 0, 0, 0))
    if shadow:
        s = Image.new("RGBA", lay.size, (0, 0, 0, 0))
        ImageDraw.Draw(s).text((20 - box[0] + 3, 20 - box[1] + 5), text, font=font, fill=(90, 10, 40, 150))
        lay.alpha_composite(s.filter(ImageFilter.GaussianBlur(4)))
    ImageDraw.Draw(lay).text((20 - box[0], 20 - box[1]), text, font=font, fill=fill)
    return lay

bg = gradient(W, H, (255, 106, 26), (232, 36, 111))
deco = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(deco)
# soft circles at the edges
for (cx, cy, r, a) in [(120, 120, 230, 22), (1560, 760, 280, 20), (1500, 90, 120, 16), (150, 780, 140, 14)]:
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(255, 255, 255, a))
# faint play triangles + spark lines (outside the central text)
def play(cx, cy, s, a):
    d.polygon([(cx - s * 0.45, cy - s * 0.55), (cx - s * 0.45, cy + s * 0.55), (cx + s * 0.6, cy)], fill=(255, 255, 255, a))
play(250, 430, 90, 40); play(1400, 420, 110, 40); play(1290, 690, 60, 34); play(370, 220, 50, 30)
for (x1, y1, x2, y2) in [(1450, 250, 1490, 190), (1480, 280, 1545, 250), (190, 610, 150, 670), (165, 585, 100, 610)]:
    d.line([(x1, y1), (x2, y2)], fill=(255, 255, 255, 70), width=14, joint="curve")
bg.alpha_composite(deco.filter(ImageFilter.GaussianBlur(1)))

# 3D wordmark
wm = Image.open(white_src).convert("RGBA"); wm = wm.crop(wm.split()[-1].getbbox())
k = 600 / wm.width; wm = wm.resize((round(wm.width * k), round(wm.height * k)), Image.LANCZOS)
art, pad = make3d(wm, (150, 18, 66))
wm_top = 170
bg.alpha_composite(art, ((W - wm.width) // 2 - pad, wm_top - pad))
y = wm_top + wm.height + 46

# headline (two lines)
for line in ["Turn Your Videos Into Series", "Fans Can Watch in Order."]:
    t = text_layer(line, f_bold(52))
    bg.alpha_composite(t, ((W - t.width) // 2, y - 20)); y += 66
y += 18

# feature pills
pills = ["Series", "Links", "Shop", "Media Kit"]
pf = f_demi(26); gap = 14; padx = 26; ph = 54
widths = [pf.getbbox(p)[2] - pf.getbbox(p)[0] + padx * 2 for p in pills]
x = (W - (sum(widths) + gap * (len(pills) - 1))) // 2
pd = ImageDraw.Draw(bg)
for p, w in zip(pills, widths):
    pd.rounded_rectangle((x, y, x + w, y + ph), radius=8, fill=(255, 255, 255, 240))
    pd.text((x + w / 2, y + ph / 2), p, font=pf, fill=(194, 27, 92), anchor="mm")
    x += w + gap
y += ph + 26
t = text_layer("inflixo.com", f_demi(28), fill=(255, 255, 255, 235), shadow=False)
bg.alpha_composite(t, ((W - t.width) // 2, y - 20))
print("content bottom y =", y + 30)

bg.convert("RGB").save(f"{out}/inflixo-facebook-cover-1640x856.png", optimize=True)

# Preview: full image with desktop (1640x624 centre band) and mobile (1522 wide centre) safe areas,
# plus how each device actually crops it.
full = bg.convert("RGB")
desk = full.crop((0, (H - 624) // 2, W, (H - 624) // 2 + 624)).resize((820, 312), Image.LANCZOS)
mob = full.crop(((W - 1522) // 2, 0, (W - 1522) // 2 + 1522, H)).resize((640, 360), Image.LANCZOS)
prev = Image.new("RGB", (860, 312 + 360 + 120), (245, 245, 247))
pdr = ImageDraw.Draw(prev); lab = f_demi(20)
pdr.text((20, 10), "Desktop (820×312 view)", font=lab, fill=(40, 40, 40))
prev.paste(desk, (20, 40))
pdr.text((20, 372), "Mobile (640×360 view)", font=lab, fill=(40, 40, 40))
prev.paste(mob, (20, 402))
prev.save(f"{out}/preview-facebook-cover-crops.png")
