import { useState, useEffect, useCallback } from "react";
import { apiCall, API_BASE } from "@/lib/api";

const TARGETS = [20, 25, 30];

function eur(v: number | null | undefined) {
  return v === null || v === undefined ? "—" : `€${Number(v).toFixed(2)}`;
}
function money0(v: number | null | undefined) {
  if (v === null || v === undefined) return "€0";
  return "€" + Math.round(Number(v)).toLocaleString("en-IE");
}
function marginCls(m: number | null | undefined) {
  if (m === null || m === undefined) return "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300";
  return m >= 25
    ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
    : m >= 10
    ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
    : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400";
}

export function DeptPage() {
  const [targetPct, setTargetPct] = useState(20);
  const [tree, setTree] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [sel, setSel] = useState<{ dept: any; sub: any | null } | null>(null);
  const [leaksOnly, setLeaksOnly] = useState(true);
  const [prods, setProds] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loadingProds, setLoadingProds] = useState(false);
  const LIMIT = 100;
  const t = (targetPct / 100).toFixed(2);

  const loadProducts = useCallback((deptCode: string, subCode: string, off: number) => {
    setLoadingProds(true);
    apiCall(`/api/departments/${deptCode}/products?sub=${subCode}&leaks_only=${leaksOnly ? 1 : 0}&target=${t}&limit=${LIMIT}&offset=${off}`)
      .then((d) => { setProds(d.products || []); setTotal(d.total || 0); setOffset(off); setLoadingProds(false); });
  }, [leaksOnly, t]);

  useEffect(() => {
    setLoading(true);
    apiCall(`/api/leak-tree?target=${t}`).then((d) => {
      const depts = d.departments || [];
      setTree(depts); setSummary(d.summary || null); setLoading(false);
      if (depts.length && !sel) {
        const first = depts[0];
        setExpanded((e) => ({ ...e, [first.code]: true }));
        setSel({ dept: first, sub: null });
        loadProducts(first.code, "", 0);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetPct]);

  // reload open node's products when target / leaks-only change
  useEffect(() => {
    if (sel) loadProducts(sel.dept.code, sel.sub ? sel.sub.code : "", 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetPct, leaksOnly]);

  const clickDept = (dept: any) => {
    setExpanded((e) => ({ ...e, [dept.code]: !e[dept.code] }));
    setSel({ dept, sub: null });
    loadProducts(dept.code, "", 0);
  };
  const clickSub = (dept: any, sub: any) => {
    setSel({ dept, sub });
    loadProducts(dept.code, sub.code, 0);
  };

  const leakUrl = (deptCode: string, subCode: string) =>
    `${API_BASE}/api/export/leaks?target=${t}${deptCode ? `&dept=${deptCode}` : ""}${subCode ? `&sub=${subCode}` : ""}`;

  const node = sel ? (sel.sub || sel.dept) : null;     // the selected node's metrics
  const nodeName = sel ? (sel.sub ? sel.sub.name : sel.dept.name) : "";
  const crumb = sel ? [sel.dept.name].concat(sel.sub ? [sel.sub.name] : []).join("  ›  ") : "";

  if (loading && !tree.length) return <div className="p-8 text-center text-gray-400">Loading departments...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] min-h-[560px] overflow-hidden">
      {/* top toolbar: title + target + store summary */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <h1 className="text-base font-bold text-gray-900 dark:text-white">Departments &amp; margin leaks</h1>
        <div className="flex items-center gap-1 ml-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-0.5">
          <span className="text-[11px] text-gray-400 px-1.5">Target</span>
          {TARGETS.map((tp) => (
            <button key={tp} onClick={() => setTargetPct(tp)}
              className={`px-2 py-0.5 rounded-md text-xs font-bold ${targetPct === tp ? "bg-violet-600 text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}>{tp}%</button>
          ))}
        </div>
        {summary && (
          <span className="text-xs text-gray-500 ml-auto">
            <b className="text-red-600">{summary.leaks}</b> leaks · <b className="text-red-600">{money0(summary.monthly_impact)}</b>/mo at risk · {summary.active} active products
          </span>
        )}
      </div>

      <div className="flex flex-1 min-h-0">
        {/* LEFT: department tree */}
        <aside className="w-64 shrink-0 border-r border-gray-200 dark:border-gray-700 overflow-y-auto bg-white dark:bg-gray-800 p-2">
          {tree.map((dept) => {
            const open = !!expanded[dept.code];
            const selDept = sel && sel.dept.code === dept.code && !sel.sub;
            const alert = dept.leaks > 0;
            return (
              <div key={dept.code}>
                <div onClick={() => clickDept(dept)}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer ${selDept ? "bg-violet-100 dark:bg-violet-900/40" : "hover:bg-gray-50 dark:hover:bg-gray-700/50"}`}>
                  <span className="w-3 text-gray-400 text-[10px]">{dept.sub_departments?.length ? (open ? "▼" : "▶") : ""}</span>
                  <span className="text-[9px] font-mono bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 px-1 py-0.5 rounded shrink-0">{dept.code}</span>
                  <span className={`flex-1 truncate text-sm ${selDept ? "text-violet-700 dark:text-violet-300 font-semibold" : alert ? "text-red-600 dark:text-red-400" : "text-gray-700 dark:text-gray-200"}`}>{dept.name}</span>
                  <span className="text-[11px] text-gray-400 tabular-nums">{dept.avg_margin ?? "—"}%</span>
                  {alert && <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>}
                </div>
                {open && (dept.sub_departments || []).map((s: any) => {
                  const selSub = sel && sel.sub && sel.sub.code === s.code && sel.dept.code === dept.code;
                  const salert = s.leaks > 0;
                  return (
                    <div key={s.code} onClick={() => clickSub(dept, s)}
                      className={`flex items-center gap-1.5 pl-7 pr-2 py-1.5 rounded-lg cursor-pointer ${selSub ? "bg-violet-100 dark:bg-violet-900/40" : "hover:bg-gray-50 dark:hover:bg-gray-700/50"}`}>
                      <span className={`flex-1 truncate text-[13px] ${selSub ? "text-violet-700 dark:text-violet-300 font-semibold" : salert ? "text-red-600 dark:text-red-400" : "text-gray-600 dark:text-gray-300"}`}>{s.name}</span>
                      <span className="text-[11px] text-gray-400 tabular-nums">{s.avg_margin ?? "—"}%</span>
                      {salert && <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </aside>

        {/* RIGHT: detail */}
        <main className="flex-1 overflow-y-auto p-5 bg-gray-50 dark:bg-gray-900">
          {!sel ? (
            <div className="text-gray-400 text-sm p-8 text-center">Select a department on the left.</div>
          ) : (
            <>
              <div className="text-xs text-gray-500 mb-1">{crumb}</div>
              <div className="flex items-center flex-wrap gap-3 mb-4">
                <span className="text-[10px] font-mono bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300 px-1.5 py-0.5 rounded">{sel.sub ? sel.sub.code : sel.dept.code}</span>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{nodeName}</h2>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${marginCls(node?.avg_margin)}`}>{node?.avg_margin ?? "—"}% avg margin</span>
                {node?.leaks > 0 && <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">{node.leaks} leaks · {money0(node.monthly_impact)}/mo</span>}
              </div>

              {/* controls (no threshold form) */}
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 cursor-pointer select-none">
                  <input type="checkbox" checked={leaksOnly} onChange={(e) => setLeaksOnly(e.target.checked)} className="accent-violet-600" />
                  Show leaks only
                </label>
                <a href={leakUrl(sel.dept.code, sel.sub ? sel.sub.code : "")}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 ml-auto">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                  Export {sel.sub ? "these" : "department"} leaks
                </a>
              </div>

              {loadingProds ? (
                <div className="p-6 text-center text-gray-400 text-sm">Loading…</div>
              ) : prods.length === 0 ? (
                <div className="p-8 text-center text-sm text-green-600 dark:text-green-400 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                  {leaksOnly ? "No margin leaks here at the current target. " : "No active products here. "}
                  {leaksOnly && <button onClick={() => setLeaksOnly(false)} className="underline text-violet-600">Show all products</button>}
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">Product</th>
                        <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 hidden md:table-cell">Sub-dept</th>
                        <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-gray-500">Cost</th>
                        <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-gray-500">Sell</th>
                        <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-gray-500">Margin</th>
                        <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-gray-500">Gap</th>
                        <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-gray-500">Suggested</th>
                        <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-gray-500">€/mo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                      {prods.map((p, i) => (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                          <td className="px-4 py-2.5 text-gray-800 dark:text-gray-100 max-w-[240px] truncate" title={p.name}>{p.name}{p.barcode && <span className="block text-[10px] text-gray-400 font-mono">{p.barcode}</span>}</td>
                          <td className="px-3 py-2.5 text-gray-400 text-xs truncate max-w-[120px] hidden md:table-cell">{p.sub_name}</td>
                          <td className="px-3 py-2.5 text-right text-gray-500 tabular-nums">{eur(p.cost)}</td>
                          <td className="px-3 py-2.5 text-right font-medium text-violet-600 tabular-nums">{p.price_on_request ? <span className="text-[11px] text-gray-400">on request</span> : eur(p.price)}</td>
                          <td className="px-3 py-2.5 text-right"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${marginCls(p.margin)}`}>{p.margin === null ? "—" : p.margin + "%"}</span></td>
                          <td className="px-3 py-2.5 text-right text-xs text-red-500 tabular-nums">{p.below_target && p.target_gap != null ? `-${p.target_gap}pp` : "—"}</td>
                          <td className="px-3 py-2.5 text-right text-xs font-semibold text-green-600 tabular-nums">{p.below_target && p.recommended != null ? eur(p.recommended) : "—"}</td>
                          <td className="px-4 py-2.5 text-right text-xs font-bold text-red-600 tabular-nums">{p.impact != null && p.impact > 0 ? money0(p.impact) : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 text-xs text-gray-500 flex items-center justify-between">
                    <span>{leaksOnly ? "Leaks " : "Products "}{total === 0 ? 0 : offset + 1}–{Math.min(offset + LIMIT, total)} of {total}</span>
                    <span className="flex gap-2">
                      <button disabled={offset === 0} onClick={() => loadProducts(sel.dept.code, sel.sub ? sel.sub.code : "", Math.max(0, offset - LIMIT))} className="px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700 disabled:opacity-40">Prev</button>
                      <button disabled={offset + LIMIT >= total} onClick={() => loadProducts(sel.dept.code, sel.sub ? sel.sub.code : "", offset + LIMIT)} className="px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700 disabled:opacity-40">Next</button>
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
