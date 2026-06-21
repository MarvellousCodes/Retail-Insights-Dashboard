import { useState, useEffect } from "react";
import { apiCall } from "@/lib/api";

function fmtPrice(v: string) {
  const n = parseFloat(v || "0");
  return isNaN(n) ? "—" : `€${n.toFixed(2)}`;
}

function MarginBadge({ p }: { p: any }) {
  if (p.margin === null || p.margin === undefined) return null;
  if (p.margin_valid === false) return <span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded" title="Cost/price data looks wrong">⚠ check data</span>;
  const m = p.margin as number;
  const cls = m >= 25 ? "bg-green-50 text-green-600" : m >= 10 ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-500";
  const label = m >= 25 ? "Healthy" : m >= 10 ? "Thin" : "Low";
  return <span className={`text-[10px] ${cls} px-1.5 py-0.5 rounded font-medium`}>{label} {m.toFixed(0)}%</span>;
}

export function LiveDataPage() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [products, setProducts] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState("Active");
  const [sortDir, setSortDir] = useState<"asc"|"desc">("desc");
  const [groupBy, setGroupBy] = useState("");
  const [view, setView] = useState<"cards"|"table">("table");
  const [expanded, setExpanded] = useState<number|null>(null);
  const [syncing, setSyncing] = useState(false);
  const [activeOnly, setActiveOnly] = useState(true);
  const [counts, setCounts] = useState<{active:number;all:number}>({active:0,all:0});

  useEffect(() => { loadData(); }, [activeOnly]);

  const loadData = async () => {
    setLoading(true);
    const q = `/api/products?limit=300&active=${activeOnly?1:0}${search.trim()?`&search=${encodeURIComponent(search)}`:""}`;
    const [s, p] = await Promise.all([apiCall("/api/stats"), apiCall(q)]);
    setStats(s); setProducts(p.data || []); setHeaders(p.headers || []);
    setCounts({active:p.active_count||0, all:p.all_count||0});
    setLoading(false);
  };

  const handleSearch = async () => {
    const p = await apiCall(`/api/products?limit=300&active=${activeOnly?1:0}${search.trim()?`&search=${encodeURIComponent(search)}`:""}`);
    setProducts(p.data || []);
  };

  const handleSync = async () => { setSyncing(true); await apiCall("/api/sync", { method: "POST" }); setSyncing(false); alert("Sync triggered! Data refreshes within 5 minutes."); };

  if (loading) return <div className="p-8 text-center text-gray-400">Loading products...</div>;

  // Sort: active first by default, then by selected column
  let sorted = [...products];
  sorted.sort((a, b) => {
    // Always put Active=Y before Active=N
    const aActive = (a.Active||"").trim() === "Y" ? 0 : 1;
    const bActive = (b.Active||"").trim() === "Y" ? 0 : 1;
    if (aActive !== bActive) return aActive - bActive;
    if (!sortCol || sortCol === "Active") return 0;
    const av = (a[sortCol]||"").toString().trim();
    const bv = (b[sortCol]||"").toString().trim();
    const an = parseFloat(av), bn = parseFloat(bv);
    if (!isNaN(an) && !isNaN(bn)) return sortDir === "asc" ? an-bn : bn-an;
    return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  // Group
  const grouped = groupBy ? sorted.reduce((acc: Record<string, any[]>, p) => {
    const key = (p[groupBy]||"Other").toString().trim() || "Other";
    (acc[key] = acc[key] || []).push(p); return acc;
  }, {}) : null;

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Products</h1>
          <p className="text-gray-500 text-xs mt-0.5">{counts.active.toLocaleString()} active{!activeOnly && counts.all ? ` of ${counts.all.toLocaleString()} total` : ""} • Synced from store EPOS</p>
        </div>
        <button onClick={handleSync} disabled={syncing} className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-medium disabled:opacity-50">
          {syncing ? "..." : "⟳ Sync Now"}
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <div className="flex-1 min-w-[180px] flex gap-1">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key==="Enter" && handleSearch()}
            placeholder="Search products, barcodes, suppliers..." className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm" />
          <button onClick={handleSearch} className="px-3 py-2 bg-violet-600 text-white rounded-lg text-xs">Search</button>
        </div>
        <select value={groupBy} onChange={e => setGroupBy(e.target.value)} className="px-2 py-2 border border-gray-200 rounded-lg text-xs bg-white dark:bg-gray-700">
          <option value="">No grouping</option>
          <option value="Supplier">By Supplier</option>
          <option value="Analysis1">By Category</option>
          <option value="VatCode">By VAT Rate</option>
          <option value="Active">Active / Inactive</option>
        </select>
        <select value={sortCol} onChange={e => { setSortCol(e.target.value); setSortDir("desc"); }} className="px-2 py-2 border border-gray-200 rounded-lg text-xs bg-white dark:bg-gray-700">
          <option value="Active">Active first</option>
          <option value="Retail1">Price ↓</option>
          <option value="Description">Name A-Z</option>
          <option value="Supplier">Supplier</option>
        </select>
        <div className="flex rounded-lg overflow-hidden border border-gray-200">
          <button onClick={() => setActiveOnly(true)} className={`px-2.5 py-1.5 text-xs ${activeOnly?"bg-violet-600 text-white":"bg-white text-gray-600"}`}>Active only</button>
          <button onClick={() => setActiveOnly(false)} className={`px-2.5 py-1.5 text-xs ${!activeOnly?"bg-violet-600 text-white":"bg-white text-gray-600"}`}>All</button>
        </div>
        <div className="flex rounded-lg overflow-hidden border border-gray-200">
          <button onClick={() => setView("table")} className={`px-2.5 py-1.5 text-xs ${view==="table"?"bg-violet-600 text-white":"bg-white text-gray-600"}`}>Table</button>
          <button onClick={() => setView("cards")} className={`px-2.5 py-1.5 text-xs ${view==="cards"?"bg-violet-600 text-white":"bg-white text-gray-600"}`}>Cards</button>
        </div>
      </div>

      {/* Content */}
      {grouped ? (
        <div className="space-y-3">
          {Object.entries(grouped).sort((a,b) => b[1].length - a[1].length).slice(0, 20).map(([group, items]) => (
            <div key={group} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="px-4 py-2.5 bg-violet-50 dark:bg-violet-900/20 flex justify-between items-center border-b border-violet-100">
                <span className="font-semibold text-sm text-violet-800 dark:text-violet-200">{group || "Uncategorised"}</span>
                <span className="text-xs bg-violet-200 dark:bg-violet-700 text-violet-800 dark:text-violet-100 px-2 py-0.5 rounded-full font-medium">{items.length}</span>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-700">
                {items.slice(0, 5).map((p: any, i: number) => (
                  <div key={i} className="px-4 py-2.5 flex justify-between items-center">
                    <div>
                      <span className="text-sm text-gray-800 dark:text-gray-200">{(p.Description||"").trim()}</span>
                      {(p.Active||"").trim() === "N" && <span className="ml-2 text-[10px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded">Inactive</span>}
                    </div>
                    <span className="text-sm font-semibold text-violet-600">{fmtPrice(p.Retail1)}</span>
                  </div>
                ))}
                {items.length > 5 && <div className="px-4 py-2 text-xs text-gray-400 text-center">+{items.length-5} more products</div>}
              </div>
            </div>
          ))}
        </div>
      ) : view === "cards" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sorted.map((p, i) => (
            <div key={i} onClick={() => setExpanded(expanded===i?null:i)} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-violet-300 hover:shadow-md transition">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm text-gray-900 dark:text-white truncate">{(p.Description||"").trim()}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{(p.Supplier||"").trim()} {(p.BarCode||"").trim() ? `• ${(p.BarCode||"").trim()}` : ""}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-violet-600">{fmtPrice(p.Retail1)}</p>
                  <p className="text-[10px] text-gray-400">Cost {fmtPrice(p.UnitCost||p.CurrentCost)}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-2 flex-wrap items-center">
                {(p.Active||"").trim() === "Y" ? <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded font-medium">Active</span> : <span className="text-[10px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded font-medium">Inactive</span>}
                <MarginBadge p={p} />
                <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">VAT {p.VatCode||"?"}</span>
                {(p.Analysis1||"").trim() && <span className="text-[10px] bg-violet-50 text-violet-600 px-1.5 py-0.5 rounded">{(p.Analysis1||"").trim()}</span>}
              </div>
              {expanded===i && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-gray-400">Barcode:</span> <span className="text-gray-700 dark:text-gray-300">{(p.BarCode||"—").trim()}</span></div>
                  <div><span className="text-gray-400">Pack Size:</span> <span className="text-gray-700 dark:text-gray-300">{p.PackSize||"—"}</span></div>
                  <div><span className="text-gray-400">Avg Cost:</span> <span className="text-gray-700 dark:text-gray-300">{fmtPrice(p.AverageCost)}</span></div>
                  <div><span className="text-gray-400">Markup:</span> <span className="text-gray-700 dark:text-gray-300">{p.Markup||"—"}%</span></div>
                  <div><span className="text-gray-400">Reorder Level:</span> <span className="text-gray-700 dark:text-gray-300">{p.ReOrderLevel||"—"}</span></div>
                  <div><span className="text-gray-400">Category:</span> <span className="text-gray-700 dark:text-gray-300">{(p.Analysis1||"—").trim()}</span></div>
                  <div><span className="text-gray-400">Sub-cat:</span> <span className="text-gray-700 dark:text-gray-300">{(p.Analysis2||"—").trim()}</span></div>
                  <div><span className="text-gray-400">Last Changed:</span> <span className="text-gray-700 dark:text-gray-300">{(p.LastAmendDate||"—").trim()}</span></div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-violet-50 dark:bg-violet-900/20 sticky top-0">
              <tr>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-violet-700">Product</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-violet-700">Price</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-violet-700">Cost</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-violet-700">Margin</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-violet-700">Markup</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-violet-700">Supplier</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-violet-700">Status</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-violet-700">Barcode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {sorted.map((p, i) => (
                <tr key={i} className="hover:bg-violet-50/40">
                  <td className="px-3 py-2.5 text-gray-800 dark:text-gray-200 truncate max-w-[220px]">{(p.Description||"").trim()}</td>
                  <td className="px-3 py-2.5 text-right font-medium text-violet-600">{p.price_on_request ? <span className="text-[11px] text-gray-400">on request</span> : fmtPrice(p.Retail1)}</td>
                  <td className="px-3 py-2.5 text-right text-gray-500">{fmtPrice(p.UnitCost||p.CurrentCost)}</td>
                  <td className="px-3 py-2.5 text-center"><MarginBadge p={p} /></td>
                  <td className="px-3 py-2.5 text-right text-gray-500 text-xs">{p.markup===null||p.markup===undefined?"—":p.markup+"%"}</td>
                  <td className="px-3 py-2.5 text-gray-500 truncate max-w-[120px]">{(p.Supplier||"").trim()}</td>
                  <td className="px-3 py-2.5 text-center">{(p.Active||"").trim()==="Y"?<span className="text-green-500 text-xs">●&nbsp;Active</span>:<span className="text-gray-300 text-xs">○&nbsp;Inactive</span>}</td>
                  <td className="px-3 py-2.5 text-gray-400 text-xs font-mono">{(p.BarCode||"").trim()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-gray-400 mt-3 text-center">Showing {sorted.length} {activeOnly ? "active" : ""} products{counts.active ? ` • ${counts.active.toLocaleString()} active in store` : ""}</p>
    </div>
  );
}
