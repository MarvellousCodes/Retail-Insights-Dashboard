import { useState, useEffect } from "react";
import { apiCall } from "@/lib/api";
import { TrendingUp, TrendingDown, ArrowUp, ArrowDown, Minus, Zap, Trophy } from "lucide-react";
import { useRevenueMask, RevenueMaskToggle, STARS } from "@/lib/privacy";

function eur(v: number | null | undefined, masked: boolean) {
  if (masked) return STARS;
  if (v === null || v === undefined) return "\u2014";
  return `\u20AC${Number(v).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function pctBadge(pct: number | null | undefined) {
  if (pct === null || pct === undefined) return null;
  const color = pct >= 0 ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50";
  const icon = pct >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />;
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-bold ${color}`}>
      {icon}{Math.abs(pct).toFixed(1)}%
    </span>
  );
}

export function TurnoverPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { masked, toggle } = useRevenueMask();

  useEffect(() => {
    apiCall("/api/sales/insights").then((d) => { setData(d || {}); setLoading(false); });
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-400">Loading sales insights...</div>;
  if (!data) return <div className="p-8 text-center text-gray-400">No data available.</div>;

  const pulse = data.pulse;
  const weekComp = data.week_comparison;
  const movers = data.movers;
  const deptRace = data.dept_race;
  const deptVsLy = data.dept_vs_ly;

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Sales</h1>
          <p className="text-xs text-gray-500">Monthly pulse, weekly comparison, top movers, department trends</p>
        </div>
        <RevenueMaskToggle masked={masked} toggle={toggle} />
      </div>

      {/* Block 1: Sales Pulse */}
      {pulse && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-violet-500" /> Sales pulse
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">This month ({pulse.latest_period})</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">{eur(pulse.latest_total, masked)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">vs previous month</div>
              <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">{eur(pulse.prev_total, masked)}</div>
              <div className="mt-1">{pctBadge(pulse.vs_prev_pct)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">vs same month last year</div>
              <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">{eur(pulse.same_ly_total, masked)}</div>
              <div className="mt-1">{pctBadge(pulse.vs_ly_pct)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Block 5: This week vs best week */}
      {weekComp && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-500" /> This week vs your best week
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">Latest complete week (from {weekComp.latest_week_start})</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">{eur(weekComp.latest_week_total, masked)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">Best week (from {weekComp.best_week_start})</div>
              <div className="text-xl font-bold text-violet-600">{eur(weekComp.best_week_total, masked)}</div>
              <div className="mt-1">{pctBadge(weekComp.vs_best_pct)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Block 3: Top Movers */}
      {movers && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" /> Biggest risers this month
            </h2>
            <div className="space-y-2">
              {(movers.risers || []).map((r: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300 truncate max-w-[180px]">{r.name}</span>
                  <span className="text-green-600 font-semibold text-xs">+{masked ? STARS : eur(r.change, false)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-3 flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4" /> Biggest fallers this month
            </h2>
            <div className="space-y-2">
              {(movers.fallers || []).map((r: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300 truncate max-w-[180px]">{r.name}</span>
                  <span className="text-red-600 font-semibold text-xs">{masked ? STARS : eur(r.change, false)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Block 4: Department Race */}
      {deptRace && deptRace.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Department rankings this month</h2>
          <div className="space-y-1.5">
            {deptRace.slice(0, 12).map((d: any, i: number) => {
              const move = d.prev_rank != null ? d.prev_rank - d.rank : 0;
              return (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="w-5 text-xs text-gray-400 text-right">{d.rank}</span>
                  <span className="w-5 text-center">
                    {move > 0 && <ArrowUp className="w-3.5 h-3.5 text-green-500 inline" />}
                    {move < 0 && <ArrowDown className="w-3.5 h-3.5 text-red-500 inline" />}
                    {move === 0 && <Minus className="w-3.5 h-3.5 text-gray-300 inline" />}
                  </span>
                  <span className="flex-1 text-gray-700 dark:text-gray-300 truncate">{d.dept}</span>
                  <span className="text-xs text-gray-500">{eur(d.value, masked)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Block 2: Same month last year by department */}
      {deptVsLy && deptVsLy.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Same month last year, by department</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-violet-50 dark:bg-violet-900/20">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-violet-700">Department</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-violet-700">This month</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-violet-700">Last year</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-violet-700">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {deptVsLy.map((d: any, i: number) => (
                  <tr key={i} className="hover:bg-violet-50/30">
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{d.dept}</td>
                    <td className="px-3 py-2 text-right">{eur(d.now, masked)}</td>
                    <td className="px-3 py-2 text-right text-gray-500">{eur(d.last_year, masked)}</td>
                    <td className="px-3 py-2 text-right">
                      <span className={`font-semibold ${d.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {d.change >= 0 ? "+" : ""}{masked ? STARS : eur(d.change, false)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        Fuel, lottery, vouchers, and tobacco excluded from product rankings.
      </p>
    </div>
  );
}
