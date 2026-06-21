import { useState, useEffect } from "react";
import { apiCall } from "@/lib/api";

interface Issue {
  name: string; dept: string; retail: number; cost: number; margin: number;
  markup: number | null; target: number; recommended: number;
  monthly_qty: number; impact: number; severity: string; supplier: string;
}

const SEV_STYLE: Record<string, string> = {
  Critical: "bg-red-100 text-red-700",
  Low: "bg-amber-100 text-amber-700",
  "Below target": "bg-gray-100 text-gray-600",
};

function eur(v: number | null) {
  return v === null || v === undefined || isNaN(v as number) ? "—" : `€${Number(v).toFixed(2)}`;
}

export function IssuesLivePage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [count, setCount] = useState(0);
  const [targetPct, setTargetPct] = useState(20);
  const [loading, setLoading] = useState(true);
  const [sevFilter, setSevFilter] = useState<string>("all");

  useEffect(() => { load(); }, [targetPct]);

  const load = async () => {
    setLoading(true);
    const d = await apiCall(`/api/issues?target=${(targetPct / 100).toFixed(2)}`);
    setIssues(d.issues || []);
    setCount(d.count || 0);
    setLoading(false);
  };

  const filtered = sevFilter === "all" ? issues : issues.filter((i) => i.severity === sevFilter);
  const totalImpact = issues.reduce((s, i) => s + (i.impact > 0 ? i.impact : 0), 0);
  const criticalCount = issues.filter((i) => i.severity === "Critical").length;
  const counts = {
    all: issues.length,
    Critical: criticalCount,
    Low: issues.filter((i) => i.severity === "Low").length,
    "Below target": issues.filter((i) => i.severity === "Below target").length,
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Issues</h1>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
          <p className="text-2xl font-bold text-violet-600">{count}</p>
          <p className="text-[11px] text-gray-500">Below {targetPct}% target</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
          <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
          <p className="text-[11px] text-gray-500">Critical (losing money)</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
          <p className="text-2xl font-bold text-green-600">{eur(totalImpact)}</p>
          <p className="text-[11px] text-gray-500">Est. monthly recovery</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
          <label className="text-[11px] text-gray-500 block mb-1">Target margin: {targetPct}%</label>
          <input type="range" min={5} max={45} value={targetPct} onChange={(e) => setTargetPct(+e.target.value)} className="w-full accent-violet-600" />
        </div>
      </div>

      {/* Severity filter */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {(["all", "Critical", "Low", "Below target"] as const).map((s) => (
          <button key={s} onClick={() => setSevFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${sevFilter === s ? "bg-violet-600 text-white" : "bg-white dark:bg-gray-800 text-gray-600 border border-gray-200 dark:border-gray-700"}`}>
            {s === "all" ? "All" : s} ({(counts as any)[s]})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-400">Loading issues...</div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-violet-50 dark:bg-violet-900/20 sticky top-0">
              <tr>
                {["Product", "Department", "Sell", "Cost", "Margin", "Markup", "→ Set to", "Impact/mo", "Severity"].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-violet-700 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {filtered.map((i, idx) => (
                <tr key={idx} className="hover:bg-violet-50/40">
                  <td className="px-3 py-2.5 text-gray-800 dark:text-gray-200 truncate max-w-[200px]">{i.name}</td>
                  <td className="px-3 py-2.5 text-gray-500 truncate max-w-[140px]">{i.dept}</td>
                  <td className="px-3 py-2.5 text-gray-700 dark:text-gray-300">{eur(i.retail)}</td>
                  <td className="px-3 py-2.5 text-gray-500">{eur(i.cost)}</td>
                  <td className="px-3 py-2.5 font-medium" style={{ color: i.margin < 0 ? "#dc2626" : i.margin < 10 ? "#d97706" : "#6b7280" }}>{i.margin}%</td>
                  <td className="px-3 py-2.5 text-gray-500">{i.markup === null ? "—" : `${i.markup}%`}</td>
                  <td className="px-3 py-2.5 font-semibold text-green-600 whitespace-nowrap">{eur(i.recommended)}</td>
                  <td className="px-3 py-2.5 text-violet-600 font-medium">{i.impact > 0 ? eur(i.impact) : "—"}</td>
                  <td className="px-3 py-2.5"><span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${SEV_STYLE[i.severity] || "bg-gray-100 text-gray-600"}`}>{i.severity}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="p-6 text-center text-gray-400 text-sm">No products below target 🎉</div>}
        </div>
      )}
      <p className="text-xs text-gray-400 mt-3 text-center">Recommended price = unit cost ÷ (1 − target). Impact = (new − current) × recent monthly sales.</p>
    </div>
  );
}
