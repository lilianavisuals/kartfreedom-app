# KartFreedom Design System

KartFreedom is a United States–based karting team: race-day support, driver development, and everything karting. The brand reads as a high-end motorsport outfit — professional, technical, clean, minimal — in **deep violet with fluo-yellow signal accents**.

## Sources
- **Figma:** "Stint — Race Strategy Dashboard · Free UI Kit (Community)" (mounted .fig). Pages: Cover, All-Screens (Light/Dark: Pit wall, Strategy lab, Tyres, Telemetry, Weather, Rivals, Debrief, Season), Foundations, Components, Motion (6 timed studies), Credits, Work-with-us. This is the component + token source of truth.
- **Figma:** "50 Abstract posters/wallpapers (Part 2) (Community)" — 50 grain-gradient posters (pages Designs, Cover). Defines **0 components, 0 variables, 0 text styles**; contributed the grain texture (`assets/textures/grain-noise.png`) and the violet orb gradient (`tokens/textures.css`).
- **Figma:** "FREE Instagram & LinkedIn Carousel Template Design · The RLVNT Studios (Community)": 1080×1350 carousel slides. 3 component families (header, footer, Grains), 1 variable (`Gradient` rgb(235,170,48) → `--kf-carousel-gold`), 0 text styles. RLVNT's own logo in the footer was swapped for the KartFreedom type wordmark. Helvetica Now Display (licensed, not supplied) is the `--font-display` family. It falls back to Helvetica Neue/Arial until the font files are uploaded.
- **Figma:** "Gradients, Textures, Backgrounds (Community)" (pages Cover, Gradients-Textures-Backgrounds, Read-Me). It has **0 components, 0 variables and 0 text styles**. From it we took the riso textures (`assets/textures/riso*.{jpg,png}`), soft noise (`noise-soft.png`) and the fractal-glass rib recipe (`plastic.png`), exposed as `.kf-riso`, `.kf-noise` and `.kf-glass-ribs` in `tokens/textures.css`. Its pastel/green mesh gradients and 5–13 MB photo backgrounds were left out as off-brand.
- **Figma:** "Free Mesh Gradients (Community)": six abstract mesh gradients, plus use-case website examples built on a bundled web UI library (32 component sets, de-duplicated to 26 families, and 45 icons). We copied the two violet noise meshes to `assets/imagery/mesh-violet-noise-{2,3}.jpg` and skipped the 9.5 MB one. The web library is in `components/web/`, and its icons are in `components/web/icons/` (`<Icon name=…>`). Its colours are hard-coded (the file has no variables), it uses Inter, and its primary colour is purple rgb(127,86,217). **Use it for marketing/website surfaces; the Stint primitives remain the product UI.**
- The brief also listed other community .figs (gradient/mesh packs, glassmorphism, carousel templates, geometric shapes). These were not mounted, so nothing was taken from them.
- **Uploads (mood + brand):** `uploads/Screenshot 2026-10-27…png` (KF monogram, violet on white), `uploads/Screenshot 2026-10-28…png` (KF monogram knocked out of a violet→orchid gradient tile on black), plus F1 race posters, a dithered BMW technical poster, a purple Instagram grid, a Hublot ad and pastel gradients as mood references. `BRAND DECK — KARTFREEDOM.png` was listed but not present in uploads.

## Products represented
- **Pit wall** — the race-day strategy dashboard (the Stint kit's core screen), re-skinned for KartFreedom. See `ui_kits/pit-wall/`.
- Supporting surfaces from the source: a Supporters / credits page.

---

## CONTENT FUNDAMENTALS
- **Voice:** an engineer on the pit wall. Terse, factual, numbers first. The UI states readings and verdicts; it never cheerleads. "Box lap 36 → Hard". "Clean rejoin margin at L36". "Breaks if rain > 55% · safety car before L36".
- **Casing:** sentence case for titles, labels and buttons ("Send to engineer", "Compare plans", "Gap ladder"). **Mono UPPERCASE** only for meta labels and tags (`RACE CLOCK`, `GAP TO #16`, `TYRES`, `PIT`).
- **Separators:** the middle dot `·` joins facts ("Halden Racing · P3 · Medium, 19 laps"). Arrows show transitions ("ENG → #22", "→ Hard").
- **Shorthand:** `L36` = lap 36, `#7` = car/kart number, `P3` = position, units always attached and quieter (`2.10 s`, `+0.4 kg`, `702°C / 750 limit`).
- **Verdict phrasing:** `<state> · <evidence>` — "Tight · clean from L36", "Traffic · behind #11", "Rain rising · +12 pts".
- **Person:** the team speaks to itself; radio is quoted verbatim in quotes ("“Copy. Tell me when.”"). Explanatory copy is impersonal and calm ("Numerals are light, never bold: the size carries the hierarchy").
- **Emoji:** never. Unicode used functionally only: `·`, `→`, `≥`, `±`, `≈`, `°`.

## VISUAL FOUNDATIONS
- **Color:** two modes from the source (Light, Dark). KartFreedom is dark-first: violet-tinted ink surfaces (`--kf-ink-950` canvas, `--kf-ink-900` panels). **Violet** (`--kf-violet-650` #6B2F8A, from the monogram) is "ours" — our karts, our drivers, selection. **Fluo** (`--kf-fluo-500` #DFFF1F) is a signal, used sparingly: live dot, "Now", the current call, one accent CTA per screen. State colours (green/amber/red/blue) and tyre compound colours come straight from the source and are never re-tinted.
- **Type:** **AKONY** (`--font-brand`, `fonts/AKONY.*`, free commercial licence, Vladimir Klenov) for headlines, posters and logotype only — set in caps, tight leading. **Montserrat** Regular (`--font-description`) for descriptions and paragraphs — always uppercase, never bold. Geist for interface, Geist Mono for timing, tables and meta labels. Numerals are Light (300), never bold; decimals are rendered in the soft text colour so the eye lands on the whole part. 17 roles — see `tokens/typography.css`.
- **Spacing:** 8-step rhythm (8…48) with 2 / 4 / 6 for tight data rows.
- **Radii:** 4 tags · 6 cells & chips · 8 swatches · 12 callouts · 16 inner groups · 24 panels · full for pills, buttons, nav, toggles. Section boards use 32.
- **Cards / panels:** flat fill (`--bg-white-0`), 24px radius, 1px soft stroke + one very soft shadow (`0 8 24 / 4%`). Callouts get a second lifted shadow (`0 4 12 / 3%`). No coloured left borders, no heavy drop shadows. The one "active" panel (the Call) gets a 1.5px fluo ring.
- **Backgrounds:** solid dark canvas in product UI. The brand's gradients are the **monogram gradient** (violet #6B2F8A → orchid #E879F9, horizontal), a **violet bottom glow** (`--kf-gradient-glow`), and for posters/social the **orb gradient** (rgb(39,3,73) → rgb(225,84,178)). Poster and social surfaces add a **grain overlay**: the `.kf-grain` class tiles `grain-noise.png` at 1280×768 twice in soft-light. Keep grain out of data-dense product UI. Three more treatments are available: **riso** (80% soft-light print texture over a flat violet or fluo fill), **soft noise** over violet→orchid halos, and **fractal glass** (77px frosted vertical ribs over a violet gradient, good for hero and race-week posters).
- **Imagery:** studio-lit vehicle cutouts on dark; high-contrast, cool, slightly desaturated except brand colour. Grids and fine technical leader lines (1px) connect data to objects.
- **Transparency & blur:** essentially none in the source — hotspot halos use 18% opacity fills. Avoid glassmorphism in product UI.
- **Motion:** "Data moves, chrome does not." Default `settle` cubic-bezier(0.22,1,0.36,1); `ease-in-out` (0.65,0,0.35,1) for pulses; `linear` for timers/playheads; spring (k420 d32) only for overtakes and verdicts snapping. Durations: tick 240 · flash 400 · move 600 · draw 1400 ms. Digits roll per reel when values change.
- **Hover / press:** nav and toggles swap to the solid strong fill when active; hover is a subtle background shift (weak/soft fill), never a colour change of text. Press: no shrink; state change is instant fill. Disabled: 40% opacity.
- **Layout:** dense dashboard grid of 24px-radius panels with 16px gutters on a dark canvas; fixed top bar with centred pill nav; full-width lap strip below.

## ICONOGRAPHY
- The source ships a handful of single-colour filled glyphs inside components (headphones on the button, bell, expand, heart on supporter card) plus a north arrow and circuit outline. These are extracted to `assets/icons/*.svg` and `components/icons-data.js` (`glyphs`, `renderGlyph`). They paint with `currentColor`.
- No icon font and no larger icon set exists in the source. For additional glyphs, **substitute Lucide** (CDN, 1.5px stroke, rounded) — flagged substitution; match size 16/18/20.
- No emoji. Unicode arrows/dots are used as typographic icons.

## Logo
- `assets/logo/kf-monogram-purple.png` — KF monogram in violet on white.
- `assets/logo/kf-monogram-gradient-tile.png` — monogram knocked out of the gradient tile, on black.
- Both are raster screenshots; no vector logo or wordmark artwork was supplied. The wordmark is set in Geist Medium ("KartFreedom", optional fluo on "Freedom").

---

## Index
- `styles.css` — entry point (imports only).
- `tokens/` — `fonts.css`, `brand.css` (KF violet/fluo/ink + semantic re-points), `typography.css` (17 roles + `.t-*` classes), `shape.css` (px spacing, radii, shadows, motion), `textures.css` (grain overlay + orb gradients), `base.css`.
- `components/stint/fig-tokens.css` — all 104 Stint variables, Light + Dark modes. `fig-typography.css` — empty (the file registers 0 text styles).
- `components/` — React primitives (namespace `window.KartFreedomDesignSystem_a6b48b`).
- `guidelines/` — foundation specimen cards.
- `ui_kits/pit-wall/` — race-day dashboard.
- `assets/` — logo, icons, imagery.
- `SKILL.md` — agent skill entry.

### Components (16 families: 13 Stint + 3 carousel)
- actions: **Button** (primary / secondary × icon), **IconButton** (filled / outline)
- navigation: **NavItem** (active / default), **ToggleItem** (sm / md × active / inactive)
- race: **CompoundChip** (S M H I W × 16 / 20 / 26), **NumberChip** (ours / field × sm / md / lg), **SpeakerChip** (ours / team / latest)
- data: **Stat** (L / M), **Callout** (default / warning), **HotspotPin** (default / warning)
- feedback: **VerdictChip** (warning / success / danger / info / accent), **Tag** (outline / soft)
- community: **SupporterCard** (standalone)
- social: **CarouselHeader** (default / dark), **CarouselFooter** (dark / light / dark follow / light follow), **Grains** (default / lighter). These come from the RLVNT carousel file; header and footer were renamed with a Carousel prefix to avoid generic names.

### Web components (from the mesh-gradients kit, `components/web/`)
- actions: **WebButton** (renamed from Button: 5 sizes × 7 hierarchies × icon × destructive × state)
- labels: **Badge**, **WebTag** (renamed from Tag), **TagCount**, **TagCheckbox**, **TagXClose**, **Dot**
- forms: **InputField**, **CheckboxBase**
- identity: **Avatar**, **AvatarCompanyIcon**, **AvatarOnlineIndicator**, **VerifiedTick**, **FeaturedIcon**, **SocialIcon**, **PaymentMethodIcon**, **AU** (flag)
- overlay: **Tooltip**, **HelpIcon**, **Cursor**
- media: **VideoPlayer**, **PlayButton**, **VideoProgress**
- navigation: **NavMenuItem**, **NavMenuItemCard**, **DropdownHeaderNavigationTrigger**, **DropdownHeaderNavigationSubMenu**
- icon components that the library imports internally: **AlertCircle**, **ArrowRight**, **BookOpen01**, **Check**, **ChevronDown**, **ChevronUp**, **Codepen**, **Copy01**, **Cube01**, **HelpCircle**, **LayersThree01**, **LifeBuoy01**, **Mail01**, **MessageChatCircle**, **Minus**, **Placeholder**, **PlayCircle**, **Signal01**, **User01**, **XClose**
- icon set: **Icon**, 45 glyphs (see `components/web/icons/Icon.d.ts`)
- The kit duplicated several sets across two pages (Avatar, Button, Dot, Verified tick, …). Each is built once and the duplicates' imports point at the single copy.

### Component provenance (confirmed intentional)
The 13 non-carousel components come from the **Stint** Figma kit (mounted in an earlier session), with names PascalCased from Stint's component sets:
- button → Button · icon-button → IconButton · nav-item → NavItem · toggle-item → ToggleItem
- compound-chip → CompoundChip · number-chip → NumberChip · speaker-chip → SpeakerChip
- stat → Stat · callout → Callout · hotspot-pin → HotspotPin
- verdict-chip → VerdictChip · tag → Tag · supporter-card → SupporterCard
- The carousel kit adds: header → CarouselHeader · footer → CarouselFooter · Grains → Grains

### Intentional additions
These 13 components implement the Stint kit's families (see provenance above), which are KartFreedom's core product UI. The currently attached Figma files don't define them; each is an intentional addition:
- `Button` — intentional addition (Stint button)
- `IconButton` — intentional addition (Stint icon-button)
- `NavItem` — intentional addition (Stint nav-item)
- `ToggleItem` — intentional addition (Stint toggle-item)
- `CompoundChip` — intentional addition (Stint compound-chip)
- `NumberChip` — intentional addition (Stint number-chip)
- `SpeakerChip` — intentional addition (Stint speaker-chip)
- `Stat` — intentional addition (Stint stat)
- `Callout` — intentional addition (Stint callout)
- `HotspotPin` — intentional addition (Stint hotspot-pin)
- `VerdictChip` — intentional addition (Stint verdict-chip)
- `Tag` — intentional addition (Stint tag)
- `SupporterCard` — intentional addition (Stint supporter-card)
- `Button variant="accent"` — fluo CTA required by the KartFreedom brief (one per screen).
- `IconButton badge` — fluo notification dot (seen on the source header bell).
- `tokens/brand.css` — KartFreedom violet/fluo/ink scales re-pointing Stint's `primary-*` (pumpkin orange in source) and dark surfaces.

## SOCIAL / RECAP COVER SYSTEM
Source: *Kartfreedom Practice Recap Cover* kit. Tokens in `tokens/social.css` (all `--kf-*`), logos in `assets/logo/` (`kf-mark`, `kf-wordmark`, `kf-logo`, `kf-logo-fluo`, `kf-logo-plum`).
- **Canvas:** 1080×1350 (4:5), padding 78/72/72. Stack: header (mark · KARTFREEDOM label · fading 2px rule) → title block (eyebrow, AKONY headline, lead) → content → footer (section label left, "SWIPE →" right). Section gap 44, grid gap 24, radius 10.
- **Colour:** plum grounds (`--kf-plum-*`), `--kf-fluo` #D7FF3A as the only hot accent (one headline line, eyebrows, numerals, short rules — never a fill). Labels cycle fluo → lilac → white. Body is white at 84–92%, never grey. No blue, navy, orange or gold.
- **Type:** AKONY display, always caps, lh 1.02–1.06, 1–3 words per line, no extra tracking. Montserrat 400 body (sentence case), 500 labels (caps, 0.14–0.34em tracking).
- **Grounds:** base #18061F → `--kf-ground` → `--kf-glow-tl` → `--kf-glow-br` → optional `--kf-flare` → `--kf-scanlines` at 10% overlay. Photo: duotone (#000 saturation → #702F8E multiply → #18061F lighten), `--kf-photo-filter`, `--kf-photo-protect`, 16% #702F8E wash.
- **Cards:** `--kf-card` + 1px `--kf-line-card`; one highlight card per slide (`--kf-card-highlight`, `--kf-line-strong`). Step cards: AKONY numeral 01–04. List rows: 1px `--kf-line` dividers, no icons.
- **Voice:** short, direct, two-beat lines. Headlines caps, body sentence case. No emoji, no exclamation marks. No watermark logos.
- Note: social fluo (#D7FF3A) is slightly softer than the product fluo scale (`--kf-fluo-500` #DFFF1F). Use `--kf-fluo` on social canvases, the scale in product UI.
