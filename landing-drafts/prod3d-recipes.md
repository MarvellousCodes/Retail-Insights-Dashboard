# RetailGuard Production-Grade 3D Landing Page Recipes

Five buildable directions that use 3D/WebGL as a **supporting accent** inside a conventional high-converting marketing page, the way real SaaS products ship it.

---

## PRODUCT FACTS (shared across all recipes)

| Field | Value |
|-------|-------|
| Product | RetailGuard |
| Audience | Shop owners aged 35 to 65 (convenience stores, forecourts) |
| Primary CTA | "Get my free margin scan" (first person, always) |
| Pricing | Insight €500/mo, Complete €1,000/mo (Most popular), Multi-site €1,500/mo. Net of VAT. No setup fee. |
| Recovery claim | "Typical opportunities identified can amount to thousands of euros per year, depending on store size." (never promise exact figures) |
| Features to showcase | Invoice scanner, Ask your shop, Price moves history, Margin leak finder, Morning report |
| Form handler | FormSubmit AJAX to retailguard.sales@gmail.com with a hidden `_subject` tag per page variant |

---

## HARD RULES (every builder must follow)

1. No em-dashes or en-dashes anywhere (use commas, full stops, or restructure).
2. Never use the word "AI", "AI-powered", or "artificial intelligence" in any copy.
3. Only illustrative numbers and example-shop figures. Never real shop data. Never "1,044".
4. Accessible colour contrast: all text/background combos must pass WCAG AA (4.5:1 body, 3:1 large text).
5. No stock photography of people. Product UI screenshots, abstract shapes, and icons only.
6. Forms always include a hidden field: `<input type="hidden" name="_subject" value="[RECIPE_NAME] Lead">`.
7. 3D must never block reading or the CTA. Must degrade to a static image on mobile or `prefers-reduced-motion`.
8. Single self-contained HTML file. No build step. three.js r170 via CDN importmap, or `<spline-viewer>` via CDN, or pure CSS 3D transforms.

---

## Design research: how production sites use 3D

| Site | How 3D is used | Why it reads premium, not gimmicky |
|------|---------------|-----------------------------------|
| **Stripe** (globe) | Single hero 3D globe, mouse-responsive rotation. Rest of page is flat copy, features, pricing. | Globe is a brand symbol, not a playground. Loads async. Page works without it. |
| **Vercel** (triangle) | WebGL mesh gradient and a single geometric form (triangle prism) that subtly rotates in the hero background. | It is wallpaper, never interactive content. Copy sits on top. |
| **Linear** (roadmap page) | Perspective-shifted UI mockups pinned to scroll sections. CSS transforms, not WebGL. | Depth is implied, not simulated. Zero GPU cost. |
| **Apple AirPods Pro** | Scroll-pinned product model assembled from image sequence (canvas drawImage). Single focal object. | You control the reveal tempo with your scroll. Degrades to one hero image. |
| **Arc / The Browser Company** | One floating browser window that tilts slightly on mouse move (CSS perspective + transform). | Subtle parallax says "crafted" without saying "look at our WebGL". |
| **Pitch** | Presentation card stack in hero with slight CSS 3D layer separation on scroll. | 3D is just depth between stacked cards, 5 lines of CSS. |
| **Framer showcase sites** | Spline-viewer `<iframe>` embedded as a single hero object (phone, device, product). Page around it is flat. | Spline component drops in like an image. No custom code. |
| **Rive.app** | Rive canvas as a hero accent animation (mascot, icon). Takes 60KB. Rest is conventional. | Lightweight runtime, single asset, infinite loop. Not interactive. |
| **Notion Calendar (Cron)** | Subtle parallax layers of calendar cards, pure CSS perspective + translateZ. | Barely 3D. Just enough to feel spatial. No JavaScript needed. |
| **Family.co** | Single 3D-rendered device mockup (pre-rendered, revealed on scroll with parallax). | 3D is in the render pipeline, not the browser. Zero runtime cost. |

**Pattern extracted:** The 3D moment is a single hero/section accent. The rest of the page is a standard marketing page (nav, features, social proof, pricing, FAQ, form). The 3D never covers more than ~30vh. It always has a static fallback.

---

## Recipe 1: "Floating Shelf"

**Inspiration:** Apple product scroll-reveal + Stripe single-object restraint.

### The 3D moment

A single wooden convenience-store shelf (three.js BoxGeometry planks + a few product-box meshes) floats in the hero section. It begins angled away. On scroll (0 to 300px), it rotates gently toward the viewer (20deg to 0deg Y-axis) while a price tag mesh attached to one product fades from red (margin leak) to green (fixed). The shelf hovers with a slow sine-wave float (translateY +/- 4px, 4s loop). Mouse parallax tilts +/- 3deg.

**Why restrained:** One object, one metaphor (shelf = your shop, price tag = your margins). The CTA and headline sit beside it in a 50/50 split layout. The shelf does not dominate the viewport.

### Palette

| Role | Hex |
|------|-----|
| Background | `#FAFAF8` |
| Card surface | `#FFFFFF` |
| Section alt | `#F5F3EE` |
| Primary text | `#1C1C1E` |
| Muted text | `#6E6E73` |
| Accent (green) | `#34A853` |
| Accent danger | `#E8453C` |
| CTA fill | `#34A853` |
| CTA text | `#FFFFFF` |

### Typography

- Display: **DM Serif Display** (400)
- Body: **Inter** (400, 500)

### Section-by-section skeleton

1. **Sticky nav** (white, slight shadow on scroll). Logo left, links centre, CTA pill right.
2. **Hero** (50/50 grid). Left: headline (48px), subtitle, CTA button. Right: the 3D shelf canvas (max 500x400px, `<canvas>` element).
3. **Social proof** (logo strip, greyscale, 40% opacity). "Trusted by independent retailers across Ireland."
4. **5 features** (alternating image/text rows). Static UI screenshots in browser frames. Each row has an icon, heading, 2-line description.
5. **How it works** (3-step numbered vertical timeline on left, illustration on right).
6. **Pricing** (3 cards, "Complete" green-bordered).
7. **FAQ** (accordion, max 6 items).
8. **Contact form** (white card on cream section). Hidden tag `_subject: "Floating Shelf Lead"`.
9. **Footer** (minimal, dark text on cream).

### 4 signature polish details

1. Shelf product boxes have subtle embossed text rendered via `TextGeometry` showing "€4.99" rotating to "€5.29" as the price-tag turns green.
2. Ambient light slowly shifts from cool (6500K) to warm (4000K) over the first scroll, suggesting sunrise/opening-time.
3. The shelf casts a soft shadow onto a `PlaneGeometry` floor that fades to transparent at edges.
4. A single receipt mesh (thin plane with torn-edge alpha map) gently flutters behind the shelf, 20% opacity, parallax-offset.

### Performance budget

- `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))`
- Pause render loop (`renderer.setAnimationLoop(null)`) when canvas is not in viewport (IntersectionObserver).
- Total geometry: < 200 triangles. No textures larger than 512x512.
- Lazy-init: three.js import and scene setup deferred until hero enters viewport.

### Mobile / reduced-motion fallback

Replace canvas with a static PNG render of the shelf at the "fixed" state (green tag). CSS `object-fit: contain`. `@media (prefers-reduced-motion: reduce)` also triggers static.

---

## Recipe 2: "Receipt Unroll"

**Inspiration:** Apple AirPods scroll-scrub + Rive lightweight accent.

### The 3D moment

A receipt mesh (thin curved PlaneGeometry with a receipt texture) is pinned (`position: sticky`) in the centre of a scroll section. As the user scrolls through 400px of travel, the receipt "unrolls" downward (vertex shader displaces top vertices from curled to flat, driven by a `uniform float progress` mapped to scroll). Line items fade in one by one as they uncurl. The final line shows a highlighted total with a green "saved" badge. No mouse interaction. Pure scroll-driven.

**Why restrained:** The receipt lives inside a single scroll-pinned section (one of eight). It tells the story "we read your invoices" in 2 seconds of scroll. Everything else on the page is flat typography and cards.

### Palette

| Role | Hex |
|------|-----|
| Background | `#0F1419` |
| Card surface | `#1A2028` |
| Border | `#2C3640` |
| Receipt paper | `#F8F6F0` |
| Receipt text | `#1C1C1E` |
| Accent (teal) | `#00BFA5` |
| CTA fill | `#00BFA5` |
| CTA text | `#0F1419` |
| Body text | `#B0BEC5` |
| Heading text | `#ECEFF1` |

### Typography

- Display: **Space Grotesk** (700)
- Body: **IBM Plex Sans** (400, 500)

### Section-by-section skeleton

1. **Sticky nav** (transparent, becomes solid dark on scroll).
2. **Hero** (centred). Large headline, subtitle, CTA. No 3D here, just a gradient orb accent behind text.
3. **Social proof** (logo strip on dark).
4. **The receipt section** (full-width, scroll-pinned). Left: explanatory text sliding in per-step. Centre: the receipt canvas (300x500px max). Right: empty (balance). Total scroll-pin height: 800px (400px for unroll, 400px for line-item reveals).
5. **4 more features** (card grid, 2x2). Dark cards with teal icon accents.
6. **Pricing** (dark cards, teal border on "Complete").
7. **FAQ** (dark accordion).
8. **Contact form** (dark card, teal CTA). Hidden tag `_subject: "Receipt Unroll Lead"`.
9. **Footer**.

### 4 signature polish details

1. Receipt paper has a real torn-edge alpha mask at the bottom, hand-drawn SVG converted to texture.
2. Each line item fades in with a typewriter-style stagger (100ms per line) synced to scroll position.
3. The final "Total saved" line pulses once with a teal glow (emissive flash) when fully revealed.
4. A faint dotted-line "cut here" scissors icon appears at the tear edge, rendered as a 2D SVG overlay.

### Performance budget

- Custom shader is < 30 lines GLSL (vertex displacement only, no fragment complexity).
- Single 512x256 texture (the receipt face).
- `renderer.setPixelRatio(1)` (receipt is already white-on-dark, no aliasing needed).
- Render only on scroll events (not rAF loop). `requestAnimationFrame` fires only when `scrollProgress` changes.

### Mobile / reduced-motion fallback

Static PNG of fully unrolled receipt with all line items visible. Fade-in on intersection. No scroll-pin on mobile (section scrolls normally, image fixed at bottom).

---

## Recipe 3: "Barcode Cursor"

**Inspiration:** Arc browser mouse-tilt + Vercel ambient background accent.

### The 3D moment

A stylised barcode (group of rounded BoxGeometry bars at varying heights) sits in the hero beside the headline. On mouse move, the bars individually react: each bar's height oscillates slightly based on its distance from the cursor (a "wave" ripples through the barcode following the pointer). The bars are coloured in a gradient from the accent violet to white. There is no scroll interaction. Pure ambient mouse-responsive.

**Why restrained:** The barcode is 200x120px footprint in a 50/50 hero split. It is decorative (like Stripe's gradient mesh). The rest of the page is completely conventional. If mouse events are unavailable (touch, reduced-motion), bars sit at static resting heights.

### Palette

| Role | Hex |
|------|-----|
| Background | `#FFFFFF` |
| Section alt | `#F7F5FF` |
| Card surface | `#FFFFFF` |
| Border | `#E8E4F0` |
| Accent (violet) | `#6C47FF` |
| Accent light | `#A78BFF` |
| CTA fill | `#6C47FF` |
| CTA text | `#FFFFFF` |
| Primary text | `#1A1A2E` |
| Muted text | `#6B6B80` |

### Typography

- Display: **Sora** (700, 800)
- Body: **Plus Jakarta Sans** (400, 500)

### Section-by-section skeleton

1. **Sticky nav** (white, border-bottom on scroll).
2. **Hero** (50/50). Left: headline, subtitle, CTA. Right: barcode 3D canvas (capped at 400x300px).
3. **Social proof** (logo strip).
4. **5 features** (stacked full-width sections, alternating white/lilac). Each: left screenshot, right text (or reversed). Rounded card frames with violet shadow.
5. **How it works** (3-step horizontal cards connected by a line).
6. **Pricing** (3 rounded cards, "Complete" has violet border + badge).
7. **FAQ** (white accordion on lilac background).
8. **Contact form** (white card on lilac section, violet CTA). Hidden tag `_subject: "Barcode Cursor Lead"`.
9. **Footer** (dark, minimal).

### 4 signature polish details

1. Each barcode bar has a subtle rounded cap (CylinderGeometry top) and a floor reflection (MeshBasicMaterial plane at 10% opacity, flipped Y).
2. The wave ripple uses a spring-decay function (not linear), so bars overshoot slightly then settle, feeling organic.
3. On first page load, bars animate from height 0 to resting heights in a staggered left-to-right entrance (300ms total).
4. A single scanning line (thin emissive plane) sweeps slowly across the barcode every 8 seconds, like a laser reader.

### Performance budget

- < 50 meshes (one BoxGeometry per bar, instanced where possible via InstancedMesh).
- No textures (pure MeshStandardMaterial with colour).
- `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))`.
- Mouse events throttled to 60fps via rAF guard.
- Canvas invisible below the fold: `renderer.setAnimationLoop(null)` on IntersectionObserver disconnect.

### Mobile / reduced-motion fallback

Bars rendered at static resting heights (no animation). On mobile, replace canvas with an inline SVG barcode icon in the accent gradient. Lightweight, accessible, same visual weight.

---

## Recipe 4: "Card Stack Depth"

**Inspiration:** Pitch/Notion/Linear CSS-only perspective depth + Framer layered scroll.

### The 3D moment

**Pure CSS 3D transforms. No three.js.** The hero contains 3 dashboard UI cards stacked in Z-space (`transform: translateZ(-20px)`, `translateZ(0)`, `translateZ(20px)`) inside a container with `perspective: 1200px`. On scroll (first 200px), the stack fans out (cards spread on the Y-axis, back cards rise up). The container subtly rotates +/- 2deg on mouse move (`rotateX`, `rotateY`). Cards show: Margin Leak table, Invoice Scan result, Ask Your Shop chat.

**Why restrained:** Zero JavaScript for the 3D effect (CSS only, with a 6-line mousemove listener for tilt). The cards are real HTML with real content. They ARE the product demonstration. The effect serves the message: "three tools, one platform."

### Palette

| Role | Hex |
|------|-----|
| Background | `#0B0B0F` |
| Card surface | `#18181B` |
| Card border | `#27272A` |
| Accent (emerald) | `#10B981` |
| Accent secondary | `#6366F1` |
| CTA fill | `#10B981` |
| CTA text | `#0B0B0F` |
| Body text | `#A1A1AA` |
| Heading text | `#FAFAFA` |

### Typography

- Display: **Outfit** (700)
- Body: **Inter** (400, 500)

### Section-by-section skeleton

1. **Sticky nav** (transparent, solid dark on scroll).
2. **Hero** (centred). Headline above the card stack. CTA below. The card stack occupies centre (max 600px wide, 400px tall perspective container).
3. **Social proof** (dark strip).
4. **5 features** (vertical scroll with sticky left text, right image). Each feature gets a scroll-triggered card that slides in from the right with `opacity` + `translateX` transition.
5. **How it works** (numbered steps, vertical line connecting them).
6. **Pricing** (dark cards, emerald "Complete" card).
7. **FAQ** (dark accordion).
8. **Contact form** (dark card, emerald CTA). Hidden tag `_subject: "Card Stack Lead"`.
9. **Footer**.

### 4 signature polish details

1. Each card in the stack has a gradient-border (emerald-to-indigo) visible only on the top edge, giving a "lit from above" look.
2. The front card (Ask Your Shop) has a blinking cursor in the chat input, pure CSS animation.
3. On hover over the stack, the back card (Margin Leaks) subtly highlights one row in red, then corrects to green after 1s, micro-storytelling the fix.
4. Scroll-triggered fan-out uses CSS `scroll-timeline` (progressive enhancement) with a JS `IntersectionObserver` fallback for Safari.

### Performance budget

- Zero WebGL. Zero canvas. Pure CSS `transform-style: preserve-3d` + `perspective`.
- Mousemove listener runs only when hero is in viewport (IntersectionObserver).
- Cards contain real HTML (not images), so they are selectable, accessible, and indexable.
- Total added CSS: ~40 lines. Total JS: ~15 lines.

### Mobile / reduced-motion fallback

Cards stack vertically (no perspective, no tilt). Simple top-to-bottom card list with slight overlap. Reduced-motion: no transitions, cards in final fanned position immediately.

---

## Recipe 5: "Ambient Depth Field"

**Inspiration:** Stripe gradient mesh background + Vercel ambient geometry + Apple soft-focus product photography.

### The 3D moment

A full-width, full-hero-height `<canvas>` sits **behind** all hero content as a background layer (`position: absolute; z-index: 0`). It renders a subtle depth-of-field scene: 5-8 abstract rounded shapes (SphereGeometry, TorusGeometry) in frosted glass materials (MeshPhysicalMaterial with transmission + roughness), drifting slowly in a gentle orbit. They are out-of-focus (custom depth-of-field post-processing pass, or simply using high roughness + low opacity). The shapes are large but ghostly (10-15% opacity). Content sits on top at `z-index: 1` with full readability.

**Why restrained:** The 3D is wallpaper. You cannot interact with it. It provides the "premium texture" feeling (like Stripe's animated gradient) without being a feature. If you removed it, the page would still work perfectly as a flat white page.

### Palette

| Role | Hex |
|------|-----|
| Background | `#FDFCFA` |
| Shape colour 1 | `#C4B5FD` (soft violet) |
| Shape colour 2 | `#A7F3D0` (soft mint) |
| Shape colour 3 | `#FDE68A` (soft amber) |
| Card surface | `#FFFFFF` |
| Border | `#E5E7EB` |
| Accent (indigo) | `#4F46E5` |
| CTA fill | `#4F46E5` |
| CTA text | `#FFFFFF` |
| Primary text | `#111827` |
| Muted text | `#6B7280` |

### Typography

- Display: **Cabinet Grotesk** (if unavailable, **Sora**) (700, 800)
- Body: **Inter** (400, 500)

### Section-by-section skeleton

1. **Sticky nav** (white/glass backdrop-filter, sits above canvas).
2. **Hero** (centred text over canvas background). Headline (56px), subtitle, CTA. Content fully opaque, canvas fades to solid background colour at the hero bottom edge.
3. **Social proof** (flat section below canvas, no 3D).
4. **5 features** (alternating left/right with rounded card screenshots).
5. **How it works** (3-step numbered row).
6. **Pricing** (white cards, indigo-bordered "Complete").
7. **FAQ** (accordion).
8. **Contact form** (card on light grey section). Hidden tag `_subject: "Ambient Depth Lead"`.
9. **Footer** (dark, flat).

### 4 signature polish details

1. Shapes drift on independent sine-wave orbits (different frequencies: 0.0003, 0.0005, 0.0007 rad/frame) so the composition never repeats.
2. A slow colour-temperature shift: ambient light hue rotates 10 degrees over 60 seconds, making the scene feel alive without being distracting.
3. The canvas has a CSS `mask-image: linear-gradient(to bottom, black 70%, transparent 100%)` so it fades seamlessly into the flat content below.
4. On page focus loss (`document.hidden`), the render loop pauses entirely. Resumes on focus.

### Performance budget

- `renderer.setPixelRatio(1)` (shapes are blurry by design, high DPI wastes cycles).
- Total meshes: 8 max. All use shared geometry (instanced torus/sphere).
- MeshPhysicalMaterial with `transmission: 0.6, roughness: 0.8` (GPU-friendly, no environment map needed).
- Render at 30fps cap (`setTimeout` wrapper around rAF) since motion is slow.
- Lazy-init: defer all three.js loading until after `DOMContentLoaded` and first paint.
- Total bundle: three.js core only (no addons, no post-processing).

### Mobile / reduced-motion fallback

Replace canvas with a static CSS gradient blob composition: 3 radial-gradient circles (matching shape colours) at 10% opacity, positioned via `background-image`. Zero JS, same visual warmth. On `prefers-reduced-motion`: same static gradient, no animation.

---

## Implementation notes (all recipes)

- **CDN importmap pattern** for three.js:
  ```html
  <script type="importmap">
  { "imports": { "three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js" } }
  </script>
  <script type="module"> import * as THREE from 'three'; /* ... */ </script>
  ```
- **Spline alternative** (Recipes 1, 3, 5 could also use `<spline-viewer>`):
  ```html
  <script type="module" src="https://unpkg.com/@splinetool/viewer@1.9.82/build/spline-viewer.js"></script>
  <spline-viewer url="https://prod.spline.design/SCENE_ID/scene.splinecode"></spline-viewer>
  ```
- Product screenshots: placeholder grey cards during build, replaced with real RetailGuard crops on final assembly.
- All recipes are single-file HTML. Tailwind via CDN play script is optional but not required.
- Test contrast with WebAIM checker after any tint tweaks.
- Mobile: all layouts collapse to single-column. 3D sections become static images. No canvas on viewports < 768px (or use the fallback path).
