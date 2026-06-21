import { useState, useEffect } from "react";
import { apiCall } from "@/lib/api";

function eur(v: number | null) {
  return v === null || v === undefined ? "—" : `€${Number(v).toFixed(2)}`;
}
function marginCls(m: number | null) {
  if (m === null || m === undefined) return "bg-gray-50 text-gray-500";
  return m >= 25 ? "bg-green-50 text-green-700" : m >= 10 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700";
}

export function DeptPage() {
  const [depts, setDepts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sub, setSub] = useState("");           // selected sub-dept code ('' = all)
  const [prods, setProds] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [deptName, setDeptName] = useState("");
  const [loadingProds, setLoadingProds] = useState(false);
  const LIMIT = 100;

  useEffect(() => {
    apiCall("/api/departments").then((d) => { setDepts(d.departments || []); setLoading(false); });
  }, []);

  const openDept = (code: string) => {
    if (expanded === code) { setExpanded(null); return; }
    setExpanded(code); setSub(""); setOffset(0);
    loadProducts(code, "", 0);
  };

  const loadProducts = async (code: string, subCode: string, off: number) => {
    setLoadingProds(true);
    const d = await apiCall(`/api/departments/${code}/products?sub=${subCode}&limit=${LIMIT}&offset=${off}`);
    setProds(d.products || []); setSubs(d.sub_departments || []); setTotal(d.total || 0);
    setDeptName(d.department_name || code); setOffset(off); setLoadingProds(false);
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Loading departments...</div>;

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Departments</h1>
      <p className="text-xs text-gray-500 mb-4">{depts.length} departments • click to drill into sub-departments & products</p>

      <div className="space-y-3">
        {depts.map((dept) => (
          <div key={dept.code} className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border ${dept.legacy ? "border-gray-100 dark:border-gray-800 opacity-70" : "border-gray-200 dark:border-gray-700"} overflow-hidden`}>
            <div onClick={() => openDept(dept.code)}
              className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-violet-50/50 dark:hover:bg-violet-900/10 transition">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-[10px] font-mono bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300 px-2 py-1 rounded shrink-0">{dept.code}</span>
                <div className="min-w-0">
                  <span className="font-semibold text-sm text-gray-900 dark:text-white truncate">{dept.name}{dept.legacy && <span className="ml-2 text-[10px] text-gray-400">(retired)</span>}</span>
                  <span className="text-xs text-gray-400 ml-2">{dept.active} active · {dept.sub_departments?.length || 0} sub-depts</span>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                {dept.revenue > 0 && <span className="text-xs text-gray-500 hidden sm:inline">{eur(dept.revenue)} rev</span>}
                <span className={`text-sm font-bold ${dept.avg_margin > 30 ? "text-green-600" : dept.avg_margin > 0 ? "text-amber-600" : "text-red-600"}`}>{dept.avg_margin ?? "—"}%</span>
                <span className="text-gray-400 text-xs">{expanded === dept.code ? "▼" : "▶"}</span>
              </div>
            </div>

            {expanded === dept.code && (
              <div className="border-t border-gray-100 dark:border-gray-700">
                {/* Sub-department chips */}
                <div className="px-4 py-2.5 flex gap-2 flex-wrap bg-gray-50 dark:bg-gray-900">
                  <button onClick={() => { setSub(""); loadProducts(dept.code, "", 0); }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium ${sub === "" ? "bg-violet-600 text-white" : "bg-white dark:bg-gray-800 text-gray-600 border border-gray-200 dark:border-gray-700"}`}>All ({dept.active})</button>
                  {subs.map((s) => (
                    <button key={s.code} onClick={() => { setSub(s.code); loadProducts(dept.code, s.code, 0); }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium ${sub === s.code ? "bg-violet-600 text-white" : "bg-white dark:bg-gray-800 text-gray-600 border border-gray-200 dark:border-gray-700"}`}>{s.name} ({s.active})</button>
                  ))}
                </div>
                {/* Products */}
                {loadingProds ? <div className="p-4 text-center text-gray-400 text-sm">Loading…</div> : (
                  <>
                    <table className="w-full text-sm">
                      <thead className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs text-gray-500">Product</th>
                          <th className="px-4 py-2 text-left text-xs text-gray-500">Sub-dept</th>
                          <th className="px-4 py-2 text-right text-xs text-gray-500">Sell</th>
                          <th className="px-4 py-2 text-right text-xs text-gray-500">Cost</th>
                          <th className="px-4 py-2 text-right text-xs text-gray-500">Margin</th>
                          <th className="px-4 py-2 text-right text-xs text-gray-500">Markup</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                        {prods.map((p, i) => (
                          <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="px-4 py-2 text-gray-800 dark:text-gray-200 truncate max-w-[260px]">{p.name}</td>
                            <td className="px-4 py-2 text-gray-400 text-xs truncate max-w-[120px]">{p.sub_name}</td>
                            <td className="px-4 py-2 text-right font-medium text-violet-600">{p.price_on_request ? <span className="text-[11px] text-gray-400">on request</span> : eur(p.price)}</td>
                            <td className="px-4 py-2 text-right text-gray-500">{eur(p.cost)}</td>
                            <td className="px-4 py-2 text-right"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${marginCls(p.margin)}`}>{p.margin === null ? "—" : p.margin + "%"}</span></td>
                            <td className="px-4 py-2 text-right text-gray-500 text-xs">{p.markup === null ? "—" : p.markup + "%"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 text-xs text-gray-500 flex items-center justify-between">
                      <span>Showing {total === 0 ? 0 : offset + 1}–{Math.min(offset + LIMIT, total)} of {total} active</span>
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
    </div>
  );
}
