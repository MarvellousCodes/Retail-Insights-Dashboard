import { Upload, TrendingDown, TrendingUp, AlertTriangle, Tag, ArrowRight } from "lucide-react";
import type { Product, MarginAlert, PriceAnomaly, DeptThreshold } from "@/App";

function fmt(n: number) { return `€${n.toFixed(2)}`; }

interface DashboardPageProps {
  products: Product[];
  marginAlerts: MarginAlert[];
  priceAnomalies: PriceAnomaly[];
  thresholds: DeptThreshold[];
  fixedIds: Set<string>;
  onNewUpload: () => void;
  sourceControls: import("@/components/SourceSelector").SourceControls;
}

import { SourceSelector } from "@/components/SourceSelector";

export function DashboardPage({ products, marginAlerts, priceAnomalies, thresholds, fixedIds, onNewUpload, sourceControls }: DashboardPageProps) {
  if (products.length === 0) {
    return (
      <div className="min-h-full bg-gray-50 flex items-center justify-center fade-up">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-5">
            <TrendingUp className="w-8 h-8 text-violet-600" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Profit Optimisation</h2>
          <p className="text-sm text-gray-500 mb-7 leading-relaxed">
            Upload a CSV with your products to automatically detect below-margin items,
            calculate recommended prices, and see exactly how much profit you can recover.
          </p>
          <button
            onClick={onNewUpload}
            className="inline-flex items-center gap-2 bg-violet-600 text-white text-sm font-bold px-6 py-3 rounded-xl hover:bg-violet-700 transition-colors shadow-md shadow-violet-600/25"
          >
            <Upload className="w-4 h-4" />
            Upload CSV to get started
          </button>
          <div className="mt-10 grid grid-cols-3 gap-3 text-left">
            {[
              { title: "Auto Margin Check", desc: "Instantly flags every product below your target margin per category." },
              { title: "Recommended Price", desc: "Calculates the exact price to hit target, rounded to retail-friendly .49 or .99." },
              { title: "Profit Recovery", desc: "Shows the total profit you can reclaim by fixing below-margin products." },
            ].map(({ title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="w-6 h-1 rounded-full bg-violet-500 mb-3" />
                <p className="text-xs font-bold text-gray-800 mb-1">{title}</p>
                <p className="text-[11px] text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const activeAlerts = marginAlerts.filter((a) => !fixedIds.has(a.product.id));
  const recoverableProfit = activeAlerts.reduce((s, a) => s + Math.max(0, a.profitImpact), 0);
  const avgMargin = products.length > 0
    ? Math.round((products.reduce((s, p) => s + p.margin, 0) / products.length) * 10) / 10
    : 0;
  const criticalCount = activeAlerts.filter((a) => a.severity === "Critical").length;
  const fixedCount = fixedIds.size;

  const priorityActions = activeAlerts.slice(0, 5);

  return (
    <div className="min-h-full bg-gray-50 fade-up">
      <div className="px-7 py-6 max-w-[1100px] mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-black text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-400 mt-0.5">{products.length} products analysed</p>
          </div>
          <div className="flex items-center gap-2">
            <SourceSelector {...sourceControls} />
            <button onClick={onNewUpload} className="flex items-center gap-2 bg-violet-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-violet-700 transition-colors shadow-sm shadow-violet-600/25">
              <Upload className="w-3.5 h-3.5" /> New Upload
            </button>
          </div>
        </div>

        {/* Total recoverable banner */}
        {recoverableProfit > 0 && (
          <div className="bg-violet-600 rounded-2xl px-6 py-4 mb-5 flex items-center justify-between shadow-lg shadow-violet-600/25">
            <div>
              <p className="text-violet-200 text-xs font-semibold uppercase tracking-wide">Total Recoverable Profit</p>
              <p className="text-white text-3xl font-black mt-0.5">{fmt(recoverableProfit)}<span className="text-violet-300 text-sm font-medium ml-2">per unit across {activeAlerts.length} products</span></p>
            </div>
            <div className="text-right">
              <p className="text-violet-200 text-xs font-medium">{fixedCount} issue{fixedCount !== 1 ? "s" : ""} marked fixed</p>
              <p className="text-violet-300 text-xs mt-0.5">{criticalCount} critical remaining</p>
            </div>
          </div>
        )}

        {/* KPI cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            {
              label: "Below Target Margin",
              value: activeAlerts.length,
              sub: `${criticalCount} critical`,
              icon: <TrendingDown className="w-4 h-4" />,
              color: activeAlerts.length > 0 ? "text-red-600" : "text-green-600",
              iconBg: activeAlerts.length > 0 ? "bg-red-100 text-red-500" : "bg-green-100 text-green-500",
            },
            {
              label: "Average Margin",
              value: `${avgMargin}%`,
              sub: avgMargin >= 20 ? "above 20% target" : "below 20% target",
              icon: <Tag className="w-4 h-4" />,
              color: avgMargin >= 20 ? "text-green-600" : "text-amber-600",
              iconBg: avgMargin >= 20 ? "bg-green-100 text-green-500" : "bg-amber-100 text-amber-500",
            },
            {
              label: "Recoverable Profit",
              value: fmt(recoverableProfit),
              sub: "per unit if all fixed",
              icon: <TrendingUp className="w-4 h-4" />,
              color: "text-violet-700",
              iconBg: "bg-violet-100 text-violet-600",
            },
            {
              label: "Price Anomalies",
              value: priceAnomalies.length,
              sub: "data entry issues",
              icon: <AlertTriangle className="w-4 h-4" />,
              color: priceAnomalies.length > 0 ? "text-orange-600" : "text-green-600",
              iconBg: priceAnomalies.length > 0 ? "bg-orange-100 text-orange-500" : "bg-green-100 text-green-500",
            },
          ].map(({ label, value, sub, icon, color, iconBg }) => (
            <div key={label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{label}</span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${iconBg}`}>{icon}</div>
              </div>
              <p className={`text-2xl font-black ${color}`}>{value}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-5 gap-5">
          {/* Priority Actions */}
          <div className="col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black text-gray-900">Priority Actions</h2>
                <p className="text-xs text-gray-400 mt-0.5">Top items needing attention</p>
              </div>
              {activeAlerts.length > 5 && (
                <span className="text-xs text-violet-600 font-semibold">+{activeAlerts.length - 5} more</span>
              )}
            </div>
            <div className="divide-y divide-gray-50">
              {priorityActions.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-400" />
                  <p className="text-sm font-semibold text-green-600">All products are at target margin</p>
                </div>
              ) : (
                priorityActions.map((alert, i) => {
                  const sevColor = alert.severity === "Critical" ? "text-red-600 bg-red-50" : alert.severity === "High" ? "text-orange-600 bg-orange-50" : "text-amber-600 bg-amber-50";
                  return (
                    <div key={i} className="px-5 py-3.5 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-bold text-gray-900 truncate">{alert.product.name}</p>
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0 ${sevColor}`}>{alert.severity}</span>
                        </div>
                        <p className="text-xs text-gray-400">
                          {alert.product.category || alert.product.department} · Margin <span className="text-red-600 font-semibold">{alert.product.margin}%</span> vs target <span className="font-semibold">{alert.threshold}%</span>
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-black text-violet-700">{fmt(alert.roundedPrice)}</p>
                        <p className="text-[10px] text-gray-400">+{fmt(alert.profitImpact)}/unit</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-300 shrink-0" />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Margin by category */}
          <div className="col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-black text-gray-900 mb-1">Margin by Category</h2>
            <p className="text-xs text-gray-400 mb-4">vs target threshold</p>
            <div className="space-y-3.5">
              {(() => {
                const map: Record<string, number[]> = {};
                products.forEach((p) => {
                  const k = p.category || p.department || "Other";
                  if (!map[k]) map[k] = [];
                  map[k].push(p.margin);
                });
                return Object.entries(map)
                  .map(([cat, margins]) => ({
                    cat,
                    avg: Math.round((margins.reduce((s, m) => s + m, 0) / margins.length) * 10) / 10,
                    threshold: thresholds.find((t) => t.department.toLowerCase() === cat.toLowerCase())?.minMargin ?? 20,
                  }))
                  .sort((a, b) => a.avg - b.avg)
                  .slice(0, 7)
                  .map(({ cat, avg, threshold }) => {
                    const below = avg < threshold;
                    return (
                      <div key={cat}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-semibold text-gray-700 truncate max-w-[120px]">{cat}</span>
                          <span className={`text-[11px] font-black ${below ? "text-red-600" : "text-green-700"}`}>{avg}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden relative">
                          <div
                            className={`h-full rounded-full ${below ? "bg-red-400" : "bg-green-500"}`}
                            style={{ width: `${Math.max(2, Math.min(100, avg))}%` }}
                          />
                          <div className="absolute top-0 h-full w-px bg-violet-400 opacity-60"
                            style={{ left: `${Math.min(100, threshold)}%` }} />
                        </div>
                      </div>
                    );
                  });
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
