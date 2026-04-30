# Patrick Meeting 2 — Gala Longford — 30 April 2026

## Key Takeaways
- **Invoice scanner was the emotional hit** — Patrick said "nobody does this, people have tried but nobody could"
- He spends 80% of time in back office now (was 80% floor at start). Values time savings deeply
- Current system: **RS Back Office 5** (Retail Solutions). Also CBE exists in Ireland but he doesn't use it
- Margin monitoring didn't land as hard — need better marketing/framing next time

## Action Items (Priority Order)

### 1. Product Matching on Invoice Scanner — HIGH
- When invoice is scanned, check each product barcode against his existing CSV/database
- Flag: ✅ EXISTS or ❌ NEW PRODUCT
- Products marked red on his current invoices = not recognised in his system
- Currently he prints invoices, manually scans barcodes one by one to check

### 2. "Add to System" Button — HIGH  
- For NEW products, button to append them to the existing CSV file
- So scanned invoice items flow directly into his product database

### 3. Test S&W Invoice Against Parser — HIGH
- Need to verify parser works with S&W (non-approved supplier) invoice format

### 4. Backend/Analytics — Track Uploads & Usage — MEDIUM
- Need before giving him the live Cloudflare link
- Track: what CSV files he uploads, what invoices he scans, frequency

### 5. Dashboard Redesign — MEDIUM
- First view should be: top 50 margin leakage items (not all the charts)
- Everything else pushed to bottom/secondary views
- Departments within departments (snacks → crisps → individual crisp brands)

### 6. RS Back Office 5 Integration — FUTURE
- Investigate API/integration options with Retail Solutions Back Office 5
- Goal: changes in RetailGuard automatically sync to his POS system
- Legal cleared ✅

## Presentation Feedback (for next time)
- Show one section at a time, let him talk about each
- Treat audience as complete beginners
- Attach value/money to each feature ("this saves you X hours = €Y")
- Practice more, agree on order beforehand
- Watch sales videos together
