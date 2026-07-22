import { useState, useEffect } from "react";
import { apiCall, API_BASE } from "@/lib/api";
import { useRevenueMask, RevenueMaskToggle, STARS } from "@/lib/privacy";
import { AlertTriangle, DollarSign, Loader2, CheckCircle2 } from "lucide-react";

function eur(v: number | null | undefined, masked: boolean) {
  if (masked) return STARS;
  if (v === null || v === undefined) return "\u2014";
  return `\u20AC${Number(v).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function eurExact(v: number | null | undefined, masked: boolean) {
  if (masked) return STARS;
  if (v === null || v === undefined) return "\u2014";
  return `\u20AC${Number(v).toFixed(2)}`;
}

const LADDER_CONFIG = [
  { key: "loss", label: "Loss", desc: "Below 0% margin", color: "bg-red-500", textColor: "text-red-700", bg: "bg-red-50" },
  { key: "thin", label: "Thin", desc: "0 to 15% margin", color: "bg-amber-400", textColor: "text-amber-700", bg: "bg-amber-50" },
  { key: "healthy", label: "Healthy", desc: "15 to 35% margin", color: "bg-green-500", textColor: "text-green-700", bg: "bg-green-50" },
  { key: "strong", label: "Strong", desc: "35%+ margin", color: "bg-violet-500", textColor: "text-violet-700", bg: "bg-violet-50" },
];

export function MarginsPage() {
  const [trend, setTrend] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [extras, setExtras] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all"|"low"|"negative"|"high">("all");
  const { masked, toggle } = useRevenueMask();
  const [queueState, setQueueState] = useState<Record<string, "idle" | "loading" | "done" | "error">>({});

  const handleQueuePrice = async (productCode: string, newPrice: number) => {
    setQueueState((s) => ({ ...s, [productCode]: "loading" }));
    try {
      const token = localStorage.getItem("rg-token");
      const res = await fetch(`${API_BASE}/api/price-jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ product_code: productCode, new_price: newPrice, draft: true, source: "margins" }),
      });
      if (res.ok) setQueueState((s) => ({ ...s, [productCode]: "done" }));
      else setQueueState((s) => ({ ...s, [productCode]: "error" }));
    } catch {
      setQueueState((s) => ({ ...s, [productCode]: "error" }));
    }
  };

  useEffect(() => {
    Promise.all([
      apiCall("/api/insights/margin-trend"),
      apiCall("/api/insights/product-margins"),
      apiCall("/api/margins/extras"),
    ]).then(([t, p, e]) => {
      setTrend(t.months || []);
      setProducts(p.products || []);
      setExtras(e || null);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-400">Calculating margins...</div>;

  const filtered = filter === "all" ? [...products].sort((a,b) => b.margin - a.margin) :
    filter === "negative" ? products.filter(p => p.margin < 0) :
    filter === "low" ? products.filter(p => p.margin >= 0 && p.margin < 20) :
    products.filter(p => p.margin >= 40);

  const maxRev = Math.max(...trend.map(m => m.revenue), 1);
  const ladder = extras?.ladder;
  const moneyOnTable = extras?.money_on_table;
  const ladderTotal = ladder ? Object.values(ladder).reduce((s: number, v: any) => s + v.count, 0) : 0;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Margins</h1>
          <p className="text-xs text-gray-500">{products.length} products analyzed</p>
        </div>
        <RevenueMaskToggle masked={masked} toggle={toggle} />
      </div>

      {/* NEW: Margin Ladder */}
      {ladder && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-500" /> Margin ladder
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {LADDER_CONFIG.map(({ key, label, desc, color, textColor, bg }) => {
              const d = ladder[key];
              const pct = ladderTotal > 0 ? Math.round((d.count / ladderTotal) * 100) : 0;
              return (
                <div key={key} className={`rounded-lg p-3 ${bg} dark:bg-gray-700/50`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className={`w-3 h-3 rounded-full ${color}`}></div>
                    <span className={`text-xs font-bold ${textColor}`}>{label}</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{d.count}</div>
                  <div className="text-[11px] text-gray-500">{pct}% of products</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">{eur(d.sales, masked)}/mo sales</div>
                  <div className="text-[10px] text-gray-400 mt-1">{desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* NEW: Money left on the table */}
      {moneyOnTable && moneyOnTable.top && moneyOnTable.top.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-green-500" /> Money left on the table
          </h2>
          <p className="text-xs text-gray-500 mb-3">
            Top products where a small price adjustment adds the most monthly profit. Combined: <span className="font-bold text-green-600">{masked ? STARS : `+${eurExact(moneyOnTable.total_gain, false)}/mo`}</span>
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-green-50 dark:bg-green-900/10">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-green-700">Product</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-green-700">Current</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-green-700">Suggested</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-green-700">Monthly gain</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {moneyOnTable.top.map((o: any, i: number) => (
                  <tr key={i} className="hover:bg-green-50/30">
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300 truncate max-w-[200px]">{o.description}</td>
                    <td className="px-3 py-2 text-right text-gray-500">{eurExact(o.price, masked)}</td>
                    <td className="px-3 py-2 text-right font-medium text-violet-600">{eurExact(o.suggested, masked)}</td>
                    <td className="px-3 py-2 text-right font-bold text-green-600">{masked ? STARS : `+${eurExact(o.gain_month, false)}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Existing: Monthly Margin Trend */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">Monthly Revenue and Margin</h2>
        <div className="flex gap-0.5 items-end mb-2" style={{height: '112px'}}>
          {trend.slice(-18).map((m, i) => {
            const barH = Math.max(4, Math.round((m.revenue / maxRev) * 96));
            return (
            <div key={i} className="flex-1 flex flex-col justify-end items-center group relative h-full">
              <div className="absolute -top-6 bg-gray-800 text-white text-[9px] px-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                {m.period}: {masked ? STARS : `\u20AC${(m.revenue/1000).toFixed(0)}K`} ({m.margin}%)
              </div>
              <div className="w-full rounded-t transition-all" style={{height: `${barH}px`, backgroundColor: m.margin > 25 ? '#8b5cf6' : m.margin > 15 ? '#f59e0b' : '#ef4444'}}></div>
              <span className="text-[8px] text-gray-400 mt-0.5 shrink-0">{m.period.slice(4)}</span>
            </div>
            );
          })}
        </div>
        <div className="flex gap-4 text-xs text-gray-500">
          <span><span className="inline-block w-2 h-2 rounded bg-violet-500 mr-1"></span>&gt;25% margin</span>
          <span><span className="inline-block w-2 h-2 rounded bg-amber-500 mr-1"></span>15-25%</span>
          <span><span className="inline-block w-2 h-2 rounded bg-red-500 mr-1"></span>&lt;15%</span>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[["all","All"],["negative","Negative"],["low","Low (<20%)"],["high","High (>40%)"]].map(([k,l]) => (
          <button key={k} onClick={() => setFilter(k as any)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filter===k ? 'bg-violet-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>{l} ({
            k==="all" ? products.length : k==="negative" ? products.filter(p=>p.margin<0).length : k==="low" ? products.filter(p=>p.margin>=0&&p.margin<20).length : products.filter(p=>p.margin>=40).length
          })</button>
        ))}
      </div>

      {/* Products table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-violet-50 dark:bg-violet-900/20 sticky top-0">
            <tr>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-violet-700">Product</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-violet-700">Retail</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-violet-700">Unit Cost</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-violet-700">Margin</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-violet-700">Markup</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-violet-700">Supplier</th>
              <th className="px-3 py-2.5 text-center text-xs font-semibold text-violet-700">Pack</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-violet-700"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
            {filtered.slice(0, 100).map((p, i) => (
              <tr key={i} className="hover:bg-violet-50/30">
                <td className="px-3 py-2 text-gray-800 dark:text-gray-200 truncate max-w-[200px]">
                  {p.name}
                  {!p.active && <span className="ml-1 text-[9px] text-red-400">{"\u25CF"}</span>}
                </td>
                <td className="px-3 py-2 text-right font-medium text-gray-700">{p.price_on_request ? <span className="text-[11px] text-gray-400">on request</span> : `\u20AC${(p.retail ?? 0).toFixed(2)}`}</td>
                <td className="px-3 py-2 text-right text-gray-500">{`\u20AC${(p.cost ?? 0).toFixed(2)}`}</td>
                <td className="px-3 py-2 text-right">
                  <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${p.margin > 30 ? 'bg-green-50 text-green-700' : p.margin > 10 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                    {p.margin}%
                  </span>
                </td>
                <td className="px-3 py-2 text-right text-gray-500 text-xs">{p.markup === null || p.markup === undefined ? '\u2014' : p.markup + '%'}</td>
                <td className="px-3 py-2 text-gray-500 text-xs truncate max-w-[100px]">{p.supplier}</td>
                <td className="px-3 py-2 text-center text-gray-400 text-xs">{p.pack}</td>
                <td className="px-3 py-2 text-right">
                  {p.cost > 0 && p.retail > 0 && (() => {
                    const suggested = p.margin < 20 ? +(p.cost / (1 - 0.25)).toFixed(2) : +(p.retail).toFixed(2);
                    const key = p.code || p.name;
                    const st = queueState[key] || "idle";
                    if (st === "done") return <span className="inline-flex items-center gap-1 text-[10px] text-green-600"><CheckCircle2 className="w-3 h-3" />Queued</span>;
                    if (st === "loading") return <Loader2 className="w-3 h-3 animate-spin text-violet-500" />;
                    if (st === "error") return <span className="text-[10px] text-red-500">Failed</span>;
                    return (
                      <button onClick={() => handleQueuePrice(key, suggested)}
                        className="text-[10px] font-medium text-violet-600 hover:text-violet-800 whitespace-nowrap">
                        Queue {`\u20AC${suggested.toFixed(2)}`}
                      </button>
                    );
                  })()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 text-center">Showing {Math.min(filtered.length, 100)} of {filtered.length} products</p>
    </div>
  );
}
