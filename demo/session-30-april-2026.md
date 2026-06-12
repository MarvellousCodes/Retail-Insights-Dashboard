# RetailGuard — Build Session 30 April 2026

## Context

Second in-person meeting with Patrick at Gala Longford. He loved the invoice scanner — said "nobody does this, people have tried but nobody could." His current system is RS Back Office 5. We needed to build several features before giving him the live link.

---

## What Was Built

### 1. Product Matching (exists/new flag)
**File**: `src/pages/InvoiceScannerPage.tsx`

When an invoice is scanned, each product is matched against the CSV data already uploaded:
- **Green "Exists" badge** — barcode or name found in existing products
- **Amber "New" badge** — not in the system
- **Summary banner** — "5 existing, 3 new" with count

Barcode matching handles:
- Exact EAN-13 match
- Leading zero stripping (`0080867067` → `80867067`)
- Short codes padded to EAN-13
- Fuzzy name matching (substring containment for names > 4 chars)

### 2. "Add New to System" Button
**File**: `src/pages/InvoiceScannerPage.tsx`

One-click button that takes all "New" products from the invoice and merges them into the main product database. Sets cost price from invoice, auto-calculates sell price from target margin, assigns department and supplier.

### 3. S&W Invoice Parser
**File**: `src/lib/invoiceParser.ts`

Patrick's supplier (S&W Wholesale) sends CamScanner photo PDFs — 6 pages of images, zero digital text. Fixed:
- **OCR fallback**: When pdf.js finds no text, renders each page to canvas at 2x resolution and runs Tesseract.js OCR
- **S&W format parser**: Handles `Qty Code Description Size Pack Price` layout where OCR merges Pack+Price (e.g. `1210.49` = pack 12, price €10.49). Uses lazy regex split: `/^(\d+?)(\d{1,2}\.\d{2})$/`
- **EAN barcode extraction**: Reads `(XXXXXXXXXX)` lines above each product. Handles missing close parens, short EAN-8, consecutive barcode lines. **96% barcode coverage** (54/56 products)
- **Skip patterns**: Filters out headers, footers, CamScanner watermarks, order metadata

### 4. Patrick's Departments
**File**: `src/App.tsx` (DEFAULT_THRESHOLDS)

Extracted 27 departments from pages 5-6 of the S&W invoice (Hanlons Gala department sales report):
- Off Licence (18%), Bread and Cakes (28%), Biscuits (25%), Confectionery (25%), Dairy Wall (22%), Soft Drinks (20%), Frozen Food (22%), Ice Cream N Cones (30%), Grocery (22%), Health and Beauty (35%), Deli Cold (40%), Deli Hot (45%), Instore Bakery (35%), Tea/Coffee Machine (60%), Non Food (30%), Fresh Produce (35%), Tobacco (8%), Newsagents (15%), Prepared Meals (40%), Breakfast Meats (25%), Cooked Meats (30%), Crisps and Snacks (28%), Sports and Nutrition (30%), Fresh Meat (25%), Forecourt Services (15%), General (20%)

Department field in invoice scanner changed from free text to **dropdown** with all 27 departments.

### 5. Analytics Tracking (Client Side)
**File**: `src/lib/analytics.ts`

Silent background tracker that logs:
- `csv_upload` — file name, product count
- `invoice_scan` — file name, type, item count, new product count
- `invoice_export` — item count, supplier
- `add_to_csv` — count, supplier

Events batched (1s debounce), wrapped in try/catch (silently fails locally). No cookies, no fingerprinting.

### 6. File Capture
**File**: `src/lib/analytics.ts` (`uploadFile` function)

Silently uploads a copy of every CSV and invoice PDF to R2 storage. Patrick sees nothing.

### 7. Cloudflare Workers (Backend)
**Files**: `functions/api/track.js`, `functions/api/upload.js`, `functions/api/analytics.js`, `functions/api/files.js`

4 serverless endpoints:
- `POST /api/track` — stores events in KV
- `POST /api/upload` — stores files in R2
- `GET /api/analytics?key=SECRET` — returns usage summary
- `GET /api/files?key=SECRET` — lists/downloads stored files

### 8. Cloudflare Infrastructure
- **KV namespace**: `retailguard-analytics` (event logs, 90-day TTL)
- **R2 bucket**: `retailguard-files` (actual PDFs/CSVs, permanent)
- **Environment variable**: `ANALYTICS_KEY` = `patrick-gala-2026`
- **Build command updated**: `npx vite build && cp -r functions dist/functions`

---

## Files Changed

| File | Change |
|---|---|
| `src/App.tsx` | Replaced generic departments with Patrick's 27 Gala departments; pass products to InvoiceScannerPage |
| `src/lib/invoiceParser.ts` | S&W parser, OCR fallback for scanned PDFs, improved barcode extraction |
| `src/lib/analytics.ts` | **NEW** — event tracker + file uploader |
| `src/pages/InvoiceScannerPage.tsx` | Product matching, add-to-CSV button, department dropdown, analytics hooks |
| `src/pages/UploadPage.tsx` | Analytics tracking on CSV upload |
| `functions/api/track.js` | **NEW** — KV event storage Worker |
| `functions/api/upload.js` | **NEW** — R2 file storage Worker |
| `functions/api/analytics.js` | **NEW** — analytics dashboard Worker |
| `functions/api/files.js` | **NEW** — file browser/download Worker |
| `package.json` | Build command updated to copy functions |

---

## Links

| What | URL |
|---|---|
| Patrick's app | https://retail-insights-dashboard.pages.dev |
| Your analytics | https://retail-insights-dashboard.pages.dev/api/analytics?key=patrick-gala-2026 |
| Your file browser | https://retail-insights-dashboard.pages.dev/api/files?key=patrick-gala-2026 |
| Invoice files | https://retail-insights-dashboard.pages.dev/api/files?key=patrick-gala-2026&type=invoice |
| CSV files | https://retail-insights-dashboard.pages.dev/api/files?key=patrick-gala-2026&type=csv |

---

## What's Next

| Task | Priority | Status |
|---|---|---|
| Test live site with Patrick's S&W invoice | HIGH | Ready to test |
| Dashboard redesign — margin leakages first | MEDIUM | Not started |
| Nested departments (Snacks → Crisps → brands) | MEDIUM | Waiting for Patrick's hierarchy sheet |
| RS Back Office 5 integration research | FUTURE | Need to investigate API |
| Unit cost calculation (case price ÷ pack size) | LOW | Not started |

---

## Meeting Notes Reference

Full meeting 2 notes: `demo/meeting-2-action-items.md`
Full meeting 2 transcript: `demo/meeting-2-notes.md`
Cloudflare infrastructure guide: `demo/cloudflare-guide.md`
