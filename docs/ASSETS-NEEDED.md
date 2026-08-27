# Assets still needed

Everything below is a **content** gap, not a code gap — every slot already has
a component rendering it, an honest empty state while it's missing, and a
database column waiting for it. Drop files in and tell me which slot each one
fills; I'll wire them into `media_assets` / `sponsors` with real alt text and
derivatives rather than hardcoding paths.

**MJ COBE portraits are excluded — you already have those.**

---

## 0. The identity lock (read first)

Every prompt below that features MJ COBE must reuse this description verbatim,
so the character stays the same person across the whole site. This is the
identity already generated and tracked in your database:

> Young Black man, short dark hair, wire-frame glasses, thin silver chain
> necklace, dark green crewneck sweater. Cinematic teal-and-navy colour grade,
> shallow depth of field, photorealistic. No text, no logos, no watermarks.

Aspect ratios matter — they're what the layout expects. Getting these wrong is
the one thing that will look broken rather than merely unfinished.

---

## 1. Song cover art — **3 missing** (highest impact)

Square **1:1**, minimum **1400×1400**. These are the biggest visible holes: the
`/music` grid currently shows three empty black squares.

`cant-read-your-mind` already has one. Needed:

**1. SOME REAL** — *released*
> Album cover. [identity lock]. Seated close to camera at a dim kitchen table
> at night, one hand resting around a short whisky glass, warm amber lamp light
> from the left, deep shadow on the right. Intimate, weary, late. Square 1:1
> composition with the subject slightly off-centre left, empty negative space
> upper right for a title overlay. No text in the image.

**2. NIGHT SHIFT** — *released*
> Album cover. [identity lock]. Leaning against a car door on an empty wet city
> street at 3am, red tail-light glow washing the puddles, blurred sodium
> streetlights receding behind. Cold blues against the warm red. Square 1:1,
> subject right of centre, negative space upper left. No text in the image.

**3. LOWER FREQUENCY** — *coming soon*
> Album cover. [identity lock]. Standing alone in a bare room lit by one
> overhead bulb, rain streaking a large window beside him, face half in
> shadow, looking down and away. Very low-key, almost monochrome with a faint
> teal cast. Square 1:1, centred. No text in the image.

---

## 2. Sponsor logos — **6 missing**

The partner leaderboards, `/partners` roster and every `/partner/[slug]` page
fall back to a letter monogram without these. **SVG or transparent PNG**,
roughly **square or 2:1**, and they must read on a near-black background —
so **white or light-grey marks only**, no dark logos.

These are fictional brands from your seed data:

| Brand | Industry | Prompt |
|---|---|---|
| **ABC Clothing** | Apparel | Minimal streetwear wordmark, "ABC" in heavy geometric sans with "CLOTHING" letterspaced small beneath, pure white on transparent, flat vector, no effects |
| **Lowkey Studios** | Recording | Circular badge mark containing a simple soundwave glyph, "LOWKEY STUDIOS" around or beneath, white on transparent, flat vector |
| **Northbound Coffee Co.** | Hospitality | Compass-star icon above a "NORTHBOUND" serif wordmark with "COFFEE CO." small beneath, white on transparent, flat vector |
| **Vellum Eyewear** | Accessories | Ultra-thin single-line glasses-frame icon beside a light "VELLUM" wordmark, elegant and minimal, white on transparent, flat vector |
| **Halcyon Barbers** | Grooming | Classic straight-razor or barber-pole icon with "HALCYON" wordmark, traditional signage feel, white on transparent, flat vector |
| **Ridgeline Print Co.** | Printing | Angular mountain-ridge line mark with "RIDGELINE" wordmark and "PRINT CO." beneath, white on transparent, flat vector |

---

## 3. Journey timeline images — **0 of 12 events have media** (optional)

The timeline reads fine as text-only. These would give it the mockup's
photo-punctuated rhythm. **4:3 or 16:9 landscape**, ~1200px wide.

Worth doing for the two production events:
- *"Official music video production has begun"* — Behind-the-scenes: a
  professional cinema camera on a tripod in the foreground, [identity lock]
  standing out of focus behind it, night exterior, documentary feel.
- *"Visual treatment locked"* — Close-up of hands over a lit audio mixing
  console, warm studio glow, no faces.

---

## 4. Audio previews — **4 missing** (functional, not visual)

Not images, but this is the biggest remaining *functional* gap. Every song page
and `/music` card shows **"PREVIEW COMING SOON"** because no song has an audio
file. The player is fully built — real playback, real waveform decoded from the
file itself, honouring each song's preview window.

Needed: **MP3 or M4A** per song. The preview window is already configured per
song in the database (Can't Read Your Mind is set to 0:42–1:12; the others
default to the first 30 seconds), so full tracks are fine — the player only
plays the window.

---

## 5. Nice-to-have

- **Artist press shot, landscape 16:9** — for `/partners` and `/now` heroes,
  which currently reuse the portrait cropped to the right half. A native
  landscape frame would sit better.
- **Sponsor brand imagery** — the `/partner/[slug]` sidebar has a 16:9 slot
  currently filled by the logo. A brand lifestyle shot would fill it properly.

---

## What I did *not* fake

No placeholder art, no stock images, no invented numbers. Every empty slot
renders a deliberate empty state instead, so nothing on the site claims
something that isn't true.
