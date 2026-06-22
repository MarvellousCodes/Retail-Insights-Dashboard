import { useState, useEffect } from "react";
import { apiCall } from "@/lib/api";
import { Lightbulb, Award, Tag, TrendingDown, TrendingUp } from "lucide-react";

function eur(v: number | null | undefined) {
  return v === null || v === undefined ? "—" : `€${Number(v).toFixed(2)}`;
}
function eur0(v: number | null | undefined) {
  return "€" + Math.round(Number(v || 0)).toLocaleString("en-IE");
}
function num(v: number | null | undefined) {
  return Math.round(Number(v || 0)).toLocaleString("en-IE");
}

function Hint({ tip, children }: { tip: string; children: React.ReactNode }) {
  const [pos, setPos] = useState<{ x: number; y: number; below: boolean } | null>(null);
  return (
    <div
      onMouseEnter={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const below = r.top < 150;
        const x = Math.min(Math.max(r.left + r.width / 2, 150), window.innerWidth - 150);
        setPos({ x, y: below ? r.bottom + 8 : r.top - 8, below });
      }}
      onMouseLeave={() => setPos(null)}
    >
      {children}
      {pos && (
        <span
          style={{ position: "fixed", left: pos.x, top: pos.y, transform: pos.below ? "translate(-50%,0)" : "translate(-50%,-100%)", zIndex: 9999 }}
          className="pointer-events-none w-72 max-w-[80vw] rounded-lg bg-gray-900 text-white text-[11px] font-normal leading-snug px-3 py-2 shadow-xl whitespace-normal"
        >
          {tip}
        </span>
      )}
    </div>
  );
}

function DriftList({ title, rows, tone }: { title: string; rows: any[]; tone: "down" | "up" }) {
  const down = tone === "down";
  return (
    <div>
      <div className={`flex items-center gap-1.5 text-xs font-bold mb-2 ${down ? "text-red-600" : "text-green-600"}`}>
        {down ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
        {title}
      </div>
      {rows.length === 0 ? (
        <p className="text-xs text-gray-400">Nothing notable.</p>
      ) : (
        <div className="space-y-1.5">
          {rows.map((d, i) => {
            const dir = down ? "drop" : "rise";
            const tip = `${d.name}: margin moved from ${d.prior}% (the 3 months before) to ${d.recent}% (the last 3 months), a ${Math.abs(d.drift)} percentage point (pp) ${dir}.`;
            return (
            <Hint key={i} tip={tip}>
              <div className="flex items-center justify-between gap-2 bg-gray-50 dark:bg-gray-900 rounded-lg px-3 py-2 cursor-help">
                <span className="text-sm text-gray-800 dark:text-gray-200 truncate border-b border-dotted border-gray-300 dark:border-gray-600">{d.name}</span>
                <span className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-gray-400 tabular-nums">{d.prior}% → {d.recent}%</span>
                  <span className={`text-xs font-bold tabular-nums px-2 py-0.5 rounded-full ${down ? "bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-400" : "bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-400"}`}>
                    {d.drift > 0 ? "+" : ""}{d.drift}pp
                  </span>
                </span>
              </div>
            </Hint>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function InsightsLivePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiCall("/api/insights/discovery").then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-400">Finding insights...</div>;

  const fallers = data?.drift?.fallers || [];
  const risers = data?.drift?.risers || [];
  const winners = data?.hidden_winners || [];
  const under = data?.underpriced_bestsellers || [];
  const card = "bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm";

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-violet-600" /> Insights
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Things worth knowing that you would not think to look for. Your fix list lives in Issues; this is the bigger picture.
        </p>
      </div>

      {/* 1. Margin drift by department */}
      <div className={`${card} p-5`}>
        <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Margin drift by department</h3>
        <p className="text-xs text-gray-400 mt-0.5 mb-4">
          Where your category margins are moving, {data?.window}. A drop is an early warning before it shows up in the takings. Hover any row for detail; pp means percentage points.
        </p>
        <div className="grid md:grid-cols-2 gap-5">
          <DriftList title="Slipping" rows={fallers} tone="down" />
          <DriftList title="Improving" rows={risers} tone="up" />
        </div>
      </div>

      {/* 2. Hidden winners */}
      <div className={`${card} overflow-hidden`}>
        <div className="p-5 pb-3">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-green-600" /> Hidden winners
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            High margin and selling fast. Keep these stocked, in date and where people see them.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900 border-y border-gray-100 dark:border-gray-700">
              <tr>
                <th className="px-5 py-2 text-left text-[11px] font-semibold text-gray-500">Product</th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 hidden sm:table-cell">Department</th>
                <th className="px-3 py-2 text-right text-[11px] font-semibold text-gray-500">Margin</th>
                <th className="px-5 py-2 text-right text-[11px] font-semibold text-gray-500">Sold / mo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {winners.map((w: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-5 py-2 text-gray-800 dark:text-gray-200 truncate max-w-[240px]">{w.name}</td>
                  <td className="px-3 py-2 text-gray-400 text-xs truncate max-w-[160px] hidden sm:table-cell">{w.dept}</td>
                  <td className="px-3 py-2 text-right"><span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-400">{w.margin}%</span></td>
                  <td className="px-5 py-2 text-right font-semibold text-gray-700 dark:text-gray-300 tabular-nums">{num(w.monthly_units)}</td>
                </tr>
              ))}
              {winners.length === 0 && <tr><td colSpan={4} className="px-5 py-6 text-center text-gray-400 text-sm">No data yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Underpriced bestsellers */}
      <div className={`${card} overflow-hidden`}>
        <div className="p-5 pb-3">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-2">
            <Tag className="w-4 h-4 text-red-600" /> Underpriced bestsellers
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Your busiest products on thin margins, biggest monthly euro wins first. Fuel, lottery and similar are left out because you cannot reprice them.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900 border-y border-gray-100 dark:border-gray-700">
              <tr>
                <th className="px-5 py-2 text-left text-[11px] font-semibold text-gray-500">Product</th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-500 hidden md:table-cell">Department</th>
                <th className="px-3 py-2 text-right text-[11px] font-semibold text-gray-500">Margin</th>
                <th className="px-3 py-2 text-right text-[11px] font-semibold text-gray-500">Now</th>
                <th className="px-3 py-2 text-right text-[11px] font-semibold text-gray-500">Suggested</th>
                <th className="px-3 py-2 text-right text-[11px] font-semibold text-gray-500 hidden sm:table-cell">Sold / mo</th>
                <th className="px-5 py-2 text-right text-[11px] font-semibold text-gray-500">€ / mo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {under.map((u: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-5 py-2 text-gray-800 dark:text-gray-200 truncate max-w-[220px]">{u.name}</td>
                  <td className="px-3 py-2 text-gray-400 text-xs truncate max-w-[140px] hidden md:table-cell">{u.dept}</td>
                  <td className="px-3 py-2 text-right"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${u.margin < 0 ? "bg-red-100 text-red-700" : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`}>{u.margin}%</span></td>
                  <td className="px-3 py-2 text-right text-gray-500 tabular-nums">{eur(u.price)}</td>
                  <td className="px-3 py-2 text-right font-semibold text-green-600 tabular-nums">{eur(u.suggested)}</td>
                  <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-300 tabular-nums hidden sm:table-cell">{num(u.monthly_units)}</td>
                  <td className="px-5 py-2 text-right font-bold text-violet-600 tabular-nums">{eur0(u.monthly_opportunity)}</td>
                </tr>
              ))}
              {under.length === 0 && <tr><td colSpan={7} className="px-5 py-6 text-center text-gray-400 text-sm">No data yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
