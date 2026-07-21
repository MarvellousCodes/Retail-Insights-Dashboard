# RetailGuard Landing Page Art Direction Recipes

Five distinct, buildable visual directions for Dribbble-grade marketing pages.

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

## Recipe 1: "Midnight Bento"

**Style:** Dark-mode bento grid with glowing accent cards. Inspired by Linear, Raycast, Vercel.

### Palette

| Role | Hex | Usage |
|------|-----|-------|
| Background | `#0A0A0F` | Page canvas |
| Card surface | `#141420` | Bento cells |
| Border | `#2A2A3C` | Card edges, dividers |
| Accent (violet) | `#7C5CFC` | CTAs, glow halos, active states |
| Accent glow | `#7C5CFC33` | Box-shadow aura behind cards |
| Success green | `#34D399` | Positive metrics, badges |
| Body text | `#B8B8CC` | Paragraphs |
| Heading text | `#F0F0F8` | h1 through h3 |

### Typography

- Display: **Space Grotesk** (700, 800)
- Body: **Inter** (400, 500)

### Layout skeleton

1. **Hero** (full-width, centred). Oversized headline (56-72px). One-line subtitle. Single CTA button with violet glow box-shadow. Below: a floating 3-column bento preview of the dashboard (cards tilted 2deg with perspective).
2. **Social proof strip**. Logos of Irish/UK symbol groups (Centra, Spar, Londis) in muted white at 40% opacity. Quote from a generic "forecourt owner, Dublin" with no real name.
3. **Features bento grid** (3x2 on desktop, stacked mobile). Each cell: icon top-left, feature name bold, two-line description, and a tiny floating UI card mockup in the corner showing that feature's output.
4. **Pricing** (3 cards side by side, "Complete" card has accent border + "Most popular" badge). Minimal feature checklist per tier.
5. **Contact form** (centred, dark card, violet CTA). Name, email, shop name. Hidden tag `_subject: "Midnight Bento Lead"`.

### 3 signature details

1. Each bento card has a subtle 1px gradient border (violet-to-transparent clockwise) that animates on hover.
2. The hero dashboard mockup uses a receipt-paper torn-edge silhouette as a mask on one card, hinting at the invoice scanner.
3. A radial gradient "aura" (accent glow, 200px radius, 15% opacity) floats behind the hero headline, slowly pulsing with CSS animation.

### Product art direction

Show the RetailGuard dashboard as a dark-themed floating composition: the main margin-leak table on a tilted card, a barcode scan animation on a second card, and a chat bubble from "Ask your shop" on a third. Cards cast long violet box-shadows onto the dark background. Receipts and barcodes appear as decorative line-art outlines in the border colour.

---

## Recipe 2: "Warm Editorial"

**Style:** Light, editorial, magazine-feel. Large serif headlines, generous whitespace, colour-blocked sections. Inspired by Stripe Press, Lemon Squeezy, Framer showcase.

### Palette

| Role | Hex | Usage |
|------|-----|-------|
| Background | `#FDFBF7` | Warm off-white canvas |
| Card surface | `#FFFFFF` | Feature cards, pricing |
| Section accent block | `#F3EDE3` | Alternating section backgrounds |
| Primary text | `#1A1A1A` | Headlines, body |
| Muted text | `#6B6B6B` | Captions, secondary |
| Accent (terracotta) | `#C9573A` | CTAs, links, highlights |
| Accent hover | `#A8432C` | Button hover |
| Divider | `#E5DDD2` | Horizontal rules, borders |

### Typography

- Display: **Playfair Display** (700, 800)
- Body: **Source Sans 3** (400, 600)

### Layout skeleton

1. **Hero** (split: left text, right product shot). Serif headline at 64px, relaxed line-height (1.2). Two lines of body copy. CTA in terracotta with rounded corners. Right side: a browser-frame mockup showing the Overview page.
2. **Value narrative** (full-width centred text block, max-w-640). Three short paragraphs explaining the problem (margin leaks), the consequence (thousands lost per year), and the fix (RetailGuard scans your data). Each paragraph separated by generous 48px spacing.
3. **Features** (alternating image-left/text-right rows). Each feature gets a colour-blocked background section alternating warm cream and white. Product screenshots as browser-frame mockups.
4. **Testimonial** (full-bleed cream section). Large pull quote in serif italic. Attribution: role and location, no real name or shop.
5. **Pricing** (clean table on white). Three columns, "Complete" highlighted with terracotta top-border.
6. **Contact form** (card on cream background, centred). Terracotta CTA. Hidden tag `_subject: "Warm Editorial Lead"`.

### 3 signature details

1. A thin terracotta horizontal rule (48px wide) sits above each section heading, acting as a chapter marker.
2. Feature screenshots are wrapped in a subtle paper-texture border (CSS only, no images) suggesting a printed receipt being analysed.
3. The hero headline uses a CSS text-decoration with a wavy underline in terracotta on the key word ("margins" or "leaks").

### Product art direction

Show RetailGuard as a calm, trustworthy tool: clean browser-frame screenshots on a slight 1deg rotate, dropped onto the warm canvas with a paper-shadow. Feature sections show cropped close-ups of the dashboard (the margin leak list, the invoice scan result, the Ask chat). Decorative elements are minimal: a faint barcode watermark in the cream sections, and thin shelf-bracket line-art icons beside each feature title.

---

## Recipe 3: "Neon Pulse"

**Style:** High-energy gradient aura on dark navy. Inspired by Pitch, Cron, Mercury SaaS pages.

### Palette

| Role | Hex | Usage |
|------|-----|-------|
| Background | `#0D1117` | Deep navy canvas |
| Surface | `#161B22` | Cards, sections |
| Border | `#30363D` | Subtle edges |
| Gradient start | `#00D4AA` | Teal/mint |
| Gradient end | `#6366F1` | Indigo |
| CTA solid | `#00D4AA` | Button background |
| CTA text | `#0D1117` | Dark text on CTA |
| Body text | `#C9D1D9` | Paragraphs |
| Heading text | `#F0F6FC` | Titles |

### Typography

- Display: **Outfit** (700, 800)
- Body: **DM Sans** (400, 500)

### Layout skeleton

1. **Hero** (centred, single column). Gradient text headline (teal-to-indigo via `background-clip: text`). Subtitle in body text colour. CTA button in solid teal. Below: a full-width product screenshot floating above a large blurred gradient orb (the "aura").
2. **Metrics strip** (3 big numbers in a row). Illustrative stats: "147 margin leaks found", "12 minutes average scan time", "6 departments monitored". Numbers in gradient text.
3. **Features** (icon grid, 2x3). Each cell: a 48px line icon, bold title, and two-line description. Icons use the teal-indigo gradient as stroke colour (SVG).
4. **Product walkthrough** (vertical scroll, 3 steps). Step number in oversized gradient numeral. Screenshot beside description. Connected by a thin gradient vertical line.
5. **Pricing** (cards on dark surface). "Complete" card has a gradient top-border. CTA buttons in teal.
6. **Contact form** (dark card with gradient border glow). Fields on surface background. Teal CTA. Hidden tag `_subject: "Neon Pulse Lead"`.

### 3 signature details

1. The hero aura: a 400px blurred ellipse (radial gradient from teal 20% to indigo 5% to transparent) sits behind the product screenshot, slightly off-centre, creating depth.
2. On scroll, each feature icon fades in with a 50ms stagger and a subtle scale(0.95) to scale(1) transition.
3. The pricing "Most popular" badge is a pill with the gradient as background and dark text, giving it a glowing badge effect.

### Product art direction

The dashboard appears as a full-resolution screenshot in a minimal dark browser chrome, floating above the gradient aura. Secondary product shots (invoice scan, Ask chat) appear as smaller floating cards orbiting the main screenshot at varying z-depths (translate3d with perspective). Decorative barcode line-art and receipt-edge silhouettes are rendered in the teal colour at 15% opacity as background texture in the features section.

---

## Recipe 4: "Brutalist Clean"

**Style:** Neo-brutalist with warm cream canvas, thick borders, hard shadows, chunky type. Inspired by Gumroad, Notion's marketing, Superdesign brutalism pages.

### Palette

| Role | Hex | Usage |
|------|-----|-------|
| Canvas | `#F5F0E8` | Warm cream page |
| Card | `#FFFFFF` | White cards with hard shadow |
| Border | `#1A1A1A` | Thick 2px black outlines |
| Shadow | `#1A1A1A` | Hard offset, no blur (4px 4px) |
| Accent (mustard) | `#F5A623` | CTAs, badges, highlights |
| Accent hover | `#D4890E` | Button hover |
| Text | `#1A1A1A` | All body and heading text |
| Muted | `#6B6B6B` | Captions, secondary info |

### Typography

- Display: **Cabinet Grotesk** (if unavailable, **Sora**) (800, 900)
- Body: **Satoshi** (if unavailable, **Inter**) (400, 500)

### Layout skeleton

1. **Hero** (left-aligned, full-width). Massive headline (72-96px, black, uppercase or sentence case). Hard-shadow CTA button (mustard fill, black border, 4px offset). Right: a product card with thick border and hard shadow, showing the margin-leak table.
2. **Problem statement** (full-width cream band). Three stacked sentences in large body text (24px). No fluff, just the pain points retailers face. Each sentence in its own bordered box.
3. **Features** (stacked cards, full-width, alternating slight rotation: +1deg / -1deg). Each card: thick border, hard shadow, icon in a mustard circle, feature name bold, description.
4. **Pricing** (3 cards in a row, "Complete" card has mustard fill). Feature checklists use checkbox-style square markers. Hard shadows everywhere.
5. **Social proof** (single large quote card, rotated -1deg, with a thick border).
6. **Contact form** (card with thick border and hard shadow). Mustard CTA. Inputs have visible thick borders. Hidden tag `_subject: "Brutalist Clean Lead"`.

### 3 signature details

1. Cards have a deliberate slight rotation (transform: rotate(1deg)) that straightens on hover, giving a "sticker on a desk" feel.
2. The CTA button has a visible state change: on hover, the shadow disappears and the button translates 4px down and 4px right, simulating a physical press.
3. A receipt-paper SVG pattern (zigzag torn edge) runs along the top of the features section as a decorative divider.

### Product art direction

The dashboard is shown as a "sticker": a cropped screenshot inside a card with thick black border and hard offset shadow, placed at a slight angle on the cream canvas. Smaller product detail shots (a barcode being scanned, a chat answer) appear as separate sticker-cards scattered with varying rotations. Shelf and receipt motifs are rendered as bold line-art illustrations in black, placed in whitespace gaps. Everything feels tactile, like paper cutouts on a desk.

---

## Recipe 5: "Geometric Gradient"

**Style:** Playful geometric shapes with soft gradients, rounded corners, and vibrant colour blocking. Inspired by Notion, Pitch, Monday.com marketing pages.

### Palette

| Role | Hex | Usage |
|------|-----|-------|
| Background | `#FFFFFF` | Clean white |
| Section block (lilac) | `#F0EBFF` | Alternating feature sections |
| Section block (mint) | `#E8FBF5` | Alternating sections |
| Primary text | `#1E1E2E` | Headlines, body |
| Muted text | `#6E6E80` | Secondary text |
| Accent (violet) | `#6C47FF` | CTAs, active states |
| Accent secondary (coral) | `#FF6B6B` | Badges, highlights |
| Accent tertiary (teal) | `#00C9A7` | Success indicators, icons |
| Border | `#E8E8ED` | Card borders |

### Typography

- Display: **Sora** (700, 800)
- Body: **Plus Jakarta Sans** (400, 500)

### Layout skeleton

1. **Hero** (centred). Bold headline (56px) with one word highlighted in violet. Subtitle in muted. CTA button (violet, rounded-full pill shape). Below: a product illustration composition: the dashboard UI as a rounded-corner card, surrounded by floating geometric shapes (circles, rounded rectangles, dots) in lilac, mint, and coral at varying opacities.
2. **Logo strip** (greyscale logos, 50% opacity).
3. **Features** (alternating colour-blocked sections, lilac and mint backgrounds). Each section: left text, right product screenshot in a rounded card with a coloured shadow matching the section background. Geometric shape decorations in the section margins.
4. **How it works** (3-step horizontal timeline). Numbered circles connected by a dotted line. Each step: icon in a coloured circle, title, description. Numbers in violet.
5. **Pricing** (rounded cards on white). "Complete" card has violet border and a "Most popular" coral badge. Generous border-radius (16px).
6. **Contact form** (on lilac section background, white card, violet CTA pill). Rounded inputs. Hidden tag `_subject: "Geometric Gradient Lead"`.

### 3 signature details

1. Floating geometric shapes (SVG circles, rounded squares, dots) in the hero are animated with a slow CSS float (translateY oscillation, 3s ease-in-out infinite), creating a playful "breathing" effect.
2. Feature screenshots have a soft coloured drop-shadow that matches their section background (e.g., a lilac shadow on the lilac section), making them feel embedded rather than pasted on.
3. The "How it works" step connectors are animated on scroll: the dotted line draws itself left-to-right as the section enters the viewport.

### Product art direction

The dashboard is presented as a friendly, approachable interface: rounded-corner browser frames, slightly oversized to feel inviting rather than technical. Feature screenshots are cropped to show one clear action (a scan result, a chat answer, a price history chart). Decorative elements are abstract geometric shapes, not literal retail items. A few playful touches: a small receipt icon as one of the floating shapes, a barcode rendered as a geometric pattern (bars as rounded rectangles in varying heights). Colour coding matches the feature: invoice scanner on mint, Ask your shop on lilac, margin finder on coral.

---

## Implementation notes

- All recipes target a single-page scroll. No routing needed.
- Each can be built as standalone HTML + Tailwind CSS (CDN) or as a React component.
- Product screenshots should use placeholder images during build, replaced with real RetailGuard UI crops on final assembly.
- Test all palettes through a contrast checker before shipping. The hex values above are designed to pass, but verify after any tint adjustments.
- Mobile: all layouts collapse to single-column stacked. Bento grids become vertical. Pricing cards stack.
