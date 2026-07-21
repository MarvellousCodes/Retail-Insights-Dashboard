# RetailGuard Landing Page Art Direction Recipes (Framer Showcase Edition)

Three distinct, buildable visual directions inspired by the best Framer-built marketing sites of 2025-2026.

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

## Top 10 Framer Showcase Sites (Research)

These are the standout Framer-built marketing sites from the 2025-2026 community gallery, marketplace trending, and curated lists. Each was chosen for a specific technique applicable to SaaS product marketing.

| # | Site | What Makes It Work |
|---|------|-------------------|
| 1 | **Superhuman** (superhuman.com) | Dark-mode SaaS benchmark. Masterful hierarchy: oversized headline, tight subtitle, single CTA. Smooth scroll-triggered reveals section by section. 8px spacing grid, every element breathes. Micro-interactions on buttons feel physical. |
| 2 | **Possible Finance** (possiblefinance.com) | Fintech clarity for non-technical users. Minimalist layout with smooth micro-interactions, modular sections that explain complex products simply, readable sans-serif pairing (geometric display + humanist body), generous 64-80px section gaps. |
| 3 | **Darkroom Agency** (darkroomagency.com) | Monochromatic confidence. Bold type hierarchy (120px+ display), sticky nav that shrinks on scroll, case-study cards with magnetic hover (translate + shadow shift), systematic 4-column grid, crisp border-radius consistency (12px everywhere). |
| 4 | **SpecifyApp** (specifyapp.com) | Modular SaaS storytelling. Hero section laser-focused on one value prop, scroll-triggered feature animations with staggered fade-in, clear visual grouping via background-colour alternation, type scale jumps (16/20/32/48/64). |
| 5 | **Jet Template** (Framer Marketplace, $149) | Bold and energetic. Swappable hero background animation (particles, gradient mesh, or grid), strong sans-serif display type, high-contrast CTA buttons, section transitions using clip-path reveals, 12-column grid with 24px gutter. |
| 6 | **Kresna Template** (Framer Marketplace, $99) | Clean AI/SaaS starter. Subtle scroll animations (opacity + translateY 20px), consistent card radius and shadow depth, sticky pricing comparison table, minimal colour palette (2 hues + neutrals), systematic icon sizing. |
| 7 | **Fabrica** (Framer Marketplace trending) | Structured grid that handles content-heavy pages without clutter. Strong vertical rhythm, alternating full-bleed and contained sections, type-driven hierarchy with restrained colour, card hover reveals extra info without layout shift. |
| 8 | **LottieFiles** (lottiefiles.com) | Vibrant SaaS with live product demos embedded in the page flow. Clear content hierarchy through size contrast, smooth transitions between feature sections, interactive showcases that let users experience the product before signing up. |
| 9 | **Wilkinson & Rivera** (wilkinson-rivera.com) | Premium minimalism. Enormous hero visuals with minimal copy overlay, hover animations on product cards (subtle scale 1.02 + shadow depth increase), professional serif/sans pairing, whitespace as the primary design element. |
| 10 | **Saphira** (saphira.ai) | Futuristic SaaS with gradient orb backgrounds, glass-morphism cards (backdrop-blur + semi-transparent fills), modular responsive layout, clean geometric typography, interactive components that respond to scroll position. |

---

## Recipe 1: "Confident Grid"

**Style:** Light-mode, modular precision. Tight 4-column grid with systematic spacing, confident typography, and product-led storytelling through real UI showcases. No gimmicks, just relentless craft.

**Inspired by:** Possible Finance (modular clarity for non-tech users), SpecifyApp (scroll-triggered feature storytelling), Fabrica (structured grid handling dense content cleanly), Kresna (subtle scroll animations + consistent card radius).

### Palette

| Role | Hex | Usage |
|------|-----|-------|
| Canvas | `#FAFAFA` | Light grey page background |
| Card surface | `#FFFFFF` | Feature cards, pricing cards |
| Section alt | `#F3F4F6` | Alternating section backgrounds |
| Primary text | `#111827` | Headlines, body |
| Secondary text | `#6B7280` | Captions, labels |
| Accent (deep teal) | `#0D9488` | CTAs, links, active states |
| Accent hover | `#0F766E` | Button hover darken |
| Accent subtle | `#CCFBF1` | Badge backgrounds, highlight tints |
| Border | `#E5E7EB` | Card borders, dividers |
| Success | `#059669` | Positive metric callouts |

### Typography (Google Fonts)

- Display: **Inter Tight** (700, 800) at 48/56/64px
- Body: **Inter** (400, 500) at 16/18px
- Mono accent: **JetBrains Mono** (500) for metric numbers

### Section-by-Section Layout Skeleton

1. **Nav** (sticky, white, border-bottom 1px). Left: RetailGuard wordmark. Right: links (Features, Pricing, FAQ) + filled CTA button "Get my free margin scan". Shrinks padding from 20px to 12px on scroll (transition 200ms).

2. **Hero** (max-w-1200, centred). Left 55%: headline (48-56px, tight leading 1.1), subtitle (18px, secondary colour), CTA button (teal, 48px height, 16px rounded). Right 45%: product screenshot in a card with 1px border, 12px radius, subtle drop-shadow (0 4px 24px rgba(0,0,0,0.08)).

3. **Social proof strip** (full-width, section-alt background, py-16). "Trusted by independent retailers across Ireland and the UK." Five muted greyscale logos at 40% opacity. Marquee scroll optional.

4. **Features** (5 features in alternating rows: image-left/text-right, then flip). Each row: 600px max for text block, product screenshot in bordered card opposite. Feature title (24px bold), 2-line description, small "Learn more" link in teal.

5. **How it works** (3-step horizontal layout on desktop, vertical on mobile). Large circled numbers (1, 2, 3) in accent-subtle background. Step title + one sentence. Connecting dotted line between steps (SVG).

6. **Pricing** (3 cards, max-w-960). Middle card ("Complete") elevated with teal top-border (3px) and "Most popular" pill badge. Each card: tier name, price, feature checklist with teal checkmarks, CTA button (middle = filled teal, others = outlined).

7. **FAQ** (accordion, max-w-720, centred). 6-8 questions. Chevron rotates on open. Clean borders between items.

8. **Contact form** (section-alt background). Card centred, max-w-480. Name, email, shop name inputs. Teal filled CTA. Hidden tag `_subject: "Confident Grid Lead"`.

9. **Footer** (white, border-top). Left: wordmark + one-line description. Right: nav links in columns. Bottom: copyright.

### 4 Signature Details

1. **Scroll-stagger fade-in.** Every card and content block enters viewport with `opacity: 0 -> 1` + `translateY(24px) -> 0` over 500ms ease-out, staggered 80ms per sibling. Uses IntersectionObserver, fires once.
2. **Magnetic CTA hover.** Primary buttons shift 1px up and gain +2px shadow depth on hover (box-shadow transition 150ms). Feels like the button lifts off the surface.
3. **Metric callout pills.** Key numbers (e.g. "147 margin issues found") shown in small rounded pills with accent-subtle background and mono font, placed inline within feature descriptions.
4. **Consistent 12px radius.** Every card, button, input, badge, and image container uses exactly border-radius: 12px. No variation. This single decision makes the entire page feel cohesive.

### Scroll/Hover Choreography (implementation spec)

- **Nav:** `position: sticky; top: 0`. On scroll > 50px, add class `.scrolled` that reduces `padding-block` from 20px to 12px and adds `box-shadow: 0 1px 3px rgba(0,0,0,0.06)`. Transition: `padding 200ms ease, box-shadow 200ms ease`.
- **Hero elements:** Fade in on load with 0/200/400ms delays (headline, subtitle, CTA). Screenshot card enters with `transform: translateY(32px) scale(0.98)` animating to rest over 700ms cubic-bezier(0.16, 1, 0.3, 1).
- **Feature rows:** IntersectionObserver with `threshold: 0.2`. On intersect, add `.visible` class. CSS: `.feature-row { opacity: 0; transform: translateY(24px); transition: all 500ms ease-out; } .feature-row.visible { opacity: 1; transform: none; }`.
- **Pricing cards:** On hover, card translates Y -4px and shadow increases from `0 2px 8px` to `0 8px 24px` (150ms ease).
- **FAQ:** Accordion content height animates via `max-height` transition (300ms ease). Chevron rotates 180deg.

### Retail-Specific Art Direction

Screenshots show RetailGuard's light-themed dashboard: the margin leak table with red/amber/green badges, the Ask chat with a natural-language question and tabular answer, the invoice scan result with matched products. Screenshots are placed in minimal browser-chrome frames (just the top bar dots, no URL). Feature icons use simple line-art representing: a barcode, a magnifying glass over a receipt, a chat bubble, a price tag with an arrow, and a clock (morning report). All icons in teal stroke, 2px weight, 24x24.

---

## Recipe 2: "Dark Observatory"

**Style:** Deep dark-mode with controlled luminance, floating UI panels, and a single vibrant accent that draws the eye to actions. Premium, modern, data-product energy.

**Inspired by:** Superhuman (dark SaaS benchmark, micro-interactions on buttons, breathing whitespace), Darkroom Agency (monochromatic confidence, bold type, magnetic hover states), Saphira (gradient orbs, glass-morphism cards, futuristic SaaS), Jet (energetic hero animation, clip-path transitions).

### Palette

| Role | Hex | Usage |
|------|-----|-------|
| Background | `#09090B` | Page canvas (zinc-950) |
| Surface | `#18181B` | Cards, panels (zinc-900) |
| Surface elevated | `#27272A` | Hover states, active cards (zinc-800) |
| Border | `#3F3F46` | Subtle card edges (zinc-700) |
| Body text | `#A1A1AA` | Paragraphs (zinc-400) |
| Heading text | `#FAFAFA` | All headlines (zinc-50) |
| Accent (emerald) | `#10B981` | CTAs, links, positive metrics |
| Accent glow | `#10B98133` | Box-shadow aura on CTAs |
| Accent hover | `#059669` | Button hover |
| Danger | `#EF4444` | Negative metrics, leak indicators |
| Gradient start | `#10B981` | Hero aura orb |
| Gradient end | `#0891B2` | Hero aura orb (cyan-600) |

### Typography (Google Fonts)

- Display: **Space Grotesk** (700) at 56/64/72px
- Body: **Inter** (400, 500) at 16/18px
- Mono: **IBM Plex Mono** (500) for data figures

### Section-by-Section Layout Skeleton

1. **Nav** (sticky, background with backdrop-blur-lg on scroll, border-bottom zinc-700). Left: RetailGuard logo (white). Right: ghost links + emerald filled CTA.

2. **Hero** (full-width centred column, max-w-1100). Massive headline (64-72px, white, tight tracking -0.02em). Subtitle in zinc-400. Emerald CTA with glow shadow. Below: full-width product screenshot floating above a blurred radial gradient orb (emerald-to-cyan, 50% opacity, 500px radius, positioned centre-bottom of hero).

3. **Social proof strip** (border-top + border-bottom zinc-700). Logos in zinc-500, evenly spaced. Simple caption above.

4. **Features** (2x3 grid of glass-morphism cards). Each card: `background: rgba(24,24,27,0.6); backdrop-filter: blur(12px); border: 1px solid rgba(63,63,70,0.5); border-radius: 16px`. Icon (emerald stroke), title (white), description (zinc-400).

5. **How it works** (vertical timeline, left-aligned). Three steps connected by a thin emerald vertical line (2px). Step circles: 40px, emerald border, dark fill, number inside. Step title + description beside. Product micro-screenshots float to the right at each step.

6. **Pricing** (3 cards on surface background). "Complete" card has emerald gradient top-border (3px). Dark cards with zinc-700 borders. Feature lists with emerald checkmarks.

7. **FAQ** (dark accordion, max-w-700). Items separated by zinc-700 borders. Open state reveals text with emerald left-bar accent (3px).

8. **Contact form** (glass-morphism card, centred, max-w-440). Inputs: dark background, zinc-700 border, zinc-400 placeholder. Emerald CTA with glow. Hidden tag `_subject: "Dark Observatory Lead"`.

9. **Footer** (border-top zinc-700). Minimal: logo, links, copyright in zinc-500.

### 4 Signature Details

1. **Hero gradient orb.** A `radial-gradient(ellipse at 50% 120%, #10B98140 0%, #0891B220 40%, transparent 70%)` positioned as a pseudo-element behind the hero screenshot. Animates with `@keyframes pulse { 0%,100% { transform: scale(1); opacity: 0.4 } 50% { transform: scale(1.05); opacity: 0.5 } }` over 8s infinite.
2. **Glass-morphism feature cards.** Semi-transparent background + backdrop-blur creates depth layering. On hover, border colour transitions from zinc-700 to emerald at 40% opacity (200ms ease), creating a "selected" glow ring.
3. **Data contrast pops.** Wherever a number appears (feature descriptions, pricing), it renders in IBM Plex Mono at a slightly larger size (18px vs 16px body) in emerald or white, making metrics jump off the dark surface.
4. **CTA glow pulse.** Primary buttons have `box-shadow: 0 0 0 0 #10B98133`. On hover, animates to `0 0 20px 4px #10B98144` over 300ms. Feels like the button is powering up.

### Scroll/Hover Choreography (implementation spec)

- **Nav:** `backdrop-filter: blur(16px)` kicks in after scroll > 20px (add class). `transition: background 200ms, border-color 200ms`.
- **Hero:** Headline fades up (translateY 20px) at 0ms, subtitle at 150ms, CTA at 300ms, screenshot at 500ms (translateY 40px + scale 0.97 to rest). Screenshot uses `cubic-bezier(0.16, 1, 0.3, 1)` for a spring feel.
- **Feature cards:** Stagger-reveal on viewport entry. Each card: `opacity: 0; transform: translateY(16px) scale(0.98)` to visible, staggered 60ms apart. On hover: `transform: translateY(-2px); border-color: rgba(16,185,129,0.4)` (200ms).
- **Timeline steps:** Each step fades in with its emerald connector line growing from 0 to full height (clip-path or scaleY animation, 400ms per step).
- **Pricing cards:** Middle card has a subtle floating animation: `@keyframes float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-4px) } }` 4s infinite, very subtle.

### Retail-Specific Art Direction

The product is shown in its own dark-themed variation: a dashboard screenshot with dark card backgrounds, emerald accents on positive margins, red on leaks. The hero screenshot is large (spanning ~80% viewport width), placed in a minimal frame (no browser chrome, just rounded corners + shadow). Secondary feature illustrations: a receipt being scanned with green scan-line overlay, a chat interface showing "Which products lost margin this week?" with a crisp table response, a price-change timeline with up/down arrows. Decorative: subtle barcode patterns rendered as very faint (5% opacity) repeating SVG in the page background at section boundaries.

---

## Recipe 3: "Open Shelf"

**Style:** Bright, approachable, and unmistakably retail. Warm white canvas with a bold colour accent system, generous rounded components, and a friendly tone that speaks to shop owners, not developers. Approachable without being childish.

**Inspired by:** LottieFiles (vibrant colour with clear hierarchy, product demos in flow), Possible Finance (accessible fintech design for non-tech users), Wilkinson & Rivera (enormous hero visuals, premium whitespace), Fabrica (vertical rhythm handling content-dense pages), SpecifyApp (alternating backgrounds for visual grouping).

### Palette

| Role | Hex | Usage |
|------|-----|-------|
| Canvas | `#FFFFFF` | Clean white page |
| Section warm | `#FFF7ED` | Warm peach tint (orange-50) for alternating sections |
| Section cool | `#F0FDF4` | Mint tint (green-50) for proof/results sections |
| Card surface | `#FFFFFF` | Cards with shadow |
| Primary text | `#1C1917` | Headlines (stone-900) |
| Body text | `#44403C` | Paragraphs (stone-700) |
| Muted text | `#78716C` | Captions (stone-500) |
| Accent (burnt orange) | `#EA580C` | CTAs, links, primary actions (orange-600) |
| Accent hover | `#C2410C` | Button hover (orange-700) |
| Accent light | `#FED7AA` | Badge/tag backgrounds (orange-200) |
| Success (forest) | `#15803D` | Positive metrics (green-700) |
| Border | `#E7E5E4` | Card edges (stone-200) |

### Typography (Google Fonts)

- Display: **Plus Jakarta Sans** (700, 800) at 44/52/60px
- Body: **Source Sans 3** (400, 600) at 16/18px
- Accent numerals: **Plus Jakarta Sans** (800) for big metric callouts

### Section-by-Section Layout Skeleton

1. **Nav** (sticky, white, soft shadow on scroll). Left: RetailGuard wordmark in stone-900. Centre: nav links. Right: "Get my free margin scan" orange CTA (pill shape, 24px radius).

2. **Hero** (split layout, max-w-1200). Left 50%: friendly headline (52px, "Know exactly where your margins leak. Fix them before they cost you."), 2-line subtitle, orange pill CTA + secondary ghost button "See how it works". Right 50%: product dashboard mockup inside a device frame (rounded rectangle with 20px radius, soft 24px shadow), tilted 2deg for visual energy.

3. **Social proof strip** (section-warm background, py-20). "Helping independent retailers protect their margins." Below: three metric cards (illustrative): "Hundreds of products scanned per upload", "Checks run every morning", "5 minutes from upload to insight". Cards have white background, orange-200 top accent bar.

4. **Features** (5 features, alternating layout rows). Odd rows: screenshot left, text right. Even rows: text left, screenshot right. Each section alternates between white and section-warm backgrounds. Feature title (28px bold), description (2-3 lines), small bulleted sub-points. Screenshots in rounded frames with soft shadows.

5. **How it works** (section-cool background). Horizontal 3-step with large numbered circles (60px, orange fill, white number). Step title bold, one-line description. Curved connector arrows between steps (SVG, stone-300 stroke).

6. **Pricing** (white background). 3 cards, generous padding (32px). "Complete" card: orange left-border (4px), "Most popular" pill badge in orange-200. Tier name, price (large, Jakarta Sans 800), "/month net of VAT" small, feature checklist, CTA button.

7. **FAQ** (section-warm background). Accordion with 20px rounded containers per item. Active item has orange left-border. Smooth height transition.

8. **Contact form** (white card on section-cool background, centred, max-w-500, 24px radius, 32px padding, large shadow). Name, email, shop name, optional message textarea. Orange pill CTA. Friendly micro-copy below: "No card needed. We will send you a sample report within 48 hours." Hidden tag `_subject: "Open Shelf Lead"`.

9. **Footer** (stone-900 background, white text). Left: logo + tagline. Centre: nav columns. Right: "Made for Irish and UK retailers" in muted white. Bottom border: thin line in orange-600.

### 4 Signature Details

1. **Rounded everything.** Buttons: 24px radius (pill). Cards: 20px radius. Input fields: 12px radius. Avatars/icons: full circle. This creates a soft, non-intimidating feel for the 45-65 year-old audience.
2. **Section colour rhythm.** White -> warm peach -> white -> cool mint -> white. This colour alternation replaces the need for heavy borders or dividers and creates natural content grouping that guides the eye down.
3. **Feature screenshot frames.** Each product screenshot sits inside a card that has a 4px top-border in the accent colour and a larger-than-normal box-shadow (0 8px 32px rgba(0,0,0,0.08)). This "lifts" the product out of the page and says "this is the important thing to look at."
4. **Friendly metric pills.** Key outcomes (in the social proof and feature sections) are shown in small pills: white text on orange background, or orange text on orange-200 background, with Plus Jakarta Sans 800. They break up long text and give the eye anchor points.

### Scroll/Hover Choreography (implementation spec)

- **Nav:** On scroll > 40px, adds `box-shadow: 0 2px 12px rgba(0,0,0,0.06)` and shrinks logo by 10% (transition 250ms ease).
- **Hero:** Left content fades in from left (translateX -20px) at 0ms/150ms/300ms stagger. Right screenshot rises from below (translateY 30px) with slight rotation unwinding (rotate 4deg to 2deg) over 600ms ease-out.
- **Feature rows:** IntersectionObserver, threshold 0.15. Text side fades in from its alignment direction (left text from left, right text from right, 20px offset). Screenshot fades in with scale(0.96) to scale(1). Stagger: text at 0ms, screenshot at 200ms.
- **Metric cards:** On viewport entry, numbers count up from 0 using a simple requestAnimationFrame counter over 1200ms (easeOutQuart). Cards themselves fade up with 100ms stagger.
- **CTA buttons:** On hover, background darkens (orange-600 to orange-700), button scales 1.02, and shadow increases from 4px to 8px blur. Transition 150ms. On active (press), scales 0.98 for tactile feel.
- **Pricing cards:** On hover, card rises 4px (translateY) and shadow doubles in size. Transition 200ms ease.

### Retail-Specific Art Direction

This recipe speaks "shop" through warmth and familiarity: the colour palette evokes a well-lit store with wooden shelves (warm peach) and fresh produce (cool mint). Product screenshots show the RetailGuard dashboard in a clean, modern light theme with orange accent elements matching the page. Feature illustrations include: a receipt with highlighted problem lines (red underline), a chatbot answering "What sold well last Tuesday?", a morning report email preview with department summary cards, an invoice being matched against the stock file with green checkmarks. Decorative elements are subtle: faint shelf-line patterns (horizontal thin grey lines) in backgrounds, small barcode motifs used as section dividers (SVG, 6% opacity), and rounded price-tag shapes as icon containers.

---

## Implementation Notes

All three recipes are designed to be built as a single self-contained HTML file with:
- Tailwind CSS via CDN (or hand-written CSS following the same utility patterns)
- Google Fonts loaded via `<link>`
- Vanilla JavaScript for scroll animations (IntersectionObserver) and interactions
- No build step, no React, no bundler required
- FormSubmit AJAX handler for the contact form
- All images as inline SVG (icons, decorative elements) or `<img>` tags pointing to static screenshots

Estimated implementation time per recipe: 6-10 hours for a developer familiar with responsive CSS and basic scroll choreography.
