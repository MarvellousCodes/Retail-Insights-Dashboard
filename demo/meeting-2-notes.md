# Meeting 2 — Patrick, Gala Longford

**Date:** 30 April 2026
**Location:** In-person, Gala store, Longford
**Attendees:** Marvellous, Co-founder, Patrick (store owner)
**Meeting type:** 2nd meeting (1st was online)
**Duration:** ~1 hour
**System:** RS Back Office 5 (Retail Solutions Back Office 5)

---

## What We Showed Him

We demonstrated 4 sections of RetailGuard:

1. **Dashboard** — KPI cards, morning report view
2. **Issues/Insights** — margin leakages, price anomalies, flagged items
3. **Departments** — margin breakdown by department
4. **Invoice Scanner** — OCR scan of non-approved supplier invoices

**Demo order followed:** Dashboard → Issues → Insights → Invoice Scanner → Patrick then showed us his system

---

## Patrick's Reactions

### Invoice Scanner — STRONGEST reaction
- He **loved** the invoice scanner — strongest emotional response of the entire meeting
- Direct quote: **"Nobody does this. People have tried this, but nobody could."**
- The setup worked — referencing his pain from meeting 1 ("last time you told us 10% of stock comes from non-approved suppliers, every Friday evening you're spending 1-1.5 hours...") made the solution land harder
- No more manual input was the key emotional trigger

### Margin Monitoring — Important but undersold
- He talked about margins for **7+ minutes straight** — it's clearly a deep pain
- He was showing us on his system where the red flags appear
- But we didn't convey the monetary value well enough
- Co-founder's assessment: "The margin is costing him hundreds of thousands, but he's not seeing that value because we didn't describe it to him well enough"

### Dashboard — Wants redesign
- When asked what he wants to see on the dashboard, he said: **a list of 50 items where the margin doesn't make sense** — margin leakages front and centre
- Everything else (revenue, KPIs) should be secondary — at the bottom if at all
- From dashboard, he should be able to drill into departments

### Departments — Wants sub-categories
- He has **departments within departments** (hierarchical categories)
- Example: Snacks → Crisps → specific crisp types (Tayto, etc.)
- Like folders within folders — wants to see margin info at every level
- This is a structural requirement we don't currently support

### Price Anomalies — Didn't understand the term
- When asked "do you know what price anomalies are?" he said **no**
- Need to rename to something definitive: "Items Below Target Margin" or "Margin Alerts"
- Co-founder's feedback: use definitive terms, not descriptive/subjective ones

---

## New Requirements from Patrick

### 1. Sub-category hierarchy (departments within departments)
- Currently we show flat departments
- He needs: Department → Sub-department → Product level
- Example: Snacks → Crisps → Tayto Cheese & Onion
- Wants margin info at every level of the hierarchy
- **Priority: HIGH** — can't use the tool properly without it

### 2. Invoice product matching (barcode lookup)
- After scanning an invoice, check if products **already exist** in his system
- Currently he does this manually: prints invoices, gets barcode scanner, scans each product barcode to check if it's in RS Back Office
- Products NOT in the system → flagged in RED for manual input
- Products that ARE in the system → just update quantity
- He circles/marks unrecognised products in red on paper invoices
- **Priority: HIGH** — directly solves his barcode scanning pain

### 3. New product onboarding flow
- After invoice scan identifies NEW products (not in his system): what happens?
- Do they get added to his existing product database with quantities?
- Need to scope this product onboarding/import flow
- **Priority: HIGH** — completes the invoice scanner workflow

### 4. Dashboard redesign — margin leakages first
- First view: list of ~50 items where margin is below target
- Everything else pushed to bottom or secondary view
- From dashboard → drill into departments → sub-departments
- **Priority: HIGH** — quick win, reorder existing content

### 5. RS Back Office 5 integration
- Current flow: CSV export → upload to RetailGuard → view insights → manually go back to RS Back Office to make changes
- He wants: make changes FROM RetailGuard that sync to RS Back Office
- Long-term: automatic margin corrections without switching systems
- He offered access to his back systems for us to understand them
- Also mentioned **CBE** as another Irish back office system (he doesn't use it)
- **Priority: MEDIUM** — needs research first

### 6. Backend tracking / analytics
- Before giving him the Cloudflare link, we need a backend to track:
  - What CSV files he's uploading
  - What invoices he's scanning
  - Usage patterns
- **Priority: MEDIUM** — needed before sharing live link

### 7. Invoice scanner consistency
- Needs to work reliably across different invoice formats
- S&W Wholesale invoice (sample provided) must be tested
- **Priority: HIGH** — must work perfectly for next demo

### 8. Rename "Price Anomalies"
- Patrick didn't understand the term
- Rename to "Items Below Target Margin" or "Margin Alerts" throughout the app
- **Priority: HIGH** — tiny effort, big clarity improvement

---

## Patrick's Business Context (new info from this meeting)

- **Time allocation shift:** Started his career spending 80% on the shop floor, 20% back office. Now it's flipped — **80% back office, 20% floor**
- **Belief:** "The real money is made in the back office"
- **Values his time deeply** — if something could cut even 20% of back office time, he's interested
- **Vendors:** He mentioned something about vendors that wasn't fully captured — need to follow up
- **Self-service checkout:** Brief mention — may have a self-checkout system, need to clarify
- **Red-flagged invoices:** In his current system, unrecognised products show up in RED or he circles them manually

---

## Relationship Status

Patrick is no longer just a potential customer — **he's a co-development partner:**
- Said "let's find ways to work together"
- Wants **constant communication**, not a dump of features every 2 weeks
- Offered access to his back office systems for us to understand
- Wants to meet in 2 weeks with a clear understanding of where we are
- He's emotionally invested — he "low-key committed himself" to working with us

---

## Self-Assessment & Lessons Learned

### What went well
- Invoice scanner was the star — strongest emotional reaction
- Setting up the pain before showing the solution worked
- Got real data: department list, sample invoice (S&W Wholesale), system details (RS Back Office 5)
- Patrick is now a committed partner, not just a prospect

### What to improve for next time

1. **One pain, one solution, let him talk** — don't show 8-9 things at once
   - Framework: "This is your problem. This is your solution. A + B = C."
   - Show feature → explain value → ask "what do you think?" → let him talk → move on

2. **Treat him like he's seeing it for the first time** — explain simply
   - "The best teachers treat everyone like they're brand new"
   - Don't assume he knows terminology (e.g. "price anomalies")

3. **Attach monetary value to each feature**
   - "This is costing you €X per week" before showing the solution
   - Margin monitoring saves more than invoice scanner but we didn't convey that

4. **Show the raw CSV first** — ground him in what the data looks like before showing the dashboard

5. **Agree on demo order in advance** — we didn't agree and it showed

6. **Practice with someone first** — dry run with family member before next client meeting

7. **Watch sales/marketing videos** — both agreed to study and share resources

8. **Need a Windows computer** — RS Back Office 5 likely runs on Windows, need to test on his actual system

9. **Meet up earlier** — not 4 hours before on the phone. Meet in person, practice, align.

---

## Deliverables He Gave Us

1. **Department list** — sheet showing his department hierarchy (photo to be sent)
2. **Sample invoice** — S&W Wholesale Order Acknowledgement (non-approved vendor)
3. **System access offer** — willing to let us work on/with his RS Back Office 5

---

## Action Items Before Next Meeting (2 weeks)

| # | Action | Owner | Priority |
|---|--------|-------|----------|
| 1 | Rename "Price Anomalies" → "Margin Alerts" or "Items Below Target" | Marvellous | Immediate |
| 2 | Test S&W Wholesale invoice against parser — must work perfectly | Marvellous | This week |
| 3 | Redesign dashboard — margin leakages as primary view | Marvellous | This week |
| 4 | Build sub-category hierarchy (dept → sub-dept → product) | Marvellous | Week 1-2 |
| 5 | Add product matching to invoice scanner (exists/doesn't exist flag) | Marvellous | Week 1-2 |
| 6 | Research RS Back Office 5 — API, integration options, architecture | Both | Week 1 |
| 7 | Send Patrick the Cloudflare link | Marvellous | After backend tracking |
| 8 | Follow up with Patrick on vendors question | Co-founder | This week |
| 9 | Clarify self-service checkout mention | Co-founder | This week |
| 10 | Practice demo with family member before next meeting | Both | Before meeting 3 |
| 11 | Watch and share sales/marketing videos | Both | Ongoing |
| 12 | Get a Windows computer for RS Back Office testing | Both | Before integration work |

---

## Key Quote

> "Nobody does this. People have tried this, but nobody could." — Patrick, on the invoice scanner

---

## Next Meeting

- **When:** ~2 weeks from 30 April (target: week of 11-15 May 2026)
- **Format:** In-person at his store
- **Goal:** Show incremental progress on his specific requests, not a feature dump
- **Prep:** Practice demo, agree on order, attach value to each feature
