import { useState, useEffect } from "react";
import { apiCall } from "@/lib/api";

function eur(v: number) {
  if (v >= 1000000) return `€${(v / 1000000).toFixed(2)}M`;
  if (v >= 1000) return `€${(v / 1000).toFixed(1)}K`;
  return `€${v.toFixed(0)}`;
}

export function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<"products" | "spend" | "avg_margin">("spend");

  useEffect(() => {
    apiCall("/api/suppliers-analytics").then((d) => { setSuppliers(d.suppliers || []); setLoading(false); });
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-400">Loading supplier analytics...</div>;

  const rows = [...suppliers].sort((a, b) => (b[sort] ?? 0) - (a[sort] ?? 0));
  const totalSpend = suppliers.reduce((s, x) => s + (x.spend || 0), 0);

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Suppliers</h1>
      <p className="text-xs text-gray-500 mb-4">{suppliers.length} suppliers • who supplies most, costs most, and earns the best margin</p>

      <div className="flex gap-2 mb-3">
        {([["spend","By spend"],["products","By product count"],["avg_margin","By margin"]] as const).map(([k,l]) => (
          <button key={k} onClick={() => setSort(k)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${sort===k ? "bg-violet-600 text-white" : "bg-white dark:bg-gray-800 text-gray-600 border border-gray-200 dark:border-gray-700"}`}>{l}</button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-violet-50 dark:bg-violet-900/20">
            <tr>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-violet-700">Supplier</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-violet-700">Products</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-violet-700">Active</th>
              <th className="px-3 py-2.5 text-center text-xs font-semibold text-violet-700">Avg Margin</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-violet-700">Spend (12mo)</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-violet-700">% of spend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
            {rows.map((s, i) => (
              <tr key={i} className="hover:bg-violet-50/40">
                <td className="px-3 py-2 font-mono text-xs text-gray-800 dark:text-gray-200">{s.code}</td>
                <td className="px-3 py-2 text-right text-gray-600">{s.products.toLocaleString()}</td>
                <td className="px-3 py-2 text-right text-gray-500">{s.active.toLocaleString()}</td>
                <td className="px-3 py-2 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${s.avg_margin === null ? "bg-gray-50 text-gray-400" : s.avg_margin >= 25 ? "bg-green-50 text-green-700" : s.avg_margin >= 10 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>{s.avg_margin === null ? "—" : s.avg_margin + "%"}</span>
                </td>
                <td className="px-3 py-2 text-right font-medium text-violet-600">{eur(s.spend || 0)}</td>
                <td className="px-3 py-2 text-right text-gray-400 text-xs">{totalSpend > 0 ? ((s.spend || 0) / totalSpend * 100).toFixed(1) : "0"}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 mt-3 text-center">Top {suppliers.length} suppliers by product count. Spend = cost × units over the last 12 months.</p>
    </div>
  );
}
