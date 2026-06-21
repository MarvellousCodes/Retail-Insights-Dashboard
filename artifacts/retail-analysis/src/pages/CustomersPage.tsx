import { useState, useEffect } from "react";
import { apiCall } from "@/lib/api";

export function CustomersPage() {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { load(); }, []);
  const load = async () => {
    setLoading(true);
    const r = await apiCall("/api/customers");
    setData(r.data || []); setTotal(r.total || 0); setLoading(false);
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Loading customers...</div>;

  const filtered = search ? data.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(search.toLowerCase()))) : data;
  const cols = ["Code","Name","Phone","Email","Add1","CreditLimit","CreditDays","Active"];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Customers</h1>
      <p className="text-sm text-gray-500 mb-4">{total} account customers</p>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search customers..." className="w-full md:w-80 px-4 py-2 mb-4 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-violet-500 outline-none" />
      <p className="text-xs text-gray-400 mb-2">Showing {filtered.length} of {total}</p>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-violet-50 dark:bg-violet-900/20">
            <tr>{cols.map(c=><th key={c} className="px-4 py-3 text-left font-medium text-violet-700 dark:text-violet-300">{c}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {filtered.map((r,i)=><tr key={i} className="hover:bg-violet-50/50 dark:hover:bg-violet-900/10">{cols.map(c=><td key={c} className="px-4 py-2.5 text-gray-700 dark:text-gray-300 truncate max-w-[200px]">{(r[c]||"").toString().trim()}</td>)}</tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
