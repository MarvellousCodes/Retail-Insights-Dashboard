# RetailGuard Landing Page Art Direction Recipes (21st.dev Showcase Tier)

Three distinct, buildable visual directions inspired by the most celebrated components
on 21st.dev (the 10,000+ component community registry for React/Tailwind). Each recipe
is designed as a **single self-contained HTML/CSS/JS file** with no build step and no React.
Vanilla CSS/JS recreations of the component aesthetics.

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

---

## Top 10 Celebrated 21st.dev Components (Research)

These are the most popular and influential component patterns from 21st.dev's community
registry (Aceternity UI, Magic UI, Motion Primitives, and top community authors):

| # | Component | What makes it excellent |
|---|-----------|------------------------|
| 1 | **Aceternity Card Spotlight** | Mouse-tracking radial gradient follows cursor across card surface, creating depth through dynamic lighting without any 3D transforms. Elegant restraint. |
| 2 | **Magic UI Border Beam** | A single luminous dot orbits the card perimeter on an infinite CSS animation. Conveys "active/live" status with zero layout shift and minimal GPU load. |
| 3 | **Hero with Mockup** (serafimcloud) | Large gradient headline, dual CTAs, and a floating product screenshot with perspective tilt and soft shadow. The composition reads instantly as "premium SaaS". |
| 4 | **Magic UI Bento Grid** | Asymmetric grid cells (2x2 hero cell, 1x1 satellites) with each cell containing a self-contained feature demo. Layout communicates hierarchy without copy. |
| 5 | **Aceternity Spotlight** | A full-section radial glow that fades from accent colour to transparent, anchored behind the headline. Creates theatrical depth on dark backgrounds with one CSS gradient. |
| 6 | **Magic UI Marquee** | Infinite horizontal scroll of logo cards with pause-on-hover, CSS-only (no JS timers). Clean proof-strip that communicates breadth without demanding attention. |
| 7 | **Motion Primitives Tilt Card** (ibelick) | 3D tilt responding to mouse position with configurable spring physics. Adds tactile quality to feature cards; the depth cue makes flat UI feel layered. |
| 8 | **Animated Testimonials Carousel** | Auto-rotating quote cards with crossfade and staggered enter animation on name/role. Combines social proof with subtle motion that draws the eye. |
| 9 | **HeroGeometric** (uniquesonu) | Dark hero with large animated geometric SVG shapes (rotating triangles, pulsing circles) layered behind text. Bold, modern, makes the page feel alive without video. |
| 10 | **Laser Focus Hero** | Animated gradient beams (conic-gradient + rotation keyframes) that emanate from the hero product mockup, simulating a product "activating". High drama, SaaS-native. |

---

## Recipe 1: "Spotlight Depth"

**Style:** Dark canvas with mouse-reactive spotlight cards, orbital border beams, and layered gradient auras. The page feels alive and premium without heavy animation. Inspired by Linear, Raycast, and the Vercel aesthetic.

### Inspirations from top components

- **Aceternity Card Spotlight** (mouse-tracking glow on feature cards)
- **Magic UI Border Beam** (orbiting luminous dot on pricing "Most popular" card)
- **Aceternity Spotlight** (hero section radial aura)
- **Hero with Mockup** (floating product screenshot with perspective)
- **Magic UI Marquee** (logo proof strip)

### Palette

| Role | Hex | Usage |
|------|-----|-------|
| Background | `#09090F` | Page canvas |
| Elevated surface | `#12121C` | Cards, sections |
| Card border | `#1E1E2E` | Subtle edges, 1px |
| Accent (electric violet) | `#8B5CF6` | CTAs, glows, active states |
| Accent subtle | `#8B5CF620` | Box-shadow auras, hover fills |
| Secondary accent (emerald) | `#10B981` | Success indicators, margin-positive numbers |
| Body text | `#A1A1B5` | Paragraphs, descriptions |
| Heading text | `#F4F4F8` | h1 through h3, strong labels |
| Muted | `#6B6B80` | Captions, footnotes |

### Typography (Google Fonts)

- Display: **Inter Tight** (700, 800) — geometric, sharp, modern
- Body: **Inter** (400, 500) — universally legible, pairs perfectly

### Section-by-section layout skeleton

1. **Nav** — Fixed top, transparent bg with backdrop-blur on scroll. Logo left, 4 links centre, CTA button right (violet ghost outline). Compact 56px height.

2. **Hero** — Full viewport height. Centred single-column. Oversized headline (clamp(40px, 5vw, 64px)) with one key word in gradient text (violet to emerald). One-line subtitle in body text colour. Single CTA button (violet fill, white text, 8px radius, subtle glow box-shadow). Below CTA: floating product mockup (the dashboard) in a rounded card with 1px border, perspective(1200px) rotateX(3deg), large violet aura (200px blur radial gradient at 12% opacity) behind it. **The Spotlight**: a 400px radial gradient ellipse (violet at 15% opacity fading to transparent) positioned centre-top, pulsing slowly (opacity oscillates 0.08 to 0.15 over 4s).

3. **Proof strip** — Horizontal logo marquee. 6 greyscale logos at 40% opacity, infinite scroll via CSS translate animation (40s linear). Pause on hover. Thin 1px border-top and border-bottom in card-border colour.

4. **Features (5 cards)** — CSS grid, 3-column on desktop (first card spans 2 cols), 1-column mobile. Each card: elevated surface bg, 1px border, 16px radius, 24px padding. **Spotlight hover effect**: on mousemove over card, a radial-gradient (accent subtle, 150px radius) is positioned at cursor coordinates via CSS custom properties set by a lightweight JS listener. Feature icon (SVG, 32px, emerald stroke) top-left. Title bold. 2-line description. Small product UI crop in bottom-right corner at 60% opacity, scaling to 80% on card hover.

5. **How it works** — 3-step vertical timeline. Each step: a numbered circle (48px, violet border, heading text number) connected by a thin vertical line (1px, card-border colour). Step title + 2-line description beside each circle. Steps stagger-fade-in on scroll (IntersectionObserver, 100ms delay between steps, opacity 0→1 + translateY(12px→0)).

6. **Pricing (3 cards)** — Horizontal row, centred. All cards: elevated surface, 1px border, 24px padding, 16px radius. "Complete" (middle) card: **Border Beam** effect (a 6px luminous dot in violet orbits the card perimeter on an infinite 6s linear animation via offset-path on a pseudo-element tracing the border-radius). "Most popular" badge: small pill above card, violet bg, dark text, 10px font. Feature checklists with emerald checkmark SVGs.

7. **FAQ** — Accordion (5 items). Click to expand with max-height transition (300ms ease). Question in heading text weight, answer in body text. Plus/minus icon rotates on toggle.

8. **Contact form** — Centred card (max-w-480px), elevated surface, violet glow box-shadow (0 0 60px accent-subtle). Three inputs (name, email, shop name) with dark bg, 1px border, 12px radius. CTA button full-width, violet fill. Hidden field: `_subject: "Spotlight Depth Lead"`.

9. **Footer** — Minimal. Logo left, 3 link columns (Product, Company, Legal), small muted copyright bottom.

### 4 signature details

1. **Cursor spotlight on feature cards** — Each card tracks mouse position and renders a radial gradient at that point (pure CSS vars + 6 lines of JS per card). No libraries.
2. **Border Beam on pricing card** — A pseudo-element with a small radial-gradient dot, animated along the card outline using `offset-path: rect()` and `offset-distance: 0% → 100%` over 6s infinite linear.
3. **Hero aura pulse** — The background radial gradient behind the hero mockup oscillates opacity from 0.08 to 0.15 via a simple `@keyframes auraPulse` (4s ease-in-out infinite alternate).
4. **Receipt-paper torn edge** — The hero mockup card uses a CSS clip-path with a zigzag bottom edge (polygon points every 8px), subtly suggesting a receipt being analysed.

### Micro-interaction inventory

| Element | Trigger | Animation | Duration | Easing |
|---------|---------|-----------|----------|--------|
| Feature card spotlight | mousemove | Radial gradient repositions to cursor (CSS vars) | Instant (no transition) | — |
| Feature card hover | mouseenter | Card border goes from border-colour to accent at 30% | 200ms | ease-out |
| Feature card icon | mouseenter on card | Scale 1→1.08, opacity 0.7→1 | 200ms | ease-out |
| Border Beam dot | always | Orbits card perimeter | 6000ms | linear infinite |
| Hero aura | always | Opacity pulse 0.08↔0.15 | 4000ms | ease-in-out alternate infinite |
| Marquee logos | always | translateX(0)→translateX(-50%) | 40000ms | linear infinite |
| Marquee | hover | animation-play-state: paused | — | — |
| FAQ item | click | max-height 0→auto (via measured height), icon rotates 0→45deg | 300ms | ease |
| How-it-works steps | scroll into view | opacity 0→1, translateY(12px→0), stagger 100ms | 400ms | ease-out |
| CTA button | hover | box-shadow grows (0 0 0→0 0 20px accent-subtle), translateY(0→-1px) | 150ms | ease-out |
| Nav | scroll past 80px | background-colour transparent→elevated with backdrop-filter:blur(12px) | 200ms | ease |

### Retail-specific art direction

The dashboard screenshot in the hero shows the margin-leak table: rows of products with red/amber/green margin indicators. Feature card mockups are cropped close-ups: (1) a barcode being scanned with a green "match found" overlay, (2) a chat bubble saying "Which dairy products lost margin this week?", (3) a price-change timeline with arrows, (4) a morning report email preview, (5) the full overview dashboard with KPI cards. All mockups rendered as dark-themed UI matching the page palette. Decorative elements: faint barcode line patterns (2% opacity, emerald) as section backgrounds, and a subtle dot-grid pattern (1px dots at 3% opacity, 24px spacing) behind the hero.

---

## Recipe 2: "Glass Bento"

**Style:** Light mode with frosted-glass cards arranged in an asymmetric bento grid layout. Depth created through layered translucent surfaces, soft coloured shadows, and parallax-like floating elements. Inspired by Apple marketing pages, Notion's landing, and the 21st.dev bento-features pattern.

### Inspirations from top components

- **Magic UI Bento Grid** (asymmetric feature grid with self-contained demos)
- **Motion Primitives Tilt Card** (subtle 3D tilt on hover)
- **HeroGeometric** (floating geometric shapes as decorative elements)
- **Animated Testimonials Carousel** (crossfade quote rotation)
- **Hero with Mockup** (floating product composition)

### Palette

| Role | Hex | Usage |
|------|-----|-------|
| Background | `#F8FAFC` | Cool off-white canvas |
| Glass surface | `#FFFFFF` at 70% opacity | Card backgrounds (+ backdrop-blur:16px) |
| Glass border | `#E2E8F0` at 50% opacity | 1px card edges |
| Deep surface | `#FFFFFF` | Solid cards (pricing, form) |
| Primary text | `#0F172A` | Headlines |
| Body text | `#334155` | Paragraphs |
| Muted text | `#64748B` | Captions, secondary |
| Accent (indigo) | `#4F46E5` | CTAs, links, badges |
| Accent hover | `#4338CA` | Button hover |
| Accent subtle | `#EEF2FF` | Badge backgrounds, tinted sections |
| Success (teal) | `#0D9488` | Positive metrics |
| Decorative (amber) | `#F59E0B` | Floating shape accents |
| Shadow colour | `#4F46E510` | Card box-shadows |

### Typography (Google Fonts)

- Display: **Plus Jakarta Sans** (700, 800) — modern geometric, warm character
- Body: **Inter** (400, 500) — clean pairing

### Section-by-section layout skeleton

1. **Nav** — Sticky, white bg with subtle bottom border. Logo left, pill-shaped nav links centre (active link has accent-subtle bg), CTA button right (indigo fill, white text, pill shape).

2. **Hero** — Split layout on desktop (55% text left, 45% visual right). Left: large headline (clamp(36px, 4.5vw, 56px)), subtitle in body colour, two buttons (primary indigo fill + secondary ghost outline). Right: a bento composition of 3 glass cards at varying z-depths and slight rotations (2deg, -1deg, 0deg), each showing a different product screen crop. Cards have backdrop-filter:blur(16px) and soft coloured box-shadows. **Floating geometric shapes**: 3 SVG elements (a rounded square in amber at 20% opacity, a circle in indigo at 10%, a small diamond in teal at 15%) positioned absolutely, animated with slow float (translateY ±8px, 5s ease-in-out infinite, staggered starts).

3. **Proof strip** — Row of 6 logos, greyscale, 50% opacity, on a full-width accent-subtle background band. Static (no marquee in this recipe for contrast with Recipe 1).

4. **Features (5 cards, bento grid)** — CSS grid with named areas: first feature spans 2 columns and 2 rows (the hero cell), remaining 4 fill as 1x1 cells. Each card: glass surface with backdrop-blur, 1px glass border, 20px radius, 24px padding, soft shadow (0 8px 32px shadow-colour). **Tilt effect on hover**: JS tracks mouse position relative to card centre, applies transform: perspective(800px) rotateX(±3deg) rotateY(±3deg) with a spring-like CSS transition (400ms cubic-bezier(0.34,1.56,0.64,1)). Each cell contains: feature icon (SVG, indigo stroke, 28px), title, 2-line description, and a cropped product UI screenshot (40% height of card, bottom-aligned, with a subtle gradient mask fading to transparent at top).

5. **How it works** — Horizontal 3-step flow. Numbered circles (indigo border) connected by a dashed line (2px dashed, accent at 30%). Each step: circle, title, description, small icon. On mobile: vertical stack.

6. **Pricing (3 cards)** — Row on solid white section. Cards have full opacity white bg (not glass, for readability). 1px border, 16px radius, generous padding. "Complete" card: indigo top border (3px), "Most popular" pill badge (indigo bg, white text). Pricing numbers in display font. Feature lists with teal checkmarks.

7. **FAQ** — On accent-subtle bg section. Cards for each Q/A (white bg, border, radius). Click toggles answer visibility with slide-down (max-height transition). Chevron icon rotates.

8. **Contact form** — Centred white card on canvas bg, wide shadow, 20px radius. Three inputs with cool-grey bg (#F1F5F9), 1px border, 10px radius. Indigo CTA button, pill shape. Hidden field: `_subject: "Glass Bento Lead"`.

9. **Footer** — White bg, subtle top border. 4-column grid (logo+tagline, Product links, Company links, Legal). Muted text throughout.

### 4 signature details

1. **Bento hero cell** — The large 2x2 feature card shows a live-feeling dashboard mockup with a subtle CSS animation: a number in a KPI card counts up from 0 to an illustrative figure over 2s on scroll-into-view (CSS @property counter animation).
2. **Tilt cards with spring** — Feature cards tilt toward the cursor with a bouncy easing that overshoots slightly then settles, giving physical weight to the interaction.
3. **Glass layering** — Hero product cards overlap at different z-depths (translateZ in 3D space), and the glass blur makes overlapping regions visibly compound, creating genuine depth.
4. **Floating geometry** — Three decorative SVG shapes float independently with CSS animations at different speeds (3s, 5s, 7s), creating a subtle parallax when the page is static.

### Micro-interaction inventory

| Element | Trigger | Animation | Duration | Easing |
|---------|---------|-----------|----------|--------|
| Feature card tilt | mousemove | rotateX/Y ±3deg based on cursor offset | 400ms | cubic-bezier(0.34,1.56,0.64,1) |
| Feature card tilt reset | mouseleave | rotateX/Y → 0 | 600ms | cubic-bezier(0.34,1.56,0.64,1) |
| Feature card shadow | mouseenter | box-shadow size grows 1.5x | 300ms | ease-out |
| Hero glass cards | always | Slight float (translateY ±4px) | 6000ms | ease-in-out infinite alternate |
| Floating shapes | always | translateY ±8px (staggered: 3s/5s/7s) | varies | ease-in-out infinite alternate |
| Bento hero counter | scroll into view | @property --num 0→illustrative-value | 2000ms | ease-out |
| CTA button | hover | scale(1.02), shadow grows | 150ms | ease-out |
| Proof logos | hover individual | opacity 0.5→1, greyscale→colour (filter transition) | 300ms | ease |
| FAQ card | click | max-height expands, chevron rotates 180deg | 250ms | ease |
| Nav on scroll | scroll > 40px | box-shadow appears below nav | 200ms | ease |
| Pricing badge | always | Subtle pulse (scale 1→1.02→1) | 3000ms | ease-in-out infinite |

### Retail-specific art direction

Product mockups are rendered in light mode (white dashboard bg, clean UI). The bento hero cell shows the overview page with a department breakdown bar chart. Satellite cells show: invoice scan result (clean list of matched/new items), the Ask chat (message bubble with answer), price history timeline (sparkline), and the morning report (email-style preview). Decorative retail motifs: a subtle shelf-bracket pattern (thin lines at 3% opacity) as the features section background. The floating geometric shapes are abstractions of retail: the rounded square suggests a receipt, the circle a barcode scanner target, the diamond a price tag. Colour coding: invoice features pair with teal, Ask features with indigo, margin tools with amber.

---

## Recipe 3: "Radiant Grid"

**Style:** Dark navy base with vibrant gradient accents (teal-to-violet spectrum), animated grid lines, and concentrated glow effects. High-energy but controlled. Inspired by Vercel's "radial glow" homepage, the Laser Focus Hero pattern, and Mercury/Pitch SaaS pages.

### Inspirations from top components

- **Laser Focus Hero** (gradient beams emanating from product)
- **Magic UI Border Beam** (pricing card beam)
- **Aceternity Spotlight** (concentrated radial glow)
- **Magic UI Marquee** (logo strip)
- **HeroGeometric** (animated background shapes)
- **Animated Testimonials** (rotating social proof)

### Palette

| Role | Hex | Usage |
|------|-----|-------|
| Background | `#0B1120` | Deep navy canvas |
| Grid lines | `#1E293B` | Subtle background grid pattern |
| Card surface | `#151F32` | Elevated cards |
| Card border | `#1E3A5F` | Subtle blue-tinted borders |
| Gradient start | `#06B6D4` | Cyan/teal |
| Gradient mid | `#8B5CF6` | Violet |
| Gradient end | `#EC4899` | Pink (used sparingly) |
| CTA solid | `#06B6D4` | Button background |
| CTA hover | `#0891B2` | Button hover |
| CTA text | `#0B1120` | Dark text on bright CTA |
| Body text | `#94A3B8` | Paragraphs |
| Heading text | `#F1F5F9` | Titles |
| Muted | `#64748B` | Secondary text |
| Success | `#34D399` | Positive indicators |

### Typography (Google Fonts)

- Display: **Space Grotesk** (700) — techy, distinctive, great for gradient text
- Body: **DM Sans** (400, 500) — clean, slightly warmer than Inter

### Section-by-section layout skeleton

1. **Nav** — Fixed, transparent. Logo left (wordmark in heading text colour). Links centre in muted, hover→heading colour. CTA right: teal pill with dark text. On scroll: bg→card-surface with backdrop-blur.

2. **Hero** — Full-width centred. Background: a fine dot-grid pattern (grid-lines colour, 1px dots, 32px spacing). Headline (clamp(40px, 5vw, 60px)) with **gradient text** (background: linear-gradient(135deg, cyan, violet); background-clip:text; color:transparent). Subtitle in body text. CTA button (teal, dark text, rounded-full). Below: full-width product screenshot in a card with 1px border, rounded corners. **Radiant effect**: behind the screenshot card, two large blurred ellipses (one teal at 8% opacity, one violet at 6% opacity, offset from each other by 100px) creating a concentrated bi-colour aura. **Grid beam lines**: 4 thin lines (1px, teal at 20%) emanate from the card corners outward at 45deg angles, animated with a "draw" effect (scaleX 0→1 over 1.5s on page load, then stay).

3. **Proof strip** — Marquee: logos in muted colour scrolling infinitely (same CSS-only technique as Recipe 1). Thin gradient line (teal→violet→pink) as the section top border (1px height, full width).

4. **Features (5 cards)** — 3-2 grid (3 top, 2 bottom centred). Each card: card-surface bg, 1px card-border, 16px radius. **On hover**: a soft glow appears behind the card (box-shadow: 0 0 40px 0 cyan at 8%). Icon (SVG, teal stroke). Title in heading colour. Description in body colour. Bottom of each card: a thin gradient line (teal→violet) as a bottom border that scales from 0% to 100% width on hover (transform: scaleX, origin:left, 300ms).

5. **How it works** — Vertical 3-step layout with a gradient vertical line (2px, teal→violet) as connector. Step circles are filled with card-surface and have a teal border that glows on scroll-into-view. Step descriptions beside each. Stagger-reveal on scroll.

6. **Pricing (3 cards)** — Row on a slightly lighter section (card-surface bg full-width). Cards are background-bg colour (darker than section = appears recessed). "Complete" card has: gradient top border (3px, teal→violet), **Border Beam** (teal luminous dot orbiting, 8s), and "Most popular" gradient pill. CTA buttons: teal fill. Feature checklists: success green checkmarks.

7. **FAQ** — Dark section. Questions in heading text. Click expands answer in body text with height transition. Gradient accent on the expand icon (small gradient circle).

8. **Contact form** — Centred card, card-surface bg, gradient border (1px, done via a wrapper div with gradient bg and inner div inset by 1px). Inputs: bg-colour bg, 1px card-border, 12px radius. CTA full-width teal. **Glow effect**: the form card has a large teal aura behind it (same technique as hero, but smaller: 120px blur, 10% opacity). Hidden field: `_subject: "Radiant Grid Lead"`.

9. **Footer** — Minimal on background. Logo, links in muted, thin gradient line as top border.

### 4 signature details

1. **Grid beam lines on hero** — Four thin teal lines extend from the product screenshot corners at 45 degrees, drawn with CSS (pseudo-elements with scaleX animation from 0 to 1, delayed 0.5s after page load). They remain static after drawing, framing the product like energy radiating outward.
2. **Gradient border grow on feature cards** — A 2px bottom border on each feature card is implemented as a pseudo-element with background: linear-gradient. On hover it transitions scaleX from 0 to 1 (origin: left), creating a "drawing" effect that feels reactive and premium.
3. **Bi-colour aura** — The hero uses two offset blurred ellipses (teal + violet) rather than a single colour, creating a chromatic depth that single-gradient auras lack. The overlap zone is a deeper purple.
4. **Background dot grid** — The entire page has a repeating radial-gradient pattern (1px dots at grid-lines colour, 32px spacing) that adds texture without competing with content. It fades out in sections with coloured backgrounds via a section-level bg overlay.

### Micro-interaction inventory

| Element | Trigger | Animation | Duration | Easing |
|---------|---------|-----------|----------|--------|
| Hero beam lines | page load (delayed 500ms) | scaleX 0→1 | 1500ms | ease-out |
| Hero aura | always | Slow drift (translate ±10px on X/Y axis) | 8000ms | ease-in-out infinite alternate |
| Feature card hover glow | mouseenter | box-shadow 0 0 0→0 0 40px cyan/8% | 300ms | ease-out |
| Feature card border grow | mouseenter | pseudo scaleX 0→1 | 300ms | ease-out |
| Feature card border shrink | mouseleave | pseudo scaleX 1→0 (origin: right) | 200ms | ease-in |
| Border Beam (pricing) | always | offset-distance 0%→100% | 8000ms | linear infinite |
| Marquee logos | always | translateX(0)→(-50%) | 35000ms | linear infinite |
| How-it-works steps | scroll into view | opacity 0→1, translateX(-20px→0), stagger 150ms | 500ms | ease-out |
| How-it-works circle | scroll into view | box-shadow 0→0 0 12px teal/20% | 300ms | ease-out (delayed to after translate) |
| CTA button | hover | translateY(-1px), box-shadow grows (0 4px 12px teal/20%) | 150ms | ease-out |
| Nav | scroll > 60px | bg transparent→card-surface, backdrop-blur appears | 200ms | ease |
| FAQ expand | click | height 0→measured, chevron rotates 90deg | 250ms | ease |
| Gradient text | always | background-size: 200% 200%, animate position (slow shimmer) | 6000ms | linear infinite |

### Retail-specific art direction

The product screenshot in the hero shows a dark-themed RetailGuard dashboard (matching the page palette: navy bg, teal/green accents for positive metrics, warm amber for warnings). This creates visual cohesion rather than a jarring light-mode screenshot on dark. Feature cards each contain a small UI vignette: (1) a barcode with scan lines animating across it, (2) a chat interface with a teal cursor blinking, (3) a sparkline showing price movement with a gradient fill underneath, (4) a simplified leak-alert card with amber warning dot, (5) a morning report preview with time and department headings. The dot-grid background subtly evokes a receipt's texture at an abstract level. Where gradient colours appear near retail UI, teal always means "savings found" and violet means "action needed", creating an intuitive visual language even before reading copy.

---

## Implementation Notes

- All three recipes target a single scrollable HTML page with inline CSS and vanilla JS. No npm, no React, no build step.
- Use Tailwind via CDN (`<script src="https://cdn.tailwindcss.com"></script>`) for utility classes alongside custom CSS for animations and effects that Tailwind cannot express.
- Product mockups: use placeholder `<div>` compositions styled to look like the dashboard during build. Replace with real RetailGuard UI screenshots (dark or light, matching recipe palette) on final assembly.
- Accessibility: all animations respect `prefers-reduced-motion: reduce` (wrap keyframes in `@media (prefers-reduced-motion: no-preference)`). Focus states visible on all interactive elements (outline: 2px solid accent, offset 2px).
- Mobile: bento grids collapse to single column. Hero compositions stack vertically. Marquee continues. Tilt effects disabled on touch (no mousemove). Beam animations remain (they are passive).
- Performance: no JS frameworks, no heavy libraries. All effects are CSS-native or require < 30 lines of vanilla JS. requestAnimationFrame only for the spotlight mousemove; everything else is pure CSS.
- Test all palette combinations through a WCAG contrast checker before shipping. The values above are designed to pass AA, but verify after any tint changes.
