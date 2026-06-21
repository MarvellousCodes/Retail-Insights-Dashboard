# RetailGuard FLAGSHIP landing — build spec (THE definitive page)

Build ONE polished, self-contained page at
`/Users/marvade/Projects/Retail-Insights-Dashboard/landing-drafts/flagship.html`.
Read `_BRIEF.md` (brand system + data) and `_UPGRADE.md` (playbook). **This spec wins** where they differ.
Implement the copy below close to verbatim (light polish only). This is the page we ship — make it excellent.

## Research principles to honor (Shopify's 5 pillars + proven formulas)
1. **Value proposition above the fold** — answer *What is it / Why care / Why you* within 5 seconds.
2. **Outcomes over features in EVERY header** (e.g. "Stop selling below cost without knowing", not "Margin tracking").
3. **Cognitive ease** — trust signals high on the page; scannable; framing.
4. **Seamlessness** — kill friction; ONE primary CTA repeated; trust signals throughout.
5. **Headline = Promise/"Without" formula**, short + clear + empathetic, not clever.
6. **Honesty** — provable claims only. NO fake testimonials, NO real third-party customer logos.

## Design
Inter (Google Fonts) 400–900 · violet `#7c3aed → #a78bfa` · dark hero `#0b0b14`/deep-navy with subtle
violet orb glow → light sections (`#fff`/`#f8f8fb`) → light-gray cards (1px `#ececf2`, soft shadow, 14px radius).
Wordmark `Retail<accent>Guard</accent>`. **NO EMOJIS — inline SVG icons only.** Responsive 360–1440px.
Accessible (landmarks, aria, contrast), exactly ONE `<h1>`. Self-contained (inline CSS, tiny inline JS for
mobile nav/smooth-scroll + a simple FAQ accordion). ~600–800 lines. Start `<!DOCTYPE html>`, end `</html>`.

## EXACT COPY (implement verbatim; only light polish)

### Nav
Wordmark `RetailGuard`. Links: **How it works · What you get · Pricing · FAQ**. Right: **Sign in** (→`signin.html`)
and a primary button **Free margin scan** (→`#contact`).

### Hero
- Eyebrow pill: **For independent Irish convenience stores & forecourts**
- **H1:** *See exactly what your shop is losing money on — without touching your POS.*
- Subhead: *RetailGuard reads the export your POS already produces and automatically flags every product
  priced below target margin. Then it scans your delivery invoices and answers questions about your shop in
  plain English. No new hardware. Set up in an afternoon.*
- Primary CTA **Get your free margin scan** (→`#contact`) · secondary **See how it works** (→`#how`)
- Proof chips (provable): **423 below-target prices found in one shop's data** · **150,556 products analysed** · **Runs for about €1 a month**
- Hero visual = a "Margin leaks found" mock card. Header: *Below target margin · 423 products*. Rows
  (product · price · margin in red · recommended):
  - Goodfellas Deep Pepperoni · €4.50 · −16.5% · €6.55
  - Free Range Eggs (dozen) · €2.30 · −4.2% · €3.10
  - Organic Tomatoes 500g · €1.38 · 2.1% · €2.45
  - Farmhouse Cheese 200g · €3.00 · 9.4% · €3.85
  Footer chip: *…and 419 more.*

### Trust strip (one row, SVG icon + text each; wraps on mobile)
**Works with your CBE / Pervasive POS** · **GALA · BWG · Musgrave compatible** · **Your data stays in Ireland (GDPR)** · **Read-only AI — it can never change your data**

### Problem  — header: *Your POS records everything. It tells you nothing.*
Intro: *Getting a straight answer out of your stock system means exporting CSVs, wrestling with Excel and
matching columns by hand — every week. Meanwhile the money leaks quietly.* Five pains (SVG icon + bold + line):
1. **Invisible margin leaks** — wrong and under-target prices sit live for months; the till never warns you.
2. **The weekly spreadsheet grind** — 3–5 hours every week exporting, reformatting and hand-calculating margins.
3. **Delivery blindness** — supplier cost rises slip through; staff hand-check barcodes against the system.
4. **No plain-English answers** — you can't just ask "what am I losing money on this month?"
5. **Data you can't trust** — corrupt imports, missing costs and ghost records silently break your reports.

### How it works — header: *Up and running in an afternoon.*
1. **Export your POS data** — the same file your POS already generates. No new hardware, nothing changes at your till.
2. **RetailGuard scans and cleans** — it validates, repairs common import errors and finds every below-target price automatically.
3. **You get the list** — exactly which products to reprice and the recommended price, ranked by impact.
Note under the steps: *RetailGuard hands you the exact list and the right price — you stay in full control of what changes.*

### What you get — header: *Three tools that do the work for you.* (outcome-led, SVG icons)
- **Ask your shop, in plain English.** Type "which 5 products am I losing the most money on?" and get an answer in about 2 seconds.
- **Scan a delivery, skip the barcode marathon.** Photograph or upload a supplier invoice; RetailGuard reads every line, matches it to your catalogue and flags cost rises before they hit your margin.
- **Check any product in a second.** Scan a barcode to see instantly whether it's in your system and what margin it's making.
Footnote: *All three run on read-only AI for about €1 a month — capped so it can never surprise-bill you.*

### Proof — header: *What we found in one shop.* (honest pilot framing — NOT a testimonial)
*In one Irish shop's data, RetailGuard analysed 150,556 stock records and flagged 423 products priced below
target margin in minutes. Shops at this turnover can recover an **estimated** €7,500–€10,000 a year by fixing
those prices.* Three stat tiles: **423** leaks found · **150,556** products analysed · **3–5 hrs** saved each week.

### Pricing — header: *Start free. Pay when it pays for itself.*
Lead: *Every shop starts with a free margin scan on your own data. Choose a plan only once you've seen what we found.*
- **Starter — €49/mo**: live dashboard, margin alerts, department insights.
- **Pro — €99/mo** *(Most popular)*: everything in Starter + supplier analytics + trading patterns + Ask Your Shop.
- **Premium — €149/mo**: everything in Pro + the Invoice Scanner.
Footnote: *One-off setup €500–€1,500 depending on your POS. AI usage included and capped.*

### FAQ (objection handling — simple accordion or Q/A blocks)
- **Do I need new hardware or to change my till?** No. RetailGuard reads the export your existing POS already produces. Nothing changes at the counter.
- **Is my data safe?** Yes. Your data stays in-region (GDPR) and the AI is read-only — it can never edit, delete or move anything. Spending is capped.
- **Will it work with my POS?** It works today with CBE / Pervasive systems, the most common setup in Irish shops. Others on request.
- **Is it expensive to run?** The AI costs about €1 a month and is hard-capped. Plans start at €49/mo — usually a fraction of the margin a single corrected price recovers.
- **Does it reprice products for me?** Not yet — RetailGuard hands you the exact list and recommended price; you stay in control. One-click repricing is on the roadmap.
- **How long does setup take?** An afternoon. Send your export and we do the rest.

### Final CTA band
Header: *See what your shop is quietly losing.* Line: *Get a free margin scan on your own data — no commitment,
no new hardware.* Button: **Get your free margin scan** (→`#contact`).

### Contact (`id="contact"`)
Short form: Name · Email · Shop name · POS system (select: CBE / Pervasive / Other) · Message. Reassurance line:
*We'll run your free scan and walk you through what we found within 24 hours.* Button **Request my free scan**.

### Footer
Wordmark + links (How it works / What you get / Pricing / FAQ) + *© 2026 RetailGuard* + *Built in Ireland.*
