import { useState, useEffect } from "react";
import { apiCall } from "@/lib/api";

export function LiveDataPage() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [products, setProducts] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [s, p] = await Promise.all([
      apiCall("/api/stats"),
      apiCall("/api/products?limit=50"),
    ]);
    setStats(s);
    setProducts(p.data || []);
    setHeaders(p.headers || []);
    setLoading(false);
  };

  const handleSearch = async () => {
    const p = await apiCall(`/api/products?limit=50&search=${encodeURIComponent(search)}`);
    setProducts(p.data || []);
  };

  const handleSync = async () => {
    setSyncing(true);
    await apiCall("/api/sync", { method: "POST" });
    setSyncing(false);
    alert("Sync triggered! Data will refresh within 5 minutes.");
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading live store data...</div>;

  const displayCols = ["Code", "Description", "Retail1", "CurrentCost", "VatCode", "Supplier", "BarCode", "Active"];
  const cols = displayCols.filter(c => headers.includes(c));

  return (
    <div className="p-6 max-w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Live Store Data</h1>
          <p className="text-gray-500 text-sm mt-1">Direct from Patrick's EPOS system • Syncs every 6 hours</p>
        </div>
        <button onClick={handleSync} disabled={syncing} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
          {syncing ? "Triggering..." : "⟳ Sync Now"}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {Object.entries(stats).map(([key, val]) => (
          <div key={key} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-2xl font-bold text-emerald-600">{val.toLocaleString()}</p>
            <p className="text-xs text-gray-500 capitalize">{key}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search products..."
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        <button onClick={handleSearch} className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm">Search</button>
        <button onClick={loadData} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg text-sm">Reset</button>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              {cols.map(h => <th key={h} className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {products.map((p, i) => (
              <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                {cols.map(h => <td key={h} className="px-4 py-2.5 text-gray-700 dark:text-gray-300 truncate max-w-[200px]">{(p[h] || "").toString().trim()}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && <p className="p-8 text-center text-gray-400">No products found</p>}
      </div>
      <p className="text-xs text-gray-400 mt-2">Showing {products.length} of {stats.stock?.toLocaleString()} products</p>
    </div>
  );
}
