# Inflixo brand assets

Logos and social media images for Instagram, Facebook and marketing.

## Source files (`source/`)
| File | What |
|---|---|
| `inflixo-mark-2048.png` | The mark: orange → pink "o" with a white play triangle pointing at two spark lines. 2048 px master, transparent. |
| `inflixo-mark-512.png` | Same mark, 512 px. |
| `inflixo-wordmark-title-gulaal-play.png` | "Inflixo" wordmark, colour (gradient), transparent, 627 px wide. |
| `inflixo-wordmark-title-white-play.png` | "Inflixo" wordmark, white, transparent, 627 px wide. |

The wordmark is only 627 px wide: fine up to ~800 px on screen; ask for a larger source before print.

## Profile pictures (`profile/`), 1080 × 1080 (Instagram + Facebook)
- `inflixo-profile-{gradient,cream,white}.png`: mark only
- `inflixo-profile-text-{gradient,cream,white}.png`: flat "Inflixo" wordmark
- `inflixo-profile-3d-{gradient,cream,white}.png`: 3D wordmark (deep pink side + top light + soft shadow)
- `preview-*-circle-crop.png`: how each looks in the round crop
- Recommended: `inflixo-profile-3d-gradient.png`

## Facebook cover (`facebook/`), 1640 × 856
- `inflixo-facebook-cover-1640x856.png`: 3D wordmark, headline "Turn Your Videos Into Series Fans Can Watch in Order.", Series · Links · Shop · Media Kit pills, inflixo.com
- `preview-facebook-cover-crops.png`: desktop (820×312) and mobile (640×360) crops

## Brand
- Gradient (Kesar Gulaal): `#FF6A1A` → `#E8246F`
- Primary `#C21B5C`, hover `#A3164E`, tint `#FFEDE6` / `#FFF6F2`, cream `#FFF8F4`, borders `#F6E0DC`
- 3D side colour on gradient: `#961242`
- Website font: Poppins. Image font used here: Avenir Next (macOS; close to Poppins)
- Corner radius 5 px
- Headline: "Turn Your Videos Into Series Fans Can Watch in Order."

## Scripts (`scripts/`)
- `facebook_cover.py`: regenerates the Facebook cover (Pillow).
  `python facebook_cover.py <white-wordmark.png> <out-dir>`

## Logo reveal videos (`videos/`), 4.6 s, 30 fps, H.264 + AAC
- `inflixo-logo-reveal-1920x1080.mp4`: YouTube, website, landscape intros/outros
- `inflixo-logo-reveal-1080x1920.mp4`: Instagram Reels / Stories
- Animation: play-button circle pops in → spark lines pop → mark flies into the "o" → letters rise → wordmark turns 3D → "For Creators. By Creators."
- Sound is synthesised in code (pop, sparkle, ticks, logo chord); no ElevenLabs.
- Rebuild: `python scripts/logo_reveal.py brand-assets <frames-dir> 1920 1080`, then `node scripts/encode_logo.mjs <frames-dir> out.mp4 1920 1080` (needs `puppeteer`; edit the `createRequire` path to a checkout that has it installed).
