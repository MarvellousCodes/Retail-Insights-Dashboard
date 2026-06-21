import { useState, useEffect } from "react";
import { apiCall } from "@/lib/api";
import { CheckCircle, AlertTriangle, TrendingUp, TrendingDown, ArrowUp, ArrowDown, BarChart3 } from "lucide-react";

export function InsightsLivePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string|null>(null);

  useEffect(() => {
    apiCall("/api/insights/product-margins").then(d => { setData(d); setLoading(false); });
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-400">Computing insights...</div>;

  const products = data?.products || [];
  const positive = products.filter((p:any) => p.margin > 0);
  const negative = products.filter((p:any) => p.margin < 0);
  const avgMargin = positive.length > 0 ? (positive.reduce((s:number,p:any) => s+p.margin, 0) / positive.length).toFixed(1) : "0";
  const topProfit = positive.length > 0 ? positive[positive.length-1] : null;
  const bottomProfit = negative.length > 0 ? negative[0] : null;
  const totalLoss = negative.reduce((s:number,p:any) => s + (p.retail - p.cost), 0);
  const biggestWinner = positive.length > 0 ? positive[positive.length-1] : null;
  const biggestLoser = negative.length > 0 ? negative[0] : null;

  const cards = [
    { id:"positive", Icon:CheckCircle, iconBg:"bg-green-100", iconColor:"text-green-600", value:positive.length.toString(), label:"Positive Margins", sub:`Avg ${avgMargin}% across ${positive.length} products`, items: positive.slice(-10).reverse() },
    { id:"negative", Icon:AlertTriangle, iconBg:"bg-red-100", iconColor:"text-red-600", value:negative.length.toString(), label:"Negative Margins", sub:`€${Math.abs(totalLoss).toFixed(2)} total loss per unit`, items: negative.slice(0,10) },
    { id:"top", Icon:TrendingUp, iconBg:"bg-green-100", iconColor:"text-green-600", value: topProfit ? `€${(topProfit.retail - topProfit.cost).toFixed(2)}/unit` : "—", label:"Top Profits", sub:"Ranked by profit per unit sold", items: positive.slice(-10).reverse() },
    { id:"bottom", Icon:TrendingDown, iconBg:"bg-red-100", iconColor:"text-red-600", value: bottomProfit ? `€${(bottomProfit.retail - bottomProfit.cost).toFixed(2)}/unit` : "—", label:"Bottom Profits", sub:"Ranked by lowest profit per unit", items: negative.slice(0,10) },
    { id:"winners", Icon:ArrowUp, iconBg:"bg-violet-100", iconColor:"text-violet-600", value: biggestWinner ? `${biggestWinner.margin}%` : "—", label:"Biggest Winners", sub:"Highest margin % products", items: positive.slice(-10).reverse() },
    { id:"losers", Icon:ArrowDown, iconBg:"bg-red-100", iconColor:"text-red-600", value: biggestLoser ? `${biggestLoser.margin}%` : "—", label:"Biggest Losers", sub:"Lowest margin % products", items: negative.slice(0,10) },
  ];

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><BarChart3 className="w-5 h-5 text-violet-600" /> Insights</h1>
      <p className="text-xs text-gray-500 mb-6">Click a card to see the full breakdown</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(card => (
          <div key={card.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div onClick={() => setExpanded(expanded===card.id ? null : card.id)} className="p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition flex justify-between items-start">
              <div>
                <div className={`w-8 h-8 ${card.iconBg} rounded-lg flex items-center justify-center mb-3`}>
                  <card.Icon className={`w-4 h-4 ${card.iconColor}`} />
                </div>
                <p className={`text-2xl font-bold ${card.id.includes('negative') || card.id.includes('bottom') || card.id.includes('loser') ? 'text-red-600' : card.id.includes('winner') ? 'text-violet-600' : 'text-green-600'}`}>{card.value}</p>
                <p className="font-medium text-sm text-gray-900 dark:text-white mt-1">{card.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
              </div>
              <span className="text-gray-300 text-sm">{expanded===card.id ? '▲' : '▼'}</span>
            </div>
            {expanded===card.id && (
              <div className="border-t border-gray-100 dark:border-gray-700 max-h-64 overflow-y-auto">
                {card.items.map((p:any, i:number) => (
                  <div key={i} className="px-5 py-2.5 flex justify-between items-center border-b border-gray-50 dark:border-gray-700 last:border-0">
                    <div>
                      <p className="text-sm text-gray-800 dark:text-gray-200">{p.name}</p>
                      <p className="text-[10px] text-gray-400">{p.supplier} • €{p.retail.toFixed(2)} retail • €{p.cost.toFixed(2)} cost</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${p.margin > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{p.margin}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
