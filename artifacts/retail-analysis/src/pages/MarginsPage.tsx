import { useState, useEffect } from "react";
import { apiCall } from "@/lib/api";

export function MarginsPage() {
  const [trend, setTrend] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all"|"low"|"negative"|"high">("all");

  useEffect(() => {
    Promise.all([
      apiCall("/api/insights/margin-trend"),
      apiCall("/api/insights/product-margins"),
    ]).then(([t, p]) => {
      setTrend(t.months || []);
      setProducts(p.products || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-400">Calculating margins...</div>;

  const filtered = filter === "all" ? [...products].sort((a,b) => b.margin - a.margin) :
    filter === "negative" ? products.filter(p => p.margin < 0) :
    filter === "low" ? products.filter(p => p.margin >= 0 && p.margin < 20) :
    products.filter(p => p.margin >= 40);

  const maxRev = Math.max(...trend.map(m => m.revenue), 1);

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Margins</h1>
      <p className="text-xs text-gray-500 mb-4">{products.length} products analyzed • {trend.length} months of data</p>

      {/* Monthly Margin Trend */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 mb-4">
        <h2 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">Monthly Revenue & Margin</h2>
        <div className="flex gap-0.5 items-end mb-2" style={{height: '112px'}}>
          {trend.slice(-18).map((m, i) => {
            const barH = Math.max(4, Math.round((m.revenue / maxRev) * 96));
            return (
            <div key={i} className="flex-1 flex flex-col justify-end items-center group relative h-full">
              <div className="absolute -top-6 bg-gray-800 text-white text-[9px] px-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                {m.period}: €{(m.revenue/1000).toFixed(0)}K ({m.margin}%)
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
      <div className="flex gap-2 mb-3">
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
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
            {filtered.slice(0, 100).map((p, i) => (
              <tr key={i} className="hover:bg-violet-50/30">
                <td className="px-3 py-2 text-gray-800 dark:text-gray-200 truncate max-w-[200px]">
                  {p.name}
                  {!p.active && <span className="ml-1 text-[9px] text-red-400">●</span>}
                </td>
                <td className="px-3 py-2 text-right font-medium text-gray-700">{p.price_on_request ? <span className="text-[11px] text-gray-400">on request</span> : `€${(p.retail ?? 0).toFixed(2)}`}</td>
                <td className="px-3 py-2 text-right text-gray-500">€{(p.cost ?? 0).toFixed(2)}</td>
                <td className="px-3 py-2 text-right">
                  <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${p.margin > 30 ? 'bg-green-50 text-green-700' : p.margin > 10 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                    {p.margin}%
                  </span>
                </td>
                <td className="px-3 py-2 text-right text-gray-500 text-xs">{p.markup === null || p.markup === undefined ? '—' : p.markup + '%'}</td>
                <td className="px-3 py-2 text-gray-500 text-xs truncate max-w-[100px]">{p.supplier}</td>
                <td className="px-3 py-2 text-center text-gray-400 text-xs">{p.pack}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 mt-2 text-center">Showing {Math.min(filtered.length, 100)} of {filtered.length} products</p>
    </div>
  );
}
