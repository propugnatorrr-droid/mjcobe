# Asset prompts — everything the site is waiting on

Every slot below already has a component rendering it, an honest empty state
while it's missing, and a database column waiting for the file. Nothing here
is a code gap. Drop files in, tell me which slot each fills, and I'll wire
them into `media_assets` / `sponsors` with real alt text and derivatives.

---

## THE IDENTITY LOCK — paste into every MJ prompt

You have MJ's portraits already, but anything **new** featuring him must reuse
this description verbatim or he'll drift into a different person across pages.
This is the identity already generated and tracked in your database:

> **[MJ]** = Young Black man, short dark hair, wire-frame glasses, thin silver
> chain necklace, dark green crewneck sweater. Cinematic teal-and-navy colour
> grade, shallow depth of field, photorealistic. No text, no logos, no
> watermarks, no visible brand names.

Where a prompt says **[MJ]**, substitute that whole paragraph.

**Universal negative prompt** (append to everything):
> no text, no lettering, no typography, no watermark, no signature, no logo,
> no extra fingers, no distorted hands, no duplicate faces, not cartoon,
> not illustration, not 3d render

---

# PRIORITY 1 — Song covers (3 missing)

The single most visible gap: `/music` currently shows three black squares.
**Square 1:1, minimum 1400×1400px.** Leave the negative space noted in each —
the title is set in HTML over the top, not baked into the image.

### 1.1 — SOME REAL *(released)*
```
Album cover photograph. [MJ] seated close to camera at a dim kitchen table
late at night, one hand resting around a short whisky glass, warm amber lamp
light raking in from the left, deep shadow filling the right side of the
frame. Intimate, weary, unguarded. Square 1:1 composition, subject positioned
slightly left of centre, clean negative space in the upper right third.
Grainy 35mm film texture, warm amber against cool shadow.
```

### 1.2 — NIGHT SHIFT *(released)*
```
Album cover photograph. [MJ] leaning against a car door on an empty wet city
street at 3am, red tail-light glow washing across the puddles at his feet,
blurred sodium streetlights receding into the background. Cold blue night
against the warm red glow. Square 1:1 composition, subject right of centre,
clean negative space in the upper left third. Cinematic, rain-slicked,
anamorphic lens flare.
```

### 1.3 — LOWER FREQUENCY *(coming soon)*
```
Album cover photograph. [MJ] standing alone in a bare room lit by a single
bare overhead bulb, heavy rain streaking a large window beside him, face
half in shadow, looking down and away from camera. Very low-key, almost
monochrome with a faint teal cast. Square 1:1 composition, subject centred,
lots of dark empty space above him. Moody, isolated, quiet.
```

---

# PRIORITY 2 — Sponsor logos (6 missing)

Partner leaderboards, the `/partners` roster and every `/partner/[slug]` page
fall back to a letter monogram without these.

**SVG or transparent PNG. Square or 2:1. WHITE / LIGHT-GREY MARKS ONLY** —
they sit on near-black, so a dark logo will vanish. These are fictional
brands from your seed data.

### 2.1 — ABC Clothing *(Apparel — the #1 presenting partner)*
```
Minimal streetwear brand logo. The letters "ABC" in a heavy geometric
sans-serif, with the word "CLOTHING" in small widely-letterspaced capitals
centred beneath. Pure white on a fully transparent background. Flat vector,
no gradients, no shadows, no 3d, no mockup. Centred, generous margin.
```

### 2.2 — Lowkey Studios *(Recording)*
```
Recording studio logo. A circular badge containing a simple minimal
soundwave glyph, with "LOWKEY STUDIOS" in clean capitals beneath the circle.
Pure white on a fully transparent background. Flat vector, single colour,
no gradients, no shadows.
```

### 2.3 — Northbound Coffee Co. *(Hospitality)*
```
Coffee roaster logo. A clean compass-star icon above the word "NORTHBOUND"
in an elegant serif, with "COFFEE CO." in small letterspaced capitals
beneath. Pure white on a fully transparent background. Flat vector, single
colour, no gradients.
```

### 2.4 — Vellum Eyewear *(Accessories)*
```
Luxury eyewear logo. An ultra-thin single-line drawing of a pair of glasses
frames beside the word "VELLUM" in a light elegant sans-serif. Pure white on
a fully transparent background. Flat vector, hairline weight, extremely
minimal, no gradients.
```

### 2.5 — Halcyon Barbers *(Grooming)*
```
Barbershop logo. A classic straight-razor icon above the word "HALCYON" in
traditional signage capitals, with "BARBERS" small beneath. Pure white on a
fully transparent background. Flat vector, single colour, vintage barber
signage feel, no gradients.
```

### 2.6 — Ridgeline Print Co. *(Printing)*
```
Print shop logo. An angular mountain-ridge line mark above "RIDGELINE" in
bold condensed capitals, with "PRINT CO." small and letterspaced beneath.
Pure white on a fully transparent background. Flat vector, single colour,
geometric, no gradients.
```

---

# PRIORITY 3 — Landscape press shots (2)

`/partners` and `/now` currently reuse the tall portrait cropped to the right
half. A native landscape frame would sit properly.
**16:9 landscape, minimum 2400×1350px.**

### 3.1 — Partners hero
```
Editorial press photograph, 16:9 landscape. [MJ] performing into a vintage
condenser microphone under a single hard spotlight, stage haze catching the
beam, deep black falling away behind him. Subject positioned in the RIGHT
third of the frame with clean dark negative space across the left two thirds
for headline text. High contrast, cinematic, dramatic side lighting.
```

### 3.2 — Now / link-in-bio hero
```
Editorial press photograph, 16:9 landscape. [MJ] seated in a dark leather
armchair beside a floor-to-ceiling window, out-of-focus night city skyline
glowing behind him, warm lamp light on his face. Subject in the RIGHT third,
clean dark negative space across the left two thirds for headline text.
Relaxed, assured, late evening.
```

---

# PRIORITY 4 — Journey timeline images (5 worth doing)

The timeline reads fine as text-only, so these are polish. They give it the
mockup's photo-punctuated rhythm.
**4:3 or 16:9 landscape, ~1200px wide.**

### 4.1 — "Official music video production has begun"
```
Behind-the-scenes documentary photograph. A professional cinema camera on a
tripod in sharp focus in the foreground, [MJ] standing out of focus behind
it lit by a practical light, night exterior street. Candid, unposed, film-set
atmosphere. 16:9 landscape.
```

### 4.2 — "Visual treatment locked"
```
Close-up photograph of hands adjusting faders on a lit audio mixing console,
warm studio glow, shallow depth of field, no faces visible. Moody low-key
studio lighting. 16:9 landscape.
```

### 4.3 — "Campaign opened" / "Song preview uploaded"
```
Close-up photograph of a studio microphone in a darkened vocal booth, pop
filter in front of it, soft blue rim light, no people. Quiet, anticipatory,
empty-room feeling. 16:9 landscape.
```

### 4.4 — "First 100 supporters"
```
Photograph of a small crowd of silhouetted hands raised in a dark venue, warm
golden stage light behind them creating rim glow, faces not identifiable.
Celebratory but intimate — a small room, not an arena. 16:9 landscape.
```

### 4.5 — "100,000 streams"
```
Abstract photograph of an audio waveform glowing gold on a dark studio
monitor screen, shallow focus, slight screen texture and scanline. No text,
no numbers, no UI elements. 16:9 landscape.
```

---

# PRIORITY 5 — Sponsor brand imagery (6, optional)

The `/partner/[slug]` sidebar has a 16:9 slot currently filled by the logo.
A brand lifestyle shot fills it properly. **16:9, ~1600×900px.** No logos or
text in frame — the logo is overlaid separately.

```
5.1 ABC Clothing    — Folded premium streetwear on a concrete surface, hard
                      directional light, monochrome palette, no branding visible.
5.2 Lowkey Studios  — A dimly lit recording booth seen through control-room
                      glass, warm amber light inside, no people.
5.3 Northbound      — An espresso being pulled into a ceramic cup on a dark
                      counter, steam catching warm light, close crop.
5.4 Vellum Eyewear  — A single pair of thin metal-frame glasses on dark slate,
                      dramatic single-source light, macro detail.
5.5 Halcyon Barbers — Vintage barber tools laid out on dark leather, straight
                      razor and comb, warm overhead light, top-down.
5.6 Ridgeline Print — Close-up of ink being rolled on a screen-printing press,
                      dark workshop, single work light.
```

---

# PRIORITY 6 — Brand marks

### 6.1 — Favicon / app icon
```
App icon. The letters "MJ" in an elegant high-contrast serif, brushed metallic
gold, centred on a near-black square background. Flat, no bevel, no drop
shadow, no 3d. Square 1:1, 512×512.
```

### 6.2 — Social share card background *(OG image, 1200×630)*
The share graphic is generated in code with live text over it — this is just
the backdrop.
```
Abstract dark background, 1200x630 landscape. Deep near-black with a subtle
warm gold light bloom entering from the lower right corner, fine film grain,
soft vignette. Completely empty — no subject, no text, no objects. Just
atmosphere and gradient.
```

---

# NOT IMAGES — Audio (4 files)

The biggest remaining *functional* gap. Every song page and `/music` card shows
**"PREVIEW COMING SOON"** because no song has an audio file attached. The
player is fully built: real HTML5 playback, and a waveform decoded from the
actual file rather than a decorative pattern.

**Needed:** one MP3 or M4A per song —
`cant-read-your-mind`, `some-real`, `night-shift`, `lower-frequency`.

Full tracks are fine. The preview window is already configured per song in the
database (Can't Read Your Mind is set to 0:42–1:12; the others default to the
first 30 seconds), and the player only plays that window.

---

## What I did not do

No placeholder art, no stock images, no invented numbers, no AI-generated
"temporary" assets passed off as real. Every empty slot renders a deliberate
empty state, so nothing on the site claims something that isn't true.
