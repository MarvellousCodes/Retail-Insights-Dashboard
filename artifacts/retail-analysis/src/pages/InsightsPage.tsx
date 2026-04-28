import { useMemo, useState } from "react";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, ArrowUpRight, ArrowDownRight, ChevronDown, ChevronUp, BarChart3 } from "lucide-react";
import type { Product } from "@/App";

interface InsightsPageProps {
  products: Product[];
  onNewUpload: () => void;
}

interface MetricCard {
  id: string;
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  items: Product[];
}

export function InsightsPage({ products, onNewUpload }: InsightsPageProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) => setExpandedId((prev) => (prev === id ? null : id));

  const fmt = (n: number) => "€" + n.toFixed(2);
  const pct = (n: number) => n.toFixed(1) + "%";

  const metrics = useMemo((): MetricCard[] => {
    if (!products.length) return [];

    const withProfit = products.map((p) => ({ ...p, profit: p.sellingPrice - p.costPrice }));
    const positive = withProfit.filter((p) => p.margin > 0).sort((a, b) => b.margin - a.margin);
    const negative = withProfit.filter((p) => p.margin <= 0).sort((a, b) => a.margin - b.margin);
    const byProfitDesc = [...withProfit].sort((a, b) => b.profit - a.profit);
    const byProfitAsc = [...withProfit].sort((a, b) => a.profit - b.profit);
    const byMarginDesc = [...withProfit].sort((a, b) => b.margin - a.margin);
    const byMarginAsc = [...withProfit].sort((a, b) => a.margin - b.margin);

    const avgPositive = positive.length ? positive.reduce((s, p) => s + p.margin, 0) / positive.length : 0;
    const totalLoss = negative.reduce((s, p) => s + (p.costPrice - p.sellingPrice), 0);

    return [
      {
        id: "positive", title: "Positive Margins", value: String(positive.length),
        subtitle: `Avg ${pct(avgPositive)} across ${positive.length} products`,
        icon: <CheckCircle className="w-5 h-5" />, color: "text-emerald-600", bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
        items: positive,
      },
      {
        id: "negative", title: "Negative Margins", value: String(negative.length),
        subtitle: negative.length ? `${fmt(totalLoss)} total loss per unit` : "No loss-making products",
        icon: <AlertTriangle className="w-5 h-5" />, color: "text-red-600", bgColor: "bg-red-50 dark:bg-red-950/20",
        items: negative,
      },
      {
        id: "topProfit", title: "Top Profits", value: byProfitDesc[0] ? fmt(byProfitDesc[0].profit) + "/unit" : "—",
        subtitle: "Ranked by profit per unit sold",
        icon: <TrendingUp className="w-5 h-5" />, color: "text-emerald-600", bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
        items: byProfitDesc,
      },
      {
        id: "bottomProfit", title: "Bottom Profits", value: byProfitAsc[0] ? fmt(byProfitAsc[0].profit) + "/unit" : "—",
        subtitle: "Ranked by lowest profit per unit",
        icon: <TrendingDown className="w-5 h-5" />, color: "text-orange-600", bgColor: "bg-orange-50 dark:bg-orange-950/20",
        items: byProfitAsc,
      },
      {
        id: "topMargin", title: "Biggest Winners", value: byMarginDesc[0] ? pct(byMarginDesc[0].margin) : "—",
        subtitle: "Highest margin % products",
        icon: <ArrowUpRight className="w-5 h-5" />, color: "text-violet-600", bgColor: "bg-violet-50 dark:bg-violet-950/20",
        items: byMarginDesc,
      },
      {
        id: "bottomMargin", title: "Biggest Losers", value: byMarginAsc[0] ? pct(byMarginAsc[0].margin) : "—",
        subtitle: "Lowest margin % products",
        icon: <ArrowDownRight className="w-5 h-5" />, color: "text-red-600", bgColor: "bg-red-50 dark:bg-red-950/20",
        items: byMarginAsc,
      },
    ];
  }, [products]);

  if (!products.length) {
    return (
      <div className="p-6 max-w-5xl mx-auto text-center py-24">
        <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
        <p className="text-gray-500 dark:text-gray-400 font-medium">No data loaded</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Upload a CSV first to see insights</p>
        <button onClick={onNewUpload} className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors">Upload CSV</button>
      </div>
    );
  }

  const active = metrics.find((m) => m.id === expandedId);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-violet-600" /> Insights
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Click a card to see the full breakdown</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {metrics.map((m) => (
          <button key={m.id} onClick={() => toggle(m.id)}
            className={`text-left p-4 rounded-xl border transition-all ${
              expandedId === m.id ? "border-violet-400 dark:border-violet-600 shadow-lg ring-2 ring-violet-100 dark:ring-violet-900/30"
                : "border-gray-200 dark:border-gray-700 hover:border-violet-200 dark:hover:border-violet-800"
            } bg-white dark:bg-gray-900`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-lg ${m.bgColor}`}><span className={m.color}>{m.icon}</span></div>
              {expandedId === m.id ? <ChevronUp className="w-4 h-4 text-violet-500" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </div>
            <div className={`text-2xl font-bold ${m.color}`}>{m.value}</div>
            <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-1">{m.title}</div>
            <div className="text-xs text-gray-400 mt-0.5">{m.subtitle}</div>
          </button>
        ))}
      </div>

      {active && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
          <div className={`px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2 ${active.bgColor}`}>
            <span className={active.color}>{active.icon}</span>
            <span className="font-semibold text-gray-800 dark:text-gray-200">{active.title}</span>
            <span className="text-xs text-gray-400 ml-auto">{active.items.length} products</span>
          </div>
          <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0">
                <tr className="bg-gray-50 dark:bg-gray-800 text-xs uppercase text-gray-500 dark:text-gray-400">
                  <th className="px-4 py-2.5 text-left font-semibold w-8">#</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Product</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Dept</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Cost</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Sell</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Margin</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Profit/unit</th>
                </tr>
              </thead>
              <tbody>
                {active.items.map((item, i) => {
                  const profit = item.sellingPrice - item.costPrice;
                  return (
                    <tr key={item.id} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-2 text-gray-400 text-xs">{i + 1}</td>
                      <td className="px-4 py-2 font-medium">{item.name}</td>
                      <td className="px-4 py-2 text-gray-500 dark:text-gray-400">{item.department || item.category}</td>
                      <td className="px-4 py-2">{fmt(item.costPrice)}</td>
                      <td className="px-4 py-2">{fmt(item.sellingPrice)}</td>
                      <td className="px-4 py-2">
                        <span className={item.margin < 0 ? "text-red-600 font-semibold" : item.margin < 15 ? "text-orange-500 font-semibold" : "text-emerald-600 font-semibold"}>
                          {pct(item.margin)}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <span className={profit < 0 ? "text-red-600 font-semibold" : "text-emerald-600"}>{fmt(profit)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
