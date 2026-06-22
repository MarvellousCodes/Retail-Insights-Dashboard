import { useState, useEffect } from "react";
import { apiCall, API_BASE } from "@/lib/api";
import { ProductDetail } from "@/components/ProductDetail";

const TARGETS = [20, 25, 30];

function eur(v: number | null | undefined) {
  return v === null || v === undefined ? "—" : `€${Number(v).toFixed(2)}`;
}
function money0(v: number | null | undefined) {
  if (v === null || v === undefined) return "€0";
  return "€" + Math.round(Number(v)).toLocaleString("en-IE");
}
function marginCls(m: number | null | undefined) {
  if (m === null || m === undefined) return "bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400";
  return m >= 25
    ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
    : m >= 10
    ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
    : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400";
}

function StatCard({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 shadow-sm">
      <div className="text-[11px] uppercase tracking-wide text-gray-400">{label}</div>
      <div className={`text-xl font-bold ${tone || "text-gray-900 dark:text-white"}`}>{value}</div>
    </div>
  );
}

function Tip({ label, tip }: { label: string; tip: string }) {
  const [pos, setPos] = useState<{ x: number; y: number; below: boolean } | null>(null);
  return (
    <span
      onMouseEnter={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const below = r.top < 150;
        const x = Math.min(Math.max(r.left + r.width / 2, 140), window.innerWidth - 140);
        setPos({ x, y: below ? r.bottom + 8 : r.top - 8, below });
      }}
      onMouseLeave={() => setPos(null)}
      className="cursor-help border-b border-dotted border-gray-400/60 hover:border-violet-500"
    >
      {label}
      {pos && (
        <span
          style={{ position: "fixed", left: pos.x, top: pos.y, transform: pos.below ? "translate(-50%,0)" : "translate(-50%,-100%)", zIndex: 9999 }}
          className="pointer-events-none w-64 max-w-[80vw] rounded-lg bg-gray-900 text-white text-[11px] font-normal leading-snug px-3 py-2 shadow-xl whitespace-normal"
        >
          {tip}
        </span>
      )}
    </span>
  );
}

export function DeptPage() {
  const [targetPct, setTargetPct] = useState<number | null>(null);
  const [tree, setTree] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sub, setSub] = useState("");
  const [leaksOnly, setLeaksOnly] = useState(false);
  const [prods, setProds] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loadingProds, setLoadingProds] = useState(false);
  const [selId, setSelId] = useState<string | null>(null);
  const LIMIT = 100;
  const hasTarget = targetPct !== null;
  const t = hasTarget ? (targetPct! / 100).toFixed(2) : "";

  useEffect(() => {
    setLoading(true);
    apiCall(hasTarget ? `/api/leak-tree?target=${t}` : `/api/leak-tree`).then((d) => {
      setTree(d.departments || []);
      setSummary(d.summary || null);
      setLoading(false);
    });
  }, [targetPct]);

  // reload the open department's products when target or the leaks-only toggle changes
  useEffect(() => {
    if (expanded) loadProducts(expanded, sub, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetPct, leaksOnly]);

  const openDept = (code: string) => {
    if (expanded === code) {
      setExpanded(null);
      return;
    }
    setExpanded(code);
    setSub("");
    setOffset(0);
    loadProducts(code, "", 0);
  };

  const loadProducts = async (code: string, subCode: string, off: number) => {
    setLoadingProds(true);
    const d = await apiCall(
      `/api/departments/${code}/products?sub=${subCode}&leaks_only=${leaksOnly && hasTarget ? 1 : 0}${hasTarget ? `&target=${t}` : ""}&limit=${LIMIT}&offset=${off}`
    );
    setProds(d.products || []);
    setTotal(d.total || 0);
    setOffset(off);
    setLoadingProds(false);
  };

  const leakUrl = (code: string, subCode: string) =>
    `${API_BASE}/api/export/leaks?target=${t}${code ? `&dept=${code}` : ""}${subCode ? `&sub=${subCode}` : ""}`;

  if (loading) return <div className="p-8 text-center text-gray-400">Loading margin leaks...</div>;

  return (
    <div className="p-4 md:p-6">
      {/* Header + target selector */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Departments &amp; margin leaks</h1>
          <p className="text-xs text-gray-500">
            {tree.length} departments. Click a department to drill into sub-departments and the products losing money.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1">
            <span className="text-[11px] text-gray-400 px-2">Target margin</span>
            <button
              onClick={() => setTargetPct(null)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold ${targetPct === null ? "bg-violet-600 text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
              title="Show every active product, no target filter"
            >
              All
            </button>
            {TARGETS.map((tp) => (
              <button
                key={tp}
                onClick={() => setTargetPct(tp)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                  targetPct === tp ? "bg-violet-600 text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                {tp}%
              </button>
            ))}
            <input
              type="number" min={1} max={99} placeholder="Custom"
              value={targetPct !== null && !TARGETS.includes(targetPct) ? targetPct : ""}
              onChange={(e) => { const v = parseInt(e.target.value, 10); setTargetPct(Number.isFinite(v) && v >= 1 && v <= 99 ? v : null); }}
              className="w-[68px] px-2 py-1 rounded-lg text-xs font-semibold bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200"
              title="Type your own target margin %"
            />
          </div>
          {hasTarget && (
          <a
            href={leakUrl("", "")}
            className="shrink-0 inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm shadow-red-600/25"
            title="Download every below-target product across the store, with recommended price and monthly euro impact"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            Export all leaks
          </a>
          )}
        </div>
      </div>

      {/* Summary band */}
      {summary && (
        hasTarget ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <StatCard label="Active products" value={(summary.active || 0).toLocaleString("en-IE")} />
            <StatCard label={`Leaks below ${targetPct}%`} value={(summary.leaks || 0).toLocaleString("en-IE")} tone="text-red-600" />
            <StatCard label="At risk / month" value={money0(summary.monthly_impact)} tone="text-red-600" />
            <StatCard label="At risk / year" value={money0(summary.annual_impact)} tone="text-red-600" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <StatCard label="Departments" value={(summary.departments || 0).toLocaleString("en-IE")} />
            <StatCard label="Active products" value={(summary.active || 0).toLocaleString("en-IE")} />
          </div>
        )
      )}
      {hasTarget ? (
        <p className="text-[11px] text-gray-400 mb-4">
          A leak is an active, priced product selling below the {targetPct}% target margin. Monthly euro figures use each
          product's recent sales velocity, so a leak with no recent sales shows as €0 impact but still counts.
        </p>
      ) : (
        <p className="text-[11px] text-gray-400 mb-4">
          Showing every active product by department. Pick a target margin (20, 25, 30, or your own) to flag the products selling below it.
        </p>
      )}

      <div className="space-y-3">
        {tree.map((dept) => (
          <div
            key={dept.code}
            className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border ${
              dept.legacy ? "border-gray-100 dark:border-gray-800 opacity-70" : "border-gray-200 dark:border-gray-700"
            } overflow-hidden`}
          >
            {/* Department row */}
            <div
              onClick={() => openDept(dept.code)}
              className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-violet-50/50 dark:hover:bg-violet-900/10 transition gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-[10px] font-mono bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300 px-2 py-1 rounded shrink-0">{dept.code}</span>
                <div className="min-w-0">
                  <span className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                    {dept.name}
                    {dept.legacy && <span className="ml-2 text-[10px] text-gray-400">(retired)</span>}
                  </span>
                  <span className="text-xs text-gray-400 ml-2">{dept.active} active · {dept.sub_departments?.length || 0} sub-depts</span>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                {dept.leaks > 0 ? (
                  <span className="text-[11px] font-bold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 px-2 py-0.5 rounded-full">{dept.leaks} leaks</span>
                ) : (
                  <span className="text-[11px] text-green-600 dark:text-green-400 hidden sm:inline">no leaks</span>
                )}
                {dept.monthly_impact > 0 && (
                  <span className="text-sm font-bold text-red-600" title="Estimated margin lost per month">{money0(dept.monthly_impact)}/mo</span>
                )}
                <span className={`text-sm font-bold ${dept.avg_margin > 30 ? "text-green-600" : dept.avg_margin > 0 ? "text-amber-600" : "text-red-600"}`}>{dept.avg_margin ?? "—"}%</span>
                <span className="text-gray-400 text-xs">{expanded === dept.code ? "▼" : "▶"}</span>
              </div>
            </div>

            {expanded === dept.code && (
              <div className="border-t border-gray-100 dark:border-gray-700">
                {/* Controls: leaks-only toggle + export this department */}
                {hasTarget && (
                <div className="px-4 py-2.5 flex items-center justify-between gap-3 bg-gray-50 dark:bg-gray-900 flex-wrap">
                  <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 cursor-pointer select-none">
                    <input type="checkbox" checked={leaksOnly} onChange={(e) => setLeaksOnly(e.target.checked)} className="accent-violet-600" />
                    Show leaks only
                  </label>
                  <a href={leakUrl(dept.code, sub)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                    Export {sub ? "these" : "department"} leaks
                  </a>
                </div>
                )}

                {/* Sub-department chips with their own leak metrics (from the tree, instant) */}
                <div className="px-4 py-2.5 flex gap-2 flex-wrap bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                  <button
                    onClick={() => { setSub(""); loadProducts(dept.code, "", 0); }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium ${sub === "" ? "bg-violet-600 text-white" : "bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"}`}
                  >
                    All ({dept.active})
                  </button>
                  {(dept.sub_departments || []).map((s: any) => (
                    <button
                      key={s.code}
                      onClick={() => { setSub(s.code); loadProducts(dept.code, s.code, 0); }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 ${sub === s.code ? "bg-violet-600 text-white" : "bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"}`}
                    >
                      <span>{s.name} ({s.active})</span>
                      {s.leaks > 0 && (
                        <span className={`text-[10px] font-bold px-1.5 rounded-full ${sub === s.code ? "bg-white/25 text-white" : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"}`}>
                          {s.leaks} · {money0(s.monthly_impact)}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Products */}
                {loadingProds ? (
                  <div className="p-4 text-center text-gray-400 text-sm">Loading…</div>
                ) : prods.length === 0 ? (
                  <div className="p-6 text-center text-sm text-green-600 dark:text-green-400">
                    {leaksOnly ? "No margin leaks here at the current target. " : "No active products. "}
                    {leaksOnly && <button onClick={() => setLeaksOnly(false)} className="underline text-violet-600">Show all products</button>}
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs text-gray-500"><Tip label="Product" tip="Product name, with its barcode below." /></th>
                            <th className="px-3 py-2 text-left text-xs text-gray-500 hidden md:table-cell"><Tip label="Sub-dept" tip="The sub-category this product sits in." /></th>
                            <th className="px-3 py-2 text-right text-xs text-gray-500"><Tip label="Sell" tip="Your current shelf price. 'on request' means staff key the price at the till." /></th>
                            <th className="px-3 py-2 text-right text-xs text-gray-500"><Tip label="Cost" tip="What one unit costs you: pack cost divided by pack size. VAT is not removed yet." /></th>
                            <th className="px-3 py-2 text-right text-xs text-gray-500"><Tip label="Margin" tip="Profit as a share of the sell price: sell price minus cost, divided by the sell price, shown as a percent." /></th>
                            {hasTarget && <th className="px-3 py-2 text-right text-xs text-gray-500"><Tip label="Gap" tip="How far below your target this product sits, in percentage points: target minus the product's margin." /></th>}
                            {hasTarget && <th className="px-3 py-2 text-right text-xs text-gray-500"><Tip label="Suggested" tip="The price that hits your target margin exactly: unit cost divided by (1 minus the target)." /></th>}
                            {hasTarget && <th className="px-4 py-2 text-right text-xs text-gray-500"><Tip label="€/mo" tip="Estimated extra profit a month at the suggested price: (suggested minus current price) times units sold per month, averaged over the last 3 months." /></th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                          {prods.map((p, i) => (
                            <tr key={i} onClick={() => p.id != null && setSelId(String(p.id))} className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                              <td className="px-4 py-2 text-gray-800 dark:text-gray-200 truncate max-w-[240px]">
                                {p.name}
                                {p.barcode && <span className="block text-[10px] text-gray-400 font-mono">{p.barcode}</span>}
                              </td>
                              <td className="px-3 py-2 text-gray-400 text-xs truncate max-w-[120px] hidden md:table-cell">{p.sub_name}</td>
                              <td className="px-3 py-2 text-right font-medium text-violet-600">{p.price_on_request ? <span className="text-[11px] text-gray-400">on request</span> : eur(p.price)}</td>
                              <td className="px-3 py-2 text-right text-gray-500">{eur(p.cost)}</td>
                              <td className="px-3 py-2 text-right"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${marginCls(p.margin)}`}>{p.margin === null ? "—" : p.margin + "%"}</span></td>
                              {hasTarget && <td className="px-3 py-2 text-right text-xs text-red-500">{p.below_target && p.target_gap != null ? `-${p.target_gap}pp` : "—"}</td>}
                              {hasTarget && <td className="px-3 py-2 text-right text-xs font-semibold text-green-600">{p.below_target && p.recommended != null ? eur(p.recommended) : "—"}</td>}
                              {hasTarget && <td className="px-4 py-2 text-right text-xs font-bold text-red-600">{p.impact != null && p.impact > 0 ? money0(p.impact) : "—"}</td>}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 text-xs text-gray-500 flex items-center justify-between">
                      <span>{leaksOnly ? "Leaks " : "Products "}{total === 0 ? 0 : offset + 1}–{Math.min(offset + LIMIT, total)} of {total}</span>
                      <span className="flex gap-2">
                        <button disabled={offset === 0} onClick={() => loadProducts(dept.code, sub, Math.max(0, offset - LIMIT))} className="px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700 disabled:opacity-40">Prev</button>
                        <button disabled={offset + LIMIT >= total} onClick={() => loadProducts(dept.code, sub, offset + LIMIT)} className="px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700 disabled:opacity-40">Next</button>
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      <ProductDetail id={selId} onClose={() => setSelId(null)} />
    </div>
  );
}
