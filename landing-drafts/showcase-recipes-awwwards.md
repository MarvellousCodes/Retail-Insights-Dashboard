# RetailGuard Landing Page: Awwwards-Tier Art Direction Recipes

Three distinct, buildable visual directions inspired by the current top Awwwards-celebrated sites.
Each is implementable as a single self-contained HTML/CSS/JS file with no build step.

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

## TOP 10 AWWWARDS-CELEBRATED SITES (2024-2026 Research)

| # | Site | What makes it exceptional |
|---|------|--------------------------|
| 1 | **Lusion** (lusion.co) | Site of the Year winner. WebGL particle systems, real-time 3D experiments, cursor-reactive physics. Proves that creative technology can serve narrative, not just spectacle. |
| 2 | **Stripe.dev** | Code-generated visual art meets developer documentation. Generative backgrounds, functional console, infinite footer, math-art motifs. Code as design material. |
| 3 | **OPTIKKA** (by Zajno) | SOTD 2025. Rotating hero element that scroll-expands into a full ecosystem. Balances "scale of a system" with warmth. Smooth orchestrated transitions between sections. |
| 4 | **Immersive Garden** | SOTD Dec 2024. Natural textures and organic forms as digital craft. Parallax depth layers, scroll-driven reveals, a decade of innovation told through sequential storytelling. |
| 5 | **Micro** | SOTD Jun 2025. Extreme two-colour palette (#0F1013 / #F8F5EF). Skew and perspective transforms on scroll. Typographic confidence with minimal decoration. Motion from geometry, not effects. |
| 6 | **Smooothy** | SOTD Jul 2025. New slider/carousel library showcasing SVG draw animations, text animation, and WebGL. Black-only palette. Proves single-colour pages can feel luxurious through motion sequencing. |
| 7 | **AIM Kharkiv** (by Obys) | SOTM Jan 2024. Cultural archive as interactive experience. Scroll-driven timeline, typography as architecture, documentary depth through horizontal panning. |
| 8 | **Locomotive** | Hall of Fame studio, Locomotive Scroll creators. Smooth-scroll parallax as vocabulary, controlled velocity curves, staggered reveal choreography. Every element earns its entrance. |
| 9 | **The Creative Website Manual** | SOTD 2025. Meta-reference: how creative websites are crafted, shown through grids, typography specimens, and motion breakdowns. Self-documenting design system as content. |
| 10 | **Sparkk** | Case study 2024. In-house agency site that uses restrained animation and editorial pacing to demonstrate innovation. Proves that SaaS/B2B can be as crafted as luxury. |

---

## DISTILLED PATTERNS

From the top 10, three dominant strategies emerge:

1. **Orchestrated Scroll Theatre** (Locomotive, OPTIKKA, Immersive Garden): Every section has a choreographed entrance. Elements don't just fade in, they arrive with velocity, direction, and timing relationships to neighbours. The scroll position becomes a conductor's baton.

2. **Reductive Typography + Geometry** (Micro, Smooothy, AIM Kharkiv): Strip colour to near-monochrome, let type scale and geometric transforms carry all the drama. Motion comes from perspective shifts, rotation, and SVG path drawing rather than colour or imagery.

3. **Generative/Reactive Surfaces** (Lusion, Stripe.dev, The Creative Website Manual): The background is alive. Particles, noise fields, or procedural patterns respond to cursor or scroll, creating a sense of a living digital material underneath the content.

---

## Recipe 1: "Scroll Conductor"

**Inspired by:** OPTIKKA, Locomotive, Immersive Garden, Sparkk

**Concept:** A vertically-scrolled page where every element arrives through precisely choreographed scroll-driven animation. Sections don't just appear, they assemble themselves from fragments (a card slides in from left while its shadow drops from above, text types itself, numbers count up). The scroll bar becomes a timeline scrubber for a orchestrated production.

### Palette

| Role | Hex | Usage |
|------|-----|-------|
| Canvas | `#F7F5F0` | Warm parchment off-white |
| Surface | `#FFFFFF` | Cards, elevated panels |
| Deep surface | `#1B1B23` | Dark sections (proof, pricing) |
| Deep text | `#F2F0EC` | Text on dark sections |
| Primary text | `#1B1B23` | Headlines, body on light |
| Muted text | `#7A7A82` | Secondary, captions |
| Accent | `#2D5F3A` | Deep forest green, CTAs, active |
| Accent hover | `#1E4528` | CTA hover state |
| Accent light | `#E8F0EB` | Badge backgrounds, subtle fills |
| Border | `#E4E0DA` | Dividers, card edges |
| Highlight | `#D4A853` | Gold accent for metrics, awards |

### Typography

- Display: **Instrument Serif** (400) via Google Fonts
- Body: **Instrument Sans** (400, 500, 600) via Google Fonts
- Mono (metrics): **JetBrains Mono** (500) via Google Fonts

### Section-by-section layout skeleton

1. **Nav** (sticky, 64px). Logo left (wordmark in Instrument Serif). Three links centre (Features, Pricing, About). CTA button right ("Get my free margin scan") in accent green, pill-shaped. On scroll past hero, nav gets backdrop-blur and a bottom border line that draws itself left-to-right.

2. **Hero** (100vh, centred column). Headline in Instrument Serif at 72px, max-width 800px. Each word staggers in from below (translateY(40px) to 0) with 80ms offset per word on page load. Subtitle at 20px in muted. CTA button with a horizontal line that extends outward on hover (CSS ::after pseudo-element). Below: a perspective-tilted dashboard screenshot (transform: perspective(1200px) rotateX(8deg) rotateY(-4deg)) that parallax-shifts on scroll.

3. **Proof strip** (dark section, 120px). Three metrics in JetBrains Mono at 48px (e.g. "147 margin leaks found", "6 departments scanned", "12 min average"). Numbers count up when section enters viewport (Intersection Observer + requestAnimationFrame). Gold highlight colour on the numbers.

4. **Features** (5 alternating rows, light canvas). Each row: text block (40%) and product screenshot (60%), alternating sides. On scroll-enter, text slides in from 0deg side and image slides from opposite with a 200ms delay. Each screenshot is in a card with 1px border and 8px shadow that intensifies as it approaches centre-viewport.

5. **How it works** (3 vertical steps, connected by a vertical line that draws as you scroll). Each step: numbered circle (accent), heading, description, and a small inline product UI detail. The connecting line uses SVG stroke-dashoffset animated by scroll position.

6. **Pricing** (dark section, 3 cards). Cards on deep surface with border. "Complete" card is elevated (translateY(-8px)) with accent border-top (3px). "Most popular" badge in gold highlight. Feature checklists with subtle stagger animation on enter.

7. **FAQ** (light, accordion). Each item: question in bold, answer hidden. Click expands with a height transition + rotate on the chevron. Questions stagger-reveal on scroll entry.

8. **Contact form** (accent-light background section). Card on white surface with accent left-border (4px). Fields: name, email, shop name, message. CTA in accent green. Hidden tag `_subject: "Scroll Conductor Lead"`. Form card slides up from below on enter.

9. **Footer** (dark, minimal). Logo, three column links, legal line. Elements fade up with stagger.

### 4 signature details

1. **Scroll-progress line**: A 2px accent-coloured line at the very top of the viewport (position:fixed) that grows from 0% to 100% width as the user scrolls the full page. Pure CSS with scroll-timeline (or JS IntersectionObserver fallback).

2. **Word-by-word hero reveal**: The headline splits into `<span>` per word, each animating translateY and opacity with staggered delays. Creates a cascading waterfall entrance that immediately signals craft.

3. **Parallax dashboard**: The hero product screenshot responds to scroll at 0.6x speed relative to surrounding content, creating depth. A subtle box-shadow grows as it "rises" toward the viewer.

4. **Metric count-up**: The proof strip numbers animate from 0 to their final value over 1.2s using an easeOutExpo curve when they enter the viewport, then stay static.

### Interaction/motion concept

All motion is scroll-driven (no autoplay loops). Use Intersection Observer with threshold arrays [0, 0.25, 0.5, 0.75, 1.0] to create progress-based animations. Each section has a "timeline" from 0 (just entered bottom of viewport) to 1 (centred or passed), and element transforms/opacity interpolate along that timeline. CSS `will-change: transform, opacity` on animated elements. Target 60fps by only animating transform and opacity (no layout-triggering properties). Locomotive Scroll is the spiritual reference: elements earn their entrances through controlled velocity. No bounce, no overshoot. Easing: cubic-bezier(0.22, 1, 0.36, 1) (custom ease-out).

### Retail-specific art direction

The dashboard screenshots show: (1) a margin leak table with red-highlighted rows and a "found" badge, (2) the invoice scanner mid-scan with a barcode overlay, (3) the Ask chat with a question and chart response, (4) a price history timeline, (5) a morning report summary card. Screenshots are real product UI crops on white backgrounds, dropped into rounded cards with subtle shadows. No abstract decoration. The product IS the decoration. Forest green accent evokes reliability, growth, and money. Gold highlight on metrics suggests value recovered. The parchment canvas feels trustworthy and unhurried, not techy or cold.

---

## Recipe 2: "Monochrome Theatre"

**Inspired by:** Micro, Smooothy, AIM Kharkiv, The Creative Website Manual

**Concept:** A near-monochrome page (charcoal + cream) where all drama comes from typography scale, geometric transforms, and SVG path animation. No colour gradients, no imagery beyond product screenshots. Text itself becomes the visual spectacle: headlines at 120px+, words that rotate in 3D on scroll, sections divided by typographic rules rather than colour blocks. The restraint IS the luxury.

### Palette

| Role | Hex | Usage |
|------|-----|-------|
| Canvas | `#F8F5EF` | Warm cream (from Micro's exact palette) |
| Ink | `#0F1013` | Near-black for all text and UI |
| Ink muted | `#0F101380` | 50% ink for secondary text |
| Accent | `#0F1013` | CTAs use ink-on-cream (inverted on hover) |
| Accent inverted | `#F8F5EF` | CTA text on hover (ink fill) |
| Card | `#FFFFFF` | Product screenshots, elevated cards |
| Border | `#0F101320` | 12% ink for rules and dividers |
| Highlight | `#C43B2B` | Single red accent, used ONLY on one word in hero and the "Most popular" badge |

### Typography

- Display: **Editorial New** (if unavailable, **Fraunces**) (Variable, optical size) via Google Fonts
- Body: **Switzer** (if unavailable, **Inter**) (400, 500) via Google Fonts

### Section-by-section layout skeleton

1. **Nav** (fixed, transparent, 80px). Wordmark left in display font, 24px. No links visible on load. A single hamburger icon right (three horizontal lines, ink). On scroll past hero, nav gains a cream backdrop + bottom border-line. CTA appears in nav only after hero passes (slide-right entrance).

2. **Hero** (100vh, left-aligned). Headline in display font at 120px (desktop), flush left, max-width 70vw. One word in the headline is highlighted in the single red accent (e.g. "margins" in `<span style="color:#C43B2B">`). Below headline: two lines of body at 20px. CTA is a text link with an arrow that extends on hover (no button shape, just underlined text + animated arrow). The entire right 30% of the hero is empty whitespace, asserting editorial confidence.

3. **Proof strip** (full-width, ink background, cream text). A single scrolling marquee line: "Scanning. Finding. Protecting. Recovering." in display font at 48px, moving left-to-right in infinite CSS animation (60s duration, linear). Below: three stat blocks in body font.

4. **Features** (5 sections, each full-viewport height). Each feature gets an entire screen. Left: feature name as oversized text (80px), rotated -90deg and pinned to the left edge. Centre: description paragraph (18px, max-width 480px). Right: product screenshot in a card that perspective-skews on scroll entry (transform: perspective(800px) rotateY(-3deg)). Sections separated by full-width 1px ink lines.

5. **How it works** (horizontal scroll section, 300vw wide). Three panels side by side, user scrolls horizontally (CSS scroll-snap or pinned scroll-to-horizontal technique). Each panel: large step number (200px, display font, 10% opacity as watermark), title, description, mini product UI.

6. **Pricing** (cream canvas, centred). Three columns with no cards, just text. Tier names at 36px, prices at 64px, feature lists at 14px. "Complete" column has the single red "Most popular" text badge above it. Dividers are vertical 1px ink lines between columns.

7. **FAQ** (minimal). Questions in display font at 24px. Answers in body at 16px. No accordion animation, just toggle visibility. Each Q/A separated by a thin rule.

8. **Contact form** (ink background, cream text, centred). Inputs have no visible border, just a bottom-line (cream, 1px). Labels float above. CTA is a large text link: "Send" with an extending arrow. Hidden tag `_subject: "Monochrome Theatre Lead"`.

9. **Footer** (cream, minimal). Logo, copyright, one row of links. Nothing else.

### 4 signature details

1. **120px+ display type**: The hero headline is unapologetically large. On mobile it drops to 56px but keeps the editorial weight. This single decision signals "this is not a template site."

2. **Horizontal scroll section**: The "How it works" panel uses CSS scroll-snap-type: x mandatory on a scroll container, creating a magazine-page-turn feel within the vertical page flow.

3. **Single-accent red word**: In an entirely monochrome page, ONE word in the hero (and the pricing badge) uses red. The restraint makes it hit like a highlighter pen on printed paper.

4. **Perspective-skewed screenshots**: Product images rotate slightly in 3D space on their Y-axis (-3deg), shifting to 0deg on hover. Creates depth without any shadows or gradients, purely through geometry.

### Interaction/motion concept

Motion is minimal but precise. No parallax, no particle effects. Three types of motion only: (1) Elements fade from opacity 0 to 1 over 600ms with cubic-bezier(0.16, 1, 0.3, 1) on viewport entry. (2) The marquee text scrolls continuously (transform: translateX, linear). (3) Hover states use 300ms transitions on transform (perspective rotations return to 0). The horizontal scroll section is the one "wow" moment, implemented via a sticky container with translateX driven by vertical scroll offset. All motion respects prefers-reduced-motion (disabled entirely). The page reads like a designed book, not a tech demo.

### Retail-specific art direction

Product screenshots are the ONLY imagery. They appear in white-background cards with a 1px ink border, like photographs mounted on card stock. The monochrome palette makes the colourful dashboard UI pop by contrast (the screenshots themselves are full-colour). Retail context comes from typography choices and copy, not decoration. No shelf icons, no barcode graphics. The absence of retail cliches signals sophistication: this is a financial tool, not a point-of-sale brochure. The single red accent subliminally evokes "loss" and "alert", the exact problem RetailGuard solves.

---

## Recipe 3: "Living Canvas"

**Inspired by:** Lusion, Stripe.dev, The Creative Website Manual, OPTIKKA

**Concept:** A dark page with a generative, cursor-reactive background surface (HTML5 Canvas noise field or WebGL particle mesh). The surface breathes, responding to mouse position with subtle distortion. Content floats above this living substrate on glass-morphism cards. The effect: the page feels alive, like looking through a window at data flowing beneath. Achievable with Canvas 2D (no three.js needed for this recipe, keeping bundle-free).

### Palette

| Role | Hex | Usage |
|------|-----|-------|
| Canvas BG | `#08090C` | Near-black base |
| Noise field | `#1A2332` | Animated background particles/grid |
| Noise accent | `#3B82F6` | Blue particle highlights on cursor proximity |
| Glass surface | `#FFFFFF08` | Card backgrounds (3% white, blur behind) |
| Glass border | `#FFFFFF15` | Card borders (8% white) |
| Primary text | `#F1F5F9` | Headlines, body |
| Muted text | `#94A3B8` | Secondary, captions |
| Accent (electric blue) | `#3B82F6` | CTAs, links, active states |
| Accent hover | `#60A5FA` | CTA hover |
| Success | `#34D399` | Positive metrics, confirmations |
| Warning | `#FBBF24` | Alert indicators in product UI |

### Typography

- Display: **Geist** (if unavailable, **Inter**) (700, 800) via Google Fonts / CDN
- Body: **Geist** (400, 500)
- Mono: **Geist Mono** (400) for metrics and code-like elements

### Section-by-section layout skeleton

1. **Nav** (fixed, glass surface, 64px, z-50). Logo left (wordmark, white). Links centre. CTA right (accent blue, pill shape with subtle glow: box-shadow 0 0 20px #3B82F640). Backdrop-filter: blur(12px).

2. **Hero** (100vh, centred). The Canvas element is positioned: fixed, covering full viewport, z-index: 0. All content sits above at z-index: 1+. Headline at 64px in white. Subtitle at 20px in muted. CTA button with accent glow. Below: a floating product dashboard screenshot with glass border, slightly elevated (translateZ effect via box-shadow layers). The screenshot has a subtle "data stream" animation: thin horizontal lines of blue scrolling vertically behind it (CSS animated background).

3. **Proof strip** (glass card, full-width, centred metrics). Three numbers in mono font at 40px with the success green colour. Labels below in muted. Card has glass morphism (backdrop-blur + border).

4. **Features** (5 glass cards in a staggered grid, 3 columns on desktop). Each card: icon (SVG, accent blue stroke), feature name in white bold, description in muted, and a small product UI thumbnail in the bottom-right corner. Cards have a hover effect: translateY(-4px) and the glass border brightens to 20% white. Stagger entrance: each card fades in with 100ms delay from its neighbour.

5. **How it works** (vertical timeline, glass line connecting 3 nodes). Each node: a circle with accent fill, connected by a vertical glass-bordered line. Content beside each node: step description and a mini product clip (static screenshot). The connecting line pulses with a traveling dot animation (CSS keyframes on a pseudo-element).

6. **Pricing** (3 glass cards). "Complete" card has accent blue border (full opacity) and a glow shadow. "Most popular" badge is a pill with accent background and dark text. Feature lists in muted, with checkmarks in success green.

7. **FAQ** (glass accordion cards). Question in white, answer in muted. Chevron rotates on expand. Cards have 1px glass border.

8. **Contact form** (large glass card, centred, max-width 480px). Inputs have glass backgrounds with muted placeholder text. Focus state: accent blue bottom-border glow. CTA in solid accent blue with hover glow intensification. Hidden tag `_subject: "Living Canvas Lead"`.

9. **Footer** (no glass, just content on the living canvas directly). Logo, links, legal. Minimal, letting the animated background show through.

### 4 signature details

1. **Cursor-reactive noise field**: A full-viewport `<canvas>` element renders a dot-grid (spacing: 30px). Each dot's opacity and slight positional offset responds to distance from the mouse cursor (within a 200px radius, dots brighten from 5% to 40% opacity and shift 2px toward cursor). Creates a "data consciousness" effect. Performance: ~2000 dots at 60fps on Canvas 2D, no WebGL needed.

2. **Glass morphism cards**: Every content container uses `backdrop-filter: blur(12px); background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);`. The living canvas shows through, making cards feel like floating glass panels over a data stream.

3. **Traveling pulse on timeline**: The "How it works" connecting line has a 4px bright dot that travels top-to-bottom on a 3s infinite animation, suggesting data flowing through the system.

4. **CTA glow**: All primary buttons have `box-shadow: 0 0 24px rgba(59,130,246,0.25)` that intensifies to 0.5 opacity on hover, creating a neon-sign warmth.

### Interaction/motion concept

Two layers of motion: (1) The background canvas runs at 60fps, with dots repositioning based on cursor (throttled to every 16ms via rAF). When cursor is idle for 2s, dots gently drift in a Perlin-noise pattern (pre-computed sin/cos offsets, no library needed). (2) Content uses Intersection Observer for scroll-entrance (translateY(20px) + opacity 0 to resting state, 500ms, ease-out). Hover states on cards use 200ms transitions. No scroll-jacking, no parallax. The canvas is the spectacle; content motion is restrained and functional. Canvas pauses when tab is not visible (document.hidden check). Entire canvas disabled and replaced with a static dark gradient on prefers-reduced-motion.

### Retail-specific art direction

The "living canvas" metaphor maps directly to RetailGuard's value: beneath the surface of your shop's numbers, there is living data revealing patterns. The cursor-reactive dots suggest "wherever you look, there are insights." Product screenshots appear in their natural colours inside glass cards, contrasting beautifully against the dark animated background. The blue accent evokes trust and intelligence without saying "AI". Success green appears only on positive metrics ("recovered", "found", "scanned"), reinforcing the value proposition through colour alone. No retail cliches (no shelf illustrations, no shopping baskets). The sophistication signals: "this is a serious financial intelligence tool", not "this is a loyalty card app."

---

## IMPLEMENTATION NOTES

- All three recipes target a single self-contained HTML file. CSS can be inline `<style>` or Tailwind via CDN (`<script src="https://cdn.tailwindcss.com"></script>`).
- JavaScript is vanilla ES2022+. No frameworks. No build step.
- Recipe 3's canvas animation is ~80 lines of JS. No libraries needed.
- All recipes respect `prefers-reduced-motion: reduce` by disabling non-essential animation.
- Product screenshots: use placeholder boxes (grey with "Screenshot: [Feature Name]" label) during build. Replace with real RetailGuard UI crops on final assembly.
- Test all palettes through a contrast checker before shipping. The hex values above are designed to pass WCAG AA, but verify after any tint adjustments.
- Mobile: all layouts collapse to single-column. Recipe 2's horizontal scroll becomes vertical stacked panels. Recipe 3's canvas runs at reduced dot-count (800 instead of 2000) on mobile for performance.
- FormSubmit activation: each variant's `_subject` tag must be unique so leads are attributable to the winning recipe.
