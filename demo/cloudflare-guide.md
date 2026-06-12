# RetailGuard — Cloudflare Infrastructure Guide

## Overview

RetailGuard runs on **Cloudflare Pages** (free tier). The frontend is a static React app. The backend is 4 **Cloudflare Workers** (serverless functions) that handle analytics and file storage.

Patrick sees: `https://retail-insights-dashboard.pages.dev`
You see: `/api/analytics`, `/api/files` (secret key required)

---

## Architecture

```
Patrick's Browser
    ↓
[Cloudflare Pages — static React app]
    ↓ (silent background fetch)
[Cloudflare Workers — /api/* endpoints]
    ↓
[KV — event logs]  +  [R2 — file storage]
```

---

## Resources Created

### 1. Cloudflare Pages Project
- **Name**: `retail-insights-dashboard`
- **URL**: https://retail-insights-dashboard.pages.dev
- **Git repo**: MarvellousCodes/Retail-Insights-Dashboard (GitHub)
- **Auto-deploy**: Yes, on push to `main`
- **Build command**: `npx vite build && cp -r functions dist/functions`
- **Build output**: `dist/public`
- **Root directory**: `artifacts/retail-analysis`

### 2. KV Namespace (event tracking)
- **Name**: `retailguard-analytics`
- **Namespace ID**: `7a08ca5a3eeb4844ab8e78dca3d0a785`
- **Binding**: `ANALYTICS`
- **Purpose**: Stores event logs (JSON) — what Patrick clicks, uploads, scans
- **TTL**: 90 days per event (auto-expires)
- **View data**: Cloudflare dashboard → Storage & Databases → KV → retailguard-analytics

### 3. R2 Bucket (file storage)
- **Name**: `retailguard-files`
- **Location**: Western Europe (WEUR)
- **S3 API**: `https://bc33f2d8b8043a8a2a34f9fc40a92cc4.r2.cloudflarestorage.com/retailguard-files`
- **Binding**: `FILES`
- **Purpose**: Stores copies of actual PDFs and CSVs Patrick uploads
- **Retention**: Permanent (until you delete)
- **View data**: Cloudflare dashboard → R2 → retailguard-files

### 4. Environment Variables
- **ANALYTICS_KEY**: `patrick-gala-2026` (secret key for viewing analytics)

---

## Worker Functions (4 endpoints)

### POST /api/track — Event Logger
- **File**: `functions/api/track.js`
- **What it does**: Receives batched events from the browser, stores in KV
- **Events tracked**: `csv_upload`, `invoice_scan`, `invoice_export`, `add_to_csv`
- **Data stored per event**: session ID, timestamp, user agent, IP, country, event details
- **Patrick sees**: Nothing — runs silently in background

### POST /api/upload — File Capture
- **File**: `functions/api/upload.js`
- **What it does**: Receives actual files (CSV, PDF) via FormData, stores in R2
- **Storage format**: `{type}/{timestamp}_{session}_{filename}` (e.g. `invoice/2026-04-30_abc123_sw_invoice.pdf`)
- **Metadata stored**: original filename, upload time, session ID, file size, IP, country
- **Patrick sees**: Nothing — runs silently after each upload/scan

### GET /api/analytics — Your Dashboard
- **File**: `functions/api/analytics.js`
- **Auth**: Requires `?key=patrick-gala-2026`
- **Returns**: Summary counts + last 50 events
- **URL**: `https://retail-insights-dashboard.pages.dev/api/analytics?key=patrick-gala-2026`

### GET /api/files — File Browser
- **File**: `functions/api/files.js`
- **Auth**: Requires `?key=patrick-gala-2026`
- **List files**: `?key=patrick-gala-2026` (all) or `&type=invoice` / `&type=csv`
- **Download file**: `?key=patrick-gala-2026&download=invoice/FILENAME`
- **URL**: `https://retail-insights-dashboard.pages.dev/api/files?key=patrick-gala-2026`

---

## How Analytics Works (Client Side)

File: `src/lib/analytics.ts`

```
track("event_name", { prop: "value" })  →  batches events  →  POST /api/track
uploadFile(file, "invoice")             →  FormData POST   →  POST /api/upload
```

- Events are batched (1 second debounce or 10 events, whichever first)
- Everything wrapped in try/catch — if the endpoint doesn't exist (local dev), it silently fails
- No cookies, no fingerprinting — just a random session ID in sessionStorage (cleared on tab close)
- No consent banner needed — no PII collected, no cross-site tracking

---

## Free Tier Limits

| Resource | Free Limit | Patrick's Expected Usage |
|---|---|---|
| Pages builds | 500/month | ~10/month |
| Worker requests | 100,000/day | ~20/day |
| KV reads | 100,000/day | ~5/day |
| KV writes | 1,000/day | ~20/day |
| KV storage | 1 GB | ~1 KB per event |
| R2 storage | 10 GB/month | ~50 MB/month |
| R2 reads | 10M/month | ~50/month |
| R2 writes | 1M/month | ~50/month |

---

## How to Deploy Updates

1. Make code changes locally
2. `git add . && git commit -m "description"`
3. `git push origin main`
4. Cloudflare auto-builds and deploys (~1-2 minutes)
5. Check deployment: Cloudflare dashboard → Workers & Pages → retail-insights-dashboard → Deployments

---

## How to Check Patrick's Activity

1. **Quick summary**: Visit `https://retail-insights-dashboard.pages.dev/api/analytics?key=patrick-gala-2026`
2. **Browse files**: Visit `https://retail-insights-dashboard.pages.dev/api/files?key=patrick-gala-2026`
3. **Download a file**: `...api/files?key=patrick-gala-2026&download=TYPE/FILENAME`
4. **Raw KV data**: Cloudflare dashboard → KV → retailguard-analytics
5. **Raw R2 files**: Cloudflare dashboard → R2 → retailguard-files

---

## Troubleshooting

| Issue | Fix |
|---|---|
| `{"error":"KV not bound"}` | Bindings not applied — go to Settings → Bindings, re-add, then retry deployment |
| `{"error":"unauthorized"}` | Wrong key or extra text in URL — use exactly `?key=patrick-gala-2026` |
| `{"error":"R2 not bound"}` | R2 binding missing — add R2 bucket binding `FILES` → `retailguard-files` |
| Workers not running | Check build output has `dist/functions/api/*.js` — build command must include `cp -r functions dist/functions` |
| Analytics shows 0 events | Nobody has used the live site yet — test by uploading a CSV on the .pages.dev URL |
