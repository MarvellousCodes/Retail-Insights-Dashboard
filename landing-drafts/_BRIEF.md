# RetailGuard Landing Page — Builder Brief (10 variants)

You are building **production-quality** marketing landing pages for **RetailGuard**, a SaaS that
connects to a convenience-store / forecourt POS and turns raw stock data into live margin
intelligence plus an AI suite. Audience: independent Irish shop owners; also a multi-store SaaS play.

## Reference the existing look first
Read these for the established visual language, then make each variant DISTINCT but in the same family:
- `/Users/marvade/Projects/Retail-Insights-Dashboard/landing/index.html`
- `/Users/marvade/Projects/Retail-Insights-Dashboard/landing/assets/style.css`

## Hard output rules
- Each variant = ONE self-contained `.html` file. ALL CSS in a single `<style>` tag. Only tiny inline
  JS allowed (mobile nav toggle, smooth scroll). The ONLY external resource permitted is Google Fonts (Inter).
- Must open directly in a browser with no build step.
- Mobile-responsive: must look right from 360px to 1440px.
- Semantic + accessible: landmarks, aria-labels, decorative SVGs `aria-hidden="true"`, good contrast.
- **NO EMOJIS anywhere.** Use inline SVG icons only. (Product owner explicitly forbids emojis in UI.)
- ~500–800 lines each. Production copy only — NO lorem ipsum, no placeholder text.
- Sign-in link → `signin.html`. Primary CTAs → `#contact`.
- After writing, confirm each file starts with `<!DOCTYPE html>` and ends with `</html>`.

## Brand / design system (keep all 10 cohesive)
- Font: **Inter** (Google Fonts), weights 400–900.
- Wordmark: `Retail<span class="accent">Guard</span>`.
- Primary accent: violet gradient `#7c3aed → #a78bfa`. Status: green `#16a34a` (good), amber `#f59e0b` (warn), red `#ef4444` (bad).
- Aesthetic: dark hero (near-black `#0b0b14` / deep navy with subtle violet orb/grid glow) → light content
  sections (`#fff` / `#f8f8fb`) → light-gray cards with 1px border `#ececf2`, soft shadow, 12–16px radius.
- Typical sections (adapt to the variant concept): sticky nav (Features, How it works, Pricing, Contact +
  "Sign in" + "Get access" button); hero (small pill badge + headline + subhead + 2 CTAs + a product-mock card);
  an AI-tools showcase of the 3 tools; a features grid; a problem / "before" block; how-it-works (3 steps);
  a stats band; pricing; a CTA band; a contact form; footer.

## Real data — use these EXACT numbers (consistency across all variants)
- 150,556 stock records analysed; 6,422 active products; 42 departments.
- 423 pricing issues auto-detected (margin leaks). Example loss-maker: "Goodfellas Deep Pepperoni" at −16.5% margin.
- Top departments by revenue: Tobacco & Lighters €9.18M; Wines & Spirits €6.90M (7,644 products, 39.5% margin);
  Vouchers/Top-ups €5.92M; also Confectionery, Soft Drinks, Dairy & Chilled, Frozen / Ready Meals.
- Fuel: Diesel €4.32M (26.7% margin), Petrol €1.40M (24.3% margin).
- Top supplier: GALA — €6.33M spend, 47.7% margin, 38,790 products. (Symbol groups: GALA / BWG / Musgrave.)
- Trading: avg basket 2.4 items, avg sale €16.96; busiest Fri (€648k) and Thu (€606k).
- Estimated recovery: €7,500–€10,000 / year (a 0.5pp margin lift on ~€1.5–2M non-fuel turnover).
- 3 AI tools:
  1. **Barcode Scanner** — free, decodes in-browser (image never leaves the device), instant "is it in my store + its margin?"
  2. **Invoice Scanner** — reads a whole supplier invoice (photo or PDF), matches every line to your catalogue,
     flags cost rises + new margin leaks. ~$0.001 per scan.
  3. **Ask Your Shop** — ask in plain English ("which 5 products am I losing money on?"), answer in ~2s,
     ~$0.001/question, READ-ONLY-safe (the AI can never change your data).
- Trust: read-only AI (triple-locked), data stays in-region (GDPR), cost-capped, no model training on your data.
- ~2s dashboard load. Saves 3–5 hours/week. Zero spreadsheets.
- Pricing tiers: Starter €49/mo, Pro €99/mo (most popular), Premium €149/mo (+ Invoice Scanner & Ask),
  one-off setup €500–€1,500.

## The 10 variants (each builder is told which to make)
- **v01 — AI Co-Pilot**: dark, AI-forward. Hero "Ask your shop anything." Hero mock = a chat UI showing the real
  Q&A ("Which 5 products am I losing the most money on?" → a ranked answer + a "Show SQL" chip). Lead with the 3 AI tools.
- **v02 — ROI / Loss-aversion**: hero = giant number "€10,000 a year" + "in margin, slipping through your till —
  found automatically." Lead with the problem + 423 issues + a "margin leaks found" table + recovery math.
- **v03 — Visibility**: hero "Your POS holds everything. You see nothing." Dashboard-led — big product-mock card
  (KPIs: 6,422 active, 34.2% markup, 423 issues, 42 depts + a Products-by-Department table). Evolves the current page.
- **v04 — Irish vertical**: green-accented (#16a34a primary, violet secondary). Hero "Margin intelligence built for
  Irish forecourts and convenience stores." Feature GALA/BWG/Musgrave, fuel + tobacco, data-stays-in-Ireland trust.
- **v05 — Price-anchored**: hero "A full-time margin analyst for €99 a month." Pricing tiers prominent near the top
  (Starter/Pro/Premium cards, Pro highlighted) + ROI math (€1,188/yr cost vs €7.5–10k recovered = 6–8×).
- **v06 — Product tour**: guided showcase — alternating image/text "screenshot" sections, one per capability
  (Dashboard, Barcode Scanner, Invoice Scanner, Ask Your Shop, Issues worklist), each with a realistic CSS UI mock.
- **v07 — Minimal editorial**: ultra-clean, lots of whitespace, large Inter typography, restrained palette
  (mostly black/white + one violet accent), one big hero stat ("423 margin leaks, found while you slept"). Premium/understated.
- **v08 — Bold dark**: full near-black background throughout, neon-violet (#a78bfa) + electric accents, big gradient
  headlines, energetic, high-contrast, glowing cards, startup-launch vibe.
- **v09 — Trust / security-led**: hero "Read-only AI. Your data never leaves your shop." Lead with the security story:
  triple-locked read-only AI, in-region/GDPR, cost-capped, no data training. Security "badges" (SVG shield icons).
- **v10 — Narrative scroll**: scrollytelling "A Tuesday in the shop" — delivery arrives, prices wrong, hours on
  spreadsheets → RetailGuard solves each beat → outcome + CTA. Emotional + concrete, real numbers woven in.

## Output location
Write to absolute paths: `/Users/marvade/Projects/Retail-Insights-Dashboard/landing-drafts/vNN.html`
